import { convert, type Manifest } from "./convert";
import { defaultGatewayPolicy, type GatewayPolicy, type Receipt, type Store } from "./pipeline";
import { templateFor } from "./use-cases";

// Sandbox gateways: a stored manifest + policy behind a public MCP URL.
// The server always re-converts the user's original input; it never trusts a
// manifest sent by the browser.

export const GATEWAY_TTL = 60 * 60 * 24 * 30;
export const MAX_GATEWAY_INPUT = 256_000;
export const MAX_GATEWAY_TOOLS = 50;
const ID = /^[A-Za-z0-9_-]{12}$/;

export type GatewayRecord = {
  id: string;
  createdAt: string;
  name: string;
  manifest: Manifest;
  policy: GatewayPolicy;
};

export function newGatewayId() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_");
}

export function buildGateway(input: string):
  | { ok: true; record: GatewayRecord; warnings: string[] }
  | { ok: false; error: string } {
  if (typeof input !== "string" || input.length > MAX_GATEWAY_INPUT)
    return { ok: false, error: "Paste up to 256 KB to create a gateway." };
  const result = convert(input);
  if (!result.ok) return result;
  const warnings = [...result.warnings];
  const manifest = result.manifest;
  if (manifest.tools.length > MAX_GATEWAY_TOOLS) {
    warnings.push(`The sandbox keeps the first ${MAX_GATEWAY_TOOLS} tools.`);
    manifest.tools = manifest.tools.slice(0, MAX_GATEWAY_TOOLS);
  }
  return {
    ok: true,
    warnings,
    record: {
      id: newGatewayId(),
      createdAt: new Date().toISOString(),
      name: manifest.name,
      manifest,
      // Built-in templates carry their own policy; anything else gets the default.
      policy: defaultGatewayPolicy(manifest, templateFor(input)?.policy),
    },
  };
}

export async function saveGateway(store: Store, record: GatewayRecord) {
  await store.set(`g:${record.id}`, JSON.stringify(record), GATEWAY_TTL);
}

export async function loadGateway(store: Store, id: string): Promise<GatewayRecord | null> {
  if (!ID.test(id)) return null;
  const raw = await store.get(`g:${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GatewayRecord;
  } catch {
    return null;
  }
}

export async function gatewayActivity(store: Store, id: string) {
  const [calls, receipts] = await Promise.all([
    store.get(`calls:${id}`),
    store.list(`receipts:${id}`, 50),
  ]);
  return {
    calls: Number(calls ?? 0),
    receipts: receipts.flatMap((r) => {
      try {
        return [JSON.parse(r) as Receipt];
      } catch {
        return [];
      }
    }),
  };
}
