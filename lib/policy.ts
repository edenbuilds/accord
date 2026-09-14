import { z } from "zod";
export const policySchema = z
  .object({
    version: z.literal("accord.policy/v1"),
    name: z.string().min(1).max(80),
    allowedTools: z.array(z.string().min(1).max(160)).max(100),
    requireApproval: z.array(z.string().min(1).max(160)).max(100),
    limitPerMinute: z.number().int().min(1).max(10000),
    maxPayloadBytes: z.number().int().min(256).max(1048576),
  })
  .strict();
export type Policy = z.infer<typeof policySchema>;
export const defaultPolicy: Policy = {
  version: "accord.policy/v1",
  name: "Engineering agent",
  allowedTools: [
    "github.list_issues",
    "github.create_issue",
    "stripe.list_customers",
  ],
  requireApproval: ["github.create_issue"],
  limitPerMinute: 30,
  maxPayloadBytes: 32768,
};
export const requestSchema = z
  .object({
    tool: z.string().min(1).max(160),
    callsInWindow: z.number().int().min(0).max(1000000),
    payloadBytes: z.number().int().min(0).max(100000000),
  })
  .strict();
export type Decision = {
  effect: "allow" | "deny" | "approval_required";
  reason: string;
  rule: string;
};
export function evaluate(
  policy: Policy,
  request: z.infer<typeof requestSchema>,
): Decision {
  if (!policy.allowedTools.includes(request.tool))
    return {
      effect: "deny",
      reason: "This tool is outside the explicit allowlist.",
      rule: "tool.allowlist",
    };
  if (request.callsInWindow >= policy.limitPerMinute)
    return {
      effect: "deny",
      reason: `The ${policy.limitPerMinute}-call minute budget has been reached.`,
      rule: "budget.minute",
    };
  if (request.payloadBytes > policy.maxPayloadBytes)
    return {
      effect: "deny",
      reason: "The request exceeds the configured payload boundary.",
      rule: "payload.max_bytes",
    };
  if (policy.requireApproval.includes(request.tool))
    return {
      effect: "approval_required",
      reason:
        "An exact-action approval is required. No action has been executed.",
      rule: "approval.required",
    };
  return {
    effect: "allow",
    reason: "The tool is permitted and the request is within its boundaries.",
    rule: "policy.allow",
  };
}
export function prunePayload(
  input: Record<string, unknown>,
  keep: string[],
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => keep.includes(key)),
  );
}
