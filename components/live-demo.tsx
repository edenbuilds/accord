"use client";
import { useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useCases } from "@/lib/use-cases";
import { BrandIcon } from "./brand-icon";
import LiveGateway, { rememberGateway } from "./live-gateway";

type State =
  | { status: "idle" | "creating" }
  | { status: "ready"; id: string; url: string }
  | { status: "error"; error: string };

export default function LiveDemo({ initial = useCases[0].slug }: { initial?: string }) {
  const [pick, setPick] = useState(initial);
  const [state, setState] = useState<State>({ status: "idle" });
  const uc = useCases.find((u) => u.slug === pick) ?? useCases[0];

  async function create() {
    setState({ status: "creating" });
    try {
      const res = await fetch("/api/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: uc.input }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "The sandbox could not be created. Try again.");
      rememberGateway({ id: data.id, name: `${uc.label} sandbox`, url: data.url, createdAt: new Date().toISOString() });
      setState({ status: "ready", id: data.id, url: data.url });
    } catch (e) {
      setState({ status: "error", error: e instanceof Error ? e.message : "Something went wrong." });
    }
  }

  if (state.status === "ready")
    return (
      <div className="live-card">
        <div className="lg-feed-head">
          <strong>{uc.label} sandbox is live</strong>
          <button type="button" className="link" onClick={() => setState({ status: "idle" })}>
            Start over
          </button>
        </div>
        <LiveGateway id={state.id} url={state.url} ask={uc.ask} />
      </div>
    );

  return (
    <div className="live-card">
      <p className="lg-help">Pick what your agent should do.</p>
      <div className="live-templates" role="group" aria-label="Sandbox template">
        {useCases.map((u) => (
          <button key={u.slug} type="button" aria-pressed={pick === u.slug} onClick={() => setPick(u.slug)}>
            {u.brands.map((b) => (
              <BrandIcon key={b} name={b} size={16} />
            ))}
            {u.label}
          </button>
        ))}
      </div>
      <p className="lg-help">
        <strong style={{ color: "var(--on-dark)", fontWeight: 500 }}>{uc.guardTitle}.</strong> {uc.guard}
      </p>
      <div>
        <button type="button" className="btn btn-light btn-lg" onClick={create} disabled={state.status === "creating"}>
          {state.status === "creating" ? <Loader2 size={18} className="spin" /> : <ArrowUpRight size={18} />}
          Create my sandbox URL
        </button>
      </div>
      <p className="lg-help">No signup. Free for 1,000 calls. Responses are sample data.</p>
      {state.status === "error" && (
        <p className="cv-error" role="alert">
          {state.error}
        </p>
      )}
    </div>
  );
}
