import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultPolicy,
  evaluate,
  policySchema,
  requestSchema,
  prunePayload,
} from "../lib/policy";
import { Guard } from "../gateway/engine";
import { gatewaySchema } from "../gateway/config";
const read = {
  tool: "github.list_issues",
  callsInWindow: 0,
  payloadBytes: 128,
};
test("An unlisted tool is denied even when the caller has budget", () => {
  assert.equal(
    evaluate(defaultPolicy, { ...read, tool: "database.drop" }).rule,
    "tool.allowlist",
  );
});
test("A caller cannot use a tool with a different case or namespace", () => {
  assert.equal(
    evaluate(defaultPolicy, { ...read, tool: "Github.list_issues" }).effect,
    "deny",
  );
});
test("The boundary rejects the first call beyond the reserved budget", () => {
  assert.equal(
    evaluate(defaultPolicy, { ...read, callsInWindow: 29 }).effect,
    "allow",
  );
  assert.equal(
    evaluate(defaultPolicy, { ...read, callsInWindow: 30 }).effect,
    "deny",
  );
});
test("Approval does not bypass the budget", () => {
  assert.equal(
    evaluate(defaultPolicy, {
      ...read,
      tool: "github.create_issue",
      callsInWindow: 30,
    }).rule,
    "budget.minute",
  );
});
test("A permitted write stays blocked until an approval workflow exists", () => {
  assert.equal(
    evaluate(defaultPolicy, { ...read, tool: "github.create_issue" }).effect,
    "approval_required",
  );
});
test("An oversized allowed request is rejected", () => {
  assert.equal(
    evaluate(defaultPolicy, { ...read, payloadBytes: 32769 }).rule,
    "payload.max_bytes",
  );
});
test("Policies reject unknown fields and unsupported versions", () => {
  assert.equal(
    policySchema.safeParse({ ...defaultPolicy, ignoreAuth: true }).success,
    false,
  );
  assert.equal(
    policySchema.safeParse({ ...defaultPolicy, version: "v2" }).success,
    false,
  );
});
test("Untrusted request metadata cannot grant its own approval", () => {
  assert.equal(
    requestSchema.safeParse({ ...read, approved: true }).success,
    false,
  );
});
test("Projection preserves nested source values without mutating input", () => {
  const source = {
    id: "example",
    nested: { secret: "fixture" },
    other: "omit",
  };
  assert.deepEqual(prunePayload(source, ["id"]), { id: "example" });
  assert.deepEqual(prunePayload(source, ["nested"]), {
    nested: { secret: "fixture" },
  });
  assert.equal(source.other, "omit");
});
test("Concurrent reservations share one synchronous process budget", async () => {
  const guard = new Guard({ ...defaultPolicy, limitPerMinute: 3 });
  const results = await Promise.all(
    Array.from({ length: 20 }, async () => guard.check(read.tool, 128)),
  );
  assert.equal(results.filter((r) => r.effect === "allow").length, 3);
});
test("A minute boundary restores the budget", () => {
  let now = 100000;
  const guard = new Guard({ ...defaultPolicy, limitPerMinute: 1 }, () => now);
  assert.equal(guard.check(read.tool, 128).effect, "allow");
  assert.equal(guard.check(read.tool, 128).effect, "deny");
  now += 60000;
  assert.equal(guard.check(read.tool, 128).effect, "allow");
});
test("Three upstream failures open the circuit until cooldown expires", () => {
  let now = 100000;
  const guard = new Guard(defaultPolicy, () => now);
  guard.failure();
  guard.failure();
  guard.failure();
  assert.equal(guard.check(read.tool, 128).rule, "circuit.open");
  now += 30001;
  assert.equal(guard.check(read.tool, 128).effect, "allow");
});
test("Gateway configuration rejects duplicate namespaces and embedded secrets", () => {
  const config = {
    version: "accord.gateway/v1",
    upstreams: [{ namespace: "test", url: "https://example.com/mcp" }],
    policy: defaultPolicy,
  };
  assert.equal(gatewaySchema.safeParse(config).success, true);
  assert.equal(
    gatewaySchema.safeParse({
      ...config,
      upstreams: [...config.upstreams, ...config.upstreams],
    }).success,
    false,
  );
  assert.equal(
    gatewaySchema.safeParse({
      ...config,
      upstreams: [
        { namespace: "test", url: "https://user:password@example.com/mcp" },
      ],
    }).success,
    false,
  );
});
