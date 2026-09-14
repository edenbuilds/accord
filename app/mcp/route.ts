import { previewHandler } from "@/lib/mcp";
export const runtime = "nodejs";
export const maxDuration = 15;
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return new Response("Origin not allowed", { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json"))
    return new Response("Use application/json", { status: 415 });
  const reader = request.body?.getReader();
  if (!reader) return new Response("Request body required", { status: 400 });
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 65536) {
      await reader.cancel();
      return new Response("Request body exceeds 64 KB", { status: 413 });
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return Response.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      { status: 400 },
    );
  }
  const response = await previewHandler.fetch(request, { parsedBody });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
export function GET() {
  return new Response(
    "Use an MCP client to POST to this endpoint. See /docs.",
    { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } },
  );
}
export const DELETE = GET;
