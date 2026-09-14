# Accord handoff

Updated 15-09-2026, IST. Repo `edenbuilds/accord` (commit `626c037`). Live at https://mcp.edenbuilds.me (Vercel project `accord`). Hosted sandbox gateways are on. Read docs/BLUEPRINT.md (architecture and contracts), docs/COPY.md (homepage and compare copy, with claims adjusted for truth), docs/STRATEGY.md and docs/DESIGN.md.

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
- Production, 15-09-2026, at 390px: "Create my sandbox URL" returned a real `/g/ID/mcp` URL, "Send a test call" went through the official MCP client (list_incidents, allowed, 99 ms, 1.0 KB to 482 B) and the receipt appeared with an IST time. `/g/ID` shows 1 of 1,000 calls and 2 visible tools; the production restart tool is hidden from the agent role, as the template intends.
- Brand icons: near-black or near-white single-colour marks (GitHub, Zendesk, cURL) now follow the text colour, and wordmarks (Stripe) use their square mark. The live demo headline no longer leaves "agent." alone on a line.
- Production: all 21 pages and files return 200, the new homepage is served, and `/api/gateways` returns its honest 503. The waitlist returns 400 on a bad email. `tests/live-smoke.ts` passes against mcp.edenbuilds.me (allow, approval, deny, origin 403, oversized 413).

## Not verified

- A real waitlist signup reaching Resend. Skipped so no test contact was written to your audience. The Resend key and audience id are set in all three Vercel environments.
- The Vercel deploy button and the Railway steps, end to end. They need someone to clone the repo into their own account.
- A full run of the Docker installer. Only its syntax and input guards were checked; a real run needs a gateway id, which needs Upstash.
- A real agent (Claude Code or Cursor) connected with `claude mcp add`. The browser test call uses the same official MCP client over the same endpoint, but no desktop agent was added, to avoid changing your local Claude config.

## Blocked on you

1. **Own Upstash store (optional).** A new store needs marketplace terms accepted in a browser, so on 15-09-2026 the existing `upstash-kv-teal-mountain` (also used by `count-edenbuilds`) was connected to accord with `vercel integration resource connect`. Accord's keys all start with `accord:`, so the two apps cannot overwrite each other, but they share one quota. To split: Vercel, accord, Storage, Create Database, Upstash for Redis; then `vercel integration resource disconnect upstash-kv-teal-mountain accord` and `vercel --prod`.
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

1. Hosted sandbox gateways are live on the shared Upstash store (`accord:` key prefix). If the user has created a dedicated store, disconnect the shared one and redeploy.
2. Connect a real agent to a fresh sandbox URL with `claude mcp add --transport http`, ask the suggested question, and confirm the receipt appears on /g/ID.
3. Start checkpoint 2: real forwarding for hosted gateways behind encrypted upstream secrets, SSRF, DNS and redirect defences, byte and time caps, and tenant isolation tests. Keep safety stages and redaction fail-closed and optimisations fail-open.
4. Keep the copy plain and never claim anything that is not shipped. Use fake values in test fixtures, because GitHub push protection blocks real-looking vendor keys.
5. Commit as omkar1sonawane@gmail.com, deploy to a Ready production release, run tests/live-smoke.ts against production, and update HANDOFF.md with the verified, unverified and blocked outcomes.
