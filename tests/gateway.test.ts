import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import {
  McpServer,
  createMcpHandler,
  isCallToolResult,
} from "@modelcontextprotocol/server";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { z } from "zod";
import { defaultPolicy } from "../lib/policy";
test(
  "The local gateway authenticates, filters discovery, blocks approval writes, and enforces its own budget",
  { timeout: 25000 },
  async () => {
    let writes = 0,
      reads = 0;
    const upstreamHandler = createMcpHandler(() => {
      const server = new McpServer({ name: "fixture", version: "1" });
      server.registerTool(
        "read",
        { inputSchema: z.object({ query: z.string() }) },
        async () => {
          reads++;
          return { content: [{ type: "text", text: "fixture read" }] };
        },
      );
      server.registerTool("write", { inputSchema: z.object({}) }, async () => {
        writes++;
        return { content: [{ type: "text", text: "fixture write" }] };
      });
      server.registerTool(
        "hidden",
        { inputSchema: z.object({}) },
        async () => ({ content: [{ type: "text", text: "hidden" }] }),
      );
      return server;
    });
    const upstream = createServer(toNodeHandler(upstreamHandler));
    await new Promise<void>((r) => upstream.listen(0, "127.0.0.1", r));
    const address = upstream.address();
    if (!address || typeof address === "string")
      throw new Error("No upstream port");
    const tmp = await mkdtemp(join(tmpdir(), "accord-test-"));
    const secret = randomBytes(32).toString("hex");
    const configPath = join(tmp, "config.json");
    await writeFile(
      configPath,
      JSON.stringify({
        version: "accord.gateway/v1",
        upstreams: [
          { namespace: "fixture", url: `http://127.0.0.1:${address.port}/mcp` },
        ],
        policy: {
          ...defaultPolicy,
          allowedTools: ["fixture.read", "fixture.write"],
          requireApproval: ["fixture.write"],
          limitPerMinute: 2,
        },
      }),
    );
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "gateway/server.ts"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          ACCORD_GATEWAY_TOKEN: secret,
          ACCORD_CONFIG: configPath,
          PORT: "0",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let logs = "";
    let errors = "";
    child.stdout.on("data", (c) => (logs += c.toString()));
    child.stderr.on("data", (c) => (errors += c.toString()));
    const client = new Client({ name: "gateway-test", version: "1" });
    try {
      const port = await new Promise<number>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error(`Gateway startup timeout: ${errors}`)),
          12000,
        );
        child.stdout.on("data", () => {
          const line = logs
            .split("\n")
            .find((s) => s.includes("gateway_ready"));
          if (line) {
            clearTimeout(timeout);
            const event = JSON.parse(line);
            resolve(Number(new URL(event.url).port));
          }
        });
        child.once("exit", () => {
          clearTimeout(timeout);
          reject(new Error(`Gateway exited: ${errors}`));
        });
      });
      const url = `http://127.0.0.1:${port}/mcp`;
      assert.equal((await fetch(url, { method: "POST" })).status, 401);
      assert.equal(
        (
          await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${secret}`,
              Origin: "https://evil.example",
            },
          })
        ).status,
        403,
      );
      await client.connect(
        new StreamableHTTPClientTransport(new URL(url), {
          requestInit: { headers: { Authorization: `Bearer ${secret}` } },
        }),
      );
      const tools = await client.listTools();
      assert.deepEqual(
        tools.tools.map((t) => t.name),
        ["fixture.read", "fixture.write"],
      );
      const approval = await client.callTool({
        name: "fixture.write",
        arguments: {},
      });
      assert.ok(isCallToolResult(approval) && approval.isError);
      assert.equal(writes, 0);
      const malformed = await client.callTool({
        name: "fixture.read",
        arguments: { query: 123 },
      });
      assert.ok(isCallToolResult(malformed) && malformed.isError);
      assert.equal(reads, 0);
      for (let i = 0; i < 2; i++) {
        const result = await client.callTool({
          name: "fixture.read",
          arguments: { query: "test" },
        });
        assert.ok(isCallToolResult(result) && !result.isError);
      }
      const over = await client.callTool({
        name: "fixture.read",
        arguments: { query: "test" },
      });
      assert.ok(isCallToolResult(over) && over.isError);
      assert.equal(reads, 2);
      assert.ok(!logs.includes(secret));
      assert.ok(!logs.includes('"query"'));
    } finally {
      await client.close();
      child.kill("SIGTERM");
      await once(child, "exit").catch(() => {});
      await upstreamHandler.close();
      await new Promise<void>((r) => upstream.close(() => r()));
      await rm(tmp, { recursive: true, force: true });
    }
  },
);
