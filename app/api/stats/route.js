// GET /api/stats: what the site shows live. Every number is real: games made, today's AI budget left, the prize pool's
// balance, the coin (once launched). The pool balance comes from Solana and is cached for a minute.
import { AI_TANK, HOLDER_MIN_SOL, LIKE_MIN_SOL, LIMITS, SPLIT, TANK } from "../../../lib/config.js";
import { gameMint } from "../../../lib/holding.js";
import { countGames } from "../../../lib/games.js";
import { K, redis, today } from "../../../lib/store.js";

export const runtime = "nodejs";

const caches = new Map();
async function balance(wallet) {
  if (!wallet) return null;
  const tankCache = caches.get(wallet) ?? { at: 0, sol: null };
  if (Date.now() - tankCache.at < 60_000) return tankCache.sol;
  try {
    const r = await fetch(process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [wallet, { commitment: "confirmed" }] }),
    });
    const j = await r.json();
    caches.set(wallet, { at: Date.now(), sol: typeof j?.result?.value === "number" ? j.result.value / 1e9 : null });
  } catch {
    caches.set(wallet, { at: Date.now(), sol: tankCache.sol });
  }
  return caches.get(wallet).sol;
}

export async function GET() {
  const [count, usedMicro, sol, aiSol, mint] = await Promise.all([countGames(), redis(["GET", K("usd", today())]), balance(TANK), balance(AI_TANK), gameMint()]);
  const budgetLeft = Math.max(0, LIMITS.globalUsdDay - Number(usedMicro ?? 0) / 1e6);
  return Response.json(
    { count, budgetLeftUsd: +budgetLeft.toFixed(2), budgetUsd: LIMITS.globalUsdDay, holderMinSol: HOLDER_MIN_SOL, likeMinSol: LIKE_MIN_SOL, mint, tank: TANK, tankSol: sol, aiTank: AI_TANK, aiSol, split: SPLIT },
    { headers: { "cache-control": "public, max-age=10, s-maxage=10" } },
  );
}
