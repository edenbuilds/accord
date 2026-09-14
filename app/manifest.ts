import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Accord",
    short_name: "Accord",
    description: "Connect your AI to any API, safely. cURL or OpenAPI in, checked MCP tools out.",
    start_url: "/",
    display: "standalone",
    background_color: "#111a14",
    theme_color: "#111a14",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
