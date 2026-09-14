# Accord copy: homepage and comparisons page

Draft from the Master Playbook, 14-09-2026. This is the structure and copy shipped on mcp.edenbuilds.me. The tone is sharp, plain and developer-first, and every claim matches what the product does today.

## Claims adjusted for truth

| Playbook claim | Shipped copy | Why |
| --- | --- | --- |
| Saves up to 80% on tokens | Every receipt shows the real bytes saved on that call | No measured fleet average yet |
| Under 15ms at the edge | Every receipt records the time Accord took. No guarantee published | Not measured on the hosted path |
| Semantic caching | Exact-match cache for repeat calls | Semantic cache not built |
| Strips PII | Replaces fields you name (email, phone, address). Fails closed | Field-name redaction, not detection |
| HITL Slack ping | The hold works today. Slack buttons are on the roadmap | Slack delivery not built |
| Zero data retention, OTel streaming | Receipts kept 30 days, never bodies. Export on the roadmap | No OTel export yet |
| Create a free account | Join the waitlist for a free account | Accounts not built |
| Native MCP has no auth | MCP defines OAuth. It leaves loops, filtering, approvals and redaction to you | The original claim is false |

## Homepage

1. **Hero** (dark, ASCII field): "Connect your AI to any API. Safely." Lede: paste a cURL command, get a tool your agent can use, every call checked. Buttons: Connect your agent, Paste an API. Client logos: Claude, Cursor, VS Code, OpenAI, Windsurf. Below: the split-pane converter.
2. **Live demo** (the main CTA): "Connect your agent. See it work in 30 seconds." Three steps: create a URL, add it to your agent, ask it something. Pick a use case, click Create my sandbox URL, copy the snippet, then watch the live feed. After the first successful call: "It works. Keep this gateway: join the waitlist."
3. **Checks:** "A firewall for AI agents. Seven checks. Every call." Six cards: loops, per-agent tools, approvals, smaller responses, private fields, cache.
4. **Use cases:** DevOps (production hidden), Customer success (redaction and refund approval), HR (approvals), Data and BI (cache).
5. **Deploy:** Vercel, Railway, Docker, then "Don't want to manage servers? Use the Accord gateway. Free for your first 1,000 calls."
6. **Compare teaser:** "MCP is the socket. Accord is the circuit breaker."
7. **Pricing:** Sandbox $0 now. Pro $79 proposed. Enterprise planned. No payment taken.
8. **FAQ:** seven straight answers for CTOs and SREs.
9. **Closing:** "Your agents, with limits you set yourself."

## Comparisons page (/compare)

- Hero: "Accord vs the rest. What each one is built for."
- Table: Accord vs native MCP server vs API gateway (Kong, Apigee) vs integration platform (Zapier, Make), across eight needs.
- Three sections with anchors (#native-mcp, #api-gateways, #automation), each saying when to choose the other tool.
- Fine print: based on public docs as of September 2026.
