"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Braces, Layers, BookOpen, Plus } from "lucide-react";
import Converter from "./converter";
import { MyGateways } from "./live-gateway";
import { BrandIcon } from "./brand-icon";
import { useCases } from "@/lib/use-cases";

export default function AppWorkspace({ initial }: { initial?: string }) {
  const [view, setView] = useState("build");
  const [source, setSource] = useState(initial);
  const [revision, setRevision] = useState(0);
  function choose(input?: string) { setSource(input); setRevision(v => v + 1); setView("build"); }
  return <div className="workspace">
    <aside className="workspace-nav">
      <span className="workspace-word">WORKSPACE</span>
      <button className={view === "build" ? "active" : ""} onClick={() => setView("build")}><Braces size={17}/>Build a server</button>
      <button className={view === "gateways" ? "active" : ""} onClick={() => setView("gateways")}><Layers size={17}/>Your sandboxes</button>
      <Link href="/docs"><BookOpen size={17}/>Developer docs</Link>
      <div className="workspace-templates"><p>Start with an example</p>{useCases.map(u => <button key={u.slug} onClick={() => choose(u.input)}><BrandIcon name={u.brands[0]} size={17}/>{u.label}</button>)}</div>
      <div className="workspace-note">Your API stays untouched while you test. Sandbox calls use sample data.</div>
    </aside>
    <section className="workspace-body">
      <div className="workspace-heading"><div><p className="kicker">{view === "build" ? "From API to AI" : "Saved on this device"}</p><h1>{view === "build" ? "Give your AI a new tool." : "Your sandbox servers."}</h1><p>{view === "build" ? "Paste a request, inspect the tool, then try it with your agent." : "Reopen a server to test tools and inspect recent calls."}</p></div><button className="btn btn-ghost" onClick={() => choose("")}><Plus size={16}/>New server</button></div>
      <div hidden={view !== "build"}><label className="workspace-mobile-template">Start with an example<select aria-label="Example template" value="" onChange={e => choose(useCases.find(u => u.slug === e.target.value)?.input)}><option value="">Choose a template</option>{useCases.map(u => <option key={u.slug} value={u.slug}>{u.label}</option>)}</select></label><div id="converter"><Converter key={revision} initial={source}/></div><div className="workspace-next"><div><h2>Ready to use real data?</h2><p>Download your manifest and run the server with your own API key.</p></div><Link className="link" href="/docs#quickstart">Deployment guide <ArrowUpRight size={16}/></Link></div></div>{view === "gateways" && <MyGateways showEmpty onCreate={() => setView("build")} />}
    </section>
  </div>;
}
