import { createHash } from "node:crypto";
import { evaluate, type Policy } from "../lib/policy";
export function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
export class Guard {
  private windowStart = 0;
  private count = 0;
  private failures = 0;
  private openedUntil = 0;
  constructor(
    readonly policy: Policy,
    private now = () => Date.now(),
  ) {}
  check(tool: string, payloadBytes: number) {
    const now = this.now();
    if (now - this.windowStart >= 60000) {
      this.windowStart = now;
      this.count = 0;
    }
    if (this.openedUntil > now)
      return {
        effect: "deny" as const,
        reason: "The upstream circuit is open. Retry after the cooldown.",
        rule: "circuit.open",
      };
    // Reservation is synchronous: concurrent requests cannot overrun the process-local budget.
    const decision = evaluate(this.policy, {
      tool,
      callsInWindow: this.count,
      payloadBytes,
    });
    if (decision.effect === "allow") this.count++;
    return decision;
  }
  success() {
    this.failures = 0;
  }
  failure() {
    this.failures++;
    if (this.failures >= 3) {
      this.openedUntil = this.now() + 30000;
      this.failures = 0;
    }
  }
}
