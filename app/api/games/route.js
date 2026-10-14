// GET /api/games: the gallery (newest first, without the files) and the count of every game made so far.
// POST /api/games {id}: one more play of a game (at most once a minute per visitor and game).
import { countGames, countPlay, getGame, listGames, validId } from "../../../lib/games.js";
import { allow, clientIp, sameOrigin } from "../../../lib/guard.js";

export const runtime = "nodejs";

export async function GET() {
  const [games, count] = await Promise.all([listGames(36), countGames()]);
  return Response.json({ games, count }, { headers: { "cache-control": "public, max-age=5, s-maxage=5" } });
}

export async function POST(req) {
  if (!sameOrigin(req)) return Response.json({ ok: false }, { status: 403 });
  const { id } = (await req.json().catch(() => null)) ?? {};
  if (!validId(id)) return Response.json({ ok: false }, { status: 400 });
  if (!(await allow("play", `${clientIp(req)}:${id}`, 1, 60))) return Response.json({ ok: true });
  if (!(await getGame(id))) return Response.json({ ok: false }, { status: 404 });
  return Response.json({ ok: true, plays: await countPlay(id) });
}
