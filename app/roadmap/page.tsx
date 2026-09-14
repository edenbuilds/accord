import Link from "next/link";
import { Header, Footer } from "@/components/ui";
export const metadata = { title: "Our direction" };
export default function Roadmap() {
  return (
    <>
      <Header />
      <main id="main" className="wrap doc-layout">
        <aside className="doc-nav">
          <span>Our direction</span>
          <a href="#today">Available today</a>
          <a href="#beta">Hosted private beta</a>
          <a href="#enterprise">Enterprise path</a>
          <a href="#standard">An open contract</a>
          <a href="#principles">Builder principles</a>
        </aside>
        <article className="doc-content">
          <p className="eyebrow">
            An ambitious destination. A deliberate sequence.
          </p>
          <h1>
            From a gateway
            <br />
            to a shared language.
          </h1>
          <p className="doc-lead">
            Agents need a consistent answer to three questions: Who allowed
            this? What were the limits? What actually happened?
          </p>
          <div className="roadmap-statement">
            <h3>Make every consequential action accountable.</h3>
            <p>
              Our long-term thesis is a portable contract for agent
              authorization and execution evidence, across gateways, clients,
              and clouds.
            </p>
          </div>
          <section id="today">
            <h2>The baseline</h2>
            <div className="milestone">
              <p className="eyebrow">Available / Developer preview</p>
              <h3>Make the boundary tangible.</h3>
              <p>
                An interactive policy workbench, JSON payload projection,
                exportable policies and simulation receipts, a public read-only
                MCP endpoint, and a single-process local gateway with tool
                allowlists, budgets, and circuit breaking.
              </p>
              <p>
                <Link href="/workbench">Explore the workbench</Link> or{" "}
                <Link href="/docs#local">run the gateway</Link>.
              </p>
            </div>
          </section>
          <section id="beta">
            <h2>The hosted private beta</h2>
            <p>
              Proposed next phase. Dates follow validation, not a feature
              countdown.
            </p>
            <div className="milestone">
              <p className="eyebrow">Checkpoint / First 10 active teams</p>
              <h3>One production workflow, end to end.</h3>
              <p>
                Managed login and workspaces. Secure upstream credential
                storage. Durable rate limits and audit metadata. One tested
                route from an engineering agent to an issue tracker. Self-serve
                connection checks and policy explanations.
              </p>
              <p>
                Success means a new team routes its first verified call in under
                ten minutes, returns the following week, and can explain a
                blocked action without founder support.
              </p>
            </div>
            <div className="milestone">
              <p className="eyebrow">
                Checkpoint / Repeat usage and paid conversion
              </p>
              <h3>Pay for operating confidence.</h3>
              <p>
                Proposed free plan: two servers and 1,000 tool calls a month.
                Proposed Pro plan: $79 a month, ten servers, 100,000 calls, and
                seven days of metadata. Default hard caps, explicit overage
                opt-in, and clear usage meters.
              </p>
              <p>
                No checkout or hosted entitlement is active today. Pricing will
                be validated against actual support, telemetry, and
                data-transfer costs.
              </p>
            </div>
          </section>
          <section id="enterprise">
            <h2>The enterprise path</h2>
            <div className="milestone">
              <p className="eyebrow">Checkpoint / Funded design partners</p>
              <h3>Identity and evidence that travel together.</h3>
              <p>
                Per-agent and delegated user identity. Managed SSO. Exact-action
                approvals with durable state and expiry. Signed policy
                revisions, tool schema change review, and metadata export to the
                customer’s observability system.
              </p>
              <p>
                SSO, private deployment, and compliance obligations need a
                commercially sustainable contract. An independent audit precedes
                any SOC 2 assurance claim.
              </p>
            </div>
            <div className="milestone">
              <p className="eyebrow">
                Checkpoint / Repeatable enterprise delivery
              </p>
              <h3>Your data plane. One control plane.</h3>
              <p>
                A customer-owned execution runtime pulls signed policy bundles
                and sends minimal evidence outbound. Support one deployment
                target first, with automated upgrade checks and a documented
                support window.
              </p>
              <p>
                Private-network access and emergency revocation are explicit
                design requirements. Arbitrary on-premise environments and
                bespoke forks are not an initial support promise.
              </p>
            </div>
          </section>
          <section id="standard">
            <h2>A three-to-five-year thesis</h2>
            <p>
              The opportunity is broader than owning the route. Publish a small,
              vendor-neutral policy and execution receipt contract that can be
              evaluated and verified independently.
            </p>
            <ul>
              <li>
                <strong>Year one:</strong> earn adoption with an excellent
                developer workflow and dependable hosted governance.
              </li>
              <li>
                <strong>Year two:</strong> establish reusable policy packs,
                schema-drift checks, and deterministic replay of authorization
                decisions.
              </li>
              <li>
                <strong>Years three to five:</strong> work toward cross-gateway
                verification, customer-owned execution, partner adapters, and
                independent conformance tests.
              </li>
            </ul>
            <p>
              These are strategic hypotheses, not promised milestones. A large
              footprint could come from many developers embedding an open
              verifier while organizations pay for fleet management and evidence
              delivery.
            </p>
            <p>
              A strategic acquisition becomes plausible when an identity,
              observability, or API infrastructure platform can buy distribution
              and a trusted contract it would take years to reproduce. A
              valuation outcome cannot be guaranteed.
            </p>
          </section>
          <section id="principles">
            <h2>Built for leverage</h2>
            <ul>
              <li>
                Use the official protocol SDK and managed identity. Do not
                maintain a private protocol or custom OAuth server.
              </li>
              <li>
                Keep the synchronous execution path small. Move billing,
                exports, and policy distribution to durable background work.
              </li>
              <li>
                Cache explicitly safe reads by exact inputs and authorization
                scope. Never use approximate matches to authorize or replay a
                write.
              </li>
              <li>
                Export evidence by default, not sensitive payloads.
                Customer-owned telemetry is a product feature, not a storage
                cost trick.
              </li>
              <li>
                Automate integration tests, release checks, and migrations
                before adding supported connectors.
              </li>
            </ul>
            <p>
              The full strategy, feature mechanics, cost model, and
              implementation checkpoints live in{" "}
              <a href="https://github.com/edenbuilds/accord/blob/main/docs/STRATEGY.md">
                the product strategy
              </a>
              .
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
