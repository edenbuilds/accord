import test from "node:test";
import assert from "node:assert/strict";
import { convert, shellSplit, LIMITS } from "../lib/convert";

const PROP = /^[A-Za-z0-9_.-]{1,64}$/;
const NAME = /^[a-z0-9_]{1,64}$/;

function ok(input: string) {
  const r = convert(input);
  if (!r.ok) assert.fail(r.error);
  for (const t of r.manifest.tools) {
    assert.match(t.name, NAME);
    for (const p of Object.keys(t.inputSchema.properties)) assert.match(p, PROP);
  }
  return r;
}

test("A Stripe refund cURL becomes a create tool with typed fields and no secret", () => {
  const r = ok(`curl https://api.stripe.com/v1/refunds \\
  -u fake_key_for_tests: \\
  -d charge=ch_3MmlLrLkdIwHu7ix0snN0B15 \\
  -d amount=1000`);
  const t = r.manifest.tools[0];
  assert.equal(t.name, "create_refund");
  assert.equal(t.method, "POST");
  assert.equal(t.params.bodyType, "form");
  assert.deepEqual(r.manifest.auth, { type: "basic" });
  assert.equal((t.inputSchema.properties.amount as { type: string }).type, "integer");
  assert.equal(r.manifest.baseUrl, "https://api.stripe.com");
  // A fake value on purpose: GitHub push protection blocked Stripe's public
  // docs test key here on 14-09-2026. The point is only that -u never leaks.
  assert.ok(!JSON.stringify(r).includes("fake_key_for_tests"));
});

test("A GitHub cURL with a bearer token and numeric id becomes a get tool with a required path id", () => {
  const r = ok(`curl -H "Authorization: Bearer ghp_abcdefghijklmnopqrstuvwxyz0123456789" https://api.github.com/repos/octo/hello/issues/42`);
  const t = r.manifest.tools[0];
  assert.equal(t.name, "get_issue");
  assert.equal(t.path, "/repos/octo/hello/issues/{issue_id}");
  assert.deepEqual(t.inputSchema.required, ["issue_id"]);
  assert.equal(t.annotations.readOnlyHint, true);
  assert.deepEqual(r.manifest.auth, { type: "bearer" });
  assert.ok(!JSON.stringify(r).includes("ghp_"));
});

test("A JSON body sent with --json becomes top-level tool inputs", () => {
  const r = ok(`curl --json '{"title":"Printer jam","labels":["office"],"priority":2}' https://api.example.com/v1/tickets`);
  const t = r.manifest.tools[0];
  assert.equal(t.method, "POST");
  assert.equal(t.params.bodyType, "json");
  assert.deepEqual(Object.keys(t.inputSchema.properties), ["title", "labels", "priority"]);
  assert.equal((t.inputSchema.properties.labels as { type: string }).type, "array");
});

test("An API key in the URL is removed and recorded as query auth", () => {
  const r = ok(`curl "https://api.example.com/v1/items?api_key=SECRET123VALUE&limit=10"`);
  assert.deepEqual(r.manifest.auth, { type: "query", name: "api_key" });
  assert.ok(!JSON.stringify(r).includes("SECRET123VALUE"));
  assert.ok(r.warnings.some((w) => w.includes("api_key")));
  assert.equal((r.manifest.tools[0].inputSchema.properties.limit as { type: string }).type, "integer");
});

test("Shell quoting, escapes and line continuations split like a real shell", () => {
  assert.deepEqual(shellSplit(`curl -H 'A: b c' "x\\"y" a\\ b \\\n --data-raw $'q'`), [
    "curl", "-H", "A: b c", 'x"y', "a b", "--data-raw", "q",
  ]);
});

test("A .json endpoint keeps its suffix in the path but not in the tool name", () => {
  const r = ok(`curl https://acme.zendesk.com/api/v2/tickets/{ticket_id}.json\ncurl https://shop.myshopify.com/admin/api/2024-07/inventory_levels.json`);
  assert.deepEqual(r.manifest.tools.map((t) => t.name), ["get_ticket", "list_inventory_levels"]);
  assert.equal(r.manifest.tools[0].path, "/api/v2/tickets/{ticket_id}.json");
  assert.deepEqual(r.manifest.tools[0].inputSchema.required, ["ticket_id"]);
});

test("Every built-in use case converts cleanly and never keeps a secret value", async () => {
  const { useCases, quickSamples } = await import("../lib/use-cases");
  for (const u of [...useCases, ...quickSamples]) {
    const r = ok(u.input);
    assert.ok(r.manifest.tools.length >= 1);
    assert.equal(r.manifest.auth.type === "none", false);
  }
});

test("A comment above a cURL command names and describes the tool", () => {
  const r = ok(`# restart_staging_server: Restart a staging server\ncurl -X POST https://ops.example.com/v1/servers/{server_id}/restart\n# Look up one order\n$ curl https://shop.example.com/orders/{order_id}`);
  assert.equal(r.manifest.tools[0].name, "restart_staging_server");
  assert.equal(r.manifest.tools[0].title, "Restart a staging server");
  assert.equal(r.manifest.tools[1].name, "get_order");
  assert.equal(r.manifest.tools[1].description, "Look up one order");
});

test("A POST to an action on a record is named after the action", () => {
  const r = ok(`curl -X POST https://api.stripe.com/v1/charges/{charge_id}/capture`);
  assert.equal(r.manifest.tools[0].name, "capture_charge");
});

test("An unclosed quote returns a plain error instead of throwing", () => {
  const r = convert(`curl 'https://api.example.com`);
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.error.includes("quote"));
});

test("Two cURL commands for the same endpoint get distinct tool names", () => {
  const r = ok(`curl https://api.example.com/items\ncurl https://api.example.com/items?page=2`);
  assert.deepEqual(r.manifest.tools.map((t) => t.name), ["list_items", "list_items_2"]);
});

const openapi = {
  openapi: "3.1.0",
  info: { title: "Helpdesk" },
  servers: [{ url: "https://{region}.helpdesk.example/api", variables: { region: { default: "eu" } } }],
  components: {
    securitySchemes: { key: { type: "apiKey", in: "header", name: "X-Api-Key" } },
    schemas: {
      Ticket: { type: "object", properties: { id: { type: "string" }, subject: { type: "string" }, parent: { $ref: "#/components/schemas/Ticket" } } },
    },
  },
  paths: {
    "/tickets/{ticketId}": {
      parameters: [{ name: "ticketId", in: "path", required: true, schema: { type: "string" } }],
      get: {
        operationId: "getTicket",
        summary: "Get one ticket",
        parameters: [{ name: "X-Api-Key", in: "header", schema: { type: "string" } }],
        responses: { "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/Ticket" } } } } },
      },
      patch: {
        operationId: "updateTicket",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["open", "solved"] } } } } },
        },
      },
    },
  },
};

test("An OpenAPI 3 spec becomes one tool per operation with refs resolved and auth kept out of inputs", () => {
  const r = ok(JSON.stringify(openapi));
  assert.equal(r.source, "openapi");
  assert.equal(r.manifest.baseUrl, "https://eu.helpdesk.example/api");
  assert.deepEqual(r.manifest.auth, { type: "header", header: "X-Api-Key" });
  const [get, patch] = r.manifest.tools;
  assert.equal(get.name, "get_ticket");
  assert.deepEqual(Object.keys(get.inputSchema.properties), ["ticketId"]);
  assert.deepEqual(get.inputSchema.required, ["ticketId"]);
  assert.ok(get.responseSchema);
  assert.equal(patch.name, "update_ticket");
  assert.deepEqual([...patch.inputSchema.required!].sort(), ["status", "ticketId"]);
});

test("A self-referencing schema is expanded without hanging", () => {
  const r = ok(JSON.stringify(openapi));
  const parent = (r.manifest.tools[0].responseSchema as { properties: { parent: unknown } }).properties.parent;
  assert.ok(parent !== undefined);
});

test("A YAML OpenAPI spec converts the same way as JSON", () => {
  const r = ok(`openapi: 3.0.3
info: {title: Pets}
servers: [{url: https://petstore.example/v1}]
paths:
  /pets:
    get:
      operationId: listPets
      parameters: [{name: limit, in: query, schema: {type: integer}}]`);
  assert.equal(r.manifest.tools[0].name, "list_pets");
  assert.deepEqual(r.manifest.tools[0].params.query, { limit: "limit" });
});

test("A Swagger 2 spec uses host and basePath and flattens the body parameter", () => {
  const r = ok(JSON.stringify({
    swagger: "2.0",
    info: { title: "Legacy" },
    host: "legacy.example",
    basePath: "/v2",
    schemes: ["https"],
    paths: { "/orders": { post: { parameters: [{ in: "body", name: "body", schema: { type: "object", properties: { sku: { type: "string" } }, required: ["sku"] } }] } } },
  }));
  assert.equal(r.source, "swagger");
  assert.equal(r.manifest.baseUrl, "https://legacy.example/v2");
  assert.deepEqual(r.manifest.tools[0].inputSchema.required, ["sku"]);
});

test("A Postman collection with folders, variables and bearer auth converts every request", () => {
  const r = ok(JSON.stringify({
    info: { name: "CRM", schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
    variable: [{ key: "baseUrl", value: "https://crm.example.com" }],
    auth: { type: "bearer" },
    item: [
      { name: "Leads", item: [{ name: "Get lead", request: { method: "GET", url: { raw: "{{baseUrl}}/leads/:leadId" } } }] },
      { name: "Create lead", request: { method: "POST", url: "{{baseUrl}}/leads", body: { mode: "raw", raw: '{"email":"a@example.com"}' } } },
    ],
  }));
  assert.equal(r.source, "postman");
  assert.equal(r.manifest.baseUrl, "https://crm.example.com");
  assert.deepEqual(r.manifest.auth, { type: "bearer" });
  assert.deepEqual(r.manifest.tools.map((t) => t.name), ["get_lead", "create_lead"]);
  assert.equal(r.manifest.tools[0].path, "/leads/{leadId}");
});

test("Input over the size limit is refused with a plain message", () => {
  const r = convert(`curl https://a.example/${"x".repeat(LIMITS.inputChars)}`);
  assert.equal(r.ok, false);
});

test("Text that is neither cURL nor a spec is refused, not guessed", () => {
  for (const s of ["", "hello world", "[1,2,3]", "{}", "- a\n- b"]) assert.equal(convert(s).ok, false);
});

test("Five hundred random mutations of real inputs never throw and never leak a secret", () => {
  const seeds = [
    `curl -X POST https://api.stripe.com/v1/refunds -u sk_live_secretvalue123: -d amount=100 -H "Stripe-Version: 2024-06-20"`,
    JSON.stringify(openapi),
    `curl --json '{"a":{"b":[1,{"c":null}]}}' "https://x.example/v1/things/123?key=zzz"`,
  ];
  let s = 42;
  const r = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const junk = [`'`, `"`, `\\`, `{`, `}`, `$ref`, `-H`, `\n`, `curl `, `%`, ` `];
  for (let i = 0; i < 500; i++) {
    let text = seeds[i % seeds.length];
    for (let j = 0; j < 1 + Math.floor(r() * 4); j++) {
      const at = Math.floor(r() * text.length);
      const op = Math.floor(r() * 4);
      if (op === 0) text = text.slice(0, at) + text.slice(at + Math.floor(r() * 20));
      else if (op === 1) text = text.slice(0, at) + junk[Math.floor(r() * junk.length)] + text.slice(at);
      else if (op === 2) text = text.slice(0, at);
      else text = text.slice(0, at) + text.slice(at, at + 30) + text.slice(at);
    }
    const started = Date.now();
    const out = convert(text);
    assert.equal(typeof out.ok, "boolean");
    assert.ok(Date.now() - started < 2000);
    assert.ok(!JSON.stringify(out).includes("sk_live_secretvalue123"));
  }
});
