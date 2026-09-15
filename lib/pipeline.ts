import Ajv, { type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { z } from "zod";
import type { Manifest, ManifestTool } from "./convert";
import { canonical, digest } from "./sandbox";

// Phase 1 data plane. Every tool call runs these stages in order. Safety
// stages fail closed: if one cannot run, the call is stopped. Optimisations
// (cache, strip, prune, receipts) fail open: if one breaks, the call still
// returns. Redaction is a privacy promise, so it fails closed too.

const glob = z.string().min(1).max(120).regex(/^[A-Za-z0-9_.*/{}-]+$/);
const key = z.string().min(1).max(60);
export const gatewayPolicySchema = z
  .object({
    version: z.literal("accord.gateway-policy/v1"),
    roles: z
      .record(
        z.string().regex(/^[a-z0-9_-]{1,32}$/),
        z.object({
          allow: z.array(glob).max(100),
          deny: z.array(glob).max(100).default([]),
          readOnly: z.boolean().default(false),
        }),
      )
      .refine((r) => Object.keys(r).length >= 1 && Object.keys(r).length <= 10),
    defaultRole: z.string(),
    requireApproval: z.array(glob).max(100).default([]),
    loop: z.object({
      maxRepeats: z.number().int().min(2).max(100),
      windowSeconds: z.number().int().min(5).max(3600),
    }),
    rate: z.object({
      capacity: z.number().int().min(1).max(1000),
      refillPerMinute: z.number().int().min(1).max(10000),
    }),
    callLimit: z.number().int().min(1).max(1000),
    cacheSeconds: z.number().int().min(0).max(3600),
    cache: z.array(glob).max(100).default([]),
    strip: z.array(key).max(50).default([]),
    redact: z.array(key).max(50).default([]),
    prune: z.record(z.string(), z.array(z.string().min(1).max(120)).max(50)).default({}),
  })
  .strict()
  .refine((p) => p.defaultRole in p.roles, { message: "defaultRole must be one of the roles." });
export type GatewayPolicy = z.infer<typeof gatewayPolicySchema>;
export type PolicyOverrides = Partial<
  Pick<GatewayPolicy, "roles" | "requireApproval" | "cache" | "cacheSeconds" | "strip" | "redact" | "prune">
>;

// Bulky fields agents rarely need. Removed from every response by default.
export const DEFAULT_STRIP = ["*_url", "url", "_links", "links", "etag", "node_id", "metadata"];

export function defaultGatewayPolicy(manifest: Manifest, overrides: PolicyOverrides = {}): GatewayPolicy {
  return {
    version: "accord.gateway-policy/v1",
    roles: {
      agent: { allow: ["*"], deny: [], readOnly: false },
      viewer: { allow: ["*"], deny: [], readOnly: true },
    },
    defaultRole: "agent",
    requireApproval: manifest.tools.filter((t) => t.annotations.destructiveHint).map((t) => t.name),
    loop: { maxRepeats: 5, windowSeconds: 60 },
    rate: { capacity: 20, refillPerMinute: 60 },
    callLimit: 1000,
    cacheSeconds: 60,
    cache: [],
    strip: DEFAULT_STRIP,
    redact: [],
    prune: {},
    ...overrides,
  };
}

export type Decision = {
  effect: "allow" | "deny" | "approval_required";
  rule: string;
  reason: string;
};
export type Receipt = {
  version: "accord.receipt/v1";
  id: string;
  time: string;
  gateway: string;
  role: string;
  tool: string;
  argsDigest: string;
  policyDigest: string;
  effect: Decision["effect"];
  rule: string;
  outcome: "sample_returned" | "not_executed" | "error";
  cached: boolean;
  latencyMs: number;
  bytesIn: number;
  bytesRaw: number;
  bytesOut: number;
  redacted: number;
};
export type CallResult = { decision: Decision; receipt: Receipt; result?: unknown };

// Minimal key-value contract. Memory store below; Redis store in lib/redis.ts.
export type Store = {
  incr(key: string, ttlSeconds: number): Promise<number>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  push(key: string, value: string, max: number): Promise<void>;
  list(key: string, max: number): Promise<string[]>;
  take(key: string, capacity: number, refillPerMinute: number, now: number): Promise<boolean>;
};

// Token bucket. Shared by the memory store and mirrored in the Redis Lua script.
export function takeToken(
  state: { tokens: number; at: number } | null,
  capacity: number,
  refillPerMinute: number,
  now: number,
) {
  const tokens = state
    ? Math.min(capacity, state.tokens + ((now - state.at) / 60000) * refillPerMinute)
    : capacity;
  return tokens >= 1
    ? { ok: true, state: { tokens: tokens - 1, at: now } }
    : { ok: false, state: { tokens, at: now } };
}

export function memoryStore(clock: () => number = Date.now): Store {
  const data = new Map<string, { value: string; expires: number }>();
  const lists = new Map<string, string[]>();
  const live = (k: string) => {
    const e = data.get(k);
    if (e && e.expires <= clock()) data.delete(k);
    return data.get(k);
  };
  return {
    async incr(key, ttl) {
      const e = live(key);
      const next = (e ? Number(e.value) : 0) + 1;
      data.set(key, { value: String(next), expires: e?.expires ?? clock() + ttl * 1000 });
      return next;
    },
    async get(key) {
      return live(key)?.value ?? null;
    },
    async set(key, value, ttl) {
      data.set(key, { value, expires: clock() + ttl * 1000 });
    },
    async push(key, value, max) {
      lists.set(key, [value, ...(lists.get(key) ?? [])].slice(0, max));
    },
    async list(key, max) {
      return (lists.get(key) ?? []).slice(0, max);
    },
    async take(key, capacity, refill, now) {
      const raw = live(key)?.value;
      const next = takeToken(raw ? JSON.parse(raw) : null, capacity, refill, now);
      data.set(key, { value: JSON.stringify(next.state), expires: now + 3600_000 });
      return next.ok;
    },
  };
}

export const matches = (pattern: string, value: string) =>
  new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`, "i").test(value);
const hit = (patterns: string[], tool: ManifestTool) =>
  patterns.some((p) => matches(p, tool.name) || matches(p, tool.path));

// RBAC tool filtering: agents only ever see the tools their role allows.
// Patterns match the tool name or its path, so "*/production/*" works.
export function visibleTools(manifest: Manifest, policy: GatewayPolicy, role: string) {
  const r = policy.roles[role];
  if (!r) return [];
  return manifest.tools.filter(
    (t) => hit(r.allow, t) && !hit(r.deny, t) && (!r.readOnly || t.annotations.readOnlyHint),
  );
}

const ajv = new Ajv({ strict: false, allErrors: false, validateFormats: true });
addFormats(ajv);
const validators = new Map<string, ValidateFunction>();
function validatorFor(tool: ManifestTool) {
  const k = digest(canonical(tool.inputSchema));
  let v = validators.get(k);
  if (!v) {
    if (validators.size > 500) validators.clear();
    v = ajv.compile(tool.inputSchema);
    validators.set(k, v);
  }
  return v;
}

function prune(value: unknown, keep: string[]): unknown {
  if (Array.isArray(value)) return value.map((v) => prune(v, keep));
  if (!value || typeof value !== "object") return value;
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const groups = new Map<string, string[]>();
  for (const path of keep) {
    const [head, ...rest] = path.split(".");
    if (!(head in obj)) continue;
    if (!rest.length) out[head] = obj[head];
    else groups.set(head, [...(groups.get(head) ?? []), rest.join(".")]);
  }
  for (const [head, paths] of groups) if (!(head in out)) out[head] = prune(obj[head], paths);
  return out;
}

function strip(value: unknown, patterns: string[], depth = 0): unknown {
  if (depth > 20 || !patterns.length) return value;
  if (Array.isArray(value)) return value.map((v) => strip(v, patterns, depth + 1));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([k]) => !patterns.some((p) => matches(p, k)))
      .map(([k, v]) => [k, strip(v, patterns, depth + 1)]),
  );
}

export const REDACTED = "[removed by Accord]";
function redact(value: unknown, keys: string[], counter: { n: number }, depth = 0): unknown {
  if (!keys.length) return value;
  if (depth > 20) throw new Error("Response too deep to redact safely.");
  if (Array.isArray(value)) return value.map((v) => redact(v, keys, counter, depth + 1));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => {
      if (keys.some((p) => k.toLowerCase().includes(p.toLowerCase())) && (v === null || typeof v !== "object")) {
        counter.n++;
        return [k, REDACTED];
      }
      return [k, redact(v, keys, counter, depth + 1)];
    }),
  );
}

export type CallInput = {
  gateway: string;
  manifest: Manifest;
  policy: GatewayPolicy;
  role: string;
  toolName: string;
  args: unknown;
  execute: (tool: ManifestTool, args: Record<string, unknown>) => Promise<unknown>;
  now?: number;
};

const blocked = (rule: string, reason: string, effect: Decision["effect"] = "deny"): Decision => ({
  effect,
  rule,
  reason,
});
const utf8Size = (text: string) => new TextEncoder().encode(text).byteLength;
const size = (v: unknown) => (v === undefined ? 0 : utf8Size(JSON.stringify(v) ?? ""));

export async function runCall(store: Store, input: CallInput): Promise<CallResult> {
  const started = input.now ?? Date.now();
  const clockStart = Date.now();
  const args = (input.args && typeof input.args === "object" && !Array.isArray(input.args)
    ? input.args
    : {}) as Record<string, unknown>;
  const argsText = canonical(args);
  const argsDigest = digest(`${input.toolName}:${argsText}`);
  const tool = visibleTools(input.manifest, input.policy, input.role).find((t) => t.name === input.toolName);
  const { policy } = input;
  const g = input.gateway;
  const stages: Array<{ name: string; run: () => Promise<Decision | void> | Decision | void }> = [
    {
      name: "input",
      run: () => {
        if (typeof input.args !== "object" || input.args === null || Array.isArray(input.args))
          return blocked("input.shape", "Tool arguments must be a JSON object.");
        if (utf8Size(argsText) > 64_000) return blocked("input.size", "The arguments are larger than 64 KB.");
      },
    },
    {
      name: "rbac",
      run: () => {
        if (!tool) return blocked("rbac.tool", `The ${input.role} role cannot use ${input.toolName}.`);
      },
    },
    {
      name: "schema",
      run: () => {
        const validate = validatorFor(tool!);
        if (!validate(args))
          return blocked(
            "schema.invalid",
            `The arguments do not match the tool: ${ajv.errorsText(validate.errors, { dataVar: "input" })}.`,
          );
      },
    },
    {
      name: "approval",
      run: () => {
        if (hit(policy.requireApproval, tool!))
          return blocked(
            "approval.required",
            "A person has to approve this action first. Nothing was sent.",
            "approval_required",
          );
      },
    },
    {
      name: "loop",
      run: async () => {
        const n = await store.incr(`loop:${g}:${argsDigest}`, policy.loop.windowSeconds);
        if (n > policy.loop.maxRepeats)
          return blocked(
            "loop.repeat",
            `This exact call ran ${policy.loop.maxRepeats} times in ${policy.loop.windowSeconds} seconds. The agent looks stuck, so Accord stopped it.`,
          );
      },
    },
    {
      name: "rate",
      run: async () => {
        const ok = await store.take(`rate:${g}`, policy.rate.capacity, policy.rate.refillPerMinute, started);
        if (!ok) return blocked("rate.bucket", "Too many calls in a short time. Wait a moment and try again.");
      },
    },
    {
      name: "quota",
      run: async () => {
        const n = await store.incr(`calls:${g}`, 60 * 60 * 24 * 30);
        if (n > policy.callLimit)
          return blocked("quota.total", `This gateway has used all ${policy.callLimit} free calls.`);
      },
    },
  ];

  let decision: Decision = { effect: "allow", rule: "policy.allow", reason: "The call passed every check." };
  for (const stage of stages) {
    try {
      const d = await stage.run();
      if (d) {
        decision = d;
        break;
      }
    } catch {
      decision = blocked(`${stage.name}.unavailable`, "A safety check could not run, so the call was stopped.");
      break;
    }
  }

  let result: unknown;
  let cached = false;
  let outcome: Receipt["outcome"] = "not_executed";
  let bytesRaw = 0;
  const counter = { n: 0 };
  if (decision.effect === "allow" && tool) {
    const cacheKey = `cache:${g}:${input.role}:${digest(canonical(policy))}:${digest(canonical(tool))}:${argsDigest}`;
    const cacheable = policy.cacheSeconds > 0 && (tool.annotations.readOnlyHint || hit(policy.cache, tool));
    if (cacheable)
      try {
        const found = await store.get(cacheKey);
        if (found !== null) {
          result = JSON.parse(found);
          cached = true;
        }
      } catch {}
    if (!cached)
      try {
        result = await input.execute(tool, args);
        if (cacheable)
          try {
            await store.set(cacheKey, JSON.stringify(result), policy.cacheSeconds);
          } catch {}
      } catch {
        outcome = "error";
        decision = blocked("execution.failed", "The tool failed. No successful response was returned.");
      }
    if (outcome !== "error") {
      outcome = "sample_returned";
      bytesRaw = size(result);
      try {
        result = strip(result, policy.strip);
      } catch {}
      const keep = policy.prune[tool.name];
      if (keep?.length)
        try {
          result = prune(result, keep);
        } catch {}
      try {
        result = redact(result, policy.redact, counter);
      } catch {
        result = undefined;
        outcome = "error";
        decision = blocked("redact.unavailable", "Private fields could not be removed, so the response was withheld.");
      }
    }
  }

  const receipt: Receipt = {
    version: "accord.receipt/v1",
    id: `rcpt_${digest(`${argsDigest}:${started}:${Math.random()}`)}`,
    time: new Date(started).toISOString(),
    gateway: g,
    role: input.role,
    tool: input.toolName.slice(0, 80),
    argsDigest,
    policyDigest: digest(canonical(policy)),
    effect: decision.effect,
    rule: decision.rule,
    outcome,
    cached,
    latencyMs: Date.now() - clockStart,
    bytesIn: utf8Size(argsText),
    bytesRaw,
    bytesOut: size(result),
    redacted: counter.n,
  };
  try {
    await store.push(`receipts:${g}`, JSON.stringify(receipt), 100);
  } catch {}
  return { decision, receipt, ...(result !== undefined ? { result } : {}) };
}
