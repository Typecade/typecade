// POST /api/like {id}: the signed-in wallet likes a game, once. Needs $TYPECADE worth LIKE_MIN_SOL; nobody likes their own game.
import { LIKE_MIN_SOL } from "../../../lib/config.js";
import { getGame, validId } from "../../../lib/games.js";
import { allow, sameOrigin } from "../../../lib/guard.js";
import { holding } from "../../../lib/holding.js";
import { like } from "../../../lib/likes.js";
import { sessionWallet } from "../../../lib/session.js";

export const runtime = "nodejs";
const no = (status, error) => Response.json({ error }, { status });

export async function POST(req) {
  if (!sameOrigin(req)) return no(403, "Like games on typecade.app.");
  const wallet = await sessionWallet(req);
  if (!wallet) return no(401, "Connect your wallet to like games.");
  const { id } = (await req.json().catch(() => null)) ?? {};
  if (!validId(id)) return no(400, "No such game.");
  if (!(await allow("like", wallet, 60, 3600))) return no(429, "That's a lot of likes. Take a break and play.");
  const g = await getGame(id);
  if (!g) return no(404, "No such game.");
  if (g.wallet && g.wallet === wallet) return no(400, "You can't like your own game.");
  const hold = await holding(wallet).catch(() => null);
  if (!hold?.liker) return no(402, `Liking takes $TYPECADE worth ${LIKE_MIN_SOL} SOL in this wallet.${hold?.reason ? " " + hold.reason + "." : ""}`);
  return Response.json(await like(id, wallet));
}
