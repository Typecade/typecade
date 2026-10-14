// Accounts are wallets. Signing in follows Sign In With Solana: the server hands out a one-time nonce, the wallet writes and
// signs a message naming the site, the wallet and that nonce, and the server answers with a session cookie (14 days,
// httpOnly, its id random and stored as tg:sess:<id> -> wallet). Works in Node and on the edge.
import { getJson, redis, setJson } from "./store.js";

export const COOKIE = "tg_session";
const DAYS = 14; // a stolen cookie is worth less the sooner it expires


const rand = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function newNonce() {
  const nonce = rand(12), issuedAt = new Date().toISOString();
  await setJson(`tg:nonce:${nonce}`, { issuedAt }, 600);
  return { nonce, issuedAt };
}
// a nonce is good once, for ten minutes: read and deleted in one step, so two requests can never both use it
export async function takeNonce(nonce) {
  if (!/^[0-9a-f]{24}$/.test(nonce)) return null;
  const v = await redis(["GETDEL", `tg:nonce:${nonce}`]);
  return v ? JSON.parse(v) : null;
}

export async function startSession(wallet) {
  const id = rand(24);
  await redis(["SET", `tg:sess:${id}`, wallet, "EX", String(DAYS * 86400)]);
  return { id, cookie: `${COOKIE}=${id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DAYS * 86400}` };
}
export const endCookie = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

function sessionId(req) {
  const c = req.headers.get("cookie") ?? "";
  const m = c.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([0-9a-f]{48})`));
  return m?.[1] ?? null;
}
// the signed-in wallet, or null
export async function sessionWallet(req) {
  const id = sessionId(req);
  return id ? await redis(["GET", `tg:sess:${id}`]) : null;
}
export async function endSession(req) {
  const id = sessionId(req);
  if (id) await redis(["DEL", `tg:sess:${id}`]);
}
export const unauth = () => Response.json({ error: "Not signed in." }, { status: 401 });
