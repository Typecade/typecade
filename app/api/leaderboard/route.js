// GET /api/leaderboard[?day=YYYY-MM-DD]: the day's most-liked games and how the pool would be shared among them, the
// all-time boards (games by likes, makers by earnings) and the pool's past payouts.
import { allTime, leaderboard, payouts } from "../../../lib/likes.js";

export const runtime = "nodejs";

export async function GET(req) {
  const day = new URL(req.url).searchParams.get("day");
  const d = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined;
  const [board, paid, all] = await Promise.all([leaderboard(d), payouts(), allTime()]);
  return Response.json({ ...board, payouts: paid.slice(0, 10), allTime: all }, { headers: { "cache-control": "public, max-age=15, s-maxage=15" } });
}
