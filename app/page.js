import Home from "../components/Home.js";
import { GAMES_REPO, HOLDER_MIN_SOL, LIKE_MIN_SOL, LIMITS, SOURCE_REPO, TANK } from "../lib/config.js";
import { countGames, listGames } from "../lib/games.js";
import { gameMint } from "../lib/holding.js";
import { leaderboard, payouts } from "../lib/likes.js";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [games, count, mint, board, paid] = await Promise.all([listGames(60).catch(() => []), countGames().catch(() => 0), gameMint().catch(() => null), leaderboard().catch(() => null), payouts().catch(() => [])]);
  const stats = { count, budgetUsd: LIMITS.globalUsdDay, holderMinSol: HOLDER_MIN_SOL, likeMinSol: LIKE_MIN_SOL, mint, tank: TANK, tankSol: null };
  const links = { source: `https://github.com/${SOURCE_REPO}`, games: `https://github.com/${GAMES_REPO}`, x: process.env.X_URL ?? "https://x.com/typecade" };
  return <Home initial={games} stats={stats} board={board ? { ...board, payouts: paid.slice(0, 10) } : null} links={links} />;
}
