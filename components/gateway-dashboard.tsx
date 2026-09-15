"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import LiveGateway, { formatIST, ruleLabel, savings, useGatewayStatus } from "./live-gateway";
import { CopyButton, downloadJson } from "./ui";
import { BrandIcon } from "./brand-icon";
import { VERCEL_DEPLOY } from "./landing";

export default function GatewayDashboard({ id }: { id: string }) {
  const { data, error, missing, reload } = useGatewayStatus(id);
  const [origin, setOrigin] = useState("https://mcp.edenbuilds.me");
  useEffect(() => setOrigin(location.origin), []);
  const url = `${origin}/g/${id}/mcp`;
  const manifestUrl = `${origin}/api/gateways/${id}?view=manifest`;

  if (missing)
    return (
      <div className="intro">
        <p className="kicker">Gateway</p>
        <h1 className="title">This gateway does not exist or has expired.</h1>
        <p className="lede">Sandbox gateways last 30 days. Creating a new one takes a single click.</p>
        <div className="hero2-actions">
          <Link href="/#live" className="btn btn-light btn-lg">
            Create a new sandbox <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    );

  return (
    <>
      <div className="intro">
        <p className="kicker">Sandbox gateway</p>
        <h1 className="title">{data?.name ?? "Loading your gateway"}</h1>
        <p className="lede">
          {data
            ? `Created ${formatIST(data.createdAt, false)}. Calls return sample data and pass every check. Nothing reaches ${data.baseUrl}.`
            : error || "Fetching the latest calls."}
        </p>
        {data && (
          <div className="gw-stat">
            <div>
              <strong>{data.calls.toLocaleString("en-IN")}</strong>
              <span>of {data.limit.toLocaleString("en-IN")} free calls used</span>
            </div>
            <div>
              <strong>{data.tools.filter((t) => t.visible).length}</strong>
              <span>tools your agent can see</span>
            </div>
            <div>
              <strong>{data.receipts.filter((r) => r.effect !== "allow").length}</strong>
              <span>stopped or held in recent receipts</span>
            </div>
          </div>
        )}
      </div>

      <div className="gw">
        <div className="gw-panel">
          <h2>Connect your agent</h2>
          <LiveGateway id={id} url={url} status={data} onReload={reload} showPageLink={false} />
        </div>
        <div style={{ display: "grid", gap: 20 }}>
          <div className="gw-panel">
            <h2>Tools</h2>
            <ul className="gw-tools">
              {data?.tools.map((t) => (
                <li key={t.name}>
                  <span className="cv-method" data-method={t.method}>
                    {t.method}
                  </span>
                  <code className="cv-tool-name">{t.name}</code>
                  <small>
                    {!t.visible
                      ? "Hidden from the agent by policy."
                      : t.needsApproval
                        ? "Held until a person approves."
                        : "Runs after the checks pass."}
                  </small>
                </li>
              ))}
            </ul>
          </div>
          {data && (
            <div className="gw-panel">
              <h2>Rules on this gateway</h2>
              <ul className="gw-rules">
                <li>
                  Stops a call repeated {data.policy.loop.maxRepeats} times within {data.policy.loop.windowSeconds} seconds.
                </li>
                <li>
                  Allows bursts of {data.policy.rate.capacity} calls, then {data.policy.rate.refillPerMinute} a minute.
                </li>
                <li>Caches repeat reads for {data.policy.cacheSeconds} seconds.</li>
                <li>Removes these fields from responses: {data.policy.strip.join(", ")}.</li>
                {data.policy.redact.length > 0 && <li>Replaces private fields: {data.policy.redact.join(", ")}.</li>}
                <li>Roles: {data.roles.join(", ")}. Add ?role=viewer to the URL for read-only access.</li>
              </ul>
            </div>
          )}
          <div className="gw-panel">
            <h2>Run it on your own server</h2>
            <p className="lg-help">Your own server calls your real API with your key. The agent never sees the key.</p>
            <div className="lg-snippet">
              <pre>{manifestUrl}</pre>
              <CopyButton text={manifestUrl} label="Copy" />
            </div>
            <div className="lg-row">
              <a className="btn btn-light" href={VERCEL_DEPLOY} target="_blank" rel="noopener noreferrer">
                <BrandIcon name="vercel" size={16} mono /> Deploy to Vercel
              </a>
              <Link className="link" href="/docs#quickstart">
                Docker and Railway steps <ArrowUpRight size={15} />
              </Link>
            </div>
            <code className="code-line">curl -sL {origin}/docker | bash -s -- {id}</code>
          </div>
        </div>
      </div>

      {data && data.receipts.length > 0 && (
        <div className="gw-panel" style={{ marginTop: 20 }}>
          <div className="lg-row"><h2>Recent receipts</h2><button className="btn btn-ghost" type="button" onClick={() => downloadJson(data.receipts, `accord-${id}-receipts.json`)}>Export receipts</button></div>
          <div className="table-wrap">
            <table className="rtable">
              <thead>
                <tr>
                  <th>Time (IST)</th>
                  <th>Tool</th>
                  <th>Decision</th>
                  <th>Time taken</th>
                  <th>Response</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {data.receipts.map((r) => (
                  <tr key={r.id}>
                    <td>{formatIST(r.time)}</td>
                    <td>
                      <code>{r.tool}</code>
                    </td>
                    <td>
                      {ruleLabel(r.rule)}
                      {r.cached ? ", from cache" : ""}
                    </td>
                    <td>{r.latencyMs} ms</td>
                    <td>
                      {savings(r) || "No response"}
                      {r.redacted ? `, ${r.redacted} fields removed` : ""}
                    </td>
                    <td>
                      <details><summary>Inspect receipt</summary><pre className="receipt-json">{JSON.stringify(r, null, 2)}</pre></details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
