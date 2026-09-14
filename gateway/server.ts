import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import {
  McpServer,
  createMcpHandler,
  fromJsonSchema,
  isCallToolResult,
} from "@modelcontextprotocol/server";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import {
  toNodeHandler,
  localhostHostValidation,
  localhostOriginValidation,
} from "@modelcontextprotocol/node";
import { gatewaySchema } from "./config";
import { Guard, hash } from "./engine";
const secret = process.env.ACCORD_GATEWAY_TOKEN;
if (!secret || secret.length < 32)
  throw new Error(
    "Set ACCORD_GATEWAY_TOKEN to a random secret of at least 32 characters.",
  );
const config = gatewaySchema.parse(
  JSON.parse(
    await readFile(process.env.ACCORD_CONFIG || "gateway/example.json", "utf8"),
  ),
);
const clients: Client[] = [];
const registered: Array<{
  name: string;
  tool: Awaited<ReturnType<Client["listTools"]>>["tools"][number];
  client: Client;
  guard: Guard;
}> = [];
const guard = new Guard(config.policy);
try {
  for (const upstream of config.upstreams) {
    const token = upstream.tokenEnv
      ? process.env[upstream.tokenEnv]
      : undefined;
    if (upstream.tokenEnv && !token)
      throw new Error("Missing upstream environment credential.");
    const client = new Client({ name: "accord-gateway", version: "0.1.0" });
    const transport = new StreamableHTTPClientTransport(new URL(upstream.url), {
      requestInit: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        redirect: "error",
      },
      fetch: async (url, init) => {
        if (new URL(String(url)).origin !== new URL(upstream.url).origin)
          throw new Error("Cross-origin upstream requests are disabled.");
        return fetch(url, {
          ...init,
          redirect: "error",
          signal: AbortSignal.any([
            ...(init?.signal ? [init.signal] : []),
            AbortSignal.timeout(10000),
          ]),
        });
      },
    });
    await client.connect(transport);
    clients.push(client);
    let cursor: string | undefined;
    let pages = 0;
    do {
      const result = await client.listTools(cursor ? { cursor } : {});
      for (const tool of result.tools) {
        if (registered.length >= 100)
          throw new Error("Preview tool catalog limit reached.");
        const name = `${upstream.namespace}.${tool.name}`;
        if (config.policy.allowedTools.includes(name))
          registered.push({ name, tool, client, guard });
      }
      cursor = result.nextCursor;
      pages++;
      if (cursor && pages >= 10)
        throw new Error("Preview catalog pagination limit reached.");
    } while (cursor);
  }
} catch {
  await Promise.allSettled(clients.map((c) => c.close()));
  throw new Error(
    "Upstream discovery failed. Verify configured URLs, credentials, and catalog limits. No upstream credentials are logged.",
  );
}
const handler = createMcpHandler(
  () => {
    const server = new McpServer({ name: "accord-gateway", version: "0.1.0" });
    for (const entry of registered) {
      server.registerTool(
        entry.name,
        {
          description: `${entry.tool.description?.slice(0, 2000) || entry.name} (via Accord)`,
          inputSchema: fromJsonSchema<Record<string, unknown>>(
            entry.tool.inputSchema as Parameters<typeof fromJsonSchema>[0],
          ),
        },
        async (args) => {
          const started = Date.now();
          const decision = entry.guard.check(
            entry.name,
            Buffer.byteLength(JSON.stringify(args)),
          );
          const receipt = {
            version: "accord.receipt/v0",
            id: randomUUID(),
            time: new Date().toISOString(),
            tool: entry.name,
            policyHash: hash(config.policy),
            schemaHash: hash(entry.tool.inputSchema),
            decision: decision.effect,
            rule: decision.rule,
          };
          if (decision.effect !== "allow") {
            console.log(
              JSON.stringify({
                ...receipt,
                outcome: "not_executed",
                latencyMs: Date.now() - started,
              }),
            );
            return {
              isError: true,
              content: [{ type: "text", text: JSON.stringify(decision) }],
            };
          }
          try {
            const result = await entry.client.callTool(
              { name: entry.tool.name, arguments: args },
              { timeout: 10000 },
            );
            if (!isCallToolResult(result))
              throw new Error("Unsupported upstream result");
            if (result.isError) entry.guard.failure();
            else entry.guard.success();
            console.log(
              JSON.stringify({
                ...receipt,
                outcome: result.isError ? "upstream_error" : "succeeded",
                latencyMs: Date.now() - started,
              }),
            );
            return result;
          } catch {
            entry.guard.failure();
            console.log(
              JSON.stringify({
                ...receipt,
                outcome: "unknown",
                latencyMs: Date.now() - started,
              }),
            );
            return {
              isError: true,
              content: [
                {
                  type: "text",
                  text: "Upstream failed or timed out. Outcome is unknown. Do not automatically retry a write.",
                },
              ],
            };
          }
        },
      );
    }
    return server;
  },
  { responseMode: "json" },
);
const adapter = toNodeHandler(handler);
const hostGuard = localhostHostValidation();
const originGuard = localhostOriginValidation();
const server = createServer(async (req, res) => {
  if (!hostGuard(req, res) || !originGuard(req, res)) return;
  if (req.url !== "/mcp") {
    res.writeHead(404).end("Not found");
    return;
  }
  const supplied = req.headers.authorization || "";
  const expected = `Bearer ${secret}`;
  if (
    !timingSafeEqual(
      createHash("sha256").update(supplied).digest(),
      createHash("sha256").update(expected).digest(),
    )
  ) {
    res
      .writeHead(401, { "WWW-Authenticate": 'Bearer realm="accord"' })
      .end("Unauthorized");
    return;
  }
  if (req.method !== "POST") {
    res.writeHead(405, { Allow: "POST" }).end("Method not allowed");
    return;
  }
  if (!req.headers["content-type"]?.includes("application/json")) {
    res.writeHead(415).end("Use application/json");
    return;
  }
  try {
    let size = 0;
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 65536) {
        res.writeHead(413).end("Request too large");
        return;
      }
      chunks.push(chunk);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(Buffer.concat(chunks).toString());
    } catch {
      res.writeHead(400).end("Invalid JSON");
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    await adapter(req, res, parsed);
  } catch {
    if (!res.headersSent) res.writeHead(500);
    res.end("Gateway request failed");
  }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
const port = Number(process.env.PORT || 4318);
server.listen(port, "127.0.0.1", () =>
  console.log(
    JSON.stringify({
      event: "gateway_ready",
      url: `http://127.0.0.1:${(server.address() as import("node:net").AddressInfo).port}/mcp`,
      tools: registered.map((t) => t.name),
      mode: "single-process developer preview",
    }),
  ),
);
async function shutdown() {
  server.close();
  await Promise.allSettled(clients.map((c) => c.close()));
  await handler.close();
  process.exit(0);
}
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
