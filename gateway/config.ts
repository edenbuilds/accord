import { z } from "zod";
import { policySchema } from "../lib/policy";
export const gatewaySchema = z
  .object({
    version: z.literal("accord.gateway/v1"),
    upstreams: z
      .array(
        z
          .object({
            namespace: z.string().regex(/^[a-z][a-z0-9_-]{0,30}$/),
            url: z
              .string()
              .url()
              .refine((value) => {
                const url = new URL(value);
                return (
                  !url.username &&
                  !url.password &&
                  !url.hash &&
                  (url.protocol === "https:" ||
                    (url.protocol === "http:" &&
                      ["localhost", "127.0.0.1", "[::1]"].includes(
                        url.hostname,
                      )))
                );
              }, "Use HTTPS or a loopback HTTP endpoint without embedded credentials."),
            tokenEnv: z
              .string()
              .regex(/^[A-Z][A-Z0-9_]*$/)
              .optional(),
          })
          .strict(),
      )
      .min(1)
      .max(2),
    policy: policySchema,
  })
  .strict()
  .refine(
    (c) =>
      new Set(c.upstreams.map((u) => u.namespace)).size === c.upstreams.length,
    "Use unique upstream namespaces.",
  );
