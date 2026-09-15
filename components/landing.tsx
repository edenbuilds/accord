"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Database, Eye, Hand, Repeat, Scissors, ShieldCheck, ShieldOff } from "lucide-react";
import { Header, Footer, Mark } from "./ui";
import Converter, { loadIntoConverter } from "./converter";
import LiveDemo from "./live-demo";
import { BrandIcon, brandTitle, type Brand } from "./brand-icon";
import AsciiWaves from "./originkit/ui/hero-21/character-waves";


import { FAQContent, FAQGroup, FAQTitle, FAQWrapper } from "./effects/animated-faq/AnimatedFaqComp";
import { useCases } from "@/lib/use-cases";
import { faqs } from "@/lib/content";

const CLIENTS: Brand[] = ["claude", "cursor", "vscode", "openai", "windsurf"];
export const VERCEL_DEPLOY =
  "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fedenbuilds%2Faccord%2Ftree%2Fmain%2Ftemplates%2Fmcp-server&project-name=accord-mcp-server&env=ACCORD_MANIFEST_URL,API_TOKEN,MCP_BEARER_TOKEN&envDescription=Your%20gateway%20manifest%20URL%2C%20your%20API%20key%2C%20and%20a%20token%20your%20agent%20will%20send.&envLink=https%3A%2F%2Fmcp.edenbuilds.me%2Fdocs%23quickstart";

const guards = [
  {
    icon: Repeat,
    title: "Stops runaway loops",
    text: "If an agent sends the same call five times in a minute, Accord stops it before it runs up your bill.",
    proof: "Try it: send the same message six times in the sandbox chat.",
  },
  {
    icon: Eye,
    title: "Each agent sees only its tools",
    text: "Give a support agent read-only tools. Keep production tools out of its list entirely.",
    proof: "Role-based tool lists, matched by tool name or path.",
  },
  {
    icon: Hand,
    title: "Risky actions stop for review",
    text: "Configured risky tools are blocked before execution.",
    proof: "Approval and resume workflows are planned.",
  },
  {
    icon: Scissors,
    title: "Smaller responses, fewer tokens",
    text: "Links, metadata and fields you do not need are removed before the response reaches the model.",
    proof: "Every receipt shows the real bytes saved on that call.",
  },
  {
    icon: ShieldOff,
    title: "Private fields never reach the model",
    text: "Emails, phone numbers or any field you name are replaced first. If that step fails, the response is withheld.",
    proof: "This check fails closed, by design.",
  },
  {
    icon: Database,
    title: "Repeat questions answered from cache",
    text: "Identical read calls come back from the cache, so your API is not hit twice for the same answer.",
    proof: "Exact-match cache, per gateway.",
  },
];

const plans = [
  {
    name: "Sandbox",
    price: "$0",
    note: "Available now",
    now: true,
    features: ["Converter and sandbox chat", "Live MCP gateway URL", "1,000 calls for 30 days", "All seven checks", "No signup"],
    cta: "Create a sandbox",
    href: "#live",
  },
  {
    name: "Pro",
    price: "$79",
    note: "Proposed, per month",
    features: ["Your real API behind the gateway", "100,000 calls a month", "7-day audit log", "Custom gateway domain"],
    cta: "Join the waitlist",
    href: "/waitlist?plan=pro",
  },
  {
    name: "Enterprise",
    price: "Let’s talk",
    note: "Planned, annual",
    features: ["SSO and identity mapping", "Slack and Teams approvals", "Private data plane", "Log export to Datadog or Splunk"],
    cta: "Join the waitlist",
    href: "/waitlist?plan=enterprise",
  },
];

export default function Landing() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="hero2" id="try">
          <div className="hero2-bg" aria-hidden="true">
            <AsciiWaves color="#729b65" background="#f7f8f3" cell={13} />
          </div>
          <div className="hero2-noise" aria-hidden="true" />
          <div className="shell">
            <div className="hero2-copy">
              <p className="kicker">An API is what your app can do. MCP lets AI use it.</p>
              <h1 className="display">
                Give your AI
                <br />
                <span className="lilac">the right tools.</span>
              </h1>
              <p className="lede">
                Turn an API into tools for Claude, Cursor, and other AI assistants.
                Test what they can do, set the boundaries, and see every call.
              </p>
              <div className="hero2-actions">
                <a href="/app" className="btn btn-lg">Build your first server <ArrowRight size={18} /></a>
                <a href="#live" className="btn btn-ghost btn-lg">
                  Try the live demo
                </a>
              </div>
              <div className="hero2-clients">
                <span>Works with any MCP client, including</span>
                {CLIENTS.map((b) => (
                  <span key={b} className="client">
                    <BrandIcon name={b} size={18} mono /> {brandTitle(b)}
                  </span>
                ))}
              </div>
            </div>
            <div className="hero2-demo" id="converter"><div className="demo-caption"><span>Try it here</span><span>Paste → Test → Connect</span></div>
              <Converter />
            </div>
            <div className="facts">
              <div className="fact">
                <strong>7</strong>
                <p>checks on every call, before anything runs</p>
              </div>
              <div className="fact">
                <strong>1,000</strong>
                <p>free sandbox calls. No card, no signup</p>
              </div>
              <div className="fact">
                <strong>4</strong>
                <p>input formats: cURL, OpenAPI, Swagger and Postman</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section dark" id="live">
          <div className="shell live">
            <div>
              <p className="kicker">Live demo</p>
              <h2 className="title">
                Connect your agent.
                <br />
                <span className="soft">See it work in 30&nbsp;seconds.</span>
              </h2>
              <p className="lede">
                Get a real MCP URL in one click. Add it to your agent, ask it something, and watch each call arrive here
                as Accord checks&nbsp;it.
              </p>
              <ol className="live-steps">
                <li>
                  <div>
                    <strong>Create a sandbox URL</strong>
                    <span>One click. No account needed.</span>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Add it to your agent</strong>
                    <span>Claude Code, Cursor, VS Code or the Claude app.</span>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Ask it to do something</strong>
                    <span>Every call shows up live, with the decision and the time it took.</span>
                  </div>
                </li>
              </ol>
            </div>
            <LiveDemo />
          </div>
        </section>

        <section className="section" id="checks">
          <div className="shell">
            <div className="intro">
              <p className="kicker">What happens on every call</p>
              <h2 className="title">
                A firewall for AI agents.
                <br />
                <span className="soft">Seven checks. Every&nbsp;call.</span>
              </h2>
              <p className="lede">
                Explore the sandbox’s seven checks, inspect every decision, and see exactly what comes back.
              </p>
            </div>
            <div className="flow" aria-label="How a call flows">
              <span>Your agent</span>
              <ArrowRight size={16} />
              <span className="lilac">Accord checks</span>
              <ArrowRight size={16} />
              <span>Your API</span>
              <ArrowRight size={16} />
              <span className="lilac">Accord trims</span>
              <ArrowRight size={16} />
              <span>Your agent</span>
            </div>
            <div className="guard-grid">
              {guards.map((g) => (
                <article className="guard" key={g.title}>
                  <g.icon size={24} />
                  <h3>{g.title}</h3>
                  <p>{g.text}</p>
                  <p className="proof">{g.proof}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="use-cases" style={{ paddingTop: 0 }}>
          <div className="shell">
            <div className="intro">
              <p className="kicker">Use cases</p>
              <h2 className="title">
                Real work for your agents.
                <br />
                <span className="soft">With the guardrails built&nbsp;in.</span>
              </h2>
            </div>
            <div className="uc-grid">
              {useCases.map((u) => (
                <article className="uc" key={u.slug}>
                  <div className="uc-brands">
                    {u.brands.map((b) => (
                      <BrandIcon key={b} name={b} size={26} />
                    ))}
                    <span className="uc-label">{u.label}</span>
                  </div>
                  <h3>{u.headline}</h3>
                  <p>{u.summary}</p>
                  <div className="uc-guard">
                    <ShieldCheck size={16} />
                    <span>
                      <strong>{u.guardTitle}.</strong> {u.guard}
                    </span>
                  </div>
                  <div className="uc-actions">
                    <button type="button" className="btn" onClick={() => loadIntoConverter(u.input)}>
                      Try it in the converter
                    </button>
                    <Link className="link" href={`/use-cases/${u.slug}`}>
                      Read the use case <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section tint" id="deploy">
          <div className="shell">
            <div className="intro">
              <p className="kicker">Deploy</p>
              <h2 className="title">
                Ready for your real API?
                <br />
                <span className="soft">Deploy your own server.</span>
              </h2>
              <p className="lede">
                Your converted tools can run as your own MCP server. Your API key stays on the server, so the agent
                never sees&nbsp;it.
              </p>
            </div>
            <div className="deploy-grid">
              <div className="deploy">
                <h3>
                  <BrandIcon name="vercel" size={20} /> Vercel
                </h3>
                <p>One click. Add your gateway’s manifest URL, your API key and a token for your agent.</p>
                <a className="btn" href={VERCEL_DEPLOY} target="_blank" rel="noopener noreferrer">
                  Deploy to Vercel <ArrowUpRight size={16} />
                </a>
              </div>
              <div className="deploy">
                <h3>
                  <BrandIcon name="railway" size={20} /> Railway
                </h3>
                <p>Deploy the same template from GitHub. It takes about two minutes.</p>
                <Link className="btn btn-ghost" href="/docs#railway">
                  Railway steps <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="deploy">
                <h3>
                  <BrandIcon name="docker" size={20} /> Docker
                </h3>
                <p>Run it anywhere with one command. You need Docker and a gateway id.</p>
                <code className="code-line">curl -sL https://mcp.edenbuilds.me/docker | bash -s -- YOUR_GATEWAY_ID</code>
              </div>
            </div>
            <div className="upsell">
              <div>
                <strong>Don’t want to manage servers?</strong>
                <p>Try a hosted sandbox with sample responses. Managed real API hosting is on the roadmap.</p>
              </div>
              <a href="#live" className="btn btn-light">
                Get a gateway URL <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </section>

        <section className="section" id="compare">
          <div className="shell">
            <div className="intro">
              <p className="kicker">How Accord compares</p>
              <h2 className="title">
                MCP is the socket.
                <br />
                <span className="soft">Accord is the circuit&nbsp;breaker.</span>
              </h2>
              <p className="lede">
                API gateways were built for apps calling APIs. Automation tools run fixed recipes. Accord is built for
                agents that decide what to do next, and need limits while they&nbsp;do.
              </p>
            </div>
            <Link className="btn btn-ghost" href="/compare">
              See the full comparison <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>

        <section className="section" id="pricing" style={{ paddingTop: 0 }}>
          <div className="shell">
            <div className="intro">
              <p className="kicker">Pricing</p>
              <h2 className="title">
                Free while you try it.
                <br />
                <span className="soft">Fair when you ship&nbsp;it.</span>
              </h2>
              <p className="lede">
                The sandbox is free today. The paid plans below are proposed and open after the private beta. We take no
                payment&nbsp;now.
              </p>
            </div>
            <div className="plans">
              {plans.map((p) => (
                <article className={`plan ${p.now ? "now" : ""}`} key={p.name}>
                  <h3>{p.name}</h3>
                  <div className="price">{p.price}</div>
                  <p className="note">{p.note}</p>
                  <ul>
                    {p.features.map((f) => (
                      <li key={f}>
                        <Check size={15} /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link className={`btn ${p.now ? "" : "btn-ghost"}`} href={p.href}>
                    {p.cta} <ArrowUpRight size={16} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="faq" style={{ paddingTop: 0 }}>
          <div className="shell faq2">
            <div>
              <p className="kicker">Questions</p>
              <h2 className="title">
                Straight answers
                <br />
                <span className="soft">for CTOs and&nbsp;SREs.</span>
              </h2>
            </div>
            <div className="faq2-list">
              <FAQGroup defaultOpenItems={["faq-0"]}>
                {faqs.map((f, i) => (
                  <FAQWrapper
                    key={f.q}
                    itemId={`faq-${i}`}
                    className="faq2-item"
                    titleClassName="faq2-title"
                    iconSize={16}
                    iconStrokeWidth={2}
                    duration={0.45}
                  >
                    <FAQTitle>{f.q}</FAQTitle>
                    <FAQContent className="faq2-body">{f.a}</FAQContent>
                  </FAQWrapper>
                ))}
              </FAQGroup>
            </div>
          </div>
        </section>

        <section className="section dark">
          <div className="shell closing2">
            <Mark size={44} />
            <h2 className="title">
              Your agents, with limits
              <br />
              <span className="soft">you set&nbsp;yourself.</span>
            </h2>
            <p className="lede">Start with one cURL command. Ship with every call checked.</p>
            <div className="row">
              <a href="#live" className="btn btn-light btn-lg">
                Connect your agent <ArrowUpRight size={18} />
              </a>
              <Link href="/waitlist" className="btn btn-ghost btn-lg">
                Join the waitlist
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
