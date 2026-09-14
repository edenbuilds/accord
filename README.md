# Accord

**Give agents access. Keep control.**

An MCP gateway and control-plane developer preview by Eden Builds.

- [Live site](https://mcp.edenbuilds.me)
- [Policy workbench](https://mcp.edenbuilds.me/workbench)
- [Documentation](https://mcp.edenbuilds.me/docs)
- [Product strategy](docs/STRATEGY.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Continuation handoff](HANDOFF.md)

## Available

Animated marketing site; local policy simulator using a shared deterministic engine; JSON payload projection and exports; session receipts; public read-only MCP tools; a configurable loopback gateway with scoped tool visibility, bearer authentication, process-local budgets, circuit breaking, schema validation, and metadata logs.

## Run

Node.js 22+.

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

Public MCP endpoint: `https://mcp.edenbuilds.me/mcp`. Tools: `accord_describe`, `accord_evaluate`. No upstream business systems are connected to this endpoint.

## Local gateway

```sh
export ACCORD_GATEWAY_TOKEN="$(openssl rand -hex 32)"
npm run gateway
```

Configure your MCP client for `http://127.0.0.1:4318/mcp` with its secure bearer-header configuration. The default `gateway/example.json` forwards to the public read-only preview. Override `ACCORD_CONFIG` for another configuration file. Upstream credentials are environment references via `tokenEnv`; do not commit credentials. Policies use namespaced exact tool names.

## Boundaries

The public site is a developer preview, not a hosted enterprise service. Hosted tenancy, durable quotas, OAuth brokering, billing, persistent approvals/audit export, semantic caching, fleet management, and compliance assurance are planned. The local gateway is single-process, loopback-only, and designed for trusted evaluation upstreams. Its counters reset on restart. Workbench samples are fictional and labeled. No model is called.

See [security](SECURITY.md) and the full [strategy](docs/STRATEGY.md) before extending the gateway.
