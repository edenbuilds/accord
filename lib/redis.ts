import type { Store } from "./pipeline";

// Upstash Redis over its REST API with plain fetch; no client library needed.
// Vercel's Upstash integration sets KV_REST_*; a direct Upstash setup sets UPSTASH_*.
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
export const redisConfigured = Boolean(url && token);
const PREFIX = "accord:";

async function run(commands: (string | number)[][]): Promise<unknown[]> {
  if (!url || !token) throw new Error("Redis is not configured.");
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`Redis returned ${res.status}.`);
  const out = (await res.json()) as { result?: unknown; error?: string }[];
  return out.map((r) => {
    if (r.error) throw new Error("A Redis command failed.");
    return r.result;
  });
}

// One atomic script; mirrors takeToken() in lib/pipeline.ts.
const BUCKET = `local s=redis.call('GET',KEYS[1])
local cap=tonumber(ARGV[1]) local rate=tonumber(ARGV[2]) local now=tonumber(ARGV[3])
local tokens=cap
if s then local d=cjson.decode(s) tokens=math.min(cap,d.tokens+((now-d.at)/60000)*rate) end
local ok=0
if tokens>=1 then tokens=tokens-1 ok=1 end
redis.call('SET',KEYS[1],cjson.encode({tokens=tokens,at=now}),'PX',3600000)
return ok`;

export const redisStore: Store = {
  async incr(key, ttl) {
    const [n] = await run([["INCR", PREFIX + key], ["EXPIRE", PREFIX + key, ttl, "NX"]]);
    return Number(n);
  },
  async get(key) {
    const [v] = await run([["GET", PREFIX + key]]);
    return typeof v === "string" ? v : null;
  },
  async set(key, value, ttl) {
    await run([["SET", PREFIX + key, value, "EX", ttl]]);
  },
  async push(key, value, max) {
    await run([
      ["LPUSH", PREFIX + key, value],
      ["LTRIM", PREFIX + key, 0, max - 1],
      ["EXPIRE", PREFIX + key, 60 * 60 * 24 * 30],
    ]);
  },
  async list(key, max) {
    const [v] = await run([["LRANGE", PREFIX + key, 0, max - 1]]);
    return Array.isArray(v) ? (v as string[]) : [];
  },
  async take(key, capacity, refill, now) {
    const [ok] = await run([["EVAL", BUCKET, 1, PREFIX + key, capacity, refill, now]]);
    return Number(ok) === 1;
  },
};
