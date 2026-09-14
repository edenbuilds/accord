import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import {
  createMcpHandler,
  isCallToolResult,
} from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { createPreviewServer } from "../lib/mcp";
import { defaultPolicy } from "../lib/policy";
test("An official SDK client discovers both public tools and receives an enforced decision", async () => {
  const handler = createMcpHandler(createPreviewServer, {
    responseMode: "json",
  });
  const server = createServer(toNodeHandler(handler));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No listener");
  const client = new Client({ name: "accord-test", version: "1.0.0" });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`http://127.0.0.1:${address.port}/mcp`),
      ),
    );
    const tools = await client.listTools();
    assert.deepEqual(
      tools.tools.map((t) => t.name),
      ["accord_describe", "accord_evaluate"],
    );
    const result = await client.callTool({
      name: "accord_evaluate",
      arguments: {
        policy: defaultPolicy,
        request: {
          tool: "github.list_issues",
          callsInWindow: 30,
          payloadBytes: 128,
        },
      },
    });
    assert.ok(isCallToolResult(result));
    const text = result.content.find((c) => c.type === "text");
    assert.ok(text && text.type === "text");
    assert.equal(JSON.parse(text.text).effect, "deny");
    const invalid = await client.callTool({
      name: "accord_evaluate",
      arguments: {
        policy: defaultPolicy,
        request: {
          tool: "github.list_issues",
          callsInWindow: -1,
          payloadBytes: 128,
        },
      },
    });
    assert.ok(isCallToolResult(invalid) && invalid.isError);
  } finally {
    await client.close();
    await handler.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
