// POST /api/auth/login {wallet, nonce, signature, signedMessage}: starts a session (an httpOnly cookie). The wallet is the
// account; the first sign-in creates it.
// Only the wallet's own Sign In With Solana is accepted: the wallet writes the message itself and refuses to sign when the
// page asking is not the domain named in it, so a look-alike site cannot collect a sign-in for typecade.app. We check
// the domain, the address and the one-time nonce in the signed text, then the signature over exactly those bytes.
import bs58 from "bs58";
import nacl from "tweetnacl";
import { allow, clientIp, sameOrigin } from "../../../../lib/guard.js";
import { redis } from "../../../../lib/store.js";
import { startSession, takeNonce } from "../../../../lib/session.js";

export const runtime = "nodejs";

const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const fail = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req) {
  if (!sameOrigin(req)) return Response.json({ error: "Sign in on typecade.app." }, { status: 403 });
  if (!(await allow("login", clientIp(req), 30, 600))) return Response.json({ error: "Too many sign-in attempts. Wait a minute." }, { status: 429 });
  const { wallet, nonce, signature, signedMessage } = await req.json().catch(() => ({}));
  if (typeof wallet !== "string" || !B58.test(wallet)) return fail("Not a Solana wallet.");
  if (!signedMessage) return fail("Sign in with a wallet that supports Sign In With Solana, such as Phantom, Solflare or Backpack.");
  const n = await takeNonce(String(nonce ?? ""));
  if (!n) return fail("This sign-in request expired. Try again.");
  let message, text;
  try {
    message = Uint8Array.from(Buffer.from(String(signedMessage), "base64"));
    text = new TextDecoder("utf-8", { fatal: true }).decode(message);
  } catch {
    return fail("The signed message could not be read.");
  }
  if (message.length > 2048) return fail("The signed message is too long.");
  const lines = text.split("\n");
  // the domain the wallet signed for must be the host this request was sent to
  const domains = [new URL(req.url).host, req.headers.get("host"), "typecade.app"].filter(Boolean);
  const ok = domains.some((d) => lines[0] === `${d} wants you to sign in with your Solana account:`)
    && lines[1] === wallet && lines.includes(`Nonce: ${nonce}`);
  if (!ok) return fail("The signed message is not this site's sign-in.", 401);
  let valid = false;
  try {
    valid = nacl.sign.detached.verify(message, bs58.decode(String(signature)), bs58.decode(wallet));
  } catch {}
  if (!valid) return fail("The signature does not match this wallet.", 401);
  const s = await startSession(wallet);
  if ((await redis(["SET", `tg:acct:${wallet}`, String(Date.now()), "NX"])) === "OK") await redis(["INCRBY", "tg:stat:wallets", "1"]);
  return Response.json({ wallet }, { headers: { "set-cookie": s.cookie, "cache-control": "no-store" } });
}
