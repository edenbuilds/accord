export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/mcp" },
    sitemap: "https://mcp.edenbuilds.me/sitemap.xml",
  };
}
