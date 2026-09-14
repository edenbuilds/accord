# Accord MCP server template

Your converted tools, running as your own MCP server. It calls your real API with your key. The key stays on the server, so the agent never sees it.

## Settings

| Variable | What it is |
| --- | --- |
| `ACCORD_MANIFEST_URL` | Your gateway's manifest URL from mcp.edenbuilds.me, or leave empty and add `tools.json` |
| `API_BASE_URL` | Optional. Overrides the API base URL in the manifest |
| `API_TOKEN` | Your API key. For basic auth, use `user:password` |
| `MCP_BEARER_TOKEN` | The token your agent sends. 24 characters or more. Required |
| `ALLOW_WRITES` | `true` to expose tools that change data. Off by default |

## Run it

- **Vercel:** use the Deploy button on mcp.edenbuilds.me. Your URL is `https://<project>.vercel.app/mcp`.
- **Docker:** `curl -sL https://mcp.edenbuilds.me/docker | bash -s -- YOUR_GATEWAY_ID`
- **Node:** `npm install && node server.mjs`, then use `http://localhost:8787/mcp`.
- **Railway:** new project from your fork of this repo, root directory `templates/mcp-server`, add the variables above.

Connect Claude Code:

```sh
claude mcp add --transport http my-api https://your-server/mcp --header "Authorization: Bearer $MCP_BEARER_TOKEN"
```

This template does not include Accord's hosted checks (loop breaker, approvals, redaction). Those run on the Accord gateway.
