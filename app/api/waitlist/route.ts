import { z } from "zod";
import { clientIp, readJson, sameOrigin } from "@/lib/http";
import { redisConfigured, redisStore } from "@/lib/redis";
import { digest } from "@/lib/sandbox";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  name: z.string().trim().max(80).optional().default(""),
  company: z.string().trim().max(120).optional().default(""),
  useCase: z.string().trim().max(500).optional().default(""),
  website: z.string().max(200).optional().default(""),
});
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const DONE = "You are on the list. We will email you when your spot opens.";

// Signups are stored as contacts in a Resend audience. No email is sent yet.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Join from mcp.edenbuilds.me." }, 403);
  const body = await readJson(request, 8192);
  if (!body.ok) return body.response;
  const parsed = schema.safeParse(body.value);
  if (!parsed.success) return json({ error: "Enter a valid email address." }, 400);
  const { email, name, company, useCase, website } = parsed.data;
  if (website) return json({ ok: true, message: DONE });
  if (redisConfigured)
    try {
      const n = await redisStore.incr(`waitlist-ip:${digest(clientIp(request))}`, 3600);
      if (n > 10) return json({ error: "Too many signups from this network. Try again later." }, 429);
    } catch {}
  const key = process.env.RESEND_API_KEY;
  const audience = process.env.RESEND_AUDIENCE_ID;
  if (!key || !audience) return json({ error: "The waitlist opens shortly. Try again soon." }, 503);
  try {
    const res = await fetch(`https://api.resend.com/audiences/${audience}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, ...(name ? { first_name: name } : {}), unsubscribed: false }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (!/already|exist/i.test(text)) throw new Error(`Resend ${res.status}`);
    }
  } catch {
    return json({ error: "We could not save your spot. Try again in a minute." }, 502);
  }
  if (redisConfigured)
    try {
      await redisStore.push("waitlist", JSON.stringify({ email, name, company, useCase, at: new Date().toISOString() }), 10000);
    } catch {}
  return json({ ok: true, message: DONE });
}
