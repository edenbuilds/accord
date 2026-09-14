// Installer for the self-hosted MCP server:
//   curl -sL https://mcp.edenbuilds.me/docker | bash -s -- YOUR_GATEWAY_ID
// Read it before you run it; it is short on purpose.
const SCRIPT = `#!/usr/bin/env bash
# Accord self-hosted MCP server installer. Source: https://github.com/edenbuilds/accord
set -euo pipefail
ID="\${1:-}"
if [ -z "$ID" ]; then echo "Usage: curl -sL __ORIGIN__/docker | bash -s -- YOUR_GATEWAY_ID"; exit 1; fi
case "$ID" in *[!A-Za-z0-9_-]*) echo "That gateway id does not look right."; exit 1;; esac
command -v docker >/dev/null || { echo "Docker is required: https://docs.docker.com/get-docker/"; exit 1; }
command -v git >/dev/null || { echo "git is required."; exit 1; }
NAME="accord-mcp-$(printf '%s' "$ID" | tr 'A-Z_' 'a-z-')"
echo "Downloading the template into ./$NAME"
git clone --quiet --depth 1 --filter=blob:none --sparse https://github.com/edenbuilds/accord "$NAME"
cd "$NAME"
git sparse-checkout set templates/mcp-server
cd templates/mcp-server
TOKEN="$(openssl rand -hex 24 2>/dev/null || head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \\n')"
API_TOKEN=""
if [ -r /dev/tty ]; then
  printf "Your API key (input hidden, press Enter to skip): " >/dev/tty
  read -rs API_TOKEN </dev/tty || true
  printf "\\n" >/dev/tty
fi
umask 077
cat > .env <<EOF
ACCORD_MANIFEST_URL=__ORIGIN__/api/gateways/$ID?view=manifest
API_TOKEN=$API_TOKEN
MCP_BEARER_TOKEN=$TOKEN
ALLOW_WRITES=false
EOF
docker build --quiet -t "$NAME" . >/dev/null
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -p 8787:8787 --env-file .env --restart unless-stopped "$NAME" >/dev/null
echo ""
echo "Your MCP server is running at http://localhost:8787/mcp"
echo "Connect Claude Code:"
echo "  claude mcp add --transport http accord http://localhost:8787/mcp --header \\"Authorization: Bearer $TOKEN\\""
echo "The token is saved in $(pwd)/.env. Write tools stay off until you set ALLOW_WRITES=true."
`;

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return new Response(SCRIPT.replaceAll("__ORIGIN__", origin), {
    headers: { "Content-Type": "text/x-shellscript; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
