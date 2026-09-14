import { McpServer, createMcpHandler, fromJsonSchema } from "@modelcontextprotocol/server";
import { loadGateway, type GatewayRecord } from "./gateways";
import { readJson, sameOrigin } from "./http";
import { runCall, visibleTools, type Store } from "./pipeline";
import { mockResponse } from "./sandbox";

// The hosted sandbox gateway: one MCP server per stored manifest. Every call
// runs the Phase 1 pipeline. Responses are sample data; nothing is forwarded.

const rpcError = (status: number, code: number, message: string) =>
  Response.json({ jsonrpc: "2.0", id: null, error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });

function buildServer(record: GatewayRecord, role: string, store: Store) {
  const server = new McpServer({ name: `accord-${record.id}`, version: "1.0.0" });
  for (const tool of visibleTools(record.manifest, record.policy, role)) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: `${tool.description} (Accord sandbox: returns sample data.)`,
        inputSchema: fromJsonSchema<Record<string, unknown>>(
          tool.inputSchema as Parameters<typeof fromJsonSchema>[0],
        ),
        annotations: tool.annotations,
      },
      async (args) => {
        const out = await runCall(store, {
          gateway: record.id,
          manifest: record.manifest,
          policy: record.policy,
          role,
          toolName: tool.name,
          args,
          execute: async (t, a) => mockResponse(t, a),
        });
        if (out.decision.effect !== "allow")
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ ...out.decision, receipt: out.receipt.id }),
              },
            ],
          };
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                sample: true,
                note: "Sample data from the Accord sandbox. No real API was called.",
                cached: out.receipt.cached,
                result: out.result,
              }),
            },
          ],
        };
      },
    );
  }
  return server;
}

export async function handleGatewayMcp(request: Request, id: string, store: Store): Promise<Response> {
  if (!sameOrigin(request)) return new Response("Origin not allowed", { status: 403 });
  if (request.method !== "POST")
    return new Response("This is an MCP endpoint. Add it to Claude, Cursor or any MCP client.", {
      status: 405,
      headers: { Allow: "POST" },
    });
  const body = await readJson(request, 65536, true);
  if (!body.ok) return body.response;
  let record: GatewayRecord | null;
  try {
    record = await loadGateway(store, id);
  } catch {
    // Fail closed: without the store we cannot enforce limits, so nothing runs.
    return rpcError(503, -32000, "The gateway store is unavailable, so calls are stopped for safety.");
  }
  if (!record) return rpcError(404, -32001, "This gateway does not exist or has expired.");
  const role = new URL(request.url).searchParams.get("role") ?? record.policy.defaultRole;
  if (!(role in record.policy.roles)) return rpcError(403, -32002, `Unknown role: ${role.slice(0, 32)}.`);
  const handler = createMcpHandler(() => buildServer(record, role, store), { responseMode: "json" });
  const response = await handler.fetch(request, { parsedBody: body.value });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
