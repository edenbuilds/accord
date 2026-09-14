import test from "node:test";
import assert from "node:assert/strict";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { isCallToolResult } from "@modelcontextprotocol/server";
import { buildGateway, saveGateway } from "../lib/gateways";
import { handleGatewayMcp } from "../lib/gateway-mcp";
import { memoryStore, type Store } from "../lib/pipeline";

const INPUT = `curl https://api.example.com/v1/orders -H "Authorization: Bearer $TOKEN"
curl -X DELETE https://api.example.com/v1/orders/{order_id} -H "Authorization: Bearer $TOKEN"`;

async function setup(store: Store = memoryStore()) {
  const built = buildGateway(INPUT);
  if (!built.ok) throw new Error(built.error);
  await saveGateway(store, built.record);
  return { store, id: built.record.id };
}

async function connect(store: Store, id: string, query = "") {
  const client = new Client({ name: "accord-test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(`https://mcp.test/g/${id}/mcp${query}`), {
      fetch: (url, init) => handleGatewayMcp(new Request(url, init), id, store),
    }),
  );
  return client;
}

function text(result: unknown) {
  assert.ok(isCallToolResult(result));
  const part = result.content.find((c) => c.type === "text");
  assert.ok(part && part.type === "text");
  return { isError: Boolean(result.isError), body: JSON.parse(part.text) };
}

test("An MCP client lists the converted tools and gets sample data back", async () => {
  const { store, id } = await setup();
  const client = await connect(store, id);
  try {
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map((t) => t.name).sort(), ["delete_order", "list_orders"]);
    const out = text(await client.callTool({ name: "list_orders", arguments: {} }));
    assert.equal(out.isError, false);
    assert.equal(out.body.sample, true);
    assert.ok(out.body.result.data.length);
  } finally {
    await client.close();
  }
});

test("A delete through the hosted gateway waits for approval", async () => {
  const { store, id } = await setup();
  const client = await connect(store, id);
  try {
    const out = text(await client.callTool({ name: "delete_order", arguments: { order_id: "1" } }));
    assert.equal(out.isError, true);
    assert.equal(out.body.effect, "approval_required");
  } finally {
    await client.close();
  }
});

test("The hosted gateway stops an agent that repeats the same call", async () => {
  const { store, id } = await setup();
  const client = await connect(store, id);
  try {
    for (let i = 0; i < 5; i++)
      assert.equal(text(await client.callTool({ name: "list_orders", arguments: {} })).isError, false);
    const sixth = text(await client.callTool({ name: "list_orders", arguments: {} }));
    assert.equal(sixth.body.rule, "loop.repeat");
  } finally {
    await client.close();
  }
});

test("A viewer role only sees read tools", async () => {
  const { store, id } = await setup();
  const client = await connect(store, id, "?role=viewer");
  try {
    assert.deepEqual((await client.listTools()).tools.map((t) => t.name), ["list_orders"]);
  } finally {
    await client.close();
  }
});

const init = (id: string, query = "") =>
  new Request(`https://mcp.test/g/${id}/mcp${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } }),
  });

test("An unknown gateway id returns 404 without running anything", async () => {
  const res = await handleGatewayMcp(init("AAAAAAAAAAAA"), "AAAAAAAAAAAA", memoryStore());
  assert.equal(res.status, 404);
});

test("When the store is down the gateway fails closed with 503", async () => {
  const { id } = await setup();
  const broken = { ...memoryStore(), get: async () => { throw new Error("down"); } };
  const res = await handleGatewayMcp(init(id), id, broken);
  assert.equal(res.status, 503);
});

test("An unknown role is refused", async () => {
  const { store, id } = await setup();
  const res = await handleGatewayMcp(init(id, "?role=admin"), id, store);
  assert.equal(res.status, 403);
});

test("A browser on another site cannot call the gateway", async () => {
  const { store, id } = await setup();
  const req = new Request(`https://mcp.test/g/${id}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
    body: "{}",
  });
  assert.equal((await handleGatewayMcp(req, id, store)).status, 403);
});

test("Gateway creation refuses oversized input and keeps at most 50 tools", () => {
  assert.equal(buildGateway("x".repeat(300_000)).ok, false);
  const many = Array.from({ length: 60 }, (_, i) => `curl https://api.example.com/r${i}`).join("\n");
  const built = buildGateway(many);
  assert.ok(built.ok && built.record.manifest.tools.length === 50);
});
