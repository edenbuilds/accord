"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Fingerprint,
  Route,
  Braces,
  Check,
  ChevronDown,
  Plus,
  Minus,
  Terminal,
  Play,
  Pause,
  LockKeyhole,
  FileCheck2,
} from "lucide-react";
import { Header, Footer, Mark, CopyButton } from "./ui";
import { Reveal } from "./reveal";
const modes = [
  {
    label: "Route",
    icon: Route,
    title: "One endpoint. A deliberate path.",
    text: "Bring remote MCP servers behind one address. Give each tool a namespace and each agent an explicit boundary.",
    trace: "github.list_issues",
    decision: "Allowed by engineering policy",
    color: "allowed",
  },
  {
    label: "Govern",
    icon: ShieldCheck,
    title: "Permission before execution.",
    text: "Check the tool, the request size, and the remaining call budget before any request reaches an upstream service.",
    trace: "database.drop",
    decision: "Denied · tool outside allowlist",
    color: "denied",
  },
  {
    label: "Observe",
    icon: FileCheck2,
    title: "Every decision has a reason.",
    text: "Inspect a decision receipt with the policy, tool, and rule that produced it. Export it without handing over your payloads.",
    trace: "github.create_issue",
    decision: "Held · explicit approval required",
    color: "held",
  },
];
function GatewayArt() {
  const [paused, setPaused] = useState(false);
  return (
    <div
      className={`gateway-art ${paused ? "paused" : ""}`}
      aria-label="Gateway architecture illustration"
    >
      <div className="art-top">
        <span>A boundary for every action.</span>
        <button
          onClick={() => setPaused(!paused)}
          aria-label={
            paused ? "Play gateway animation" : "Pause gateway animation"
          }
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}
        </button>
      </div>
      <svg
        className="architecture"
        viewBox="0 0 640 510"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="slab"
            x1="170"
            y1="100"
            x2="490"
            y2="340"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#dbe5cd" />
            <stop offset="1" stopColor="#819b69" />
          </linearGradient>
          <linearGradient id="floor">
            <stop stopColor="#354039" stopOpacity="0" />
            <stop offset=".5" stopColor="#819578" stopOpacity=".4" />
            <stop offset="1" stopColor="#354039" stopOpacity="0" />
          </linearGradient>
          <filter id="shadow">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>
        <path
          d="M0 320 320 140 640 320M0 380 320 200 640 380M0 440 320 260 640 440M100 510 420 330M220 510 540 330M420 510 100 330M540 510 220 330"
          stroke="url(#floor)"
        />
        <ellipse
          cx="328"
          cy="397"
          rx="178"
          ry="45"
          fill="#050a06"
          opacity=".7"
          filter="url(#shadow)"
        />
        <g className="lower-layer">
          <path
            d="m141 299 178-101 183 103-177 103z"
            fill="#25342c"
            stroke="#718069"
          />
          <path
            d="m141 299 184 105 177-103v17L325 422 141 316z"
            fill="#17271d"
            stroke="#4b6049"
          />
          <path
            d="m192 300 128-73 130 74-127 74z"
            fill="#1c2e23"
            stroke="#4b6049"
          />
          <path
            d="m259 303 63-36 63 36-63 36z"
            fill="#d9efaa"
            fillOpacity=".08"
            stroke="#c9e498"
          />
        </g>
        <g className="main-layer">
          <path
            d="m141 208 178-101 183 103-177 103z"
            fill="url(#slab)"
            stroke="#dfe8ce"
          />
          <path
            d="m141 208 184 105 177-103v22L325 336 141 230z"
            fill="#6d8259"
            stroke="#92a779"
          />
          <path d="m325 313 177-103v22L325 336z" fill="#49653f" />
          <path
            d="m232 208 87-49 88 50-87 49z"
            stroke="#40583a"
            strokeWidth="1.5"
          />
          <path
            d="m284 225 17-34 12-7-15 34m19-3 10-21 26 4m-53 12 39-22"
            stroke="#273d23"
            strokeWidth="5"
          />
          <path
            d="m174 210 25 14m10 6 10 6m209-23 26-15"
            stroke="#e4ebd8"
            strokeWidth="3"
          />
        </g>
        <g className="top-layer">
          <path
            d="m220 87 100-57 101 57-101 57z"
            fill="#263c2e"
            fillOpacity=".4"
            stroke="#7f9872"
          />
          <path
            d="m220 87 100 57 101-57v8l-101 57-100-57z"
            fill="#314733"
            stroke="#7f9872"
          />
          <path d="m298 87 22-13 23 13-23 13z" fill="#d0ec9f" />
        </g>
        <path
          className="flow-line"
          d="M320 30V0M320 154v45m0 137v46m182-172 93-53M141 208 44 153m98 147L40 355m462-53 99 55"
          stroke="#bfdc9b"
          strokeWidth="1.5"
          strokeDasharray="4 7"
        />
        <text
          x="36"
          y="137"
          fill="#c2ccb9"
          fontSize="12"
          fontFamily="sans-serif"
        >
          AGENTS
        </text>
        <text
          x="517"
          y="141"
          fill="#c2ccb9"
          fontSize="12"
          fontFamily="sans-serif"
        >
          IDENTITY
        </text>
        <text
          x="18"
          y="378"
          fill="#c2ccb9"
          fontSize="12"
          fontFamily="sans-serif"
        >
          POLICY
        </text>
        <text
          x="541"
          y="383"
          fill="#c2ccb9"
          fontSize="12"
          fontFamily="sans-serif"
        >
          TOOLS
        </text>
      </svg>
      <div className="art-bottom">
        <span>
          <ShieldCheck size={16} /> Explicit by design
        </span>
        <span>Architecture preview</span>
      </div>
    </div>
  );
}
export default function Landing() {
  const [mode, setMode] = useState(0);
  const [faq, setFaq] = useState<number | null>(0);
  const selected = modes[mode];
  const config = JSON.stringify(
    { mcpServers: { accord: { url: "https://mcp.edenbuilds.me/mcp" } } },
    null,
    2,
  );
  return (
    <>
      <Header />
      <main id="main">
        <section className="hero wrap">
          <Reveal className="hero-copy">
            <Link className="release-link" href="/docs">
              <span className="release-square" /> Developer preview is here{" "}
              <ArrowUpRight size={14} />
            </Link>
            <h1>
              Give agents
              <br />
              access.
              <br />
              <span>Keep control.</span>
            </h1>
            <p className="hero-description">
              The control layer between what your agents <em>can</em> do and
              what they <em>should</em> do.
            </p>
            <div className="hero-actions">
              <Link href="/workbench" className="button">
                Try the workbench <ArrowUpRight size={17} />
              </Link>
              <Link href="/docs" className="text-link">
                Read the docs <ArrowRight size={17} />
              </Link>
            </div>
            <p className="hero-footnote">
              No account. No credentials. See the policy work.
            </p>
          </Reveal>
          <Reveal className="hero-visual">
            <GatewayArt />
          </Reveal>
        </section>
        <section className="compat wrap">
          <span>
            Built on an open protocol.
            <br />
            <strong>Made for your existing stack.</strong>
          </span>
          <div className="client-names">
            <span>
              <Braces />
              MCP
            </span>
            <span>Claude</span>
            <span className="cursor-logo">Cursor</span>
            <span>OpenAI</span>
            <span>
              <Terminal />
              Your agent
            </span>
          </div>
          <small>Protocol compatibility, not endorsements.</small>
        </section>
        <section className="platform wrap" id="platform">
          <div className="section-intro">
            <p className="eyebrow">The missing control layer</p>
            <h2>
              Connect freely.
              <br />
              <span>Execute deliberately.</span>
            </h2>
            <p>
              More tools should not mean more exposure. Put a clear boundary
              between an agent’s intent and the systems it can change.
            </p>
          </div>
          <div className="platform-panel">
            <div
              className="tablist"
              role="tablist"
              aria-label="Platform capabilities"
            >
              {modes.map((m, i) => (
                <button
                  role="tab"
                  aria-selected={mode === i}
                  aria-controls="platform-detail"
                  id={`platform-tab-${i}`}
                  key={m.label}
                  onClick={() => setMode(i)}
                  className={mode === i ? "selected" : ""}
                >
                  <m.icon size={18} />
                  {m.label}
                  <span>0{i + 1}</span>
                </button>
              ))}
            </div>
            <div
              className="platform-detail"
              id="platform-detail"
              role="tabpanel"
              aria-labelledby={`platform-tab-${mode}`}
              key={mode}
            >
              <div>
                <h3>{selected.title}</h3>
                <p>{selected.text}</p>
                <Link href="/workbench" className="text-link">
                  Test a decision <ArrowUpRight size={17} />
                </Link>
              </div>
              <div className="mini-trace">
                <div className="trace-header">
                  <span>Policy evaluation</span>
                  <span>Interactive example</span>
                </div>
                <div className="trace-route">
                  <span>
                    <Terminal size={19} /> Agent
                  </span>
                  <ArrowRight size={19} />
                  <span className="route-mark">
                    <Mark size={22} /> Accord
                  </span>
                  <ArrowRight size={19} />
                  <span>
                    <Braces size={19} /> Tool
                  </span>
                </div>
                <div className="trace-code">
                  <code>{selected.trace}</code>
                  <span className={selected.color}>{selected.decision}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="principles wrap">
          <article>
            <Fingerprint size={27} />
            <h3>Identity, before access.</h3>
            <p>
              Start with scoped gateway credentials. The roadmap connects human
              and agent identity to every authorization decision.
            </p>
            <Link href="/docs#security">
              Read the security boundary <ArrowUpRight size={16} />
            </Link>
          </article>
          <article>
            <LockKeyhole size={27} />
            <h3>A hard stop means stop.</h3>
            <p>
              Explicit allowlists and call budgets run before upstream
              execution. Approval-gated tools stay blocked in the preview.
            </p>
            <Link href="/workbench">
              Try an agent retry loop <ArrowUpRight size={16} />
            </Link>
          </article>
          <article>
            <Braces size={27} />
            <h3>Less context. More signal.</h3>
            <p>
              Choose the fields that matter. Inspect the exact JSON and byte
              reduction before changing a response contract.
            </p>
            <Link href="/workbench?view=payload">
              Open the payload pruner <ArrowUpRight size={16} />
            </Link>
          </article>
        </section>
        <section className="dark-section">
          <div className="wrap developer-section">
            <div>
              <p className="eyebrow">A small first step</p>
              <h2>
                Meet Accord.
                <br />
                <span>From your agent.</span>
              </h2>
              <p>
                Connect to the public, read-only MCP preview. Inspect its
                capabilities and evaluate a policy with the same engine used in
                the workbench.
              </p>
              <Link href="/docs" className="button light">
                Connect your client <ArrowUpRight size={17} />
              </Link>
              <div className="dev-note">
                <ShieldCheck size={17} /> No access to your GitHub, Stripe, or
                databases.
              </div>
            </div>
            <div className="code-window">
              <div className="code-header">
                <span>mcp.json</span>
                <CopyButton text={config} />
              </div>
              <pre>{config}</pre>
              <div className="code-footer">
                <span>Available tools</span>
                <code>accord_describe</code>
                <code>accord_evaluate</code>
              </div>
            </div>
          </div>
        </section>
        <section className="pricing wrap" id="pricing">
          <div className="section-intro">
            <p className="eyebrow">A business that scales with yours</p>
            <h2>
              Start with a boundary.
              <br />
              <span>Grow into a control plane.</span>
            </h2>
            <p>
              Use the developer preview today. These are our proposed hosted
              plans, with billing opening after the private beta.
            </p>
          </div>
          <div className="pricing-grid">
            {[
              {
                name: "Developer",
                price: "$0",
                sub: "Proposed free hosted plan",
                text: "A clear starting point for your first agents.",
                features: [
                  "2 connected MCP servers",
                  "1,000 tool calls / month",
                  "Explicit tool policies",
                  "Community documentation",
                ],
                cta: "Try the free preview",
                href: "/workbench",
              },
              {
                name: "Pro",
                price: "$79",
                sub: "Proposed / month",
                text: "For teams taking agents into production.",
                features: [
                  "10 connected MCP servers",
                  "100,000 tool calls / month",
                  "Custom gateway domain",
                  "7-day metadata retention",
                ],
                cta: "Read the beta plan",
                href: "/roadmap#beta",
              },
              {
                name: "Enterprise",
                price: "Let’s talk",
                sub: "Planned annual contracts",
                text: "Your identity. Your infrastructure. Your rules.",
                features: [
                  "SSO and delegated identity",
                  "Private data plane",
                  "Export to your observability stack",
                  "Evidence and compliance controls",
                ],
                cta: "Explore the enterprise path",
                href: "/roadmap#enterprise",
              },
            ].map((p, i) => (
              <article
                className={`price-card ${i === 1 ? "featured" : ""}`}
                key={p.name}
              >
                <div className="price-title">
                  <h3>{p.name}</h3>
                  {i === 1 && <span>For production teams</span>}
                </div>
                <p>{p.text}</p>
                <div className="price">{p.price}</div>
                <small>{p.sub}</small>
                <Link
                  href={p.href}
                  className={`button ${i === 1 ? "" : "secondary"}`}
                >
                  {p.cta}
                  <ArrowUpRight size={16} />
                </Link>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}>
                      <Check size={15} />
                      {f}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="pricing-note">
            No payment collected. Hosted quotas, retention, and enterprise
            features are not active in this preview.
          </p>
        </section>
        <section className="faq wrap">
          <div>
            <p className="eyebrow">Before you connect</p>
            <h2>
              Clear answers.
              <br />
              <span>Clear boundaries.</span>
            </h2>
          </div>
          <div>
            {[
              {
                q: "What can I use right now?",
                a: "The workbench evaluates real policy rules against illustrative scenarios, prunes JSON fields, and exports policies and decision receipts. The public MCP endpoint exposes two read-only tools. The repository includes a local gateway for configured remote MCP servers.",
              },
              {
                q: "Is this an enterprise-ready hosted gateway?",
                a: "Not yet. This is a developer preview. Managed accounts, OAuth identity brokering, billing, durable approvals, and SOC 2 assurance are planned. No compliance certifications or production SLAs are claimed.",
              },
              {
                q: "Will my data train a model?",
                a: "Accord does not call a model. The workbench processes scenarios in your browser. Public MCP evaluations run on Vercel and return a decision without application-level persistence. Do not put secrets or customer data in the public preview.",
              },
              {
                q: "Can I run it in my own environment?",
                a: "Yes. Run the single-process Node gateway in the repository with your own environment variables and explicit upstream configuration. It is an evaluation deployment, with in-memory budgets that reset on restart. Production multi-replica deployments require the durable quota and audit work in the roadmap.",
              },
            ].map((f, i) => (
              <div className="faq-item" key={f.q}>
                <button
                  aria-expanded={faq === i}
                  aria-controls={`faq-${i}`}
                  onClick={() => setFaq(faq === i ? null : i)}
                >
                  {f.q}
                  {faq === i ? <Minus size={18} /> : <Plus size={18} />}
                </button>
                {faq === i && <p id={`faq-${i}`}>{f.a}</p>}
              </div>
            ))}
          </div>
        </section>
        <section className="closing wrap">
          <Mark size={48} />
          <h2>
            Let your agents work.
            <br />
            <span>Make the rules yours.</span>
          </h2>
          <Link href="/workbench" className="button">
            Put a policy to the test <ArrowUpRight size={18} />
          </Link>
          <p>Built by Eden. Designed for what comes next.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
