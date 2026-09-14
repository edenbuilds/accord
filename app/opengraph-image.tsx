import { ImageResponse } from "next/og";

export const alt = "Accord: connect your AI to any API, safely";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MARK =
  "M35 0H66L100 72L88 92C80 90 72 86 60 86C48 86 38 95 22 99L0 72ZM50 13L16 78C30 74 42 66 55 67C68 68 77 73 85 76Z";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#111a14",
          color: "#eef2e8",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40, fontWeight: 600 }}>
          <svg width="52" height="52" viewBox="0 0 100 100">
            <path fill="#eef2e8" fillRule="evenodd" d={MARK} />
          </svg>
          accord
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Connect your AI to any API.</div>
          <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, color: "#c9b8f2" }}>Safely.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#a9b5a3" }}>
          <span>cURL or OpenAPI in. Checked MCP tools out.</span>
          <span style={{ color: "#dcf49a" }}>mcp.edenbuilds.me</span>
        </div>
      </div>
    ),
    size,
  );
}
