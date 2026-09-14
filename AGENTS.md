# Accord

Repository: edenbuilds/accord. Production: https://mcp.edenbuilds.me. This repository is independent of all SHB, Veryfy, Praya, and other MCP projects.

Read HANDOFF.md, docs/STRATEGY.md, and docs/ARCHITECTURE.md first. Distinguish shipped developer preview from planned hosted/enterprise capabilities. Do not add fake customer claims, active billing, SLA, compliance, approval, or tenant-isolation claims.

Use official MCP SDK. Shared policy evaluator lives in lib/policy.ts. Public /mcp is read-only; never expose arbitrary upstream forwarding or private credentials there. Local gateway uses one shared principal and loopback only. Do not relax its binding or protection without implementing the architecture's production boundaries.

Run npm run typecheck, npm test, npm run build. Test actual desktop and 390px browser interactions and live SDK MCP tools after deployment. Keep credentials and paid design archives out of git. Author release commits with omkar1sonawane@gmail.com.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
