// Guards shared by the routes: who is asking (client IP) and how often they may ask (fixed-window counters in the store).
import { createHash, timingSafeEqual } from "node:crypto";
import { ipAddress } from "@vercel/functions";
import { K, redis } from "./store.js";

// Vercel sets the client address itself; locally there is none
export function clientIp(req) {
  return ipAddress(req) || req.headers.get("x-real-ip") || "local";
}

// true while `id` has made at most `limit` calls in the current window of `windowS` seconds
export async function allow(bucket, id, limit, windowS) {
  const slot = Math.floor(Date.now() / 1000 / windowS);
  const k = K("rl", bucket, id, slot);
  const n = await redis(["INCRBY", k, "1"]);
  if (n === 1) await redis(["EXPIRE", k, String(windowS + 5)]);
  return n <= limit;
}

// a request that spends money must come from Typecade's own pages
export function sameOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origin).host === new URL(req.url).host || new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

// the server's bearer key (BOT_KEY), compared in constant time; wrong guesses are capped per address
export async function botAuth(req, key) {
  if (!key || !(await allow("bot", clientIp(req), 20, 600))) return false;
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const h = (s) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(got), h(key));
}
// who made a game, without storing the address itself
export const ipHash = (ip) => createHash("sha256").update(`typeagame:${ip}`).digest("hex").slice(0, 20);
