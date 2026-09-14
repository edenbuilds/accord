// Manual smoke test for templates/mcp-server (not in `npm test`: it calls a
// public API). Run: npx tsx tests/template-smoke.ts
import assert from "node:assert/strict";
import { rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { isCallToolResult } from "@modelcontextprotocol/server";
import { convert } from "../lib/convert";

const dir = new URL("../templates/mcp-server/", import.meta.url).pathname;
const r = convert(`# get_post: Read one post
curl https://jsonplaceholder.typicode.com/posts/{post_id}
# create_post: Create a post
curl --json '{"title":"x"}' https://jsonplaceholder.typicode.com/posts`);
if (!r.ok) throw new Error(r.error);
writeFileSync(`${dir}tools.json`, JSON.stringify(r.manifest));

const token = "t".repeat(32);
const port = "8799";
const child = spawn("node", ["server.mjs"], {
  cwd: dir,
  env: { ...process.env, PORT: port, MCP_BEARER_TOKEN: token, ACCORD_MANIFEST_URL: "" },
});
const base = `http://127.0.0.1:${port}/mcp`;
try {
  await new Promise<void>((ok, fail) => {
    const timer = setTimeout(() => fail(new Error("The template server did not start.")), 15000);
    child.stdout.on("data", (d) => String(d).includes("Accord MCP server") && (clearTimeout(timer), ok()));
    child.stderr.on("data", (d) => process.stderr.write(d));
  });

  const unauth = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.equal(unauth.status, 401, "A call without the bearer token is refused");

  const client = new Client({ name: "template-smoke", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(base), { requestInit: { headers: { Authorization: `Bearer ${token}` } } }),
  );
  const tools = (await client.listTools()).tools.map((t) => t.name);
  assert.deepEqual(tools, ["get_post"], "Write tools stay hidden unless ALLOW_WRITES=true");

  const res = await client.callTool({ name: "get_post", arguments: { post_id: "1" } });
  assert.ok(isCallToolResult(res) && !res.isError, "The real API call succeeds");
  const part = res.content.find((c) => c.type === "text");
  assert.ok(part && part.type === "text" && JSON.parse(part.text).id === 1, "The real API response comes back");
  await client.close();
  console.log(JSON.stringify({ unauthorized: unauth.status, tools, forwarded: "get_post -> jsonplaceholder /posts/1 ok" }));
} finally {
  child.kill();
  rmSync(`${dir}tools.json`, { force: true });
}
