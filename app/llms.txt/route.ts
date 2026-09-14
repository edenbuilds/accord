import { SITE, SUMMARY, faqs } from "@/lib/content";
import { useCases } from "@/lib/use-cases";

export const dynamic = "force-static";

// Plain-text summary for AI answer engines (llmstxt.org format).
export function GET() {
  const body = `# Accord

> ${SUMMARY}

Accord is an MCP gateway made by Eden Builds. It is a developer preview.

## What it does
- Converts a cURL command, OpenAPI 3, Swagger 2 or Postman v2.1 collection into MCP tool definitions in the browser. API keys are removed.
- Gives a one-click sandbox gateway URL that works in Claude Code, Cursor, VS Code and the Claude app. Sandbox calls return sample data. 1,000 free calls for 30 days, no signup.
- Runs seven checks on every call: readable request, role-based tool access, input schema, human approval, loop breaker, rate limit and call quota.
- Trims responses (links and metadata), removes private fields (fails closed), caches repeat reads, and records a receipt for every call.
- Ships a self-hosted MCP server template for Vercel, Railway and Docker. The server adds your API key, so the agent never sees it.

## Not yet available
SSO, identity mapping, Slack approval buttons, audit export to Datadog or Splunk, semantic caching, paid plans, SOC 2 and SLAs.

## Pages
- [Home and live demo](${SITE}/)
- [Converter app](${SITE}/app)
- [Compare with native MCP, API gateways and Zapier](${SITE}/compare)
- [Documentation](${SITE}/docs)
${useCases.map((u) => `- [Use case: ${u.label}](${SITE}/use-cases/${u.slug}): ${u.headline}`).join("\n")}
- [Waitlist](${SITE}/waitlist)
- [Source code](https://github.com/edenbuilds/accord)

## Questions
${faqs.map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
