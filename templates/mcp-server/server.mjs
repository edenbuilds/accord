import { createServer } from "node:http";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { checkAuth, createHandler, loadManifest } from "./lib.mjs";

// Node server for Docker, Railway or any VM. Serves POST /mcp and GET /health.
const manifest = await loadManifest();
const { handler, count } = createHandler(manifest);
const adapter = toNodeHandler(handler);
const port = Number(process.env.PORT || 8787);

const server = createServer(async (req, res) => {
  if (req.url === "/health") return res.writeHead(200, { "Content-Type": "text/plain" }).end("ok");
  if (req.url !== "/mcp") return res.writeHead(404).end("Not found");
  const denied = checkAuth(req.headers.authorization);
  if (denied) return res.writeHead(denied === "unauthorized" ? 401 : 500, { "WWW-Authenticate": 'Bearer realm="accord"' }).end(denied === "unauthorized" ? "Unauthorized" : denied);
  if (req.method !== "POST") return res.writeHead(405, { Allow: "POST" }).end("Use POST");
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) return res.writeHead(413).end("Request too large");
    chunks.push(chunk);
  }
  let parsed;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    return res.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }));
  }
  await adapter(req, res, parsed);
});

server.listen(port, "0.0.0.0", () => console.log(`Accord MCP server on :${port}/mcp with ${count} tools`));
