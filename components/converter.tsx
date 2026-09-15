"use client";
import { useDeferredValue, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { ArrowUpRight, Check, CircleSlash, FileUp, KeyRound, Loader2, Minus, Play, RotateCcw, Send, X } from "lucide-react";
import { convert, type ManifestTool } from "@/lib/convert";
import { buildRequest, exampleArgs, mockResponse } from "@/lib/sandbox";
import { defaultGatewayPolicy, matches, memoryStore, runCall, visibleTools, type CallResult, type GatewayPolicy } from "@/lib/pipeline";
import { quickSamples, templateFor } from "@/lib/use-cases";
import { CopyButton, downloadJson } from "./ui";
import BeamBorder from "./effects/border-beam/BorderBeam";
import LiveGateway, { rememberGateway, savings } from "./live-gateway";

const SOURCE = { curl: "cURL", openapi: "OpenAPI 3", swagger: "Swagger 2", postman: "Postman" } as const;
const STAGES = [
  { id: "input", label: "Readable request" },
  { id: "rbac", label: "Tool allowed" },
  { id: "schema", label: "Inputs match" },
  { id: "approval", label: "No approval needed" },
  { id: "loop", label: "Not stuck in a loop" },
  { id: "rate", label: "Not too fast" },
  { id: "quota", label: "Within free calls" },
];

export const LOAD_EVENT = "accord:load";
export function loadIntoConverter(input: string) {
  window.dispatchEvent(new CustomEvent(LOAD_EVENT, { detail: input }));
  document.getElementById("converter")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
export function highlightJson(json: string) {
  return escapeHtml(json).replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (m, str, colon, lit) =>
      str
        ? `<span class="${colon ? "j-key" : "j-str"}">${str}</span>${colon ?? ""}`
        : lit
          ? `<span class="j-lit">${m}</span>`
          : `<span class="j-num">${m}</span>`,
  );
}
function Code({ value, className = "" }: { value: string; className?: string }) {
  return <pre className={`cv-code ${className}`} dangerouslySetInnerHTML={{ __html: highlightJson(value) }} />;
}

function pickTool(text: string, tools: ManifestTool[]) {
  const words = new Set(text.toLowerCase().match(/[a-z]{3,}/g) ?? []);
  let best: ManifestTool | undefined;
  let score = 0;
  for (const t of tools) {
    const parts = `${t.name} ${t.title}`.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2);
    const s = parts.filter((p) => words.has(p) || words.has(`${p}s`) || words.has(p.replace(/s$/, ""))).length;
    if (s > score) [best, score] = [t, s];
  }
  return best;
}

function describe(t: ManifestTool, policy: GatewayPolicy, visible: Set<string>) {
  if (!visible.has(t.name)) return "Hidden from the agent by policy. It cannot even see this tool.";
  if (policy.requireApproval.some((p) => matches(p, t.name) || matches(p, t.path)))
    return "Changes data. Waits for a person to approve.";
  if (t.annotations.readOnlyHint) return "Reads data. Runs on its own.";
  return "Changes data. Every call is checked and recorded.";
}

type Turn = {
  id: number;
  ask: string;
  tool: ManifestTool;
  args: Record<string, unknown>;
  out: CallResult;
  request?: ReturnType<typeof buildRequest>;
};
type Gateway = { state: "idle" | "creating" } | { state: "ready"; id: string; url: string } | { state: "error"; error: string };

export default function Converter({ initial }: { initial?: string }) {
  const [input, setInput] = useState(initial ?? quickSamples[1].input);
  const deferred = useDeferredValue(input);
  const result = useMemo(() => convert(deferred), [deferred]);
  const tools = useMemo(() => (result.ok ? result.manifest.tools : []), [result]);
  const policy = useMemo(
    () => (result.ok ? defaultGatewayPolicy(result.manifest, templateFor(deferred)?.policy) : null),
    [result, deferred],
  );
  const visible = useMemo(
    () => new Set(result.ok && policy ? visibleTools(result.manifest, policy, "agent").map((t) => t.name) : []),
    [result, policy],
  );
  const signature = deferred;
  const latestInput = useRef(input);
  latestInput.current = input;
  const [selected, setSelected] = useState(0);
  const tool = tools[Math.min(selected, Math.max(0, tools.length - 1))];
  const [view, setView] = useState<"tools" | "json">("tools");
  const [testing, setTesting] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("Run it");
  const [argsText, setArgsText] = useState("{}");
  const [argsError, setArgsError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [gateway, setGateway] = useState<Gateway>({ state: "idle" });
  const store = useRef(memoryStore());
  const log = useRef<HTMLDivElement>(null);
  const turnId = useRef(0);

  useEffect(() => {
    const onLoad = (e: Event) => setInput((e as CustomEvent<string>).detail);
    window.addEventListener(LOAD_EVENT, onLoad);
    return () => window.removeEventListener(LOAD_EVENT, onLoad);
  }, []);
  useEffect(() => {
    setSelected(0);
    setTurns([]);
    store.current = memoryStore();
    setGateway({ state: "idle" });
  }, [signature]);
  useEffect(() => {
    if (tool) setArgsText(JSON.stringify(exampleArgs(tool), null, 2));
    setArgsError("");
  }, [tool, signature]);
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  const listJson = useMemo(
    () =>
      JSON.stringify(
        {
          jsonrpc: "2.0",
          id: 1,
          result: {
            tools: tools
              .filter((t) => visible.has(t.name))
              .map((t) => ({
                name: t.name,
                title: t.title,
                description: t.description,
                inputSchema: t.inputSchema,
                annotations: t.annotations,
              })),
          },
        },
        null,
        2,
      ),
    [tools, visible],
  );

  async function readFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 1_000_000) return setInput("# This file is over 1 MB. Trim the spec and try again.");
    setInput(await file.text());
  }
  async function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    await readFile(e.dataTransfer.files?.[0]);
  }

  async function run(ask: string) {
    if (!result.ok || !tool || !policy) return;
    let args: Record<string, unknown>;
    try {
      const parsed = JSON.parse(argsText || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      args = parsed;
      setArgsError("");
    } catch {
      setArgsError("These inputs are not valid JSON. Fix them and send again.");
      return;
    }
    const target = pickTool(ask, tools) ?? tool;
    const callArgs = target === tool ? args : exampleArgs(target);
    const out = await runCall(store.current, {
      gateway: "browser",
      manifest: result.manifest,
      policy,
      role: "agent",
      toolName: target.name,
      args: callArgs,
      execute: async (t, a) => mockResponse(t, a),
    });
    const request = out.decision.effect === "allow" ? buildRequest(result.manifest, target, callArgs) : undefined;
    setTurns((prev) => [...prev.slice(-7), { id: ++turnId.current, ask, tool: target, args: callArgs, out, request }]);
  }

  async function createGateway() {
    const submittedInput = input;
    setGateway({ state: "creating" });
    try {
      const res = await fetch("/api/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "The gateway could not be created. Try again.");
      const name = result.ok ? result.manifest.name : "API";
      rememberGateway({ id: data.id, name, url: data.url, createdAt: new Date().toISOString() });
      if (latestInput.current === submittedInput) setGateway({ state: "ready", id: data.id, url: data.url });
    } catch (e) {
      setGateway({ state: "error", error: e instanceof Error ? e.message : "Something went wrong." });
    }
  }

  return (
    <div className="cv">
      <div className="cv-grid">
        <div
          className={`cv-pane cv-input ${dragging ? "dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className="cv-head">
            <span className="cv-step">1</span>
            <label htmlFor="cv-source" className="cv-label">
              Paste an API call or spec
            </label>
            <label className="cv-file">
              <FileUp size={15} /> Upload
              <input type="file" accept=".json,.yaml,.yml,.txt,.sh" onChange={(e) => readFile(e.target.files?.[0])} />
            </label>
          </div>
          <textarea
            id="cv-source"
            value={input}
            spellCheck={false}
            onChange={(e) => setInput(e.target.value)}
            placeholder="curl https://api.example.com/v1/orders -H 'Authorization: Bearer ...'"
          />
          <div className="cv-samples" aria-label="Examples">
            <span>Try</span>
            {quickSamples.map((s) => (
              <button key={s.label} type="button" onClick={() => setInput(s.input)}>
                {s.label}
              </button>
            ))}
            <button type="button" onClick={() => setInput("")}>
              Clear
            </button>
          </div>
        </div>

        <div className="cv-pane cv-output" aria-live="polite">
          <div className="cv-head">
            <span className="cv-step">2</span>
            <span className="cv-label">
              {result.ok
                ? `${tools.length} AI ${tools.length === 1 ? "tool" : "tools"} from ${SOURCE[result.source]}`
                : "Your AI tools appear here"}
            </span>
            {result.ok && (
              <div className="cv-switch" role="tablist" aria-label="Output view">
                <button type="button" role="tab" aria-selected={view === "tools"} onClick={() => setView("tools")}>
                  Tools
                </button>
                <button type="button" role="tab" aria-selected={view === "json"} onClick={() => setView("json")}>
                  MCP JSON
                </button>
              </div>
            )}
          </div>
          {!result.ok || !policy ? (
            <p className="cv-empty">
              {input.trim() ? (result.ok ? "" : result.error) : "Paste a cURL command, an OpenAPI or Swagger file, or a Postman collection."}
            </p>
          ) : view === "json" ? (
            <div className="cv-json">
              <CopyButton text={listJson} label="Copy JSON" />
              <Code value={listJson} />
            </div>
          ) : (
            <div className="cv-tools">
              {result.warnings.map((w) => (
                <p className="cv-note" key={w}>
                  <KeyRound size={15} /> {w}
                </p>
              ))}
              {result.manifest.auth.type !== "none" && (
                <p className="cv-note">
                  <KeyRound size={15} /> Your key stays out of the tool. You add it once as a secret when you deploy.
                </p>
              )}
              <ul>
                {tools.map((t, i) => (
                  <li key={t.name}>
                    <button
                      type="button"
                      className={`${i === selected ? "selected" : ""} ${visible.has(t.name) ? "" : "hidden-tool"}`}
                      onClick={() => setSelected(i)}
                    >
                      <span className="cv-method" data-method={t.method}>
                        {t.method}
                      </span>
                      <span className="cv-tool-name">{t.name}</span>
                      <span className="cv-tool-desc">{describe(t, policy, visible)}</span>
                    </button>
                  </li>
                ))}
              </ul>

            </div>
          )}
          {result.ok && (
            <div className="cv-actions">
              <BeamBorder size="line" colorVariant="mono" theme="dark" active={!testing} borderRadius={10} className="cv-beam">
                <button type="button" className="btn btn-light" onClick={() => { setTesting(true); requestAnimationFrame(() => document.querySelector(".cv-playground")?.scrollIntoView({ behavior: "smooth", block: "center" })); }}>
                  <Play size={16} /> Test this tool
                </button>
              </BeamBorder>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={createGateway}
                disabled={gateway.state === "creating" || input !== deferred}
              >
                {gateway.state === "creating" ? <Loader2 size={16} className="spin" /> : <ArrowUpRight size={16} />}
                Create sandbox URL
              </button>
              <button type="button" className="link" onClick={() => result.ok && downloadJson(result.manifest, "tools.json")}>Download manifest</button>
            </div>
          )}
        </div>
      </div>

      {gateway.state === "ready" && (
        <div className="cv-live">
          <h3>Your sandbox is live. It returns sample data.</h3>
          <LiveGateway id={gateway.id} url={gateway.url} />
        </div>
      )}
      {gateway.state === "error" && (
        <p className="cv-error" role="alert">
          <CircleSlash size={16} /> {gateway.error}
        </p>
      )}

      {testing && result.ok && tool && (
        <div className="cv-playground" role="region" aria-label="Sandbox chat">
          <div className="cv-head">
            <span className="cv-step">3</span>
            <span className="cv-label">Sandbox chat. Nothing real is called.</span>
            <button
              type="button"
              className="cv-icon"
              onClick={() => {
                setTurns([]);
                store.current = memoryStore();
              }}
              aria-label="Reset the sandbox"
            >
              <RotateCcw size={15} />
            </button>
            <button type="button" className="cv-icon" onClick={() => setTesting(false)} aria-label="Close the sandbox">
              <X size={16} />
            </button>
          </div>
          <div className="cv-play-grid">
            <div className="cv-args">
              <label htmlFor="cv-tool">Tool</label>
              <select id="cv-tool" value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
                {tools.map((t, i) => (
                  <option key={t.name} value={i}>
                    {t.name}
                  </option>
                ))}
              </select>
              <label htmlFor="cv-args">Inputs the AI will send</label>
              <textarea id="cv-args" value={argsText} spellCheck={false} onChange={(e) => setArgsText(e.target.value)} />
              {argsError && <p className="cv-error">{argsError}</p>}
              <p className="cv-hint">Tip: send the same thing six times to watch the loop breaker stop it.</p>
            </div>
            <div className="cv-chat">
              <div className="cv-log" ref={log}>
                {!turns.length && (
                  <p className="cv-empty">
                    Type what you would ask your AI, like “run it”, and press Send.
                  </p>
                )}
                {turns.map((t) => {
                  const failAt = STAGES.findIndex((s) => t.out.decision.rule.startsWith(`${s.id}.`));
                  const allowed = t.out.decision.effect === "allow";
                  const saved = savings(t.out.receipt);
                  return (
                    <div className="cv-turn" key={t.id}>
                      <p className="cv-bubble you">{t.ask}</p>
                      <div className="cv-bubble ai">
                        <p>
                          Calling <strong>{t.tool.name}</strong>
                        </p>
                        <Code
                          value={JSON.stringify(
                            { jsonrpc: "2.0", method: "tools/call", params: { name: t.tool.name, arguments: t.args } },
                            null,
                            2,
                          )}
                        />
                      </div>
                      <div className={`cv-bubble accord ${t.out.decision.effect}`}>
                        <p className="cv-verdict">
                          {allowed ? <Check size={16} /> : <CircleSlash size={16} />}
                          {allowed
                            ? t.out.receipt.cached
                              ? "Allowed. Served from cache, so your API was not called again."
                              : "Allowed. Here is what came back."
                            : t.out.decision.reason}
                        </p>
                        <ol className="cv-stages">
                          {STAGES.map((s, i) => {
                            const state = failAt === -1 || i < failAt ? "pass" : i === failAt ? "stop" : "skip";
                            return (
                              <li key={s.id} className={state}>
                                {state === "pass" ? <Check size={13} /> : state === "stop" ? <X size={13} /> : <Minus size={13} />}
                                {s.label}
                              </li>
                            );
                          })}
                        </ol>
                        {allowed && (saved || t.out.receipt.redacted > 0) && (
                          <p className="cv-savings">
                            {saved ? `Trimmed before the model saw it: ${saved}.` : ""}
                            {t.out.receipt.redacted ? ` ${t.out.receipt.redacted} private fields removed.` : ""}
                          </p>
                        )}
                        {allowed && t.out.result !== undefined && (
                          <details open>
                            <summary>Sample response the agent receives</summary>
                            <Code value={JSON.stringify(t.out.result, null, 2)} className="short" />
                          </details>
                        )}
                        {t.request && (
                          <details>
                            <summary>What a deployed server would send to the API</summary>
                            <Code value={JSON.stringify(t.request, null, 2)} className="short" />
                          </details>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                className="cv-send"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(draft.trim() || "Run it");
                }}
              >
                <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Message to your AI" />
                <button type="submit" className="btn btn-light">
                  <Send size={16} /> Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
