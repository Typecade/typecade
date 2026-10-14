// Everything Typecade promises in one place: the model that writes the games, what a day may cost and how many games a
// visitor may make. The site and the API read the same numbers.

const num = (k, d) => (process.env[k] ? Number(process.env[k]) : d);

// The model behind the engine (OpenRouter id) and its price in USD per million tokens. Picked with tools/quality.mjs:
// the game has to be complete, playable on a phone and done in about a minute.
export const MODEL = {
  id: process.env.GAME_MODEL ?? "anthropic/claude-sonnet-5.5",
  in: num("GAME_MODEL_IN", 2),
  out: num("GAME_MODEL_OUT", 10),
  // the model always thinks before it writes (OpenRouter will not switch that off for it); left to itself it thinks for over
  // a minute on a game and runs out of tokens, so it is held to low effort: code starts sooner and fits the budget
  effort: process.env.GAME_REASONING_EFFORT ?? "low",
};

export const LIMITS = {
  // the fuse: all AI paid by Typecade in one UTC day; past it the builder pauses until 00:00 UTC
  globalUsdDay: num("GLOBAL_USD_DAY", 20),
  // games one holder wallet may make per UTC day
  perWalletDay: num("GAMES_PER_WALLET_DAY", 10),
  // a backstop per network address, whatever wallets it uses
  perIpDay: num("GAMES_PER_IP_DAY", 30),
  // a game is one file; thinking and code share this budget, and longer answers are cut off and fail
  maxOutputTokens: num("MAX_OUTPUT_TOKENS", 24000),
  promptMin: 3,
  promptMax: 280,
  // a stored game file may not be larger than this
  maxHtmlBytes: 400_000,
};

export const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? "";
export const SITE = process.env.SITE ?? "https://typecade.app";
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
export const GAMES_REPO = process.env.GITHUB_GAMES_REPO ?? "Typecade/games";
export const SOURCE_REPO = process.env.GITHUB_SOURCE_REPO ?? "Typecade/typecade";
// the coin (set at launch through /api/admin, GAME_MINT in the env as a fallback) and its two fee wallets. Creator fees split
// on-chain: 50% to the developer, 15% to the prize pool (shared each UTC day among the makers of the most-liked games),
// 35% to the AI tank (pays the AI as games are made; it holds SOL and buys AI credit only as needed, so nothing sits as
// unused prepaid credit; if Typecade closes, what is left in it goes to the developer)
export const GAME_MINT = (process.env.GAME_MINT ?? "").trim() || null;
export const POOL = (process.env.POOL_WALLET ?? "CG7kcijLqvV7MjgsN35VNuPWSgZWXyCqn1hzCdapEJU").trim();
export const AI_TANK = (process.env.AI_TANK_WALLET ?? "Cx2Ufer7ZYDMZ1n6BLWsmLnFT7gVxoxUYYZahdo6BnM").trim();
export const TANK = POOL;
export const SPLIT = { dev: 50, pool: 15, ai: 35 };
// making a game takes $TYPECADE worth this much SOL; liking one takes this much
export const HOLDER_MIN_SOL = num("HOLDER_MIN_SOL", 1);
export const LIKE_MIN_SOL = num("LIKE_MIN_SOL", 0.1);
// $TYPECADE that arrived by plain transfer counts only after this many hours (bought $TYPECADE counts at once)
export const TRANSFER_WAIT_H = num("TRANSFER_WAIT_H", 24);
// a day's winner needs at least this many likes, or the pool rolls over to the next day
export const MIN_WIN_LIKES = num("MIN_WIN_LIKES", 3);
// games made by these wallets (the disclosed team and dev wallets, comma-separated in TEAM_WALLETS) never win the pool
export const TEAM_WALLETS = new Set((process.env.TEAM_WALLETS ?? "").split(",").map((w) => w.trim()).filter(Boolean));
export const RPC_URL = process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com";
export const BOT_KEY = process.env.BOT_KEY ?? "";

// worst case of one game in micro-USD, booked before the call so parallel builds cannot pass the day's fuse
export const worstCaseMicro = (promptTokens) => Math.ceil((promptTokens * MODEL.in + LIMITS.maxOutputTokens * MODEL.out));
