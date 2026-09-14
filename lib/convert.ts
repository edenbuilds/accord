import { parse as parseYaml } from "yaml";

// Turns a cURL command, OpenAPI 3, Swagger 2 or Postman v2.1 collection into
// MCP tool definitions. Pure and isomorphic: the browser, the gateway API and
// the tests all run this same file. It never throws to the caller and never
// carries a secret value into the manifest.

export type JsonSchema = { [key: string]: unknown };
export type ToolParams = {
  path: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, string>;
  bodyType: "json" | "form" | "raw" | null;
  wholeBody?: string;
};
export type ManifestTool = {
  name: string;
  title: string;
  description: string;
  method: string;
  path: string;
  server?: string;
  inputSchema: JsonSchema & {
    type: "object";
    properties: Record<string, JsonSchema>;
    required?: string[];
  };
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
  params: ToolParams;
  responseSchema?: JsonSchema;
};
export type Auth =
  | { type: "none" | "bearer" | "basic" }
  | { type: "header"; header: string }
  | { type: "query"; name: string };
export type Manifest = {
  version: "accord.manifest/v1";
  name: string;
  baseUrl: string;
  auth: Auth;
  headers: Record<string, string>;
  tools: ManifestTool[];
};
export type Source = "curl" | "openapi" | "swagger" | "postman";
export type ConvertResult =
  | { ok: true; source: Source; manifest: Manifest; warnings: string[] }
  | { ok: false; error: string };

export const LIMITS = {
  inputChars: 1_000_000,
  tools: 200,
  refDepth: 24,
  expandedNodes: 200_000,
  schemaChars: 32_000,
};
const METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];
const PLACEHOLDER_BASE = "https://api.example.com";
const SECRET_KEY = /pass|secret|token|api[-_]?key|apikey|auth|credential|cvc|cvv|ssn/i;
const SECRET_VALUE =
  /(sk|rk|pk)_(live|test)_[A-Za-z0-9]{6,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[abprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|sk-(proj|ant)-[A-Za-z0-9_-]{10,}|re_[A-Za-z0-9]{8,}_[A-Za-z0-9_]{8,}|hpx_[a-f0-9]{32,}/;
const SECRET_QUERY =/^(api[-_]?key|apikey|key|token|access[-_]?token|auth|secret)$/i;
const SKIP_HEADERS = new Set([
  "authorization",
  "content-type",
  "accept",
  "user-agent",
  "content-length",
  "host",
  "accept-encoding",
  "connection",
  "origin",
  "referer",
]);
const RESERVED = new Set(["__proto__", "constructor", "prototype"]);

class ConvertError extends Error {}
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const clip = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;

export const snake = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
const singular = (s: string) =>
  s.endsWith("ies")
    ? `${s.slice(0, -3)}y`
    : s.endsWith("sses")
      ? s.slice(0, -2)
      : s.endsWith("s") && !s.endsWith("ss")
        ? s.slice(0, -1)
        : s;

// Claude and most MCP clients require ^[a-zA-Z0-9_.-]{1,64}$ for property names.
function propName(raw: string, used: Set<string>) {
  let name = raw.replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 64) || "param";
  if (RESERVED.has(name)) name = `p_${name}`;
  const base = name;
  for (let i = 2; used.has(name); i++) name = `${base.slice(0, 60)}_${i}`;
  used.add(name);
  return name;
}

export function shellSplit(input: string): string[] {
  const out: string[] = [];
  let cur = "";
  let has = false;
  let quote: "'" | '"' | null = null;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quote === "'") {
      if (c === "'") quote = null;
      else cur += c;
      continue;
    }
    if (quote === '"') {
      if (c === '"') quote = null;
      else if (c === "\\" && '"\\$`\n'.includes(input[i + 1] ?? "")) {
        const next = input[++i];
        if (next !== "\n") cur += next;
      } else cur += c;
      continue;
    }
    if (c === "$" && input[i + 1] === "'") {
      quote = "'";
      has = true;
      i++;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      has = true;
      continue;
    }
    if (c === "\\") {
      const next = input[i + 1];
      if (next === "\n") i++;
      else if (next === "\r") i += input[i + 2] === "\n" ? 2 : 1;
      else if (next !== undefined) {
        cur += next;
        has = true;
        i++;
      }
      continue;
    }
    if (/\s/.test(c)) {
      if (has) out.push(cur);
      cur = "";
      has = false;
      continue;
    }
    cur += c;
    has = true;
  }
  if (quote) throw new ConvertError("A quote in the cURL command is not closed.");
  if (has) out.push(cur);
  return out;
}

type RawRequest = {
  method?: string;
  url: string;
  headers: [string, string][];
  body?: string;
  form?: [string, string][];
  basicUser?: boolean;
  name?: string;
  title?: string;
  description?: string;
};

const VALUE_FLAGS = new Set([
  "-X", "--request", "-H", "--header", "-d", "--data", "--data-raw",
  "--data-binary", "--data-ascii", "--data-urlencode", "--json", "-u",
  "--user", "-F", "--form", "--url", "-A", "--user-agent", "-e", "--referer",
  "-b", "--cookie", "-o", "--output", "-m", "--max-time", "--connect-timeout",
  "-x", "--proxy", "-c", "--cookie-jar", "-w", "--write-out", "--retry", "-T",
  "--upload-file", "--cacert", "--cert", "--key", "-E", "-r", "--range", "-K",
  "--config", "--resolve", "--connect-to", "--oauth2-bearer",
]);

function parseCurl(input: string, warnings: string[]): RawRequest {
  const tokens = shellSplit(input);
  if (tokens[0]?.toLowerCase() !== "curl")
    throw new ConvertError("Start the command with curl.");
  const req: RawRequest = { url: "", headers: [] };
  const data: string[] = [];
  let asQuery = false;
  let json = false;
  for (let i = 1; i < tokens.length; i++) {
    let flag = tokens[i];
    let value: string | undefined;
    if (flag.startsWith("--") && flag.includes("=")) {
      value = flag.slice(flag.indexOf("=") + 1);
      flag = flag.slice(0, flag.indexOf("="));
    } else if (/^-[A-Za-z]./.test(flag) && VALUE_FLAGS.has(flag.slice(0, 2))) {
      value = flag.slice(2);
      flag = flag.slice(0, 2);
    }
    const take = () => {
      if (value !== undefined) return value;
      const next = tokens[++i];
      if (next === undefined) throw new ConvertError(`${flag} needs a value.`);
      return next;
    };
    switch (flag) {
      case "-X":
      case "--request":
        req.method = take().toUpperCase();
        break;
      case "-H":
      case "--header": {
        const h = take();
        const k = h.indexOf(":");
        if (k > 0) req.headers.push([h.slice(0, k).trim(), h.slice(k + 1).trim()]);
        break;
      }
      case "-d":
      case "--data":
      case "--data-raw":
      case "--data-binary":
      case "--data-ascii":
      case "--data-urlencode":
        data.push(take());
        break;
      case "--json":
        data.push(take());
        json = true;
        break;
      case "-F":
      case "--form": {
        const f = take();
        const k = f.indexOf("=");
        if (k > 0) (req.form ??= []).push([f.slice(0, k), f.slice(k + 1)]);
        break;
      }
      case "-u":
      case "--user":
        take();
        req.basicUser = true;
        break;
      case "--oauth2-bearer":
        take();
        req.headers.push(["Authorization", "Bearer {{secret}}"]);
        break;
      case "-G":
      case "--get":
        asQuery = true;
        break;
      case "-I":
      case "--head":
        req.method = "HEAD";
        break;
      case "--url":
        req.url = take();
        break;
      default:
        if (VALUE_FLAGS.has(flag)) take();
        else if (!flag.startsWith("-") && !req.url) req.url = flag;
    }
  }
  if (!req.url) throw new ConvertError("No URL found in the cURL command.");
  if (data.length) {
    if (asQuery)
      req.url += (req.url.includes("?") ? "&" : "?") + data.join("&");
    else {
      req.body = data.length === 1 ? data[0] : data.join("&");
      req.method ??= "POST";
    }
  }
  if (json) req.headers.push(["Content-Type", "application/json"]);
  if (req.form) req.method ??= "POST";
  req.method ??= "GET";
  if (req.body?.startsWith("@"))
    warnings.push("The body is read from a file, so its fields are unknown.");
  return req;
}

function toUrl(raw: string): URL {
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    return url;
  } catch {
    throw new ConvertError("The URL could not be read.");
  }
}

const ID_SEGMENT =
  /^(\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-z]{2,6}_[A-Za-z0-9]{6,}|[0-9a-f]{24,})$/i;

function templatePath(pathname: string, used: Set<string>) {
  const segments = pathname.split("/").filter(Boolean);
  const params: Record<string, string> = {};
  const decoded = segments.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });
  const path = decoded.map((segment, i) => {
    // Shopify and Zendesk put ".json" after ids: /tickets/{id}.json
    const ext = segment.match(/\.(json|xml)$/i)?.[0] ?? "";
    const s = ext ? segment.slice(0, -ext.length) : segment;
    const marked = s.match(/^\{(.+)\}$/) ?? s.match(/^:(.+)$/) ?? s.match(/^<(.+)>$/);
    let original = marked?.[1];
    if (!original && ID_SEGMENT.test(s))
      original = `${singular(snake(decoded[i - 1] ?? "item")) || "item"}_id`;
    if (!original) return segment;
    const prop = propName(original, used);
    params[prop] = prop;
    return `{${prop}}${ext}`;
  });
  return { path: `/${path.join("/")}`, params };
}

function deriveName(method: string, path: string) {
  const segments = path.split("/").filter(Boolean);
  const statics = segments
    .filter((s) => !s.startsWith("{") && !/^v\d+(\.\d+)?$/i.test(s) && s !== "api")
    .map((s) => s.replace(/\.(json|xml)$/i, ""));
  const resource = snake(statics[statics.length - 1] ?? "") || "root";
  const endsWithParam = segments[segments.length - 1]?.startsWith("{") ?? false;
  // POST /servers/{id}/restart is an action on a record: restart_server.
  const n = segments.length;
  if (method === "POST" && n >= 3 && !endsWithParam && segments[n - 2].startsWith("{") && statics.length >= 2)
    return `${resource}_${singular(snake(statics[statics.length - 2]))}`;
  const verb =
    ({
      GET: endsWithParam ? "get" : "list",
      POST: "create",
      PUT: "update",
      PATCH: "update",
      DELETE: "delete",
      HEAD: "check",
      OPTIONS: "describe",
    } as Record<string, string>)[method] ?? method.toLowerCase();
  return `${verb}_${verb === "list" ? resource : singular(resource)}`;
}

function annotations(method: string) {
  return {
    readOnlyHint: ["GET", "HEAD", "OPTIONS"].includes(method),
    destructiveHint: method === "DELETE",
    idempotentHint: ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"].includes(method),
    openWorldHint: true,
  };
}

export function inferSchema(value: unknown, key = "", depth = 0): JsonSchema {
  if (depth > 8) return {};
  const secret = SECRET_KEY.test(key);
  if (value === null) return { type: "null" };
  if (Array.isArray(value))
    return { type: "array", items: value.length ? inferSchema(value[0], key, depth + 1) : {} };
  if (typeof value === "string")
    return secret ? { type: "string" } : { type: "string", examples: [clip(value, 80)] };
  if (typeof value === "number")
    return {
      type: Number.isInteger(value) ? "integer" : "number",
      ...(secret ? {} : { examples: [value] }),
    };
  if (typeof value === "boolean") return { type: "boolean" };
  if (isObj(value)) {
    const properties: Record<string, JsonSchema> = {};
    for (const [k, v] of Object.entries(value).slice(0, 100))
      if (!RESERVED.has(k)) properties[k] = inferSchema(v, k, depth + 1);
    return { type: "object", properties };
  }
  return {};
}

const scalarSchema = (key: string, value: string): JsonSchema =>
  /^-?\d{1,15}$/.test(value)
    ? inferSchema(Number(value), key)
    : value === "true" || value === "false"
      ? { type: "boolean" }
      : inferSchema(value, key);

function detectAuth(headers: [string, string][], basicUser?: boolean): Auth {
  for (const [k, v] of headers) {
    const lk = k.toLowerCase();
    if (lk === "authorization")
      return /^bearer/i.test(v)
        ? { type: "bearer" }
        : /^basic/i.test(v)
          ? { type: "basic" }
          : { type: "header", header: k };
    if (SECRET_KEY.test(lk)) return { type: "header", header: k };
  }
  return basicUser ? { type: "basic" } : { type: "none" };
}

type Built = { origin: string; auth: Auth; headers: Record<string, string>; tool: ManifestTool };

function fromRaw(raw: RawRequest, warnings: string[]): Built {
  const url = toUrl(raw.url);
  const method = (raw.method ?? "GET").toUpperCase();
  const used = new Set<string>();
  const { path, params: pathParams } = templatePath(url.pathname, used);
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  const params: ToolParams = { path: pathParams, query: {}, body: {}, bodyType: null };
  for (const prop of Object.keys(pathParams)) {
    properties[prop] = { type: "string", description: `The ${prop.replace(/_/g, " ")}.` };
    required.push(prop);
  }
  let auth = detectAuth(raw.headers, raw.basicUser);
  for (const [k, v] of url.searchParams) {
    if (SECRET_QUERY.test(k)) {
      auth = { type: "query", name: k };
      warnings.push(`Removed the ${k} value from the URL. Add it as a secret when you deploy.`);
      continue;
    }
    const prop = propName(k, used);
    properties[prop] = scalarSchema(k, v);
    params.query[prop] = k;
  }
  const addBody = (key: string, schema: JsonSchema) => {
    if (RESERVED.has(key)) return;
    const prop = propName(key, used);
    properties[prop] = schema;
    params.body[prop] = key;
  };
  const contentType =
    raw.headers.find(([k]) => k.toLowerCase() === "content-type")?.[1] ?? "";
  if (raw.form) {
    params.bodyType = "form";
    for (const [k, v] of raw.form)
      addBody(k, v.startsWith("@") ? { type: "string", description: "File contents." } : scalarSchema(k, v));
  } else if (raw.body !== undefined) {
    let parsed: { value: unknown } | null = null;
    try {
      parsed = { value: JSON.parse(raw.body) };
    } catch {}
    if (parsed && isObj(parsed.value)) {
      params.bodyType = "json";
      for (const [k, v] of Object.entries(parsed.value).slice(0, 100))
        addBody(k, inferSchema(v, k));
    } else if (parsed) {
      params.bodyType = "json";
      params.wholeBody = propName("body", used);
      properties[params.wholeBody] = inferSchema(parsed.value);
    } else if (!raw.body.startsWith("@") && raw.body.includes("=") && !contentType.includes("json")) {
      params.bodyType = "form";
      for (const [k, v] of new URLSearchParams(raw.body)) addBody(k, scalarSchema(k, v));
    } else {
      params.bodyType = "raw";
      params.wholeBody = propName("body", used);
      properties[params.wholeBody] = { type: "string" };
    }
  }
  const headers: Record<string, string> = {};
  for (const [k, v] of raw.headers) {
    const lk = k.toLowerCase();
    if (SKIP_HEADERS.has(lk) || (auth.type === "header" && auth.header.toLowerCase() === lk)) continue;
    if (lk === "cookie" || SECRET_KEY.test(lk) || /[A-Za-z0-9_\-]{32,}/.test(v)) {
      warnings.push(`Dropped the ${k} header because it may hold a secret.`);
      continue;
    }
    if (!RESERVED.has(k)) headers[k] = clip(v, 200);
  }
  const name = raw.name ? snake(raw.name) || deriveName(method, path) : deriveName(method, path);
  const words = deriveName(method, path).replace(/_/g, " ");
  return {
    origin: url.origin,
    auth,
    headers,
    tool: {
      name,
      title: clip(raw.title ?? raw.name ?? words[0].toUpperCase() + words.slice(1), 120),
      description: clip(
        raw.description?.trim() || `${words[0].toUpperCase()}${words.slice(1)} on ${url.host}.`,
        600,
      ),
      method,
      path,
      inputSchema: { type: "object", properties, ...(required.length ? { required } : {}) },
      annotations: annotations(method),
      params,
    },
  };
}

function finalize(
  source: Source,
  name: string,
  baseUrl: string,
  auth: Auth,
  headers: Record<string, string>,
  tools: ManifestTool[],
  warnings: string[],
): ConvertResult {
  if (!tools.length) throw new ConvertError("No API operations were found.");
  if (tools.length > LIMITS.tools) {
    warnings.push(`Kept the first ${LIMITS.tools} of ${tools.length} operations.`);
    tools = tools.slice(0, LIMITS.tools);
  }
  // Last line of defence: a key pasted into the wrong place (e.g. fused into the
  // URL) is still removed. Found by the fuzz test, not by a real report.
  const json = JSON.stringify({ tools, headers, baseUrl });
  if (SECRET_VALUE.test(json)) {
    warnings.push("Removed something that looked like a secret key.");
    ({ tools, headers, baseUrl } = JSON.parse(json.replace(new RegExp(SECRET_VALUE.source, "g"), "secret")));
  }
  const names = new Set<string>();
  for (const tool of tools) {
    let n = snake(tool.name).slice(0, 64) || "tool";
    const base = n;
    for (let i = 2; names.has(n); i++) n = `${base.slice(0, 60)}_${i}`;
    names.add(n);
    tool.name = n;
    if (JSON.stringify(tool.inputSchema).length > LIMITS.schemaChars) {
      warnings.push(`Simplified the input schema of ${n} because it was too large.`);
      tool.inputSchema = { type: "object", properties: {} };
    }
    if (tool.responseSchema && JSON.stringify(tool.responseSchema).length > LIMITS.schemaChars)
      delete tool.responseSchema;
  }
  return {
    ok: true,
    source,
    warnings: [...new Set(warnings)],
    manifest: {
      version: "accord.manifest/v1",
      name: clip(name.trim() || "API", 80),
      baseUrl,
      auth,
      headers,
      tools,
    },
  };
}

function fromRequests(source: Source, name: string | undefined, raws: RawRequest[], warnings: string[]) {
  const built = raws.map((r) => fromRaw(r, warnings));
  const first = built[0];
  for (const b of built.slice(1))
    if (b.origin !== first.origin) b.tool.server = b.origin;
  const auth = built.find((b) => b.auth.type !== "none")?.auth ?? { type: "none" as const };
  return finalize(
    source,
    name ?? new URL(first.origin).host,
    first.origin,
    auth,
    Object.assign({}, ...built.map((b) => b.headers)),
    built.map((b) => b.tool),
    warnings,
  );
}

// ---------- OpenAPI 3 / Swagger 2 ----------

function pointer(doc: Obj, ref: string): unknown {
  let node: unknown = doc;
  for (const part of ref.slice(2).split("/")) {
    const key = decodeURIComponent(part).replace(/~1/g, "/").replace(/~0/g, "~");
    if (!isObj(node) && !Array.isArray(node)) return undefined;
    if (!Object.prototype.hasOwnProperty.call(node, key)) return undefined;
    node = (node as Obj)[key];
  }
  return node;
}

function makeDeref(doc: Obj, warnings: string[]) {
  let budget = LIMITS.expandedNodes;
  const deref = (node: unknown, depth = 0, stack: ReadonlySet<string> = new Set()): unknown => {
    if (--budget < 0) throw new ConvertError("This spec is too large to expand. Split it and try again.");
    if (depth > LIMITS.refDepth) return {};
    if (Array.isArray(node)) return node.map((n) => deref(n, depth + 1, stack));
    if (!isObj(node)) return node;
    const ref = str(node.$ref);
    if (ref !== undefined) {
      if (!ref.startsWith("#/")) {
        warnings.push("Skipped a $ref that points outside this file.");
        return {};
      }
      if (stack.has(ref)) return {};
      const target = pointer(doc, ref);
      if (target === undefined) {
        warnings.push(`Could not find ${clip(ref, 80)}.`);
        return {};
      }
      return deref(target, depth + 1, new Set([...stack, ref]));
    }
    const out: Obj = {};
    for (const [k, v] of Object.entries(node)) {
      if (RESERVED.has(k) || k.startsWith("x-") || k === "xml" || k === "externalDocs" || k === "discriminator")
        continue;
      out[k] = deref(v, depth + 1, stack);
    }
    return out;
  };
  return deref;
}

function swaggerParamSchema(p: Obj): JsonSchema {
  const out: JsonSchema = {};
  for (const k of ["type", "format", "items", "enum", "default", "minimum", "maximum", "pattern"])
    if (p[k] !== undefined) out[k] = p[k];
  if (out.type === "file") out.type = "string";
  return out;
}

function specAuth(doc: Obj, deref: (n: unknown) => unknown): Auth {
  const schemes = (isObj(doc.components) ? doc.components.securitySchemes : undefined) ?? doc.securityDefinitions;
  if (!isObj(schemes)) return { type: "none" };
  const first = deref(Object.values(schemes)[0]);
  if (!isObj(first)) return { type: "none" };
  const type = str(first.type);
  const scheme = str(first.scheme)?.toLowerCase();
  if (type === "oauth2" || type === "openIdConnect" || (type === "http" && scheme === "bearer"))
    return { type: "bearer" };
  if (type === "basic" || (type === "http" && scheme === "basic")) return { type: "basic" };
  if (type === "apiKey" && str(first.name))
    return first.in === "query"
      ? { type: "query", name: str(first.name)! }
      : { type: "header", header: str(first.name)! };
  return { type: "none" };
}

function specBaseUrl(doc: Obj, source: Source, warnings: string[]) {
  let base: string | undefined;
  if (source === "swagger") {
    if (str(doc.host)) {
      const scheme = Array.isArray(doc.schemes) && str(doc.schemes[0]) ? doc.schemes[0] : "https";
      base = `${scheme}://${doc.host}${str(doc.basePath) ?? ""}`;
    }
  } else if (Array.isArray(doc.servers) && isObj(doc.servers[0]) && str(doc.servers[0].url)) {
    const server = doc.servers[0];
    const vars = isObj(server.variables) ? server.variables : {};
    base = str(server.url)!.replace(/\{([^}]+)\}/g, (_, v: string) => {
      const def = isObj(vars[v]) ? str((vars[v] as Obj).default) : undefined;
      return def ?? v;
    });
  }
  if (!base || base.startsWith("/")) {
    warnings.push("The spec has no absolute server URL. Set the real base URL when you deploy.");
    return `${PLACEHOLDER_BASE}${base ?? ""}`.replace(/\/$/, "");
  }
  try {
    return toUrl(base).href.replace(/\/$/, "");
  } catch {
    warnings.push("The server URL could not be read. Set the real base URL when you deploy.");
    return PLACEHOLDER_BASE;
  }
}

function pickContent(content: unknown): { type: string; schema: unknown } | undefined {
  if (!isObj(content)) return undefined;
  const keys = Object.keys(content);
  const key =
    keys.find((k) => k.includes("json")) ??
    keys.find((k) => k.includes("x-www-form-urlencoded")) ??
    keys.find((k) => k.includes("multipart")) ??
    keys[0];
  const entry = key ? content[key] : undefined;
  return key && isObj(entry) ? { type: key, schema: entry.schema } : undefined;
}

function fromSpec(doc: Obj, source: Source, warnings: string[]): ConvertResult {
  const deref = makeDeref(doc, warnings);
  const auth = specAuth(doc, (n) => deref(n));
  const baseUrl = specBaseUrl(doc, source, warnings);
  const tools: ManifestTool[] = [];
  const paths = isObj(doc.paths) ? doc.paths : {};
  let total = 0;
  for (const [path, rawItem] of Object.entries(paths)) {
    const item = deref(rawItem);
    if (!isObj(item)) continue;
    const shared = Array.isArray(item.parameters) ? item.parameters : [];
    for (const method of METHODS) {
      const op = item[method];
      if (!isObj(op)) continue;
      if (++total > LIMITS.tools) continue;
      const used = new Set<string>();
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      const params: ToolParams = { path: {}, query: {}, body: {}, bodyType: null };
      const opParams = [...shared, ...(Array.isArray(op.parameters) ? op.parameters : [])];
      const seen = new Set<string>();
      for (const p of opParams.reverse()) {
        if (!isObj(p) || !str(p.name) || !str(p.in)) continue;
        const name = str(p.name)!;
        const where = str(p.in)!;
        if (seen.has(`${where}:${name}`)) continue;
        seen.add(`${where}:${name}`);
        if (auth.type === "header" && where === "header" && name.toLowerCase() === auth.header.toLowerCase()) continue;
        if (auth.type === "query" && where === "query" && name === auth.name) continue;
        if (where === "header" || where === "cookie") continue;
        if (where === "body") {
          const schema = isObj(p.schema) ? p.schema : {};
          params.bodyType = "json";
          if (isObj(schema.properties)) {
            const req = Array.isArray(schema.required) ? schema.required : [];
            for (const [k, v] of Object.entries(schema.properties)) {
              if (RESERVED.has(k)) continue;
              const prop = propName(k, used);
              properties[prop] = isObj(v) ? v : {};
              params.body[prop] = k;
              if (req.includes(k)) required.push(prop);
            }
          } else {
            params.wholeBody = propName("body", used);
            properties[params.wholeBody] = schema;
            if (p.required) required.push(params.wholeBody);
          }
          continue;
        }
        const prop = propName(name, used);
        const schema = isObj(p.schema) ? { ...p.schema } : swaggerParamSchema(p);
        if (str(p.description)) schema.description = clip(str(p.description)!, 300);
        properties[prop] = schema;
        if (where === "path") params.path[prop] = name;
        else if (where === "formData") {
          params.bodyType = "form";
          params.body[prop] = name;
        } else params.query[prop] = name;
        if (p.required || where === "path") required.push(prop);
      }
      const body = isObj(op.requestBody) ? pickContent(op.requestBody.content) : undefined;
      if (body) {
        params.bodyType = body.type.includes("json") ? "json" : body.type.includes("form") || body.type.includes("multipart") ? "form" : "raw";
        const schema = isObj(body.schema) ? body.schema : {};
        if (isObj(schema.properties)) {
          const req = Array.isArray(schema.required) ? schema.required : [];
          for (const [k, v] of Object.entries(schema.properties)) {
            if (RESERVED.has(k)) continue;
            const prop = propName(k, used);
            properties[prop] = isObj(v) ? v : {};
            params.body[prop] = k;
            if (req.includes(k)) required.push(prop);
          }
        } else {
          params.wholeBody = propName("body", used);
          properties[params.wholeBody] = schema;
          if (isObj(op.requestBody) && op.requestBody.required) required.push(params.wholeBody);
        }
      }
      let responseSchema: JsonSchema | undefined;
      if (isObj(op.responses)) {
        const code = ["200", "201", "202"].find((c) => isObj((op.responses as Obj)[c])) ?? Object.keys(op.responses).find((c) => /^2/.test(c));
        const res = code ? (op.responses as Obj)[code] : undefined;
        if (isObj(res)) {
          const schema = source === "swagger" ? res.schema : pickContent(res.content)?.schema;
          if (isObj(schema)) responseSchema = schema;
        }
      }
      const verb = method.toUpperCase();
      const summary = str(op.summary)?.trim();
      const detail = str(op.description)?.trim();
      const name = str(op.operationId) ?? deriveName(verb, path);
      tools.push({
        name,
        title: clip(summary || name.replace(/_/g, " "), 120),
        description: clip([summary, detail].filter(Boolean).join(". ") || `${verb} ${path}`, 600),
        method: verb,
        path,
        inputSchema: { type: "object", properties, ...(required.length ? { required: [...new Set(required)] } : {}) },
        annotations: annotations(verb),
        params,
        ...(responseSchema ? { responseSchema } : {}),
      });
    }
  }
  if (total > LIMITS.tools) warnings.push(`Kept the first ${LIMITS.tools} of ${total} operations.`);
  const info = isObj(doc.info) ? doc.info : {};
  return finalize(source, str(info.title) ?? "API", baseUrl, auth, {}, tools, warnings);
}

// ---------- Postman v2.1 ----------

function isPostman(doc: Obj) {
  const info = isObj(doc.info) ? doc.info : undefined;
  return Boolean(info && (str(info.schema)?.includes("postman") || (Array.isArray(doc.item) && str(info._postman_id))));
}

function fromPostman(doc: Obj, warnings: string[]): ConvertResult {
  const vars: Record<string, string> = {};
  for (const v of Array.isArray(doc.variable) ? doc.variable : [])
    if (isObj(v) && str(v.key) && str(v.value) && !SECRET_KEY.test(str(v.key)!))
      vars[str(v.key)!] = str(v.value)!;
  const fill = (s: string) =>
    s.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (m, k: string) => vars[k] ?? m);
  const items: Obj[] = [];
  const walk = (list: unknown, depth: number) => {
    if (!Array.isArray(list) || depth > 10) return;
    for (const it of list) {
      if (!isObj(it)) continue;
      if (Array.isArray(it.item)) walk(it.item, depth + 1);
      else if (it.request) items.push(it);
    }
  };
  walk(doc.item, 0);
  const collectionAuth = isObj(doc.auth) ? doc.auth : undefined;
  const raws: RawRequest[] = [];
  for (const it of items.slice(0, LIMITS.tools)) {
    const req: Obj = isObj(it.request) ? it.request : { url: it.request, method: "GET" };
    let url = str(req.url) ?? (isObj(req.url) ? str(req.url.raw) : undefined) ?? "";
    url = fill(url);
    if (/^\{\{/.test(url)) {
      warnings.push("A Postman base URL variable was not set. Set the real base URL when you deploy.");
      url = url.replace(/^\{\{[^}]+\}\}/, PLACEHOLDER_BASE);
    }
    url = url.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, ":$1");
    const headers: [string, string][] = [];
    for (const h of Array.isArray(req.header) ? req.header : [])
      if (isObj(h) && !h.disabled && str(h.key)) headers.push([str(h.key)!, fill(str(h.value) ?? "")]);
    const auth = isObj(req.auth) ? req.auth : collectionAuth;
    if (auth?.type === "bearer" || auth?.type === "oauth2") headers.push(["Authorization", "Bearer {{secret}}"]);
    if (auth?.type === "basic") headers.push(["Authorization", "Basic {{secret}}"]);
    if (auth?.type === "apikey" && Array.isArray(auth.apikey)) {
      const key = auth.apikey.find((e) => isObj(e) && e.key === "key");
      const keyName = isObj(key) ? str(key.value) : undefined;
      if (keyName) headers.push([keyName, "{{secret}}"]);
    }
    const raw: RawRequest = {
      method: str(req.method)?.toUpperCase() ?? "GET",
      url,
      headers,
      name: str(it.name),
      description: str(req.description) ?? (isObj(req.description) ? str(req.description.content) : undefined),
    };
    const body = isObj(req.body) ? req.body : undefined;
    if (body?.mode === "raw" && str(body.raw)) raw.body = fill(str(body.raw)!);
    if ((body?.mode === "urlencoded" || body?.mode === "formdata") && Array.isArray(body[body.mode as string])) {
      raw.form = [];
      for (const f of body[body.mode as string] as unknown[])
        if (isObj(f) && !f.disabled && str(f.key)) raw.form.push([str(f.key)!, str(f.value) ?? ""]);
    }
    raws.push(raw);
  }
  if (items.length > LIMITS.tools)
    warnings.push(`Kept the first ${LIMITS.tools} of ${items.length} requests.`);
  if (!raws.length) throw new ConvertError("No requests were found in this collection.");
  const info = isObj(doc.info) ? doc.info : {};
  return fromRequests("postman", str(info.name), raws, warnings);
}

// ---------- Entry point ----------

export function convert(input: string): ConvertResult {
  const warnings: string[] = [];
  try {
    if (typeof input !== "string" || !input.trim())
      throw new ConvertError("Paste a cURL command or an API spec.");
    if (input.length > LIMITS.inputChars)
      throw new ConvertError("This input is over 1 MB. Trim the spec and try again.");
    const text = input.trim();
    if (/^\s*(\$\s+)?curl\s/im.test(text) && !/^[{[]/.test(text) && !/^(openapi|swagger)\s*:/im.test(text)) {
      // One tool per curl command. A "# name: description" line above a
      // command names the tool; a plain "# ..." line describes it.
      const commands: { text: string; comment?: string }[] = [];
      let pending: string | undefined;
      for (const line of text.split(/\r?\n/)) {
        const t = line.trim().replace(/^\$\s+/, "");
        const continued = commands.length > 0 && /\\\s*$/.test(commands[commands.length - 1].text);
        if (/^curl(\s|$)/i.test(t) && !continued) {
          commands.push({ text: t, comment: pending });
          pending = undefined;
        } else if (t.startsWith("#") && !continued) pending = t.replace(/^#+\s*/, "");
        else if (commands.length && t) commands[commands.length - 1].text += `\n${line}`;
      }
      const raws = commands.slice(0, LIMITS.tools).map((c) => {
        const raw = parseCurl(c.text, warnings);
        const named = c.comment?.match(/^([A-Za-z][A-Za-z0-9_]{1,63})\s*:\s*(.+)$/);
        if (named) {
          raw.name = named[1];
          raw.title = raw.description = named[2];
        } else if (c.comment) raw.title = raw.description = c.comment;
        return raw;
      });
      return fromRequests("curl", undefined, raws, warnings);
    }
    let doc: unknown;
    try {
      doc = JSON.parse(text);
    } catch {
      try {
        doc = parseYaml(text, { maxAliasCount: 100, logLevel: "silent" });
      } catch {
        throw new ConvertError("This is not a cURL command, JSON or YAML.");
      }
    }
    if (!isObj(doc)) throw new ConvertError("This is not a cURL command, JSON or YAML.");
    if (str(doc.openapi)?.startsWith("3")) return fromSpec(doc, "openapi", warnings);
    if (String(doc.swagger ?? "").startsWith("2")) return fromSpec(doc, "swagger", warnings);
    if (isPostman(doc)) return fromPostman(doc, warnings);
    throw new ConvertError(
      "We could not tell what this is. Paste a cURL command, OpenAPI 3, Swagger 2 or a Postman v2.1 collection.",
    );
  } catch (e) {
    return {
      ok: false,
      error: e instanceof ConvertError ? e.message : "This input could not be converted.",
    };
  }
}
