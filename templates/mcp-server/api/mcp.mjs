import { checkAuth, createHandler, loadManifest } from "../lib.mjs";

// Vercel function. vercel.json maps /mcp to this file.
let ready;

export async function POST(request) {
  const denied = checkAuth(request.headers.get("authorization"));
  if (denied)
    return new Response(denied === "unauthorized" ? "Unauthorized" : denied, {
      status: denied === "unauthorized" ? 401 : 500,
      headers: { "WWW-Authenticate": 'Bearer realm="accord"' },
    });
  ready ??= loadManifest().then((m) => createHandler(m).handler);
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 });
  }
  return (await ready).fetch(request, { parsedBody: body });
}

export function GET() {
  return new Response("This is an MCP endpoint. POST JSON-RPC to /mcp.", { status: 405, headers: { Allow: "POST" } });
}
