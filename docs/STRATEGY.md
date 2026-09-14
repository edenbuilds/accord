# Accord: Enterprise MCP Gateway & Control Plane

Strategy baseline, 14-09-2026. Founder: Eden Builds. Working brand: Accord. Domain: https://mcp.edenbuilds.me. This is a product thesis with validation gates, not a forecast or claim of enterprise readiness. Branding clearance and trademark research remain a commercial-launch task.

## 1. The expanded vision

**Make every consequential agent action accountable across any execution environment.** The initial gateway is the insertion point. The eventual product is the common contract connecting identity, permission, execution, and evidence.

Positioning: “Give agents access. Keep control.” Category: MCP gateway and control plane. Buyer promise: “Know why an agent could act, bound what it can do, and prove what happened.” A developer should first experience a clear blocked action, not a sales call or a configuration maze.

### Correct the founding assumptions

- MCP does not ignore security: its authorization specification addresses resource servers, audience validation, and separate upstream access tokens. The gap is operating consistent governance across heterogeneous systems, not inventing authorization. [MCP authorization](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization).
- Basic governance is already competitive. Kong documents MCP aggregation and governance, and IBM ContextForge provides a gateway/registry foundation. “One endpoint plus RBAC” is a category entry requirement, not a moat. [Kong MCP servers](https://developer.konghq.com/ai-gateway/entities/ai-mcp-server/), [ContextForge](https://github.com/IBM/mcp-context-forge).
- Free alternatives pressure a generic proxy business. Cloudflare lists core AI Gateway functionality as free, although that is not feature-for-feature MCP equivalence. Charge for operational accountability and managed fleets. [Cloudflare pricing](https://developers.cloudflare.com/ai-gateway/reference/pricing/).
- A gateway only controls traffic that passes through it. A rogue agent with independent credentials or unrestricted egress can bypass it. Managed credentials and customer network policy are prerequisites for a credible enforced boundary.
- An allowlisted tool can still do something harmful with permitted arguments. Rate limits constrain volume, not correctness. Argument policies and application authorization matter.
- Do not promise 80–90% margins before measuring all delivery costs. A lightweight proxy can still carry large egress, logging, support, and compliance bills.

### Initial wedge

Serve seed-to-Series-B software teams deploying engineering/operations agents to shared SaaS systems. Champion: platform engineer or AI lead. Initial economic buyer: CTO; security buyer joins as exposure grows. Start with one proof workflow: inspect an engineering issue, propose a change, require approval for the write, and retain the decision lineage. The baseline uses harmless fixtures and read-only MCP tools; private beta adds a real design-partner issue tracker.

Do not compete on “50+ native integrations.” Federate remote MCP servers; support three golden integrations deeply. Every other connection carries a compatibility label and a test result. Avoid ownership of SaaS API churn wherever a maintained upstream server exists.

### The three-to-five-year trajectory

| Horizon | Deliverable | Commercial checkpoint | Solo founder operating rule |
|---|---|---|---|
| First 4–6 weeks | Public evaluator, local gateway, reproducible security cases, clear docs | 10 teams route evaluation traffic; first-call setup median under 10 minutes | One runtime, one hosting region, no private Slack for every free user |
| Months 2–6 | Hosted workspaces, durable budgets, scoped credentials, real decision history | 5 paid design partners; repeated weekly usage; support under 30 minutes per account/week | Automate connection diagnostics before adding connectors |
| Months 6–12 | Exact-action approvals, schema-drift review, billing, SIEM export | Paid cohorts retain; support and telemetry fit plan economics | Add only features that unblock repeated deals or prevent incidents |
| Year 2 | Customer-owned runtime, signed policy bundles, replay test packs | Repeatable annual contracts and first independent runtime integration | One supported private deployment target; partner-led installation |
| Years 3–5 | Portable action/receipt contract, independent verifier, cross-gateway federation | External implementations pass conformance; organizations pay for fleet operation | Ecosystem carries adapters; a small specialist team becomes optional, not a prerequisite for each new customer |

These are gates, not promised dates. One founder can build the product and distribution architecture. A multi-region enterprise SLA, incident response, audits, and complex procurement eventually require paid specialists or partners. Refusing every form of operational help is not leverage.

### A billion-dollar footprint without a billion-dollar support burden

Aim for a widely embedded open contract and verifier, not exclusive ownership of every request. Developers adopt a small policy runtime freely; organizations buy policy distribution, credential lifecycle, evidence retention/delivery, drift management, and support. The strategy works only if independent users can verify claims without trusting Accord’s dashboard.

Proposed north-star metric: weekly active organizations with verified governed actions in production. Supporting metrics: first governed call time, four-week organization retention, actions with complete receipts, false-positive denial rate, approval completion time, gateway-added p95 latency, support minutes/account, and gross contribution/account. Do not use aggregate API calls as the sole success metric; retry loops can inflate them.

A billion-dollar valuation cannot be engineered from features. As simple valuation arithmetic, a $1B outcome at 10–20× recurring revenue would require roughly $50–100M ARR; the multiple itself is not a prediction. A solo execution plan should first prove a durable $1M business with defensible distribution. Large adoption can exceed the paying footprint through an open runtime.

### Acquisition positioning

Potential strategic buyer categories are identity platforms, API gateways, observability vendors, and developer/cloud platforms. These are categories, not claims of interest. Valuable assets would be: active distribution inside agent workflows, a trusted action contract, external conformance implementations, retained enterprise customers, and independently reviewed security. Preserve clean IP provenance, dependency licenses, reproducible benchmarks, customer consent boundaries, and portable infrastructure. Do not build custom customer forks that only the founder can operate.

The moat is accumulated trust, tested policy packs, schema-change intelligence, and integration into development workflows. Customer logs remain exportable. Holding evidence hostage creates procurement objections; it is not the right switching-cost strategy.

## 2. Feature breakdown

Each feature below separates functionality, experience, mechanics, and release status. Only the baseline column in the shipped matrix is implemented today.

### A. Unified MCP gateway and tool catalog

- **Core functionality:** aggregate remote tool catalogs under stable namespaces. Filter discovery and execution consistently. Track tool schema revisions, upstream identity, health, and support level. Later expose narrow toolsets for each workload instead of dumping all 50 server catalogs into the LLM context.
- **Developer UX:** paste a remote URL, choose a secret reference, test discovery, inspect exact schemas, select allowed tools, copy one client URL. Explain transport/auth errors with actionable diagnostics. Never silently grant all discovered tools.
- **Security admin UX:** search by connection, owner, environment, schema revision, and allowed principal. Review a diff before a changed tool becomes usable. Quarantine can remove tools immediately.
- **Lean mechanics:** use the official MCP TypeScript SDK for both client and server; do not implement JSON-RPC or OAuth by hand. Refresh catalogs in durable jobs; the data plane reads validated snapshots. Remote HTTP only initially. Local stdio belongs in the customer’s runner, not a Vercel subprocess. Support catalog paging and capability negotiation explicitly. [Official SDK](https://github.com/modelcontextprotocol/typescript-sdk).
- **Baseline:** local gateway, two configured upstreams, exact namespaced allowlists, startup discovery. Public endpoint offers only Accord’s own read-only tools. Live catalog refresh and 50-server support are future work.

### B. Identity, RBAC, and contextual policy

- **Core functionality:** bind every action to tenant, agent/workload, delegated user when present, environment, connection, and policy revision. Begin with owner/member roles for control-plane access; add argument and resource attributes for runtime ABAC. Role permission alone cannot authorize a particular bank account or repository.
- **Developer UX:** register a workload and copy a short-lived setup flow. Show the effective toolset and why permission is missing. Rotate or revoke without editing every agent config.
- **Admin UX:** identity graph with explicit delegation edges, credential expiry, and effective access. A policy simulator explains the exact matching rule; version history supports rollback. Store real identity IDs, not inferred names.
- **Lean mechanics:** use managed login/SSO and OAuth libraries, validate issuer/audience/signature/expiry, scope resource-bound tokens, and keep incoming and upstream tokens separate. Encrypt upstream refresh tokens with envelope encryption and per-tenant binding. Never use unverified model-supplied identity claims. Start with a typed policy contract; evaluate OPA signed bundles when ABAC needs justify a richer language. Avoid maintaining both Cedar and OPA.
- **Baseline:** one shared bearer principal in the local gateway; explicit policy evaluator. Managed identity, ABAC, SSO, JWT validation, delegated user flows, and a control-plane RBAC service are not shipped.

### C. Run budgets, rate limits, and circuit breakers

- **Core functionality:** bound calls per tenant/principal/run/tool, maximum concurrency, payload bytes, deadlines, and later provider cost budgets. A runaway agent stops before the upstream action. Distinguish upstream error circuits from volume caps.
- **Developer UX:** presets such as “30 calls/minute” with retry-after details, then a local test that intentionally exhausts the budget. Show requests remaining rather than ambiguous usage percentages.
- **Admin UX:** inspect the principal and run that triggered a stop, the rule revision, and recovery conditions. Emergency revoke is separate from increasing a budget.
- **Lean mechanics:** atomic reservations in Redis or a strongly consistent per-tenant coordinator. Reserve before forwarding, reconcile after outcome, and treat ambiguous writes as unknown rather than retryable. Use token buckets or sliding windows for production; a fixed-minute window permits boundary bursts. Circuits should be per upstream in production, with one controlled half-open probe and jitter.
- **Baseline:** single-process shared minute budget, shared error circuit, request size checks, no automatic retry. Restart/multi-replica durability is not provided.

### D. Payload projection, exact caching, and context reduction

- **Core functionality:** a visual JSON field pruner with byte/token comparison, versioned output contract, cache eligibility, and optional on-device sensitive-field highlighting. Shrink tool catalogs through authorized discovery. Exact read caching precedes semantic caching.
- **Developer UX:** paste a sample, select retained fields, inspect before/after, run a schema compatibility test, and export a projection policy. Warn when required fields would disappear. Show measured bytes and tokenizer-specific estimates separately.
- **Admin UX:** see which resources may be cached, who may read cache entries, TTL, residency, invalidation events, and fields removed. Read-after-write paths can opt out.
- **Lean mechanics:** deterministic JSON projection, output-schema validation, and cache keys containing tenant, principal authorization scope, connection, tool/schema version, canonical arguments, and policy revision. Reauthorize before serving a hit. Never share across identities by text similarity. Invalidate on permission changes and relevant writes. Do not cache destructive or non-idempotent calls, secrets, or ambiguous results.
- **Semantic caching gate:** only for explicitly approved, low-risk retrieval workloads after measuring false-hit consequences. Embedding costs and tenant isolation are real operating costs. Approximate caching is never part of an authorization decision.
- **Baseline:** browser-local top-level projection, UTF-8 byte measurement, export. No token estimate, runtime projection, cache, or DLP claims.

### E. Audit trails and execution receipts

- **Core functionality:** record identity, tool/schema hash, canonical argument commitment, policy revision, decision, approval binding, attempt, timing, and actual outcome. Separate intent, authorization, forwarding, and confirmed completion. Export evidence with integrity verification.
- **Developer UX:** click a denied request to see the rule and exact test case. Download a reproducible fixture with secrets removed. Correlate SDK request, upstream operation, and user-visible result.
- **Admin UX:** export an evidence range, prove signatures, inspect delivery gaps, and set retention/residency. A “sent to Splunk” state requires downstream acknowledgment, not a queued job.
- **Lean mechanics:** metadata-first OpenTelemetry spans plus durable append-only events. Outbox to a managed queue, retries, deduplication IDs, DLQ, and customer-owned OTLP/SIEM destination. Collectors already have Datadog/Splunk integrations; do not build a separate query language and storage engine. BYO storage reduces retained payload risk but does not eliminate buffering, egress, delivery, or support cost.
- **Integrity:** an Ed25519 signature demonstrates which key attested a record; it does not independently prove the upstream performed a business action. Include upstream references and reconciliation evidence. Batch-signed manifests and customer WORM storage add tamper evidence. HMAC or keyed commitments avoid easy guessing of low-entropy sensitive arguments.
- **Baseline:** unsigned session simulation receipts and local stdout metadata with policy/schema hashes. Not a certified audit trail.

### F. Human approval for exact actions

- **Core functionality:** suspend a consequential action without keeping the HTTP request open. An authenticated human approves exact canonical arguments, action/schema version, principal, connection, destination, policy revision, budget reservation, and expiry. One approval cannot authorize a modified or second request.
- **Developer UX:** receive a durable application run ID and pending status; resume/poll using a supported client mechanism. Client disconnects do not lose the approval. Mutation after approval invalidates it.
- **Admin UX:** Slack notification deep-links to an authenticated decision page with readable field diff, risk context, expiry, Approve and Reject. A Slack message alone must not hold the authority to execute. Teams follows only after Slack proves demand.
- **Lean mechanics:** durable state machine `proposed → authorized → queued → started → succeeded | failed | unknown → reconciled`. Atomic compare-and-swap claims and an outbox handle duplicate clicks. Use managed durable workflows/queues, not a sleeping Vercel function. Single-use approval grants, webhook signature verification, revocation checks, and idempotency keys. Treat upstream timeouts as unknown. No universal exactly-once guarantee for external writes.
- **Baseline:** approval requirements are enforced as a block; notification, authorization, durable state, and execution resume are planned.

### G. Tool supply-chain integrity and schema drift

- **Core functionality:** pin a tool’s executable contract, review new/destructive fields, detect namespace shadowing and description changes, and quarantine unexpected revisions. Tool descriptions and annotations are untrusted inputs, never authorization instructions.
- **Developer UX:** a CI diff shows which policy or generated client would break. Accept a revision with a fixture and rollback path.
- **Admin UX:** see which teams trust an upstream revision, the reviewer, and the active canary. Emergency freeze is one operation.
- **Lean mechanics:** stable JSON canonicalization plus content hashes; scheduled discovery; schema diff; signed catalog bundles; automated negative tests. Reuse JSON Schema tooling and maintained scanners as signals. Do not market a heuristic prompt-injection detector as complete protection.
- **Baseline:** local schema snapshots at startup and receipt hashes. Reviewed promotion, drift monitoring, signatures, and conformance registry are next-phase work.

### H. Policy-as-code, replay, and conformance

- **Core functionality:** run authorization fixtures in CI, compare proposed and active policies, and verify receipts independently. Replays evaluate decisions without re-executing side effects. Publish a narrow contract with compatibility tests.
- **Developer UX:** a pull request shows “these historical requests change from allow to deny” with readable reasons. A verifier CLI works without an Accord account.
- **Admin UX:** approve policy changes and staged rollout; inspect expected denial changes and roll back to a signed previous bundle.
- **Lean mechanics:** deterministic evaluator, canonical JSON, signed revision artifacts, retained redacted fixtures, and a GitHub Action. OPA already documents verified policy bundles; reuse it where useful rather than inventing another distribution protocol. [OPA bundles](https://www.openpolicyagent.org/docs/management-bundles).
- **Baseline:** shared evaluator, explicit JSON version, regression tests. Independent public standard, semantic policy diff, signed distribution, and replay UI remain proposals.

### I. Customer-owned execution and fleet control

- **Core functionality:** local/VPC execution with outbound policy retrieval and minimal evidence export. Private services and secrets remain in the customer network. Control plane distributes policy and manages authorized runtime identity.
- **Developer UX:** one supported container, preflight diagnostics, health report, and upgrade command. Agent clients keep their URL as environments migrate.
- **Admin UX:** inventory, version drift, policy age, key rotation, emergency revoke, and signed upgrade verification. Explicit stale-policy behavior with short leases; a disconnected runtime cannot claim instantaneous revocation.
- **Lean mechanics:** publish one hardened container and one deployment template initially. Prefer outbound connectivity, short-lived workload credentials, signed bundles, SBOMs, Sigstore where appropriate, and automated upgrade tests. Keep cloud-specific plumbing in adapters maintained by partners. Vercel hosts the control plane; customer runtimes handle sustained sessions and private network access.
- **Baseline:** loopback Node evaluation runtime only. No VPC installer, fleet management, mTLS, residency guarantee, or private-network tunnel service.

### J. PLG onboarding, billing, and self-service operations

- **Core functionality:** create a workspace, connect a server, apply a policy, perform a verified test, and view a receipt. Meter tool invocations and enforce quotas without surprise bills. Include account export, secret revocation, and deletion paths.
- **Developer UX:** activation before payment; a guided safe sample before production secrets. “Your first denied request” is a deliberate onboarding step. Troubleshooting artifacts redact secrets automatically.
- **Admin UX:** budgets, invoices, billing role, members, data retention, and kill switch in one place. Audit sensitive administrative changes.
- **Lean mechanics:** managed auth, Postgres tenant isolation, Stripe hosted checkout/customer portal, signature-verified idempotent webhooks, transactional entitlement updates, and a durable usage ledger. Never rely only on a client-side billing state or delayed vendor invoice to enforce a cap.
- **Baseline:** zero-signup browser workbench and exported configuration. No billing, tenant accounts, managed entitlements, or hosted usage promises.

## 3. Lean infrastructure and economics

### Recommended sequence

1. **Now:** Next.js on Vercel, official MCP SDK, deterministic policy core, loopback Node runtime, GitHub CI. No application database and no background scheduler needed for the preview.
2. **Private beta:** add managed auth, one managed Postgres database, one Redis quota store, and a managed durable queue/outbox. Single region with explicit latency/failure behavior. Keep secret encryption and tenancy controls outside frontend code.
3. **Enterprise:** separate data/control plane. Add customer-owned runtime and policy leases; do not make serverless functions host stdio daemons or long-lived human approvals. Vercel function duration and payload constraints must inform the data-plane design. [Vercel limits](https://vercel.com/docs/functions/limitations).

| Vendor/resource | Fastest | Cheapest practical entry | Best fit | Easiest operational use |
|---|---|---|---|---|
| Vercel | Existing account and Next deployment | Reuse current plan within its actual allowance | Site/control plane, short HTTP evaluation | Managed deployments, TLS, previews |
| WorkOS AuthKit | Managed account/organization flows | Published free allowance up to 1M active users | B2B identity; SSO separately priced | Managed admin onboarding |
| Upstash Redis | HTTP client and atomic scripts | Use current free/pay-as-you-go plan within tested limits | Small durable quota and budget service | No Redis operations staff |
| Official MCP SDK | Native protocol support | MIT-licensed package; runtime costs remain | MCP wire compatibility | Pin versions and run contract tests |
| OPA | Slower than the initial typed evaluator | Apache-licensed runtime; integration cost remains | Mature ABAC and signed policy bundles | Adopt only when customer policy complexity warrants it |

These rankings are task-specific judgments, not a claim of universal vendor superiority. Confirm plan terms before provisioning. Official sources: [Vercel pricing](https://vercel.com/pricing), [WorkOS pricing](https://workos.com/pricing), [Upstash pricing](https://upstash.com/pricing/redis), [SDK repository](https://github.com/modelcontextprotocol/typescript-sdk), [OPA repository](https://github.com/open-policy-agent/opa).

WorkOS currently lists entry SSO connections at $125/month and SIEM streaming at $125/connection/month. That alone is more than a $79 Pro plan. Put enterprise SSO and managed SIEM connections in appropriately priced contracts; do not absorb them into Pro by accident. Auth-provider custom domains are also separate from gateway custom domains. [WorkOS official pricing](https://workos.com/pricing).

### Pricing proposal

- **Free:** 2 servers, 1,000 tool calls/month, fixed hard cap, short metadata retention only once implemented, community support. Never revoke basic security when a user downgrades; reduce capacity.
- **Pro:** $79/month, 10 servers, 100,000 calls, 7-day metadata retention, custom gateway domain. Test $49/$99 willingness-to-pay only after activation is strong. Suggested overage experiment: $1/1,000 additional calls with an opt-in ceiling, subject to measured cost.
- **Enterprise:** annual platform commitment with explicit identity/SSO, retention, support, and deployment add-ons. Initial planning floor $15–30K/year, a hypothesis to validate through design partners; charge separately for bespoke deployment/support obligations. No unlimited support or 24/7 promise from a single person.

Bill on accepted tool-call attempts at ingress, including cache hits because governance still ran, with one clearly documented treatment for errors. Denials should not create paid overage, but need an abuse cap. Protocol discovery, health checks, and polling require separate load limits. Show “agent intent” versus “execution attempt” to prevent billing disputes around retries.

### Unit-economic guardrails

Gross margin = (revenue − attributable delivery cost) / revenue. Include compute, bandwidth, Redis operations, durable storage/queue, observability, payment fees, and delivery support; do not disguise founder labor as zero. Compliance and central engineering can be shown separately, with a fully loaded business view alongside gross margin.

At $79 monthly revenue, 80% gross margin permits **$15.80** attributable cost; 90% permits **$7.90**. An illustrative $8 delivery cost yields 89.9%; $20 yields 74.7%; $50 yields 36.7%. These are arithmetic scenarios, not measured costs.

100,000 calls × 2 KB metadata is roughly 200 MB raw metadata before indexes/replication. At 50 KB payloads it is roughly 5 GB before copies and transfer. Sampling can reduce debugging payloads, but security decisions should retain a complete minimal evidence record. Set egress/payload limits separately from call limits.

Instrument cost per 1,000 calls, p95 upstream duration, average response bytes, reserved concurrency, metadata size, and export retry volume. Stop admitting capacity before an account becomes loss-making. Prefer customer-owned long-term evidence over unlimited retention.

## 4. Distribution and defensibility

- Ship an evaluation CLI, minimal verifier, policy fixtures, and a GitHub Action. The open contract must remain useful without the hosted platform.
- Publish reproducible cases: tool namespace spoofing, changed schema, exact approval replay, exhausted budget, stale identity, and ambiguous writes. Avoid unsupported “blocks all prompt injection” claims.
- Build one-click migration docs from direct MCP configurations. Preserve existing tool semantics and show an exact catalog diff.
- Offer public sample policies as a discovery surface; never publish a customer’s internal policy or action data without explicit consent.
- Integrate with agent frameworks and established gateways. A protocol-compatible sidecar or verification library can distribute farther than a replacement-only pitch.
- Make support self-service: structured connection diagnostics, versioned compatibility matrix, sandbox reproduction, known errors, automated upgrade check.
- Open the policy/receipt contract and verifier under a permissive license. Keep hosted management commercial. The present baseline source is under MIT; paid design-source archives are excluded. Independent adoption, not marketing language, determines whether it becomes a standard.

## 5. Execution plan and acceptance gates

1. **Checkpoint: baseline released.** Site, workbench, public MCP tools, local gateway, source, automated tests, desktop/mobile checks, and exact handoff. Do not label this a hosted enterprise product.
2. **Checkpoint: secure hosted tenancy.** Managed login; two test tenants with cross-tenant denial tests; encrypted upstream secrets; two maintained upstreams; identity-bound tool filtering; durable quota contention tests; deletion/export flow. No billing before isolation passes.
3. **Checkpoint: reliable real execution.** Durable receipts/outbox; per-upstream circuits; response limits; SSRF/DNS/redirect defenses; connection revocation; complete redaction tests; golden read/write workflow; operational recovery runbook. Measure p95 added latency rather than inventing a target achievement.
4. **Checkpoint: paid self-service.** Stripe sandbox lifecycle tests, webhook replay, opt-in overages, entitlement reconciliation, verified cancellation, and support playbooks. Enable paid production only after the flow passes in a production-like environment.
5. **Checkpoint: exact approvals.** Durable single-use grants, canonical bindings, duplicate-click tests, expired/revoked policy tests, unknown-outcome reconciliation, signed Slack delivery, and authenticated decision UI. Human approval must not be a boolean supplied by the agent.
6. **Checkpoint: independent evidence.** Receipt canonicalization/signatures, key rotation, verifier, tamper tests, policy replay fixtures, and schema quarantine. Publish benchmark methods and limits.
7. **Checkpoint: enterprise repeatability.** One private deployment target; two independent installs; signed upgrade/rollback; load/failure tests; third-party security review; contractual SLOs; audit evidence. Add another target only when existing operations fit capacity.

## 6. Explicitly deferred

SOC 2 certification, arbitrary on-premise support, universal Zero Trust coverage, generic semantic caching, unrestricted API conversion, autonomous agent learning, agent payments, 50 custom SaaS connectors, universal exactly-once external writes, and bespoke 24/7 support. Revisit only when commercial evidence and operational capacity justify them.

The ambitious scope remains broad. The implementation sequence stays narrow enough that each new capability can be tested, sold, and operated by a highly capable solo founder.
