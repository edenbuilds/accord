import { previewHandler } from "@/lib/mcp";
import { readJson, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export const maxDuration = 15;
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Origin not allowed", { status: 403 });
  const body = await readJson(request, 65536, true);
  if (!body.ok) return body.response;
  const response = await previewHandler.fetch(request, { parsedBody: body.value });
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
