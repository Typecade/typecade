// POST /api/thumb {id, data}: the title-screen thumbnail a game hands to the page that framed it (app/g/[id]/route.js).
// Accepted once per game, only from the visitor who made it, within 30 minutes, and only as a small JPEG data URL.
import { getGame, validId } from "../../../lib/games.js";
import { clientIp, ipHash, sameOrigin } from "../../../lib/guard.js";
import { K, redis } from "../../../lib/store.js";

export const runtime = "nodejs";

export async function POST(req) {
  if (!sameOrigin(req)) return Response.json({ ok: false }, { status: 403 });
  const { id, data } = (await req.json().catch(() => null)) ?? {};
  if (!validId(id) || typeof data !== "string" || !data.startsWith("data:image/jpeg;base64,") || data.length > 90_000) return Response.json({ ok: false }, { status: 400 });
  const g = await getGame(id);
  if (!g || g.by === "team" || g.ipHash !== ipHash(clientIp(req)) || Date.now() - g.at > 30 * 60_000) return Response.json({ ok: false }, { status: 403 });
  const set = await redis(["SET", K("thumb", id), data, "NX"]);
  return Response.json({ ok: !!set });
}
