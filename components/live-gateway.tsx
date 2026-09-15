"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2, Play } from "lucide-react";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { CopyButton } from "./ui";
import { argsFromSchema } from "@/lib/sandbox";
import type { Receipt } from "@/lib/pipeline";

// Dates in the UI are DD-MM-YYYY, Asia/Kolkata.
export function formatIST(iso: string, withTime = true) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false } : {}),
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const date = `${get("day")}-${get("month")}-${get("year")}`;
  return withTime ? `${date} ${get("hour")}:${get("minute")}:${get("second")}` : date;
}

const RULES: Record<string, string> = {
  "policy.allow": "Allowed",
  "execution.failed": "Execution failed",
  "loop.repeat": "Loop stopped",
  "rbac.tool": "Not allowed for this role",
  "approval.required": "Held for approval",
  "schema.invalid": "Inputs did not match",
  "rate.bucket": "Too many calls at once",
  "quota.total": "Free calls used up",
  "input.shape": "Bad request",
  "input.size": "Request too large",
  "redact.unavailable": "Withheld",
};
export const ruleLabel = (rule: string) =>
  RULES[rule] ?? (rule.endsWith(".unavailable") ? "Stopped: a check could not run" : rule);
export const fmtBytes = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);
export function savings(r: Pick<Receipt, "bytesRaw" | "bytesOut">) {
  if (!r.bytesRaw || r.bytesOut >= r.bytesRaw) return "";
  return `${fmtBytes(r.bytesRaw)} → ${fmtBytes(r.bytesOut)} (${Math.round((1 - r.bytesOut / r.bytesRaw) * 100)}% smaller)`;
}

export type GatewayStatus = {
  id: string;
  name: string;
  createdAt: string;
  baseUrl: string;
  limit: number;
  calls: number;
  roles: string[];
  policy: {
    loop: { maxRepeats: number; windowSeconds: number };
    rate: { capacity: number; refillPerMinute: number };
    cacheSeconds: number;
    cache: string[];
    strip: string[];
    redact: string[];
  };
  tools: { name: string; title: string; method: string; path: string; visible: boolean; needsApproval: boolean }[];
  receipts: Receipt[];
};

export function useGatewayStatus(id: string, enabled = true) {
  const [data, setData] = useState<GatewayStatus | null>(null);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);
  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/gateways/${id}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (res.status === 404) setMissing(true);
      if (!res.ok) throw new Error(body.error ?? "Could not load the gateway.");
      setData(body);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the gateway.");
    }
  }, [id]);
  useEffect(() => {
    if (!enabled) return;
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 2500);
    return () => clearInterval(timer);
  }, [enabled, load]);
  return { data, error, missing, reload: load };
}

// Gateways created in this browser, so people can find them again.
export type SavedGateway = { id: string; name: string; url: string; createdAt: string };
const SAVED = "accord.gateways.v1";
export function rememberGateway(g: SavedGateway) {
  try {
    const list: SavedGateway[] = JSON.parse(localStorage.getItem(SAVED) ?? "[]");
    localStorage.setItem(SAVED, JSON.stringify([g, ...list.filter((x) => x.id !== g.id)].slice(0, 20)));
  } catch {}
}
export function MyGateways({ showEmpty = false, onCreate }: { showEmpty?: boolean; onCreate?: () => void }) {
  const [list, setList] = useState<SavedGateway[]>([]);
  useEffect(() => {
    try {
      setList(JSON.parse(localStorage.getItem(SAVED) ?? "[]"));
    } catch {}
  }, []);
  if (!list.length) return showEmpty ? <div className="gw-panel"><h2>No sandboxes yet</h2><p>Create your first server in the builder. It will appear here so you can find it again.</p>{onCreate ? <button type="button" className="link" onClick={onCreate}>Build your first server</button> : <Link href="/app" className="link">Build your first server</Link>}</div> : null;
  return (
    <div className="gw-panel">
      <h2>Your gateways in this browser</h2>
      <ul className="gw-tools">
        {list.map((g) => (
          <li key={g.id}>
            <span className="cv-method">MCP</span>
            <Link href={`/g/${g.id}`} className="link">
              {g.name}
            </Link>
            <small>Created {formatIST(g.createdAt, false)}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

function snippets(url: string, name: string) {
  return [
    {
      id: "claude-code",
      label: "Claude Code",
      code: `claude mcp add --transport http ${name} ${url}`,
      help: "Run this in your terminal, then start Claude Code.",
    },
    {
      id: "cursor",
      label: "Cursor",
      code: JSON.stringify({ mcpServers: { [name]: { url } } }, null, 2),
      help: "Add this to .cursor/mcp.json in your project, or ~/.cursor/mcp.json.",
    },
    {
      id: "vscode",
      label: "VS Code",
      code: JSON.stringify({ servers: { [name]: { type: "http", url } } }, null, 2),
      help: "Add this to .vscode/mcp.json, then start the server from the MCP view.",
    },
    {
      id: "claude",
      label: "Claude app",
      code: url,
      help: "In Claude, open Settings, then Connectors, then Add custom connector, and paste this URL.",
    },
  ];
}

export default function LiveGateway({
  id,
  url,
  ask,
  status,
  onReload,
  showPageLink = true,
}: {
  id: string;
  url: string;
  ask?: string;
  status?: GatewayStatus | null;
  onReload?: () => void;
  showPageLink?: boolean;
}) {
  const own = useGatewayStatus(id, status === undefined);
  const data = status === undefined ? own.data : status;
  const reload = onReload ?? own.reload;
  const [tab, setTab] = useState("claude-code");
  const [testing, setTesting] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [catalog, setCatalog] = useState<{ name: string; inputSchema: Record<string, unknown> }[]>([]);
  const [selectedTool, setSelectedTool] = useState("");
  const [argumentsText, setArgumentsText] = useState("{}");
  const [responseText, setResponseText] = useState("");
  useEffect(() => {
    let cancelled = false;
    const client = new Client({ name: "accord-playground", version: "1.0.0" });
    void (async () => {
      try {
        await client.connect(new StreamableHTTPClientTransport(new URL(url)));
        const result = await client.listTools();
        if (cancelled) return;
        setCatalog(result.tools);
        const first = result.tools.find(t => t.annotations?.readOnlyHint) ?? result.tools[0];
        if (first) {
          setSelectedTool(first.name);
          setArgumentsText(JSON.stringify(argsFromSchema(first.inputSchema, first.name), null, 2));
        }
      } catch {
        if (!cancelled) setMessage("Tool discovery failed. Reload this page to reconnect.");
      } finally { await client.close().catch(() => {}); }
    })();
    return () => { cancelled = true; void client.close().catch(() => {}); };
  }, [url]);
  const name = `accord-${id.slice(0, 6).toLowerCase().replace(/[^a-z0-9]/g, "x")}`;
  const list = snippets(url, name);
  const current = list.find((s) => s.id === tab) ?? list[0];
  const receipts = data?.receipts ?? [];

  async function testCall() {
    setTesting("running");
    setMessage("");
    setResponseText("");
    const client = new Client({ name: "accord-browser-test", version: "1.0.0" });
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(url)));
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === selectedTool);
      if (!tool) throw new Error("This gateway has no tools for this role.");
      const args = JSON.parse(argumentsText);
      if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("Arguments must be a JSON object.");
      const res = await client.callTool({ name: tool.name, arguments: args });
      const content = Array.isArray(res.content) ? res.content : [];
      const rendered = content.map(part => {
        if (part.type !== "text") return part;
        try { return JSON.parse(String(part.text)); } catch { return part.text; }
      });
      setResponseText(JSON.stringify(rendered.length === 1 ? rendered[0] : rendered, null, 2));
      setMessage(
        `Called ${tool.name} through the real MCP endpoint. ${res.isError ? "Accord stopped it. The feed shows why." : "Sample data came back."}`,
      );
      setTesting("done");
      reload();
    } catch (e) {
      setTesting("error");
      setMessage(e instanceof SyntaxError ? "These inputs are not valid JSON. Check the brackets and quotes, then try again." : e instanceof Error ? e.message : "The test call failed.");
    } finally {
      await client.close().catch(() => {});
    }
  }

  return (
    <div className="lg">
      <div className="lg-tabs" role="tablist" aria-label="Where to connect">
        {list.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={tab === s.id} onClick={() => setTab(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="lg-snippet">
        <pre>{current.code}</pre>
        <CopyButton text={current.code} />
      </div>
      <p className="lg-help">{current.help}</p>
      {ask && (
        <div className="lg-ask">
          <span>
            Then ask your agent: <q>{ask}</q>
          </span>
          <CopyButton text={ask} label="Copy" />
        </div>
      )}
      <div className="lg-feed-head">
        <strong>Live calls</strong>
        <span>
          {data
            ? `${data.calls.toLocaleString("en-IN")} of ${data.limit.toLocaleString("en-IN")} free calls used`
            : own.error || "Connecting"}
        </span>
      </div>
      {receipts.length === 0 ? (
        <div className="lg-wait">
          Waiting for your agent’s first call.
        </div>
      ) : (
        <ul className="lg-feed" aria-live="polite">
          {receipts.slice(0, 20).map((r) => (
            <li key={r.id}>
              <span className={`lg-dot ${r.effect}`} aria-hidden="true" />
              <span>
                <code>{r.tool}</code> · {ruleLabel(r.rule)}
                {r.cached ? " · from cache" : ""}
              </span>
              <span>{r.latencyMs} ms</span>
              <span className="t">
                {formatIST(r.time)} IST
                {savings(r) ? ` · ${savings(r)}` : ""}
                {r.redacted ? ` · ${r.redacted} private fields removed` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="lg-tester">
        <h3>Test the MCP endpoint</h3>
        <p className="lg-help">Choose a tool and edit its JSON inputs. This sends a real MCP call; the sandbox returns sample data.</p>
        <label>Tool to call
          <select aria-label="Live tool" value={selectedTool} onChange={e => {
            setSelectedTool(e.target.value);
            const tool = catalog.find(t => t.name === e.target.value);
            if (tool) setArgumentsText(JSON.stringify(argsFromSchema(tool.inputSchema, tool.name), null, 2));
            setResponseText(""); setMessage("");
          }}>
            {!catalog.length && <option value="">Discovering tools…</option>}
            {catalog.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
        </label>
        <label>Arguments
          <textarea aria-label="Live arguments" value={argumentsText} onChange={e => setArgumentsText(e.target.value)} spellCheck={false} />
        </label>
      </div>
      <div className="lg-row">
        <button type="button" className="btn btn-ghost" onClick={testCall} disabled={testing === "running" || !selectedTool}>
          {testing === "running" ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
          Send a test call
        </button>
        {showPageLink && (
          <Link href={`/g/${id}`} className="link">
            Open the gateway page <ArrowUpRight size={15} />
          </Link>
        )}
      </div>
      {message && <p className={testing === "error" ? "cv-error" : "lg-help"}>{message}</p>}
      {responseText && <details className="lg-response" open><summary>MCP response</summary><CopyButton text={responseText} label="Copy response" /><pre>{responseText}</pre></details>}
      {receipts.some((r) => r.effect === "allow") && (
        <div className="lg-hook">
          <p>
            <strong>It works.</strong> This sandbox stays live for 30 days or 1,000 calls. To connect your real API,
            use the self-hosted template. Hosted accounts are planned.
          </p>
          <Link href="/docs#quickstart" className="btn">
            Connect a real API <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
