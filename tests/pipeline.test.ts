import test from "node:test";
import assert from "node:assert/strict";
import { convert, type Manifest } from "../lib/convert";
import {
  defaultGatewayPolicy,
  memoryStore,
  runCall,
  takeToken,
  visibleTools,
  type GatewayPolicy,
  type Store,
} from "../lib/pipeline";
import { buildRequest, mockResponse } from "../lib/sandbox";

const converted = convert(
  `curl https://api.example.com/v1/orders\ncurl -X DELETE https://api.example.com/v1/orders/123\ncurl --json '{"note":"hi","amount":5}' https://api.example.com/v1/orders`,
);
if (!converted.ok) throw new Error(converted.error);
const manifest: Manifest = converted.manifest;
const policy = defaultGatewayPolicy(manifest);
const execute = async (tool: Manifest["tools"][number], args: Record<string, unknown>) =>
  mockResponse(tool, args);
const call = (store: Store, toolName: string, args: unknown = {}, extra: Partial<GatewayPolicy> = {}, role = "agent", now?: number) =>
  runCall(store, { gateway: "g1", manifest, policy: { ...policy, ...extra }, role, toolName, args, execute, now });

test("An allowed read returns sample data and a receipt", async () => {
  const out = await call(memoryStore(), "list_orders");
  assert.equal(out.decision.effect, "allow");
  assert.equal(out.receipt.outcome, "sample_returned");
  assert.ok(out.result);
});

test("A second identical read is served from the cache", async () => {
  const store = memoryStore();
  await call(store, "list_orders");
  const second = await call(store, "list_orders");
  assert.equal(second.receipt.cached, true);
});

test("A broken cache still lets the call through because caching fails open", async () => {
  const store = { ...memoryStore(), get: async () => { throw new Error("down"); }, set: async () => { throw new Error("down"); } };
  const out = await call(store, "list_orders");
  assert.equal(out.decision.effect, "allow");
  assert.equal(out.receipt.outcome, "sample_returned");
});

test("A broken counter stops the call because safety checks fail closed", async () => {
  const store = { ...memoryStore(), incr: async () => { throw new Error("down"); } };
  let ran = false;
  const out = await runCall(store, { gateway: "g1", manifest, policy, role: "agent", toolName: "list_orders", args: {}, execute: async () => { ran = true; } });
  assert.equal(out.decision.effect, "deny");
  assert.match(out.decision.rule, /\.unavailable$/);
  assert.equal(ran, false);
});

test("The sixth identical call inside a minute is stopped as a loop", async () => {
  const store = memoryStore();
  for (let i = 0; i < 5; i++) assert.equal((await call(store, "list_orders")).decision.effect, "allow");
  const sixth = await call(store, "list_orders");
  assert.equal(sixth.decision.rule, "loop.repeat");
});

test("The loop breaker lets the same call through again once the window passes", async () => {
  let now = 1_000_000;
  const store = memoryStore(() => now);
  for (let i = 0; i < 6; i++) await call(store, "list_orders", {}, {}, "agent", now);
  now += 61_000;
  assert.equal((await call(store, "list_orders", {}, {}, "agent", now)).decision.effect, "allow");
});

test("A viewer never sees or runs a write tool", async () => {
  assert.deepEqual(visibleTools(manifest, policy, "viewer").map((t) => t.name), ["list_orders"]);
  const out = await call(memoryStore(), "create_order", { note: "x" }, {}, "viewer");
  assert.equal(out.decision.rule, "rbac.tool");
});

test("An unknown role sees no tools at all", () => {
  assert.deepEqual(visibleTools(manifest, policy, "admin"), []);
});

test("A delete waits for a person and nothing is executed", async () => {
  let ran = false;
  const out = await runCall(memoryStore(), { gateway: "g1", manifest, policy, role: "agent", toolName: "delete_order", args: { order_id: "1" }, execute: async () => { ran = true; } });
  assert.equal(out.decision.effect, "approval_required");
  assert.equal(ran, false);
});

test("Arguments that do not match the schema are rejected before execution", async () => {
  const out = await call(memoryStore(), "create_order", { amount: "five" });
  assert.equal(out.decision.rule, "schema.invalid");
  assert.equal(out.receipt.outcome, "not_executed");
});

test("The call limit stops the first call over the cap", async () => {
  const store = memoryStore();
  for (let i = 0; i < 3; i++) await call(store, "create_order", { amount: i }, { callLimit: 3 });
  const over = await call(store, "create_order", { amount: 99 }, { callLimit: 3 });
  assert.equal(over.decision.rule, "quota.total");
});

test("The token bucket empties under a burst and refills over time", () => {
  let state = null as { tokens: number; at: number } | null;
  for (let i = 0; i < 3; i++) {
    const r = takeToken(state, 3, 60, 0);
    assert.equal(r.ok, true);
    state = r.state;
  }
  assert.equal(takeToken(state, 3, 60, 0).ok, false);
  assert.equal(takeToken(state, 3, 60, 1000).ok, true);
});

test("A burst beyond the rate limit is stopped", async () => {
  const store = memoryStore();
  const results = [];
  for (let i = 0; i < 4; i++) results.push((await call(store, "create_order", { amount: i }, { rate: { capacity: 3, refillPerMinute: 1 } })).decision.rule);
  assert.equal(results[3], "rate.bucket");
});

test("Pruning keeps only the chosen fields of the response", async () => {
  const out = await call(memoryStore(), "list_orders", {}, { prune: { list_orders: ["data.id"] } });
  const data = (out.result as { data: Record<string, unknown>[] }).data;
  assert.deepEqual(Object.keys(data[0]), ["id"]);
});

test("Bulky links and metadata are stripped and the byte saving is recorded", async () => {
  const out = await call(memoryStore(), "list_orders");
  const first = (out.result as { data: Record<string, unknown>[] }).data[0];
  assert.equal("url" in first || "html_url" in first || "metadata" in first, false);
  assert.ok(out.receipt.bytesOut < out.receipt.bytesRaw);
});

test("Private fields are replaced before the response leaves the gateway", async () => {
  const out = await call(memoryStore(), "list_orders", {}, { redact: ["email"] });
  const first = (out.result as { data: Record<string, unknown>[] }).data[0];
  assert.equal(first.email, "[removed by Accord]");
  assert.equal(out.receipt.redacted, 3);
});

test("A write listed in the cache policy is served from cache on repeat", async () => {
  const store = memoryStore();
  await call(store, "create_order", { amount: 1 }, { cache: ["create_order"] });
  const again = await call(store, "create_order", { amount: 1 }, { cache: ["create_order"] });
  assert.equal(again.receipt.cached, true);
});

test("A deny rule on a path hides production tools from the agent", async () => {
  const { useCases } = await import("../lib/use-cases");
  const devops = useCases.find((u) => u.slug === "devops")!;
  const r = convert(devops.input);
  assert.ok(r.ok);
  const p = defaultGatewayPolicy(r.manifest, devops.policy);
  assert.deepEqual(visibleTools(r.manifest, p, "agent").map((t) => t.name), ["list_incidents", "restart_staging_server"]);
});

test("The built request carries a secret placeholder and never a value", () => {
  const tool = manifest.tools.find((t) => t.name === "create_order")!;
  const req = buildRequest({ ...manifest, auth: { type: "bearer" } }, tool, { note: "hi", amount: 5 });
  assert.equal(req.method, "POST");
  assert.equal(req.headers.Authorization, "Bearer {{API_TOKEN}}");
  assert.equal(req.body, '{"note":"hi","amount":5}');
});

test("Fuzzed arguments always get a decision and never crash the pipeline", async () => {
  const store = memoryStore();
  const shapes: unknown[] = [null, 1, "x", [], [1, 2], { amount: {} }, { amount: 1e308 }, { note: "a".repeat(70_000) }, { ["__proto__"]: { polluted: true } }, { amount: Number.NaN }];
  for (const args of shapes)
    for (const tool of ["create_order", "list_orders", "nope", ""]) {
      const out = await call(store, tool, args, { loop: { maxRepeats: 100, windowSeconds: 60 }, rate: { capacity: 1000, refillPerMinute: 1000 } });
      assert.ok(["allow", "deny", "approval_required"].includes(out.decision.effect));
    }
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
});

test("An execution failure is reported as a failure instead of an allowed result", async () => {
  const out = await runCall(memoryStore(), { gateway: "failure", manifest, policy, role: "agent", toolName: "list_orders", args: {}, execute: async () => { throw new Error("offline"); } });
  assert.equal(out.decision.rule, "execution.failed");
  assert.equal(out.receipt.outcome, "error");
  assert.equal(out.result, undefined);
});

test("Receipt sizes count UTF-8 bytes for non-ASCII data", async () => {
  const result = { message: "नमस्कार 世界" };
  const out = await runCall(memoryStore(), { gateway: "bytes", manifest, policy, role: "agent", toolName: "list_orders", args: {}, execute: async () => result });
  assert.equal(out.receipt.bytesRaw, Buffer.byteLength(JSON.stringify(result)));
  assert.equal(out.receipt.bytesOut, Buffer.byteLength(JSON.stringify(result)));
});

test("A changed tool contract does not reuse an earlier cached response", async () => {
  const store = memoryStore();
  const input = { gateway: "changed", manifest, policy, role: "agent", toolName: "list_orders", args: {}, execute: async () => ({ value: "first" }) };
  await runCall(store, input);
  const changed = { ...manifest, tools: manifest.tools.map(t => ({ ...t, path: "/new-orders" })) };
  const out = await runCall(store, { ...input, manifest: changed, execute: async () => ({ value: "new" }) });
  assert.equal(out.receipt.cached, false);
  assert.deepEqual(out.result, { value: "new" });
});
