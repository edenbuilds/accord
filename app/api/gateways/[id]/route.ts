import { gatewayActivity, loadGateway } from "@/lib/gateways";
import { matches, visibleTools } from "@/lib/pipeline";
import { redisConfigured, redisStore } from "@/lib/redis";
export const runtime = "nodejs";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Gateway status for its page, or ?view=manifest for deploy templates.
// Manifests hold header names and auth types only, never secret values.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!redisConfigured) return json({ error: "Hosted gateways are switching on." }, 503);
  const { id } = await params;
  try {
    const record = await loadGateway(redisStore, id);
    if (!record) return json({ error: "This gateway does not exist or has expired." }, 404);
    if (new URL(request.url).searchParams.get("view") === "manifest") return json(record.manifest);
    const activity = await gatewayActivity(redisStore, id);
    const { policy, manifest } = record;
    const visible = new Set(visibleTools(manifest, policy, policy.defaultRole).map((t) => t.name));
    return json({
      id,
      name: record.name,
      createdAt: record.createdAt,
      baseUrl: manifest.baseUrl,
      limit: policy.callLimit,
      roles: Object.keys(policy.roles),
      policy: {
        loop: policy.loop,
        rate: policy.rate,
        cacheSeconds: policy.cacheSeconds,
        cache: policy.cache,
        strip: policy.strip,
        redact: policy.redact,
      },
      tools: manifest.tools.map((t) => ({
        name: t.name,
        title: t.title,
        method: t.method,
        path: t.path,
        visible: visible.has(t.name),
        needsApproval: policy.requireApproval.some((p) => matches(p, t.name) || matches(p, t.path)),
      })),
      ...activity,
    });
  } catch {
    return json({ error: "The gateway store did not respond." }, 503);
  }
}
