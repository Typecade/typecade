// GET /api/auth/nonce?wallet=<w>: a one-time nonce (ten minutes) for the wallet's Sign In With Solana.
import { allow, clientIp } from "../../../../lib/guard.js";
import { newNonce } from "../../../../lib/session.js";

export const runtime = "nodejs";

export async function GET(req) {
  if (!(await allow("nonce", clientIp(req), 30, 600))) return Response.json({ error: "Too many sign-in attempts. Wait a minute." }, { status: 429 });
  const wallet = new URL(req.url).searchParams.get("wallet") ?? "";
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) return Response.json({ error: "Not a Solana wallet." }, { status: 400 });
  const n = await newNonce();
  return Response.json(n, { headers: { "cache-control": "no-store" } });
}
