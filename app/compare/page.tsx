import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Header, Footer } from "@/components/ui";

export const metadata: Metadata = {
  title: "Accord vs native MCP, API gateways and Zapier",
  description:
    "How Accord compares with a native MCP server, API gateways like Kong and Apigee, and integration platforms like Zapier and Make. Honest, from public docs.",
  alternates: { canonical: "/compare" },
};

const rows: [string, string, string, string, string][] = [
  ["Turn a cURL or OpenAPI spec into MCP tools", "Yes, in the browser, instantly", "You write the server", "Some offer it as an add-on", "Uses its own prebuilt actions"],
  ["A different tool list for each agent", "Yes, by role, tool name or path", "Build it yourself", "Through route and plugin config", "Set per connection by a person"],
  ["Stops an agent stuck in a loop", "Yes, repeated-call breaker", "No", "Rate limits, not loop detection", "Task limits per plan"],
  ["A person approves risky calls", "Held today. Slack buttons on the roadmap", "Your AI client may ask you, per call", "Not built in", "Approval steps inside fixed workflows"],
  ["Trims responses before the model", "Yes, with bytes saved on every call", "No", "Response transforms you configure", "Field mapping per step"],
  ["Removes private fields", "Yes, and fails closed", "No", "Through plugins", "Not the focus"],
  ["A record of every call", "Receipts, kept 30 days in the sandbox", "Your own logging", "Access logs", "Task history"],
  ["Built for", "Agents that choose their next step", "Exposing one system to AI", "Apps and services calling APIs", "Workflows a person designs"],
];

export default function ComparePage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="page-hero">
          <div className="shell">
            <p className="kicker">Compare</p>
            <h1 className="title">
              Accord vs the rest.
              <br />
              <span className="soft">What each one is built&nbsp;for.</span>
            </h1>
            <p className="lede">
              MCP connects agents to tools. API gateways manage traffic. Automation platforms run recipes. Accord adds the
              checks that agents need when they decide for&nbsp;themselves.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <div className="cmp-wrap">
              <table className="cmp">
                <thead>
                  <tr>
                    <th scope="col">What you need</th>
                    <th scope="col" className="us">Accord</th>
                    <th scope="col">Native MCP server</th>
                    <th scope="col">API gateway (Kong, Apigee)</th>
                    <th scope="col">Integration platform (Zapier, Make)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([need, us, mcp, gateway, zap]) => (
                    <tr key={need}>
                      <th scope="row">{need}</th>
                      <td className="us">{us}</td>
                      <td>{mcp}</td>
                      <td>{gateway}</td>
                      <td>{zap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="fine">
              Based on public documentation as of September 2026. These products change often, so check their current docs.
              Product names belong to their owners and are used here only to compare.
            </p>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="shell vs">
            <article id="native-mcp">
              <h3>Accord vs native MCP</h3>
              <p>
                MCP is the standard way for an agent to find and call tools. It even defines how to sign in with OAuth. What
                it leaves to you is the rest of the safety work.
              </p>
              <ul>
                <li>Which agent may see which tool</li>
                <li>What to do when an agent repeats itself</li>
                <li>Which calls need a person first</li>
                <li>What the model should never see</li>
              </ul>
              <p style={{ marginTop: 12 }}>Accord adds those checks in front of any MCP tool, without changing the tool.</p>
            </article>
            <article id="api-gateways">
              <h3>Accord vs API gateways</h3>
              <p>
                Kong, Apigee and similar gateways are excellent at routing, auth and rate limits for app traffic. Several now
                add MCP features too.
              </p>
              <ul>
                <li>Accord starts from the agent, not the route</li>
                <li>It turns an API into tools in one paste</li>
                <li>It stops loops, not just bursts</li>
                <li>It measures the tokens you save on every call</li>
              </ul>
              <p style={{ marginTop: 12 }}>Already run a gateway? Accord can sit in front of it.</p>
            </article>
            <article id="automation">
              <h3>Accord vs Zapier and Make</h3>
              <p>
                Zapier and Make run workflows that a person designs step by step. Zapier also offers MCP access to its
                actions. They shine when the steps are known in advance.
              </p>
              <ul>
                <li>Agents choose their own next step</li>
                <li>Accord keeps that choice inside your limits</li>
                <li>Use your own APIs, not only prebuilt apps</li>
                <li>Every decision leaves a receipt</li>
              </ul>
              <p style={{ marginTop: 12 }}>Fixed recipe? Use Zapier. An agent that thinks for itself? Put Accord in front.</p>
            </article>
          </div>
        </section>

        <section className="section dark">
          <div className="shell closing2">
            <h2 className="title">
              See the difference
              <br />
              <span className="soft">in 30 seconds.</span>
            </h2>
            <p className="lede">Paste an API, connect your agent, and watch Accord check every call.</p>
            <div className="row">
              <Link href="/#live" className="btn btn-light btn-lg">
                Connect your agent <ArrowUpRight size={18} />
              </Link>
              <Link href="/app" className="btn btn-ghost btn-lg">
                Open the converter
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
