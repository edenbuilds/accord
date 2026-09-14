import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1b2a20" }}>
        <svg width="104" height="104" viewBox="0 0 100 100">
          <path
            fill="#eef2e8"
            fillRule="evenodd"
            d="M35 0H66L100 72L88 92C80 90 72 86 60 86C48 86 38 95 22 99L0 72ZM50 13L16 78C30 74 42 66 55 67C68 68 77 73 85 76Z"
          />
        </svg>
      </div>
    ),
    size,
  );
}
