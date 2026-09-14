import { handleGatewayMcp } from "@/lib/gateway-mcp";
import { redisStore } from "@/lib/redis";
export const runtime = "nodejs";
export const maxDuration = 15;
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  return handleGatewayMcp(request, (await params).id, redisStore);
}
export function GET() {
  return new Response("This is an MCP endpoint. Add it to Claude, Cursor or any MCP client.", {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
export const DELETE = GET;
