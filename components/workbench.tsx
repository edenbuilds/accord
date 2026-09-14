"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  SlidersHorizontal,
  Braces,
  Plug,
  Download,
  ArrowUpRight,
  Play,
  FileCheck2,
  Check,
  OctagonX,
  Clock3,
  Info,
  RotateCcw,
} from "lucide-react";
import { Header, CopyButton, downloadJson } from "./ui";
import {
  defaultPolicy,
  evaluate,
  policySchema,
  prunePayload,
  type Policy,
  type Decision,
} from "@/lib/policy";
import { samplePayload, scenarios } from "@/lib/fixtures";
type Receipt = {
  id: string;
  createdAt: string;
  tool: string;
  decision: Decision;
  policy: Policy;
  request: { tool: string; callsInWindow: number; payloadBytes: number };
  mode: "simulation";
};
const sections = [
  { id: "policies", name: "Policy workbench", icon: ShieldCheck },
  { id: "payload", name: "Payload pruner", icon: Braces },
  { id: "receipts", name: "Decision receipts", icon: FileCheck2 },
  { id: "connect", name: "Connect a client", icon: Plug },
];
export default function Workbench() {
  const [view, setView] = useState("policies");
  const [policy, setPolicy] = useState<Policy>(defaultPolicy);
  const [ready, setReady] = useState(false);
  const [scenario, setScenario] = useState(0);
  const [calls, setCalls] = useState(3);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [result, setResult] = useState<Decision | null>(null);
  const [keep, setKeep] = useState(["id", "title", "state", "labels"]);
  const [payload, setPayload] =
    useState<Record<string, unknown>>(samplePayload);
  const [raw, setRaw] = useState(JSON.stringify(samplePayload, null, 2));
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const selected = scenarios[scenario];
  useEffect(() => {
    const initial = new URLSearchParams(location.search).get("view");
    if (sections.some((s) => s.id === initial)) setView(initial!);
    try {
      const stored = localStorage.getItem("accord.policy.v1");
      if (stored) {
        const parsed = policySchema.safeParse(JSON.parse(stored));
        if (parsed.success) setPolicy(parsed.data);
      }
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("accord.policy.v1", JSON.stringify(policy));
    } catch {
      setFeedback(
        "Browser storage is unavailable. Export your policy to keep it.",
      );
    }
  }, [policy, ready]);
  function navigate(id: string) {
    setView(id);
    history.replaceState(null, "", `?view=${id}`);
    setFeedback("");
  }
  function run() {
    const request = {
      tool: selected.tool,
      callsInWindow: calls,
      payloadBytes: selected.payloadBytes,
    };
    const decision = evaluate(policy, request);
    setResult(decision);
    setReceipts((prev) =>
      [
        {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          tool: selected.tool,
          decision,
          policy: structuredClone(policy),
          request,
          mode: "simulation" as const,
        },
        ...prev,
      ].slice(0, 100),
    );
  }
  function toggleTool(tool: string) {
    setPolicy((p) => ({
      ...p,
      allowedTools: p.allowedTools.includes(tool)
        ? p.allowedTools.filter((t) => t !== tool)
        : [...p.allowedTools, tool],
    }));
    setResult(null);
  }
  const output = prunePayload(payload, keep);
  const before = new TextEncoder().encode(JSON.stringify(payload)).length;
  const after = new TextEncoder().encode(JSON.stringify(output)).length;
  const config = JSON.stringify(
    { mcpServers: { accord: { url: "https://mcp.edenbuilds.me/mcp" } } },
    null,
    2,
  );
  function loadPayload() {
    try {
      if (new TextEncoder().encode(raw).length > 32768)
        throw new Error("Keep the payload below 32 KB.");
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error("Use a JSON object, not an array or a primitive.");
      setPayload(parsed);
      setKeep(Object.keys(parsed));
      setError("");
      setFeedback("Payload loaded. Choose fields to retain.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }
  const title = sections.find((s) => s.id === view)?.name;
  return (
    <>
      <Header />
      <main id="main" className="workbench">
        <aside className="sidebar" aria-label="Workbench sections">
          <div className="workspace-name">
            Your local workspace<span>Developer preview</span>
          </div>
          {sections.map((s) => (
            <button
              key={s.id}
              className={view === s.id ? "selected" : ""}
              onClick={() => navigate(s.id)}
              aria-current={view === s.id ? "page" : undefined}
            >
              <s.icon size={16} />
              {s.name}
            </button>
          ))}
          <p className="sidebar-note">
            Policies stay in this browser.
            <br />
            Receipts stay in this session.
            <br />
            No upstream actions run here.
          </p>
        </aside>
        <div className="work-area">
          <div className="work-heading">
            <div>
              <p className="eyebrow">Explore Accord</p>
              <h1>{title}</h1>
              <p>
                {view === "policies"
                  ? "Set a boundary. Send a scenario. Inspect the decision."
                  : view === "payload"
                    ? "Keep the useful fields. See exactly what leaves."
                    : view === "receipts"
                      ? "A record of the decisions you have evaluated in this session."
                      : "Use the real, read-only MCP endpoint in your own agent."}
              </p>
            </div>
            <button
              className="button secondary"
              onClick={() => {
                downloadJson(policy, "accord.policy.json");
                setFeedback("Policy exported.");
              }}
            >
              <Download size={15} />
              Export policy
            </button>
          </div>
          <div className="preview-note">
            <Info size={15} />
            <span>
              Developer preview. Scenarios are illustrative. Policy decisions
              and JSON transformations are real; this workbench does not execute
              external tools.
            </span>
          </div>
          <p className="sr-only" role="status">
            {feedback}
          </p>
          {view === "policies" && (
            <>
              <div className="work-grid">
                <section className="panel">
                  <div className="panel-head">
                    <span style={{ color: "var(--ink)" }}>
                      01 / Define the boundary
                    </span>
                    <SlidersHorizontal size={15} />
                  </div>
                  <div className="panel-body">
                    <label className="field">
                      Policy name
                      <input
                        value={policy.name}
                        maxLength={80}
                        onChange={(e) => {
                          if (e.target.value.trim())
                            setPolicy({ ...policy, name: e.target.value });
                        }}
                      />
                    </label>
                    <p className="field">Tools visible to this agent</p>
                    {[
                      "github.list_issues",
                      "github.create_issue",
                      "stripe.list_customers",
                      "database.drop",
                    ].map((tool) => (
                      <label className="rule-row" key={tool}>
                        <input
                          type="checkbox"
                          checked={policy.allowedTools.includes(tool)}
                          onChange={() => toggleTool(tool)}
                        />
                        <code>{tool}</code>
                        <span>{tool.includes("list") ? "Read" : "Write"}</span>
                      </label>
                    ))}
                    <div style={{ height: 25 }} />
                    <label className="field">
                      <span className="field-label">
                        Call budget / minute
                        <strong>{policy.limitPerMinute}</strong>
                      </span>
                      <input
                        aria-label="Call budget per minute"
                        type="range"
                        min="1"
                        max="100"
                        value={policy.limitPerMinute}
                        onChange={(e) => {
                          setPolicy({
                            ...policy,
                            limitPerMinute: Number(e.target.value),
                          });
                          setResult(null);
                        }}
                      />
                    </label>
                    <label className="rule-row">
                      <input
                        type="checkbox"
                        checked={policy.requireApproval.includes(
                          "github.create_issue",
                        )}
                        onChange={(e) => {
                          setPolicy({
                            ...policy,
                            requireApproval: e.target.checked
                              ? ["github.create_issue"]
                              : [],
                          });
                          setResult(null);
                        }}
                      />
                      Require approval to create an issue
                    </label>
                    <div className="policy-summary">
                      <span>
                        Maximum request:{" "}
                        {policy.maxPayloadBytes.toLocaleString()} bytes
                      </span>
                      <span>Explicit allowlist</span>
                    </div>
                    <button
                      className="text-link copy-button"
                      onClick={() => {
                        setPolicy(defaultPolicy);
                        setResult(null);
                        setFeedback("Default policy restored.");
                      }}
                    >
                      <RotateCcw size={13} />
                      Restore default policy
                    </button>
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-head">
                    <span style={{ color: "var(--ink)" }}>
                      02 / Test an action
                    </span>
                    <Play size={15} />
                  </div>
                  <div className="panel-body">
                    <div className="scenario-buttons">
                      {scenarios.map((s, i) => (
                        <button
                          className={scenario === i ? "selected" : ""}
                          key={s.name}
                          onClick={() => {
                            setScenario(i);
                            setCalls(s.callsInWindow);
                            setResult(null);
                          }}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                    <p className="scenario-description">
                      {selected.description}
                    </p>
                    <label className="field">
                      Requested tool
                      <input readOnly value={selected.tool} />
                    </label>
                    <label className="field">
                      Calls already made this minute
                      <input
                        type="number"
                        min="0"
                        max="1000000"
                        value={calls}
                        onChange={(e) => {
                          setCalls(
                            Math.max(
                              0,
                              Math.min(
                                1000000,
                                Math.floor(Number(e.target.value) || 0),
                              ),
                            ),
                          );
                          setResult(null);
                        }}
                      />
                    </label>
                    <button className="button wide-button" onClick={run}>
                      <Play size={15} />
                      Evaluate request
                    </button>
                    <div style={{ marginTop: 22 }} aria-live="polite">
                      {result ? (
                        <div className={`decision ${result.effect}`}>
                          <div className="decision-title">
                            {result.effect === "allow" ? (
                              <Check size={22} />
                            ) : result.effect === "deny" ? (
                              <OctagonX size={22} />
                            ) : (
                              <Clock3 size={22} />
                            )}{" "}
                            {result.effect === "allow"
                              ? "Request allowed"
                              : result.effect === "deny"
                                ? "Request denied"
                                : "Approval required"}
                          </div>
                          <p>{result.reason}</p>
                          <code>Matched rule: {result.rule}</code>
                        </div>
                      ) : (
                        <div className="empty">
                          <ShieldCheck size={29} />
                          <p>Your next decision appears here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>
              <ReceiptList
                receipts={receipts.slice(0, 3)}
                onExport={() => downloadJson(receipts, "accord.receipts.json")}
              />
            </>
          )}
          {view === "payload" && (
            <>
              <div className="payload-grid">
                <section className="panel">
                  <div className="panel-head">
                    Fields to retain<span>Explicit projection</span>
                  </div>
                  <div className="panel-body">
                    {Object.keys(payload).map((key) => (
                      <label className="rule-row" key={key}>
                        <input
                          type="checkbox"
                          checked={keep.includes(key)}
                          onChange={(e) =>
                            setKeep(
                              e.target.checked
                                ? [...keep, key]
                                : keep.filter((k) => k !== key),
                            )
                          }
                        />
                        <code>{key}</code>
                      </label>
                    ))}
                    <p className="notice">
                      Top-level fields only. Nested content within a retained
                      field is preserved. No semantic caching or data masking is
                      applied.
                    </p>
                    <div className="callout-links">
                      <button
                        className="copy-button"
                        onClick={() => setKeep(Object.keys(payload))}
                      >
                        Keep all
                      </button>
                      <button
                        className="copy-button"
                        onClick={() => setKeep([])}
                      >
                        Clear selection
                      </button>
                    </div>
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-head">
                    Projected response
                    <CopyButton text={JSON.stringify(output, null, 2)} />
                  </div>
                  <div className="payload-stats">
                    <div>
                      <strong>{before.toLocaleString()}</strong>
                      <span>Original bytes</span>
                    </div>
                    <div>
                      <strong>{after.toLocaleString()}</strong>
                      <span>Retained bytes</span>
                    </div>
                    <div>
                      <strong>{Math.round((1 - after / before) * 100)}%</strong>
                      <span>Smaller payload</span>
                    </div>
                  </div>
                  <pre className="json-view">
                    {JSON.stringify(output, null, 2)}
                  </pre>
                  <div className="panel-body">
                    <button
                      className="button secondary wide-button"
                      onClick={() =>
                        downloadJson(output, "accord.projected.json")
                      }
                    >
                      <Download size={14} />
                      Export projected JSON
                    </button>
                    <p className="notice">
                      Byte reduction is measured using UTF-8. Token savings
                      depend on the tokenizer and are not estimated.
                    </p>
                  </div>
                </section>
              </div>
              <section className="panel" style={{ marginTop: 23 }}>
                <div className="panel-head">
                  Try your own JSON<span>Processed in this browser</span>
                </div>
                <div className="panel-body">
                  <label className="field">
                    JSON object · up to 32 KB
                    <textarea
                      aria-label="JSON payload"
                      value={raw}
                      onChange={(e) => setRaw(e.target.value)}
                      maxLength={32768}
                    />
                  </label>
                  {error && (
                    <p className="error" role="alert">
                      {error}
                    </p>
                  )}
                  <button className="button secondary" onClick={loadPayload}>
                    Load payload <ArrowUpRight size={15} />
                  </button>
                </div>
              </section>
            </>
          )}
          {view === "receipts" && (
            <>
              <ReceiptList
                receipts={receipts}
                onExport={() => downloadJson(receipts, "accord.receipts.json")}
              />
              <p className="notice">
                Up to 100 session receipts. Exports include the exact policy and
                evaluated inputs. These simulation receipts are unsigned and are
                not compliance evidence.
              </p>
              <button
                className="button secondary"
                style={{ marginTop: 20 }}
                onClick={() => navigate("policies")}
              >
                Evaluate another request <ArrowUpRight size={15} />
              </button>
            </>
          )}
          {view === "connect" && (
            <section className="panel">
              <div className="panel-head">
                Connect in a few minutes<span>Public MCP preview</span>
              </div>
              <div className="panel-body">
                <div className="step">
                  <span>1</span>
                  <div>
                    <h3>Add Accord to your client.</h3>
                    <p>
                      For clients accepting URL-based MCP configuration, add the
                      entry below. Client configuration keys can differ; see the
                      documentation for a Claude Code command.
                    </p>
                    <div className="connect-code">
                      <CopyButton text={config} />
                      <pre>{config}</pre>
                    </div>
                  </div>
                </div>
                <div className="step">
                  <span>2</span>
                  <div>
                    <h3>Ask what it can do.</h3>
                    <p>
                      Call <code>accord_describe</code> to inspect the preview.
                      Call <code>accord_evaluate</code> with a policy and
                      scenario to get an actual policy decision.
                    </p>
                  </div>
                </div>
                <div className="step">
                  <span>3</span>
                  <div>
                    <h3>Run a gateway locally.</h3>
                    <p>
                      The repository includes a configurable gateway that
                      discovers remote MCP tools, filters them by policy,
                      enforces a shared process-local call budget, and logs
                      metadata receipts.
                    </p>
                    <div className="callout-links">
                      <Link href="/docs#local">
                        Local gateway setup <ArrowUpRight size={14} />
                      </Link>
                      <a href="https://github.com/edenbuilds/accord">
                        Open repository <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
function ReceiptList({
  receipts,
  onExport,
}: {
  receipts: Receipt[];
  onExport: () => void;
}) {
  return (
    <section className="panel receipt-list">
      <div className="panel-head">
        Decision receipts
        <button
          className="copy-button"
          disabled={!receipts.length}
          onClick={onExport}
        >
          <Download size={14} />
          Export JSON
        </button>
      </div>
      {!receipts.length ? (
        <div className="empty-receipts">
          No decisions yet. Evaluate a scenario to create your first receipt.
        </div>
      ) : (
        receipts.map((r) => (
          <div className="receipt" key={r.id}>
            <div>
              <code>{r.tool}</code>
              <small>
                {new Intl.DateTimeFormat("en-GB", {
                  dateStyle: "short",
                  timeStyle: "medium",
                  timeZone: "Asia/Kolkata",
                })
                  .format(new Date(r.createdAt))
                  .replaceAll("/", "-")}{" "}
                IST
              </small>
            </div>
            <span>{r.decision.rule}</span>
            <span
              className={`effect ${r.decision.effect === "allow" ? "allowed" : r.decision.effect === "deny" ? "denied" : "held"}`}
            >
              {r.decision.effect === "approval_required"
                ? "Approval required"
                : r.decision.effect === "allow"
                  ? "Allowed"
                  : "Denied"}
            </span>
          </div>
        ))
      )}
    </section>
  );
}
