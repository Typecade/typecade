import { notFound } from "next/navigation";
import GamePage from "../../../components/GamePage.js";
import { GAMES_REPO, SOURCE_REPO } from "../../../lib/config.js";
import { getGame, listGames } from "../../../lib/games.js";
import { gameMint } from "../../../lib/holding.js";
import { leaderboard, likeCount } from "../../../lib/likes.js";
import { K, redis } from "../../../lib/store.js";

export const dynamic = "force-dynamic";

// a starter game has a 16:10 cover of its own #cover still; a made game has the title-screen snap its first player sent
const thumbOf = (g) => (g.by === "team" ? `/covers/${g.id}.jpg` : `/api/thumb/${g.id}`);
const hasThumb = async (g) => g.by === "team" || Number(await redis(["EXISTS", K("thumb", g.id)]).catch(() => 0)) > 0;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const g = await getGame(id).catch(() => null);
  if (!g) return { title: "Game not found · Typecade" };
  const d = `Made from one sentence: “${g.prompt}”. Play it free, then type your own on Typecade.`;
  return { title: `${g.title} · Typecade`, description: d, openGraph: { title: `${g.title}: play it on Typecade`, description: d, images: [thumbOf(g)] }, twitter: { card: "summary_large_image", title: g.title, description: d, images: [thumbOf(g)] } };
}

export default async function Play({ params }) {
  const { id } = await params;
  const g = await getGame(id).catch(() => null);
  if (!g) notFound();
  const [likes, plays, board, more, mint] = await Promise.all([likeCount(id).catch(() => 0), redis(["GET", K("plays", id)]).catch(() => 0), leaderboard().catch(() => null), listGames(30).catch(() => []), gameMint().catch(() => null)]);
  const rank = board?.rows.findIndex((r) => r.id === id);
  const thumb = (await hasThumb(g)) ? thumbOf(g) : null;
  const game = { id: g.id, title: g.title, prompt: g.prompt, by: g.by ?? null, wallet: g.wallet ?? null, ms: g.ms ?? null, at: g.at ?? null, repo: g.repo ?? (g.by === "team" ? `https://github.com/${SOURCE_REPO}/blob/main/starter/${g.id}.html` : null), thumb, likes, plays: Number(plays ?? 0), rank: rank >= 0 ? rank + 1 : null };
  const links = { source: `https://github.com/${SOURCE_REPO}`, games: `https://github.com/${GAMES_REPO}`, x: process.env.X_URL ?? "https://x.com/typecadeapp" };
  return <GamePage game={game} more={more.filter((m) => m.id !== id).slice(0, 18)} mint={mint} links={links} />;
}
