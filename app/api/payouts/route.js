// POST /api/payouts {day, signature, winners:[{id, title, wallet, likes, sol}]}: the server's payout worker records a day's
// prize, paid in one transaction to every winning maker (bearer BOT_KEY).
import { BOT_KEY } from "../../../lib/config.js";
import { botAuth } from "../../../lib/guard.js";
import { recordPayout } from "../../../lib/likes.js";

export const runtime = "nodejs";

export async function POST(req) {
  if (!(await botAuth(req, BOT_KEY))) return Response.json({ error: "no" }, { status: 401 });
  const p = await req.json().catch(() => null);
  const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  const ok = p && /^\d{4}-\d{2}-\d{2}$/.test(p.day) && /^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(p.signature ?? "") && Array.isArray(p.winners) && p.winners.length > 0 && p.winners.length <= 10
    && p.winners.every((w) => B58.test(w.wallet ?? "") && Number(w.sol) > 0);
  if (!ok) return Response.json({ error: "bad payout" }, { status: 400 });
  const winners = p.winners.map((w) => ({ id: w.id ?? null, title: w.title ?? null, wallet: w.wallet, likes: Number(w.likes ?? 0), sol: Number(w.sol) }));
  const total = winners.reduce((a, w) => a + w.sol, 0);
  return Response.json({ ok: true, payouts: (await recordPayout({ day: p.day, signature: p.signature, winners, sol: total, title: winners[0].title, at: Date.now() })).length });
}
