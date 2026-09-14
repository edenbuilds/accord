# Accord handoff

## Actual context

- Independent greenfield project: `/Users/omkar/accord`.
- Intended repository: `https://github.com/edenbuilds/accord`.
- Intended production URL: `https://mcp.edenbuilds.me` on Vercel.
- Brand: Accord, by Eden Builds. Narrative: MCP gateway and control plane.
- Strategy: `docs/STRATEGY.md`; mechanics/trust boundaries: `docs/ARCHITECTURE.md`; reference lineage: `docs/DESIGN.md`.

## Implemented

Next.js 16 / React 19 site with Geist fonts, custom SVG gateway illustration, GSAP reveal, pause/reduced-motion support, responsive navigation, functional tabs/FAQ, pricing explicitly marked proposed. `/workbench` has policy scenarios, browser-local policy persistence, actual shared policy evaluation, JSON field projection, UTF-8 byte measurements, clipboard/export, and unsigned session receipts. `/docs` and `/roadmap` document scope.

`/mcp` uses the official MCP SDK v2 to expose `accord_describe` and `accord_evaluate`, read-only and without arbitrary forwarding. Origin guard and bounded request bodies are present. It does not authenticate real agent identities or meter actual agent budgets.

`gateway/server.ts` is a real loopback-only Node gateway. Environment bearer credential; separate upstream secret references; trusted configured HTTP MCP discovery; exact namespaced tools; SDK schema validation; process-local budget reservation; approval block; upstream timeout/no automatic retry; circuit breaking; stdout metadata receipts. Default config routes to the public read-only preview.

## Not implemented

Managed hosted workspaces/authentication, tenant database, JWT/OAuth brokering, production durable quotas, billing, durable HITL approval/resume, remote SIEM export, semantic/exact cache, runtime payload projection, customer VPC/fleet installer, SOC 2, or SLA. No real customer integrations are configured. Baseline is intentionally labeled developer preview everywhere. Do not describe the pricing table as active entitlements.

## Validation before release

- 15 tests passed: policy boundaries, schema input, no caller-supplied approval, concurrent quota reservations, circuit cooldown, upstream config, public SDK tools, and real local gateway integration (401, origin rejection, filtered discovery, approval blocks, schema rejection, budget enforced).
- Production build passed before final formatting and release documentation; final release check recorded below.
- Local desktop: four policy scenarios returned correct decisions; JSON empty/all projection, custom JSON validation, and clipboard verified.
- In-app browser download-event capture timed out; exported Blob implementation needs verification in a browser with download support.
- Live deployment and final 390px checks pending at this checkpoint.

## Operating commands

```sh
cd /Users/omkar/accord
npm ci
npm run typecheck
npm test
npm run build
npm run dev -- --port 3118
```

Local gateway: generate `ACCORD_GATEWAY_TOKEN` (at least 32 random characters), then `npm run gateway`. Never print or commit credentials. Gateway config defaults to `gateway/example.json`; `ACCORD_CONFIG` overrides it. Read SECURITY.md before using real upstreams.

## Paste-ready continuation prompt

Continue Accord in `/Users/omkar/accord`, repository `edenbuilds/accord`, domain `mcp.edenbuilds.me`. Read HANDOFF.md, docs/STRATEGY.md and docs/ARCHITECTURE.md. Preserve the existing premium visual direction and truthful preview boundaries. First verify the live release and tests. Implement checkpoint 2 from the strategy: managed identity and workspaces, tenant-isolated Postgres, encrypted upstream secrets, durable quota reservations, and two maintained remote MCP integrations. Reuse the official SDK and shared policy engine. Do not turn the public read-only /mcp endpoint into an unauthenticated arbitrary proxy. Do not call a client-supplied count a real quota or an approval boolean human authorization. Complete cross-tenant, concurrent-limit, credential isolation, and secret-redaction tests before hosted beta. Then browser-test desktop and 390px mobile, commit with omkar1sonawane@gmail.com, deploy to a confirmed Ready Vercel release, check live flows, and update this handoff with exact verified/unverified/blocked outcomes. Treat the full enterprise roadmap as staged work, not active product capabilities.
