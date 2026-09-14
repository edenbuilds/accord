# Accord handoff

Updated 14-09-2026, IST. Repo `edenbuilds/accord`. Live at https://mcp.edenbuilds.me (Vercel project `accord`, deployment `dpl_AskhNN3ha2fYefGxbpDc7g5EtG52`, Ready 21:42 IST). Read docs/BLUEPRINT.md (architecture and contracts), docs/COPY.md (homepage and compare copy, with claims adjusted for truth), docs/STRATEGY.md and docs/DESIGN.md.

## What shipped

- **Converter** (`lib/convert.ts`): cURL, OpenAPI 3.x, Swagger 2 and Postman 2.1 become MCP tools. Keys are removed. `# name: description` above a cURL command names the tool. It never throws and is fuzz-tested.
- **Pipeline** (`lib/pipeline.ts`): input → rbac → schema → approval → loop → rate → quota, then cache, strip, prune, redact, receipt. Safety checks and redaction fail closed. Optimisations fail open.
- **Sandbox gateway:**
  - `POST /api/gateways` creates a gateway.
  - `/g/ID/mcp` is its MCP endpoint (official SDK).
  - `/g/ID` is its dashboard, with live receipts in IST.
  - Sample data only, 1,000 calls, 30 days, Upstash REST (`lib/redis.ts`).
- **Site:**
  - A green and lilac system (`app/site.css`), with your logo as the `Mark` SVG.
  - Homepage: converter hero, live agent demo, checks, use cases, deploy, pricing, FAQ.
  - Other pages: `/app`, `/compare`, `/use-cases/*`, `/waitlist` (Resend audience "Accord waitlist"), `/terms`, `/privacy`, `/docs`.
  - SEO: OG image, apple icon, manifest, `llms.txt`, sitemap, robots, and JSON-LD for the Organization, SoftwareApplication, WebSite and FAQPage.
- **Self-hosting:** `templates/mcp-server` (Vercel, Docker, Railway, Node). A bearer token is required, it is read-only by default, and your key stays on the server. `/docker` serves the installer.
- **Effects:**
  - Originkit hero-21 ASCII and dither, and the footer-02 Tetris canvas.
  - Hyperiux: loader, scramble, border beam, counter, FAQ, CTA button and dotted grid.
  - theSVG brand icons.

## Verified

- `npm run typecheck` is clean. `npm test` passes 63/63. `npm run build` passes (26 routes).
- `npx tsx tests/template-smoke.ts`: a call without a token gets 401, write tools are hidden, and a real call forwarded to jsonplaceholder returned the real post.
- Local browser at the pane width and at 390px:
  - Five identical sandbox sends were allowed, each trimmed 377 B to 186 B. The sixth was stopped by the loop breaker.
  - No sideways overflow on `/`, `/compare` or `/waitlist`. The compare table scrolls inside its box.
  - The hero button text is dark on lime.
  - No console errors.
- Production: all 21 pages and files return 200, the new homepage is served, and `/api/gateways` returns its honest 503. The waitlist returns 400 on a bad email. `tests/live-smoke.ts` passes against mcp.edenbuilds.me (allow, approval, deny, origin 403, oversized 413).

## Not verified

- A real waitlist signup reaching Resend. Skipped so no test contact was written to your audience. The Resend key and audience id are set in all three Vercel environments.
- The Vercel deploy button and the Railway steps, end to end. They need someone to clone the repo into their own account.
- A full run of the Docker installer. Only its syntax and input guards were checked; a real run needs a gateway id, which needs Upstash.
- Hosted gateway creation, the browser "Send a test call" and the gateway dashboard on production. All of these need Upstash. The same code path passes the gateway end-to-end tests with an in-memory store.

## Blocked on you

1. **Upstash for Accord.** Your only store (`upstash-kv-teal-mountain`) is linked to `count-edenbuilds`, and CLI provisioning stops at a browser step. In Vercel, open the accord project, then Storage, then Create Database, then Upstash for Redis, and connect it to all environments. Then redeploy (`vercel --prod`), because env vars only apply to new deployments. Check that `KV_REST_API_URL` and `KV_REST_API_TOKEN` appear in `vercel env ls`.
2. **Rotate the keys that were shared in chat:** both originkit keys, the Hyperiux token, and the keys in the Downloads secrets file (OpenAI, xAI, Composio, Render, Resend). If you rotate the Resend key, update `RESEND_API_KEY` in Vercel.
3. **Legal review:** /terms names the laws of India. Have a lawyer confirm that, and both pages, before a paid launch.

## Operating commands

```sh
cd /Users/omkar/accord
npm ci && npm run typecheck && npm test && npm run build
npm run dev -- --port 3119
ACCORD_LIVE_URL=https://mcp.edenbuilds.me npx tsx tests/live-smoke.ts
npx tsx tests/template-smoke.ts
```

Commit as omkar1sonawane@gmail.com, or Vercel will not deploy. GitHub push protection scans every push, so use obviously fake values in test fixtures and never real-looking vendor keys.

## Paste-ready continuation prompt

Continue Accord in /Users/omkar/accord (edenbuilds/accord, https://mcp.edenbuilds.me). Read HANDOFF.md, docs/BLUEPRINT.md and docs/STRATEGY.md first.

1. Confirm the Upstash store is linked to the accord project (`vercel env ls` shows `KV_REST_API_URL`), then redeploy with `vercel --prod`.
2. On the live site at desktop and 390px, go to #live, click Create my sandbox URL, connect it with `claude mcp add --transport http`, ask the suggested question, and confirm the receipt appears on /g/ID. Also test "Send a test call" and the gateway dashboard.
3. Start checkpoint 2: real forwarding for hosted gateways behind encrypted upstream secrets, SSRF, DNS and redirect defences, byte and time caps, and tenant isolation tests. Keep safety stages and redaction fail-closed and optimisations fail-open.
4. Keep the copy plain and never claim anything that is not shipped. Use fake values in test fixtures, because GitHub push protection blocks real-looking vendor keys.
5. Commit as omkar1sonawane@gmail.com, deploy to a Ready production release, run tests/live-smoke.ts against production, and update HANDOFF.md with the verified, unverified and blocked outcomes.
