// GET /api/thumb/<id>: a game's thumbnail as a JPEG (404 until its maker's page has sent one).
import { validId } from "../../../../lib/games.js";
import { K, redis } from "../../../../lib/store.js";

export const runtime = "nodejs";

export async function GET(_req, { params }) {
  const { id } = await params;
  const data = validId(id) ? await redis(["GET", K("thumb", id)]).catch(() => null) : null;
  if (!data) return new Response(null, { status: 404, headers: { "cache-control": "public, max-age=30" } });
  const bytes = Buffer.from(data.slice(data.indexOf(",") + 1), "base64");
  return new Response(bytes, { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=86400, s-maxage=31536000, immutable" } });
}
