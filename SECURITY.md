# Security

Accord 0.1 is a developer preview, with no enterprise certification or SLA. Do not put real credentials or private customer data into the public workbench/MCP endpoint.

Report vulnerabilities through GitHub private vulnerability reporting for this repository. Do not include live secrets in public issues. If private reporting is unavailable, use the contact path on https://edenbuilds.me to request a private channel before sharing details.

The public MCP endpoint exposes only two read-only tools and does not proxy arbitrary URLs. Workbench policies are browser-local. Its JSON projection does not upload data. Vercel still processes public MCP requests and platform access metadata.

The local gateway binds 127.0.0.1, uses separate gateway and upstream bearer credentials, filters discovery, validates input schemas, and blocks approval-gated calls. It is not an OAuth identity broker. In-memory budgets and circuits are not multi-replica safe. Upstream response bytes are not bounded yet. Use only configured trusted upstreams during evaluation.

See docs/ARCHITECTURE.md for required production defenses and failure semantics. Never treat a tool's readOnly annotation or description as trusted authorization. Never auto-retry a timed-out write.
