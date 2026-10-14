// Games in the store: tg:game:<id> holds the file and its story (prompt, title, model, time, cost); tg:plays:<id> counts
// its plays; tg:recent lists the newest ids for the gallery; tg:count counts every game ever made. Starter games made by the team carry by: "team".
import { GAMES_REPO, GITHUB_TOKEN, LIMITS } from "./config.js";
import { STARTER, starterGame } from "./starter.js";
import { K, getJson, pipeline, redis, setJson } from "./store.js";

const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";
export function newId() {
  const b = crypto.getRandomValues(new Uint8Array(8));
  return [...b].map((x) => ALPHABET[x % ALPHABET.length]).join("");
}
export const validId = (id) => typeof id === "string" && /^[0-9a-z]{8}$/.test(id);

// The model's answer to the file: fences and chatter stripped, from <!DOCTYPE (or <html) to the last </html>.
// Returns null for anything that is not one complete document.
export function extractHtml(text) {
  const t = String(text).replace(/^\s*```(?:html)?\s*/i, "").replace(/```\s*$/, "");
  const start = t.search(/<!doctype html|<html[\s>]/i);
  const end = t.toLowerCase().lastIndexOf("</html>");
  if (start < 0 || end < start) return null;
  const html = t.slice(start, end + 7);
  if (!/<script[\s>]/i.test(html)) return null;
  if (new TextEncoder().encode(html).length > LIMITS.maxHtmlBytes) return null;
  return html;
}

export function titleOf(html, fallback) {
  const m = html.match(/<title>([^<]{1,80})<\/title>/i);
  const t = (m?.[1] ?? "").replace(/\s+/g, " ").trim();
  return t || fallback.slice(0, 60);
}

// Requests that are not games, refused before any money is spent. The model refuses the rest itself, and the sandbox
// makes a fake login or wallet page useless anyway (it cannot send anything anywhere).
const NOT_A_GAME = /\b(seed ?phrase|private ?key|secret ?key|recovery ?phrase|mnemonic|connect (your )?wallet|wallet (login|connect)|log ?in page|sign ?in page|password|phishing|airdrop claim|claim (your )?airdrop|metamask|phantom wallet|bank login|credit card)\b/i;
export const screen = (prompt) => (NOT_A_GAME.test(prompt) ? "Typecade makes games, not login or wallet pages." : null);

export async function saveGame(g) {
  await pipeline([
    ["SET", K("game", g.id), JSON.stringify(g)],
    ["LPUSH", K("recent"), g.id],
    ["LTRIM", K("recent"), "0", "499"],
    ["INCRBY", K("count"), "1"],
  ]);
}
export const getGame = async (id) => (validId(id) ? (await starterGame(id)) ?? getJson(K("game", id)) : null);
export const setGame = (g) => setJson(K("game", g.id), g);

// the gallery: newest first, without the files
// the starter games (written by the team, files in starter/) always close the list
export async function listGames(limit = 24) {
  const ids = (await redis(["LRANGE", K("recent"), "0", String(limit - 1)])) ?? [];
  const starters = STARTER.map((g) => ({ ...g, by: "team", thumb: `/thumbs/${g.id}.jpg`, cover: `/covers/${g.id}.jpg` }));
  const withPlays = async (list) => {
    if (!list.length) return [];
    const [p, l] = await Promise.all([redis(["MGET", ...list.map((g) => K("plays", g.id))]), pipeline(list.map((g) => ["SCARD", K("likes", g.id)]))]);
    return list.map((g, i) => ({ ...g, plays: Number(p[i] ?? 0), likes: Number(l[i] ?? 0) }));
  };
  if (!ids.length) return withPlays(starters);
  const [raw, plays] = await Promise.all([redis(["MGET", ...ids.map((id) => K("game", id))]), redis(["MGET", ...ids.map((id) => K("plays", id))])]);
  const [likes, thumbs] = await Promise.all([pipeline(ids.map((id) => ["SCARD", K("likes", id)])), pipeline(ids.map((id) => ["EXISTS", K("thumb", id)]))]);
  const made = raw.map((s, i) => [s, plays[i], likes[i], thumbs[i]]).filter(([s]) => s).map(([s, p, l, t]) => { const g = JSON.parse(s); return { id: g.id, title: g.title, prompt: g.prompt, at: g.at, by: g.by ?? null, wallet: g.wallet ?? null, ms: g.ms ?? null, plays: Number(p ?? 0), likes: Number(l ?? 0), repo: g.repo ?? null, thumb: Number(t) ? `/api/thumb/${g.id}` : null }; });
  return [...made, ...(await withPlays(starters))];
}
export const countGames = async () => Number((await redis(["GET", K("count")])) ?? 0);

// Every game is open source: one folder per game in the public games repo, with the prompt it came from.
export async function publishGame(g) {
  if (!GITHUB_TOKEN) return null;
  const put = async (path, content, message) => {
    const r = await fetch(`https://api.github.com/repos/${GAMES_REPO}/contents/${path}`, {
      method: "PUT",
      headers: { authorization: `Bearer ${GITHUB_TOKEN}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "typecade" },
      body: JSON.stringify({ message, content: Buffer.from(content, "utf8").toString("base64") }),
    });
    if (!r.ok) throw new Error(`github ${r.status}`);
  };
  const readme = `# ${g.title}\n\nMade with [Typecade](https://typecade.app/play/${g.id}) from one sentence:\n\n> ${g.prompt.replace(/\n/g, " ")}\n\nPlay it: https://typecade.app/play/${g.id}\n\nModel: ${g.model}. The whole game is the single file \`index.html\`. MIT licensed.\n`;
  await put(`games/${g.id}/index.html`, g.html, `Add ${g.id}: ${g.title}`);
  await put(`games/${g.id}/README.md`, readme, `Describe ${g.id}`);
  return `https://github.com/${GAMES_REPO}/tree/main/games/${g.id}`;
}

export const countPlay = (id) => redis(["INCRBY", K("plays", id), "1"]);
