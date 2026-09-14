"use client";
import { useState, type FormEvent } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import DottedGrid from "./effects/dotted-grid";

export default function WaitlistForm({ plan, from }: { plan?: string; from?: string }) {
  const [state, setState] = useState<{ status: "idle" | "sending" | "ok" | "error"; message?: string }>({ status: "idle" });

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const note = String(form.get("useCase") ?? "");
    setState({ status: "sending" });
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          name: form.get("name"),
          company: form.get("company"),
          useCase: [plan && `Plan: ${plan}`, from && `Gateway: ${from}`, note].filter(Boolean).join(" | ").slice(0, 500),
          website: form.get("website"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Try again.");
      setState({ status: "ok", message: data.message });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  return (
    <section className="wl">
      <div className="wl-bg" aria-hidden="true">
        <DottedGrid backgroundColor="#111a14" spacing={26} showDesktopHint={false} />
      </div>
      <div className="wl-card">
        <p className="kicker">Waitlist</p>
        <h1 className="title">
          Keep your gateway.
          <br />
          <span className="soft">Connect your real&nbsp;API.</span>
        </h1>
        <p className="lede">
          Free accounts are coming: gateways that do not expire, your real API behind every check, and a full audit log.
          Get in&nbsp;first.
        </p>
        {state.status === "ok" ? (
          <p className="form-msg ok" role="status" style={{ marginTop: 24 }}>
            {state.message}
          </p>
        ) : (
          <form className="form" onSubmit={submit}>
            <label>
              Work email
              <input name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
            </label>
            <label>
              Name (optional)
              <input name="name" autoComplete="name" maxLength={80} />
            </label>
            <label>
              Company (optional)
              <input name="company" autoComplete="organization" maxLength={120} />
            </label>
            <label>
              What would you connect first? (optional)
              <textarea name="useCase" maxLength={400} placeholder="For example: our support desk and Stripe" />
            </label>
            <label className="hp" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <button type="submit" className="btn btn-light btn-lg" disabled={state.status === "sending"}>
              {state.status === "sending" ? <Loader2 size={18} className="spin" /> : <ArrowUpRight size={18} />}
              Join the waitlist
            </button>
            {state.status === "error" && (
              <p className="form-msg err" role="alert">
                {state.message}
              </p>
            )}
            <p className="lg-help">We will only email you about your spot. See our privacy policy.</p>
          </form>
        )}
      </div>
    </section>
  );
}
