import type { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/ui";
import { VERCEL_DEPLOY } from "@/components/landing";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Quickstart, input formats, policies, security and the API for Accord, the MCP gateway that checks every agent tool call.",
  alternates: { canonical: "/docs" },
};

const policyExample = `{
  "version": "accord.gateway-policy/v1",
  "roles": {
    "agent":  { "allow": ["*"], "deny": ["*/production/*"], "readOnly": false },
    "viewer": { "allow": ["*"], "deny": [], "readOnly": true }
  },
  "defaultRole": "agent",
  "requireApproval": ["delete_*", "create_refund"],
  "loop": { "maxRepeats": 5, "windowSeconds": 60 },
  "rate": { "capacity": 20, "refillPerMinute": 60 },
  "callLimit": 1000,
  "cacheSeconds": 60,
  "cache": ["run_sql"],
  "strip": ["*_url", "url", "_links", "links", "etag", "node_id", "metadata"],
  "redact": ["email", "phone", "address"],
  "prune": {}
}`;

const nav = [
  ["quickstart", "Quickstart"],
  ["inputs", "What you can paste"],
  ["flow", "How a call flows"],
  ["policies", "Policies"],
  ["security", "Security"],
  ["receipts", "Receipts"],
  ["api", "API"],
  ["connect", "Public MCP endpoint"],
];

export default function DocsPage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="page-hero">
          <div className="shell">
            <p className="kicker">Documentation</p>
            <h1 className="title">
              Everything you need
              <br />
              <span className="soft">to put Accord in front of your&nbsp;agent.</span>
            </h1>
            <p className="lede">{nav.map(([id, label], i) => (
              <span key={id}>
                <a className="link" href={`#${id}`}>{label}</a>
                {i < nav.length - 1 ? " · " : ""}
              </span>
            ))}</p>
          </div>
        </section>
        <section className="section">
          <div className="shell prose">
            <h2 id="quickstart">Quickstart</h2>
            <h3>1. Get a sandbox URL</h3>
            <p>
              On the <Link href="/#live">homepage</Link> or in the <Link href="/app">converter</Link>, click Create my sandbox
              URL or Create sandbox URL. No account is needed. Sandbox calls return sample data.
            </p>
            <h3>2. Connect your agent</h3>
            <pre className="code-line">{`# Claude Code
claude mcp add --transport http accord https://mcp.edenbuilds.me/g/YOUR_ID/mcp

# Cursor: .cursor/mcp.json
{ "mcpServers": { "accord": { "url": "https://mcp.edenbuilds.me/g/YOUR_ID/mcp" } } }

# VS Code: .vscode/mcp.json
{ "servers": { "accord": { "type": "http", "url": "https://mcp.edenbuilds.me/g/YOUR_ID/mcp" } } }`}</pre>
            <p>Add ?role=viewer to the URL to connect with read-only tools.</p>
            <h3>3. Run it on your own server</h3>
            <p>
              The template in <code>templates/mcp-server</code> calls your real API with your key. Every option needs your
              gateway’s manifest URL, shown on its page, and a token your agent will send.
            </p>
            <ul>
              <li>
                <a href={VERCEL_DEPLOY} target="_blank" rel="noopener noreferrer">
                  Deploy to Vercel
                </a>
                . Your URL is https://your-project.vercel.app/mcp.
              </li>
              <li>
                Docker: <code>curl -sL https://mcp.edenbuilds.me/docker | bash -s -- YOUR_ID</code>
              </li>
              <li>
                Node: <code>npm install && node server.mjs</code> inside the template folder.
              </li>
            </ul>
            <h3 id="railway">Railway</h3>
            <ol>
              <li>Fork github.com/edenbuilds/accord.</li>
              <li>In Railway, create a project and choose Deploy from GitHub repo, then pick your fork.</li>
              <li>In the service settings, set the root directory to templates/mcp-server.</li>
              <li>Add ACCORD_MANIFEST_URL, API_TOKEN and MCP_BEARER_TOKEN as variables.</li>
              <li>Generate a domain. Your URL is https://your-service.up.railway.app/mcp.</li>
            </ol>
            <p>The self-hosted template forwards calls. The seven checks run on the Accord gateway, not in the template.</p>

            <h2 id="inputs">What you can paste</h2>
            <ul>
              <li>
                <strong>cURL.</strong> One tool per command. Put <code># tool_name: What it does</code> on the line above a
                command to name it. Keys in headers, -u and the URL are removed.
              </li>
              <li>
                <strong>OpenAPI 3.0 and 3.1, Swagger 2.0.</strong> JSON or YAML. Local $ref links are resolved. Up to 200
                operations and 1 MB.
              </li>
              <li>
                <strong>Postman v2.1.</strong> Folders, collection variables and auth settings are read.
              </li>
            </ul>

            <h2 id="flow">How a call flows</h2>
            <p>Agent → Accord gateway → your API → Accord gateway → agent. In the sandbox, the API step returns sample data.</p>
            <ol>
              <li>Readable request: arguments must be a JSON object under 64 KB.</li>
              <li>Tool allowed: the role must be allowed to see the tool.</li>
              <li>Inputs match: arguments are checked against the tool’s schema.</li>
              <li>Approval: matching tools are held for a person. Nothing is sent.</li>
              <li>Loop breaker: the same call repeated too often is stopped.</li>
              <li>Rate limit: a token bucket per gateway.</li>
              <li>Quota: 1,000 calls per sandbox gateway.</li>
            </ol>
            <p>After the call: cache, strip bulky fields, prune to chosen fields, redact private fields, then write a receipt.</p>

            <h2 id="policies">Policies</h2>
            <p>
              Each gateway has one policy. Built-in use cases come with their own. Patterns use * and match a tool’s name or
              its path.
            </p>
            <pre className="code-line">{policyExample}</pre>

            <h2 id="security">Security</h2>
            <ul>
              <li>
                <strong>Safety checks fail closed.</strong> If the store behind roles, loops, rate limits or quotas is
                unreachable, the call is stopped.
              </li>
              <li>
                <strong>Optimisations fail open.</strong> If caching, stripping or receipts fail, the call still returns.
              </li>
              <li>
                <strong>Redaction fails closed.</strong> If private fields cannot be removed, the response is withheld.
              </li>
              <li>
                <strong>No secrets in tools.</strong> The converter removes keys. Self-hosted servers add them on the
                server.
              </li>
              <li>
                <strong>The sandbox never forwards.</strong> It cannot reach your systems or anyone else’s.
              </li>
              <li>
                <strong>Roles in the sandbox are chosen by the URL.</strong> They show filtering, not verified identity.
                Identity mapping is on the <Link href="/roadmap">roadmap</Link>.
              </li>
            </ul>
            <p>Not yet available: SSO, OAuth identity mapping, Slack approval buttons, audit export, SOC 2, SLAs.</p>

            <h2 id="receipts">Receipts</h2>
            <p>
              Every call writes a receipt: id, time, tool, role, decision and rule, a fingerprint of the arguments and the
              policy, time taken, and sizes before and after trimming. Receipts never include response bodies. Sandbox
              receipts are kept for 30 days.
            </p>

            <h2 id="api">API</h2>
            <ul>
              <li>
                <code>POST /api/gateways</code> with <code>{`{ "input": "curl ..." }`}</code> creates a sandbox gateway.
                Twenty per hour per network.
              </li>
              <li>
                <code>GET /api/gateways/ID</code> returns tools, rules, call count and recent receipts.
              </li>
              <li>
                <code>GET /api/gateways/ID?view=manifest</code> returns the tool manifest for self-hosting.
              </li>
              <li>
                <code>POST /g/ID/mcp</code> is the MCP endpoint (Streamable HTTP, JSON responses).
              </li>
            </ul>

            <h2 id="connect">Public MCP endpoint</h2>
            <p>
              https://mcp.edenbuilds.me/mcp exposes two read-only tools, accord_describe and accord_evaluate, so any MCP client
              can evaluate a policy without creating a gateway. The <Link href="/workbench">policy workbench</Link> uses the
              same evaluator.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
