import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { z } from "zod";
import { evaluate, policySchema, requestSchema } from "./policy";
export function createPreviewServer() {
  const server = new McpServer({ name: "accord-preview", version: "0.1.0" });
  server.registerTool(
    "accord_describe",
    {
      description:
        "Describe the Accord developer preview and its explicit capability boundaries.",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const description = {
        product: "Accord",
        stage: "developer preview",
        capabilities: [
          "Policy evaluation",
          "Explicit tool allowlists",
          "Budget and payload checks",
        ],
        boundaries: [
          "No external tool execution",
          "No persistent audit storage",
          "No managed identity or billing",
          "Caller-supplied budgets are illustrative, not gateway enforcement",
        ],
        docs: "https://mcp.edenbuilds.me/docs",
      };
      return { content: [{ type: "text", text: JSON.stringify(description) }] };
    },
  );
  server.registerTool(
    "accord_evaluate",
    {
      description:
        "Evaluate a supplied policy against illustrative request metadata. Does not execute tools, authenticate principals, or measure actual usage.",
      inputSchema: z
        .object({ policy: policySchema, request: requestSchema })
        .strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ policy, request }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            mode: "simulation",
            ...evaluate(policy, request),
          }),
        },
      ],
    }),
  );
  return server;
}
export const previewHandler = createMcpHandler(() => createPreviewServer(), {
  responseMode: "json",
});
