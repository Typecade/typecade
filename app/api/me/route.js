// GET /api/me: the signed-in wallet and what its $TYPECADE allows (make games from HOLDER_MIN_SOL, like from LIKE_MIN_SOL).
import { HOLDER_MIN_SOL, LIKE_MIN_SOL } from "../../../lib/config.js";
import { gameMint, holding } from "../../../lib/holding.js";
import { sessionWallet } from "../../../lib/session.js";

export const runtime = "nodejs";

export async function GET(req) {
  const wallet = await sessionWallet(req);
  const fresh = new URL(req.url).searchParams.has("fresh");
  const mint = await gameMint();
  const devOpen = false; // the browser always sees the real holder rules (see app/api/build)
  if (!wallet) return Response.json({ wallet: null, mint, devOpen, holderMinSol: HOLDER_MIN_SOL, likeMinSol: LIKE_MIN_SOL }, { headers: { "cache-control": "no-store" } });
  const hold = await holding(wallet, fresh).catch(() => ({ holder: false, liker: false, sol: 0, reason: "The balance could not be read just now. Try again in a minute." }));
  return Response.json({ wallet, mint, devOpen, hold, holderMinSol: HOLDER_MIN_SOL, likeMinSol: LIKE_MIN_SOL }, { headers: { "cache-control": "no-store" } });
}
