import type { JsonSchema, Manifest, ManifestTool } from "./convert";

// Sample responses for the sandbox gateway and the homepage demo. Values are
// generated from the tool's schema and seeded by tool + arguments, so the same
// call always returns the same data. Everything is visibly sample data
// (example.com addresses, "sample" ids); no real API is ever called here.

export function digest(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

function random(seed: string) {
  let s = parseInt(digest(seed), 16) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

const WORDS = ["harbor", "maple", "orbit", "cedar", "delta", "summit", "river", "linen"];
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function sampleString(key: string, format: unknown, r: () => number) {
  const k = key.toLowerCase();
  const word = WORDS[Math.floor(r() * WORDS.length)];
  const day = 1 + Math.floor(r() * 13);
  if (format === "date-time" || /(_at|_on|date|time)$/.test(k))
    return new Date(Date.UTC(2026, 8, day, 9, 30)).toISOString();
  if (format === "date") return `2026-09-${String(day).padStart(2, "0")}`;
  if (format === "email" || k.includes("email")) return `${word}@example.com`;
  if (format === "uri" || k.includes("url") || k.includes("link")) return `https://example.com/${word}`;
  if (format === "uuid" || k === "id" || k.endsWith("_id") || k.endsWith("id"))
    return `sample_${Math.floor(r() * 1e9).toString(36)}`;
  if (k.includes("currency")) return "usd";
  if (k.includes("status") || k.includes("state")) return ["open", "active", "pending"][Math.floor(r() * 3)];
  if (k.includes("name") || k.includes("title")) return `Sample ${word[0].toUpperCase()}${word.slice(1)}`;
  return `sample ${word}`;
}

export function sample(schema: unknown, r: () => number, key = "", depth = 0): unknown {
  if (!isObj(schema) || depth > 6) return null;
  if (Array.isArray(schema.examples) && schema.examples.length) return schema.examples[0];
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length)
    return schema.enum[Math.floor(r() * schema.enum.length)];
  if (Array.isArray(schema.allOf) && schema.allOf.length)
    return Object.assign({}, ...schema.allOf.map((s) => sample(s, r, key, depth + 1)).filter(isObj));
  const choice = schema.oneOf ?? schema.anyOf;
  if (Array.isArray(choice) && choice.length) return sample(choice[0], r, key, depth + 1);
  let type = schema.type;
  if (Array.isArray(type)) type = type.find((t) => t !== "null");
  if (!type && isObj(schema.properties)) type = "object";
  switch (type) {
    case "object": {
      const props = isObj(schema.properties) ? schema.properties : {};
      return Object.fromEntries(
        Object.entries(props).slice(0, 25).map(([k, v]) => [k, sample(v, r, k, depth + 1)]),
      );
    }
    case "array":
      return Array.from({ length: depth === 0 ? 3 : 2 }, () => sample(schema.items, r, key, depth + 1));
    case "integer":
      return Math.floor(r() * 1000);
    case "number":
      return Math.round(r() * 100000) / 100;
    case "boolean":
      return r() > 0.5;
    case "string":
      return sampleString(key, schema.format, r);
    default:
      return null;
  }
}

export function mockResponse(tool: ManifestTool, args: Record<string, unknown>): unknown {
  const r = random(`${tool.name}:${canonical(args)}`);
  if (tool.responseSchema) return sample(tool.responseSchema, r);
  const noun = tool.name.replace(/^(list|get|create|update|delete|check|describe)_/, "");
  // Shaped like a typical API record, bulky links and metadata included, so
  // stripping and redaction have something real to act on.
  const record = (extra: Record<string, unknown> = {}) => {
    const id = `sample_${Math.floor(r() * 1e9).toString(36)}`;
    return {
      id,
      object: noun,
      name: sampleString("name", undefined, r),
      email: sampleString("email", undefined, r),
      status: sampleString("status", undefined, r),
      created_at: sampleString("created_at", undefined, r),
      url: `https://example.com/${noun}/${id}`,
      html_url: `https://example.com/app/${noun}/${id}`,
      metadata: { source: "accord-sample", etag: digest(id), node_id: `N_${id}` },
      ...extra,
    };
  };
  const bodyArgs = Object.fromEntries(
    Object.keys(tool.params.body).filter((p) => args[p] !== undefined).map((p) => [tool.params.body[p], args[p]]),
  );
  const pathArgs = Object.fromEntries(Object.keys(tool.params.path).map((p) => [p, args[p]]));
  switch (tool.method) {
    case "GET":
      return Object.keys(tool.params.path).length && tool.name.startsWith("get_")
        ? record(pathArgs)
        : { data: [record(), record(), record()], has_more: false };
    case "DELETE":
      return { ...pathArgs, deleted: true };
    case "POST":
      return record(bodyArgs);
    default:
      return record({ ...pathArgs, ...bodyArgs });
  }
}

// The HTTP request a deployed server would send. Secrets stay as placeholders.
export function buildRequest(m: Manifest, tool: ManifestTool, args: Record<string, unknown>) {
  let path = tool.path;
  for (const [prop, name] of Object.entries(tool.params.path))
    path = path.replace(`{${name}}`, encodeURIComponent(String(args[prop] ?? "")));
  const url = new URL(`${(tool.server ?? m.baseUrl).replace(/\/$/, "")}${path}`);
  const text = (v: unknown) => (typeof v === "object" ? JSON.stringify(v) : String(v));
  for (const [prop, name] of Object.entries(tool.params.query))
    if (args[prop] !== undefined) url.searchParams.set(name, text(args[prop]));
  const headers: Record<string, string> = { ...m.headers };
  if (m.auth.type === "bearer") headers.Authorization = "Bearer {{API_TOKEN}}";
  if (m.auth.type === "basic") headers.Authorization = "Basic {{API_TOKEN}}";
  if (m.auth.type === "header") headers[m.auth.header] = "{{API_TOKEN}}";
  let href = url.toString();
  if (m.auth.type === "query")
    href += `${url.search ? "&" : "?"}${encodeURIComponent(m.auth.name)}={{API_TOKEN}}`;
  let body: string | undefined;
  const { wholeBody, bodyType } = tool.params;
  if (wholeBody && args[wholeBody] !== undefined) body = text(args[wholeBody]);
  else if (Object.keys(tool.params.body).length) {
    const fields: Record<string, unknown> = {};
    for (const [prop, name] of Object.entries(tool.params.body))
      if (args[prop] !== undefined) fields[name] = args[prop];
    if (Object.keys(fields).length)
      body =
        bodyType === "form"
          ? new URLSearchParams(Object.entries(fields).map(([k, v]) => [k, text(v)])).toString()
          : JSON.stringify(fields);
  }
  if (body !== undefined)
    headers["Content-Type"] =
      bodyType === "form" ? "application/x-www-form-urlencoded" : bodyType === "json" ? "application/json" : "text/plain";
  return { method: tool.method, url: href, headers, body };
}

// Example arguments for "Test this tool": required fields and any field with
// an example get a value. Works on any JSON Schema, including tools/list output.
export function argsFromSchema(schema: unknown, seed = "args"): Record<string, unknown> {
  const r = random(seed);
  const out: Record<string, unknown> = {};
  if (!isObj(schema)) return out;
  const required = new Set(Array.isArray(schema.required) ? schema.required : []);
  const props = isObj(schema.properties) ? schema.properties : {};
  for (const [k, s] of Object.entries(props)) {
    const hasExample = isObj(s) && (Array.isArray(s.examples) || s.example !== undefined);
    if (required.has(k) || hasExample) out[k] = sample(s, r, k);
  }
  return out;
}
export function exampleArgs(tool: ManifestTool): Record<string, unknown> {
  return argsFromSchema(tool.inputSchema as JsonSchema, tool.name);
}
