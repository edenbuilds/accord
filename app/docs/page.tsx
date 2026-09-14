import Link from "next/link";
import { Header, Footer, CopyButton } from "@/components/ui";
export const metadata = { title: "Documentation" };
const command =
  "claude mcp add --transport http accord https://mcp.edenbuilds.me/mcp";
export default function Docs() {
  return (
    <>
      <Header />
      <main id="main" className="wrap doc-layout">
        <aside className="doc-nav">
          <span>Developer documentation</span>
          <a href="#quickstart">Public preview</a>
          <a href="#policy">Policy contract</a>
          <a href="#local">Local gateway</a>
          <a href="#security">Security boundary</a>
          <a href="#compatibility">Compatibility</a>
          <Link href="/roadmap">What comes next</Link>
        </aside>
        <article className="doc-content">
          <p className="eyebrow">Accord / Developer preview</p>
          <h1>
            A boundary you
            <br />
            can inspect.
          </h1>
          <p className="doc-lead">
            Start with a real policy evaluation. Then run a gateway in your own
            environment. Every capability below is explicit about where it
            works.
          </p>
          <section id="quickstart">
            <h2>Connect to the public preview</h2>
            <p>
              The endpoint exposes two read-only tools. No API keys or connected
              accounts are required. Claude Code supports this command:
            </p>
            <pre>{command}</pre>
            <CopyButton text={command} />
            <p>
              In another MCP client, add{" "}
              <code>https://mcp.edenbuilds.me/mcp</code> as a remote HTTP
              server. Use the client’s own configuration format.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>What it does</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>accord_describe</code>
                  </td>
                  <td>
                    Returns the preview’s capability and deployment boundaries.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>accord_evaluate</code>
                  </td>
                  <td>
                    Evaluates a policy and caller-supplied request metadata. It
                    never forwards a request to an external service.
                  </td>
                </tr>
              </tbody>
            </table>
            <p style={{ marginTop: 20 }}>
              Try: “Use Accord to evaluate whether an agent can call
              github.list_issues after it has already made 30 calls this minute,
              with a limit of 30.”
            </p>
          </section>
          <section id="policy">
            <h2>The first policy contract</h2>
            <p>
              A versioned JSON document is the source of truth. The workbench,
              public MCP tool, and local gateway use the same deterministic
              evaluator.
            </p>
            <pre>
              {JSON.stringify(
                {
                  version: "accord.policy/v1",
                  name: "Engineering agent",
                  allowedTools: ["github.list_issues", "github.create_issue"],
                  requireApproval: ["github.create_issue"],
                  limitPerMinute: 30,
                  maxPayloadBytes: 32768,
                },
                null,
                2,
              )}
            </pre>
            <ul>
              <li>
                Only exact tool names in <code>allowedTools</code> are
                permitted. Names are case sensitive.
              </li>
              <li>
                The minute limit and byte boundary are checked before the
                approval rule.
              </li>
              <li>
                An approval requirement returns <code>approval_required</code>.
                The local gateway blocks it; no approval bypass is implemented.
              </li>
              <li>
                Policy versions are explicit. Unknown properties are rejected
                when parsing.
              </li>
            </ul>
            <p>
              The workbench’s call count is a simulation input. The local
              gateway measures and reserves its own call count before it
              contacts an upstream server.
            </p>
            <Link className="button secondary" href="/workbench">
              Try the policy workbench
            </Link>
          </section>
          <section id="local">
            <h2>Run the local gateway</h2>
            <p>
              Requires Node.js 22 or later. The default config routes to the
              public preview, so you can verify the path without granting access
              to any private system.
            </p>
            <pre>{`git clone https://github.com/edenbuilds/accord.git
cd accord
npm ci
export ACCORD_GATEWAY_TOKEN="$(openssl rand -hex 32)"
npm run gateway`}</pre>
            <p>
              The gateway listens on <code>http://127.0.0.1:4318/mcp</code>.
              Configure your MCP client to send{" "}
              <code>Authorization: Bearer $ACCORD_GATEWAY_TOKEN</code>, using
              the actual environment value through its secure secret
              configuration. It will expose <code>preview.accord_describe</code>{" "}
              and <code>preview.accord_evaluate</code>.
            </p>
            <h3>Bring a remote server</h3>
            <p>
              Copy <code>gateway/example.json</code>, set{" "}
              <code>ACCORD_CONFIG</code> to the new path, and replace the
              upstream configuration. Credentials are environment variable
              references, never configuration values.
            </p>
            <pre>
              {JSON.stringify(
                {
                  namespace: "github",
                  url: "https://api.githubcopilot.com/mcp/",
                  tokenEnv: "GITHUB_MCP_TOKEN",
                },
                null,
                2,
              )}
            </pre>
            <p>
              Set the referenced credential in your shell or secret manager.
              Discover the server’s actual tool names and explicitly allow{" "}
              <code>namespace.tool_name</code>. Restart after configuration or
              upstream schema changes. The preview supports up to two upstreams
              and 100 allowed tools.
            </p>
            <h3>What runs before forwarding</h3>
            <ul>
              <li>
                Gateway bearer authentication, loopback host and origin guards.
              </li>
              <li>
                64 KB HTTP body cap, schema validation, explicit tool
                visibility.
              </li>
              <li>
                A shared process-local minute budget and 32 KB default argument
                limit.
              </li>
              <li>
                Approval-gated tools remain blocked. Three consecutive upstream
                errors open a 30-second circuit.
              </li>
              <li>
                Ten-second upstream timeouts and no automatic write retries.
              </li>
              <li>
                Metadata receipts on stdout with policy/schema hashes and
                outcome. Arguments, credentials, and response payloads are
                omitted.
              </li>
            </ul>
            <p>
              The preview circuit is shared across upstreams. Quotas and
              circuits reset on restart and cannot coordinate multiple replicas.
              Upstream responses are not yet size-bounded; use trusted
              evaluation servers. These limits are documented evaluation
              constraints, not production safeguards.
            </p>
          </section>
          <section id="security">
            <h2>Security boundary</h2>
            <p>
              The hosted site has no tenant database, billing system, identity
              broker, or production customer gateway. Its public MCP endpoint
              performs read-only calculations. Do not send secrets or customer
              records to it.
            </p>
            <p>
              Workbench policies are stored in localStorage. Payload projection
              happens in your browser. Decision receipts last only for the
              current tab session and are unsigned. The public endpoint does not
              intentionally persist submitted policy data, but Vercel processes
              requests and can retain platform access metadata.
            </p>
            <p>
              The local gateway uses a single shared bearer principal. That is
              scoped gateway authentication, not OAuth delegation, JWT audience
              validation, or per-agent RBAC. Incoming credentials are never
              passed through to upstream services. Upstream bearer credentials
              are configured separately.
            </p>
            <p>
              Run it on loopback for evaluation. Production exposure requires
              TLS, tenant isolation, durable quotas, upstream egress
              restrictions, secret rotation, durable audit delivery, and
              operational hardening.{" "}
              <Link href="/roadmap">See the delivery sequence.</Link>
            </p>
            <h3>Disclosure</h3>
            <p>
              Report a vulnerability through{" "}
              <a href="https://github.com/edenbuilds/accord/security">
                GitHub security reporting
              </a>
              . Never include working credentials or private payloads in a
              public issue.
            </p>
          </section>
          <section id="compatibility">
            <h2>Protocol and scope</h2>
            <p>
              The implementation uses the official MCP TypeScript SDK v2. The
              HTTP handler supports modern requests and the SDK’s stateless
              compatibility path for older clients. Transport session
              persistence, subscriptions, resources, prompts, and remote stdio
              process hosting are outside this preview.
            </p>
            <p>
              The hosted MCP endpoint and local gateway have automated SDK
              client tests. Compatibility with every client application is not
              implied. In particular, client products that require OAuth for
              remote connections may need the planned identity phase.
            </p>
            <ul>
              <li>
                <a href="https://github.com/modelcontextprotocol/typescript-sdk">
                  Official TypeScript SDK
                </a>
              </li>
              <li>
                <a href="https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization">
                  MCP authorization and separate upstream tokens
                </a>
              </li>
              <li>
                <a href="https://github.com/edenbuilds/accord">
                  Source, tests, and full product strategy
                </a>
              </li>
            </ul>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
