// Shared guards for public JSON endpoints: origin, content type, size, parse.

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function readJson(
  request: Request,
  limit: number,
  rpc = false,
): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    return { ok: false, response: new Response("Use application/json", { status: 415 }) };
  const reader = request.body?.getReader();
  if (!reader) return { ok: false, response: new Response("Request body required", { status: 400 }) };
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return {
        ok: false,
        response: new Response(`Request body exceeds ${Math.round(limit / 1024)} KB`, { status: 413 }),
      };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return {
      ok: false,
      response: rpc
        ? Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 })
        : Response.json({ error: "The request body is not valid JSON." }, { status: 400 }),
    };
  }
}
