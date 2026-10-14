// Starter games: written by the Typecade team (not by the engine) so the gallery has something to play on day one.
// They follow the same rules as engine games (one file, no network, works on phones) and run in the same sandbox.
// The site labels them "by the team"; the engine's own games say how long they took.
import { readFile } from "node:fs/promises";
import path from "node:path";

export const STARTER = [
  { id: "rugsnake", title: "Rug Snake", prompt: "Snake, but you're a pump.fun dev eating green candles and dodging rug pulls" },
  { id: "tothemun", title: "To The Moon", prompt: "A one-button rocket that flies a memecoin to the moon past bear paws" },
  { id: "candlebk", title: "Candle Breaker", prompt: "Breakout where the bricks are red candles and you turn the chart green" },
  { id: "rainycat", title: "Rainy Day Cat", prompt: "A cat in a yellow raincoat catching falling fish in the rain" },
  { id: "bugblast", title: "Bug Blaster", prompt: "A space shooter where you blast giant pixel bugs out of the code" },
  { id: "roofninj", title: "Rooftop Ninja", prompt: "A ninja running across city rooftops at sunset, double jump to flip" },
].map((g) => ({ ...g, at: Date.parse("2026-10-14T00:00:00Z"), ms: null, repo: null }));

export async function starterGame(id) {
  const meta = STARTER.find((g) => g.id === id);
  if (!meta) return null;
  const html = await readFile(path.join(process.cwd(), "starter", `${id}.html`), "utf8");
  return { ...meta, html, by: "team", model: "team", plays: 0 };
}
