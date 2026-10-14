// Likes and the daily prize. A like is one $TYPECADE holder's vote for one game, once (tg:likes:<id> is the set of wallets);
// every like also counts for the UTC day it was given (tg:day:<date>, a sorted set of game ids by likes that day) and
// for all time (tg:alltime, same shape). Each day the pool is shared among the makers of that day's top games (up to
// PRIZE_SLOTS, each with at least MIN_WIN_LIKES likes, never a starter game), in proportion to their likes: the more a
// game is played and liked, the more its maker earns. The server's payout worker reads /api/leaderboard and records
// what it paid at /api/payouts; tg:earned is what each maker wallet has been paid in total.
import { MIN_WIN_LIKES } from "./config.js";
export const PRIZE_SLOTS = 10;
import { getGame } from "./games.js";
import { K, getJson, pipeline, redis, setJson, today } from "./store.js";

export async function like(id, wallet) {
  const added = await redis(["SADD", K("likes", id), wallet]);
  if (!added) return { added: false, likes: Number(await redis(["SCARD", K("likes", id)])) };
  const day = today();
  const [, , , n] = await pipeline([["ZINCRBY", K("day", day), "1", id], ["EXPIRE", K("day", day), String(40 * 86400)], ["ZINCRBY", K("alltime"), "1", id], ["SCARD", K("likes", id)]]);
  return { added: true, likes: Number(n) };
}
export const likedBy = async (id, wallet) => wallet ? Boolean(await redis(["SISMEMBER", K("likes", id), wallet])) : false;
export const likeCount = async (id) => Number(await redis(["SCARD", K("likes", id)]));
export async function likeCounts(ids) {
  if (!ids.length) return [];
  return (await pipeline(ids.map((id) => ["SCARD", K("likes", id)]))).map(Number);
}

// a day's ranking, with each game's maker; the winner is the first game that may win
export async function leaderboard(day = today(), n = 10) {
  const flat = await redis(["ZREVRANGE", K("day", day), "0", String(n * 3 - 1), "WITHSCORES"]);
  const rows = [];
  for (let i = 0; i < flat.length; i += 2) {
    const g = await getGame(flat[i]).catch(() => null);
    if (!g) continue;
    rows.push({ id: g.id, title: g.title, prompt: g.prompt, wallet: g.wallet ?? null, team: g.by === "team", likes: Number(flat[i + 1]) });
  }
  const eligible = rows.filter((r) => !r.team && r.wallet && r.likes >= MIN_WIN_LIKES).slice(0, PRIZE_SLOTS);
  const total = eligible.reduce((a, r) => a + r.likes, 0);
  // the share of the pool each maker gets (likes over all winning likes); one wallet with several games adds up
  const winners = eligible.map((r) => ({ ...r, share: total ? r.likes / total : 0 }));
  return { day, rows: rows.slice(0, n), winners, winner: winners[0] ?? null, minLikes: MIN_WIN_LIKES, slots: PRIZE_SLOTS };
}

// all-time boards: the most-liked games ever, and the makers who earned the most from the pool
export async function allTime(n = 20) {
  const flat = await redis(["ZREVRANGE", K("alltime"), "0", String(n - 1), "WITHSCORES"]);
  const games = [];
  for (let i = 0; i < flat.length; i += 2) {
    const g = await getGame(flat[i]).catch(() => null);
    if (g) games.push({ id: g.id, title: g.title, wallet: g.wallet ?? null, team: g.by === "team", likes: Number(flat[i + 1]) });
  }
  const ef = await redis(["ZREVRANGE", K("earned"), "0", String(n - 1), "WITHSCORES"]);
  const makers = [];
  for (let i = 0; i < ef.length; i += 2) makers.push({ wallet: ef[i], sol: Number(ef[i + 1]) / 1e9 });
  return { games, makers };
}

// what the pool paid out, newest first
export const payouts = async () => (await getJson(K("payouts"))) ?? [];
export async function recordPayout(p) {
  const list = await payouts();
  if (list.some((x) => x.day === p.day)) return list;
  const next = [p, ...list].slice(0, 120);
  await setJson(K("payouts"), next);
  // each maker's lifetime earnings, in lamports
  await pipeline(p.winners.map((w) => ["ZINCRBY", K("earned"), String(Math.round(w.sol * 1e9)), w.wallet]));
  return next;
}
