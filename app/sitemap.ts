export default function sitemap() {
  return ["", "/docs", "/roadmap", "/workbench"].map((path) => ({
    url: `https://mcp.edenbuilds.me${path}`,
  }));
}
