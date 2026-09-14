import { buildGateway, saveGateway } from "@/lib/gateways";
import { clientIp, readJson, sameOrigin } from "@/lib/http";
import { redisConfigured, redisStore } from "@/lib/redis";
import { digest } from "@/lib/sandbox";
export const runtime = "nodejs";

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Create gateways from mcp.edenbuilds.me." }, 403);
  if (!redisConfigured)
    return json({ error: "Hosted gateways are switching on. The converter and sandbox chat work now." }, 503);
  const body = await readJson(request, 300_000);
  if (!body.ok) return body.response;
  const input = (body.value as { input?: unknown } | null)?.input;
  if (typeof input !== "string") return json({ error: "Send the cURL command or spec as text." }, 400);
  try {
    const created = await redisStore.incr(`create:${digest(clientIp(request))}`, 3600);
    if (created > 20) return json({ error: "You have created 20 gateways this hour. Try again later." }, 429);
    const built = buildGateway(input);
    if (!built.ok) return json({ error: built.error }, 422);
    await saveGateway(redisStore, built.record);
    const { id, manifest } = built.record;
    return json(
      {
        id,
        url: `${new URL(request.url).origin}/g/${id}/mcp`,
        page: `/g/${id}`,
        tools: manifest.tools.map((t) => t.name),
        warnings: built.warnings,
      },
      201,
    );
  } catch {
    return json({ error: "The gateway store did not respond. Nothing was created." }, 503);
  }
}
