// Upstash Redis over REST (works on the edge and in Node), a memory map on a laptop. Every key starts with "tg:".
// Production never falls back to memory: limits, keys and sessions would silently stop being shared, so it fails closed.
const R_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const R_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const mem = (globalThis.__tgMem ??= new Map());
const LOCAL = !R_URL || !R_TOKEN;
// checked on use, not on import, so a build without the store's env still compiles
function local(cmd) {
  if (process.env.NODE_ENV === "production" && process.env.TG_ALLOW_MEMORY_STORE !== "1") throw new Error("Typecade needs KV_REST_API_URL and KV_REST_API_TOKEN in production.");
  return memory(cmd);
}

function memory([op, key, ...a]) {
  const live = () => {
    const e = mem.get(key);
    if (e?.exp && e.exp < Date.now()) mem.delete(key);
    return mem.get(key);
  };
  switch (op) {
    case "GET": return live()?.v ?? null;
    case "GETDEL": { const v = live()?.v ?? null; mem.delete(key); return v; }
    case "SET": {
      if (a.includes("NX") && live()) return null;
      const ex = a.indexOf("EX");
      mem.set(key, { v: String(a[0]), exp: ex >= 0 ? Date.now() + Number(a[ex + 1]) * 1000 : undefined });
      return "OK";
    }
    case "DEL": return mem.delete(key) ? 1 : 0;
    case "EXISTS": return live() ? 1 : 0;
    case "INCRBY": {
      const n = Number(live()?.v ?? 0) + Number(a[0]);
      mem.set(key, { v: String(n), exp: live()?.exp });
      return n;
    }
    case "EXPIRE": {
      const e = live();
      if (e) e.exp = Date.now() + Number(a[0]) * 1000;
      return e ? 1 : 0;
    }
    case "LPUSH": {
      const l = live()?.v ?? [];
      const v = Array.isArray(l) ? l : [];
      v.unshift(...a.map(String));
      mem.set(key, { v, exp: live()?.exp });
      return v.length;
    }
    case "LRANGE": {
      const l = live()?.v;
      if (!Array.isArray(l)) return [];
      const end = Number(a[1]) < 0 ? l.length + Number(a[1]) : Number(a[1]);
      return l.slice(Number(a[0]), end + 1);
    }
    case "LREM": {
      const l = live()?.v;
      if (!Array.isArray(l)) return 0;
      const keep = l.filter((x) => x !== String(a[1]));
      mem.set(key, { v: keep, exp: live()?.exp });
      return l.length - keep.length;
    }
    case "LTRIM": {
      const l = live()?.v;
      if (Array.isArray(l)) mem.set(key, { v: l.slice(Number(a[0]), Number(a[1]) + 1), exp: live()?.exp });
      return "OK";
    }
    case "SADD": { const v = live()?.v; const set = v instanceof Set ? v : new Set(); const n0 = set.size; a.forEach((x) => set.add(String(x))); mem.set(key, { v: set }); return set.size - n0; }
    case "SISMEMBER": { const v = live()?.v; return v instanceof Set && v.has(String(a[0])) ? 1 : 0; }
    case "SCARD": { const v = live()?.v; return v instanceof Set ? v.size : 0; }
    case "ZINCRBY": { const v = live()?.v; const z = v instanceof Map ? v : new Map(); const n = (z.get(String(a[1])) ?? 0) + Number(a[0]); z.set(String(a[1]), n); mem.set(key, { v: z, exp: live()?.exp }); return String(n); }
    case "ZSCORE": { const v = live()?.v; return v instanceof Map && v.has(String(a[0])) ? String(v.get(String(a[0]))) : null; }
    case "ZREVRANGE": {
      const v = live()?.v; if (!(v instanceof Map)) return [];
      const rows = [...v.entries()].sort((x, y) => y[1] - x[1]).slice(Number(a[0]), Number(a[1]) + 1);
      return a.includes("WITHSCORES") ? rows.flatMap(([m, sc]) => [m, String(sc)]) : rows.map(([m]) => m);
    }
    case "MGET": return [key, ...a].map((k) => { const e = mem.get(k); return e && !(e.exp && e.exp < Date.now()) ? e.v : null; });
    default: throw new Error(`memory store: ${op} not supported`);
  }
}

// every failure throws: a limit or a key check must never read an error as "nothing used yet"
export async function redis(cmd) {
  if (LOCAL) return local(cmd);
  const r = await fetch(R_URL, { method: "POST", headers: { authorization: `Bearer ${R_TOKEN}`, "content-type": "application/json" }, body: JSON.stringify(cmd), cache: "no-store" });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || j.error) throw new Error(`store: ${j?.error ?? r.status}`);
  return j.result;
}

// several commands in one round trip
export async function pipeline(cmds) {
  if (LOCAL) return cmds.map(local);
  const r = await fetch(`${R_URL}/pipeline`, { method: "POST", headers: { authorization: `Bearer ${R_TOKEN}`, "content-type": "application/json" }, body: JSON.stringify(cmds), cache: "no-store" });
  const j = await r.json().catch(() => null);
  if (!r.ok || !Array.isArray(j)) throw new Error(`store: ${r.status}`);
  const bad = j.find((x) => x?.error);
  if (bad) throw new Error(`store: ${bad.error}`);
  return j.map((x) => x.result);
}

export const getJson = async (k) => { const v = await redis(["GET", k]); return v ? JSON.parse(v) : null; };
export const setJson = (k, v, ttl) => redis(ttl ? ["SET", k, JSON.stringify(v), "EX", ttl] : ["SET", k, JSON.stringify(v)]);
export const today = () => new Date().toISOString().slice(0, 10);
export const K = (...parts) => ["tg", ...parts].join(":");
