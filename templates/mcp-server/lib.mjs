import { createHash, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { McpServer, createMcpHandler, fromJsonSchema } from "@modelcontextprotocol/server";

// Self-hosted Accord MCP server. It forwards tool calls to your real API with
// your key, which stays on this server. The agent never sees it.
const env = process.env;

export async function loadManifest() {
  if (env.ACCORD_MANIFEST_URL) {
    const res = await fetch(env.ACCORD_MANIFEST_URL, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Could not load the manifest (${res.status}).`);
    return res.json();
  }
  return JSON.parse(await readFile(new URL("./tools.json", import.meta.url), "utf8"));
}

// Returns null when the caller may proceed, or a reason when not.
export function checkAuth(authorization) {
  const expected = env.MCP_BEARER_TOKEN;
  if (!expected || expected.length < 24) return "Set MCP_BEARER_TOKEN (24 characters or more) before exposing this server.";
  const a = createHash("sha256").update(authorization ?? "").digest();
  const b = createHash("sha256").update(`Bearer ${expected}`).digest();
  return timingSafeEqual(a, b) ? null : "unauthorized";
}

export function buildRequest(manifest, tool, args) {
  let path = tool.path;
  for (const [prop, name] of Object.entries(tool.params.path)) path = path.replace(`{${name}}`, encodeURIComponent(String(args[prop] ?? "")));
  const base = (env.API_BASE_URL || tool.server || manifest.baseUrl).replace(/\/$/, "");
  const url = new URL(base + path);
  const text = (v) => (typeof v === "object" ? JSON.stringify(v) : String(v));
  for (const [prop, name] of Object.entries(tool.params.query)) if (args[prop] !== undefined) url.searchParams.set(name, text(args[prop]));
  const headers = { ...manifest.headers };
  const token = env.API_TOKEN ?? "";
  if (manifest.auth.type === "bearer") headers.Authorization = `Bearer ${token}`;
  if (manifest.auth.type === "basic") headers.Authorization = `Basic ${Buffer.from(token.includes(":") ? token : `${token}:`).toString("base64")}`;
  if (manifest.auth.type === "header") headers[manifest.auth.header] = token;
  if (manifest.auth.type === "query") url.searchParams.set(manifest.auth.name, token);
  let body;
  const { wholeBody, bodyType } = tool.params;
  if (wholeBody && args[wholeBody] !== undefined) body = text(args[wholeBody]);
  else if (Object.keys(tool.params.body).length) {
    const fields = {};
    for (const [prop, name] of Object.entries(tool.params.body)) if (args[prop] !== undefined) fields[name] = args[prop];
    if (Object.keys(fields).length)
      body = bodyType === "form" ? new URLSearchParams(Object.entries(fields).map(([k, v]) => [k, text(v)])).toString() : JSON.stringify(fields);
  }
  if (body !== undefined) headers["Content-Type"] = bodyType === "form" ? "application/x-www-form-urlencoded" : "application/json";
  return { method: tool.method, url: url.toString(), headers, body };
}

export function createHandler(manifest) {
  // Read-only by default. Set ALLOW_WRITES=true to expose tools that change data.
  const allowWrites = env.ALLOW_WRITES === "true";
  const tools = manifest.tools.filter((t) => allowWrites || t.annotations?.readOnlyHint);
  const handler = createMcpHandler(
    () => {
      const server = new McpServer({ name: "accord-self-hosted", version: "1.0.0" });
      for (const tool of tools)
        server.registerTool(
          tool.name,
          { title: tool.title, description: tool.description, inputSchema: fromJsonSchema(tool.inputSchema), annotations: tool.annotations },
          async (args) => {
            const req = buildRequest(manifest, tool, args);
            try {
              const res = await fetch(req.url, { method: req.method, headers: req.headers, body: req.body, redirect: "error", signal: AbortSignal.timeout(15000) });
              const text = (await res.text()).slice(0, 200_000);
              return { isError: !res.ok, content: [{ type: "text", text: res.ok ? text : `The API returned ${res.status}: ${text.slice(0, 2000)}` }] };
            } catch {
              return { isError: true, content: [{ type: "text", text: "The API did not respond in time. The outcome is unknown, so do not retry a write automatically." }] };
            }
          },
        );
      return server;
    },
    { responseMode: "json" },
  );
  return { handler, count: tools.length };
}
