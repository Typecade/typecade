// Who holds $TYPECADE: a wallet's $TYPECADE valued in SOL (Jupiter prices), with tokens that arrived by plain transfer counted only
// after TRANSFER_WAIT_H hours, so one bag passed from wallet to wallet cannot make many holders a day. A wallet with
// HOLDER_MIN_SOL may make games, one with LIKE_MIN_SOL may like them. Kept 10 minutes for holders, 1 minute otherwise.
// Taken over from AgentFuel (lib/access.js), where it ran in production.
import { PublicKey } from "@solana/web3.js";
import { GAME_MINT, HOLDER_MIN_SOL, LIKE_MIN_SOL, RPC_URL, TRANSFER_WAIT_H } from "./config.js";
import { getJson, redis, setJson } from "./store.js";

// $TYPECADE's mint: set at launch through /api/admin (tg:mint), GAME_MINT in the env as a fallback
export async function gameMint() {
  return (await redis(["GET", "tg:mint"]).catch(() => null)) || GAME_MINT;
}

async function rpc(method, params) {
  const r = await fetch(RPC_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), cache: "no-store" });
  const j = await r.json();
  if (j.error) throw new Error(`${method}: ${j.error.message}`);
  return j.result;
}

const SOL_MINT = "So11111111111111111111111111111111111111112";
// USD prices from Jupiter, cached a minute
export async function prices(mints) {
  const k = `tg:px:${mints.join(",")}`;
  const kept = await getJson(k).catch(() => null);
  if (kept) return kept;
  const j = await fetch(`https://lite-api.jup.ag/price/v3?ids=${mints.join(",")}`, { cache: "no-store" }).then((r) => r.json());
  const out = Object.fromEntries(mints.map((m) => [m, Number(j?.[m]?.usdPrice ?? 0)]));
  await setJson(k, out, 60).catch(() => {});
  return out;
}

// Where a purchase of $TYPECADE comes from: the coin's pump.fun bonding curve, and after it graduates its canonical PumpSwap
// pool. Every buy, through pump.fun, a trading bot or an aggregator, takes its tokens out of one of these two.
const PUMP = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const PUMP_AMM = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");
const WSOL = new PublicKey(SOL_MINT);
const markets = new Map();
function marketsOf(mint) {
  if (!markets.has(mint)) {
    const m = new PublicKey(mint), pda = (seeds, program) => PublicKey.findProgramAddressSync(seeds, program)[0];
    const authority = pda([Buffer.from("pool-authority"), m.toBuffer()], PUMP);
    markets.set(mint, new Set([
      pda([Buffer.from("bonding-curve"), m.toBuffer()], PUMP).toBase58(),
      pda([Buffer.from("pool"), Buffer.from([0, 0]), authority.toBuffer(), m.toBuffer(), WSOL.toBuffer()], PUMP_AMM).toBase58(),
    ]));
  }
  return markets.get(mint);
}

// $TYPECADE that came in by transfer during the waiting window (it does not count yet). What the wallet received in a
// transaction counts at once as far as the same transaction took it out of the bonding curve or the pool: that is a
// purchase, whatever it was paid with. The rest came from another wallet and waits. A transaction that cannot be read
// makes the whole holding wait, so an RPC hiccup can only delay holder access, never grant it.
async function waitingGame(wallet, mint, accounts) {
  const since = Date.now() / 1000 - TRANSFER_WAIT_H * 3600;
  const market = marketsOf(mint);
  let waiting = 0, unsure = false;
  for (const acct of accounts) {
    const sigs = (await rpc("getSignaturesForAddress", [acct, { limit: 25, commitment: "confirmed" }])) ?? [];
    const recent = sigs.filter((s) => !s.err && (s.blockTime == null || s.blockTime > since));
    if (sigs.length === 25 && recent.length === 25) unsure = true; // busier than we read: recheck within a minute
    for (const s of recent) {
      const tx = await rpc("getTransaction", [s.signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0, commitment: "confirmed" }]).catch(() => null);
      if (!tx?.meta) return { waiting: Infinity, unsure: true, unread: true };
      const held = (list) => {
        const by = new Map();
        for (const b of list ?? []) if (b.mint === mint) by.set(b.owner, (by.get(b.owner) ?? 0) + Number(b.uiTokenAmount?.uiAmount ?? 0));
        return by;
      };
      const pre = held(tx.meta.preTokenBalances), post = held(tx.meta.postTokenBalances);
      const got = (post.get(wallet) ?? 0) - (pre.get(wallet) ?? 0);
      if (got <= 0) continue;
      let bought = 0;
      for (const owner of market) bought += Math.max(0, (pre.get(owner) ?? 0) - (post.get(owner) ?? 0));
      waiting += Math.max(0, got - bought);
    }
  }
  return { waiting, unsure };
}

// $TYPECADE held by a wallet, valued in SOL; a wallet holding enough (not counting recently transferred tokens) is a holder
export async function holding(wallet, fresh = false) {
  const k = `tg:holding:${wallet}`;
  if (!fresh) {
    const kept = await getJson(k).catch(() => null);
    if (kept) return kept;
  }
  const mint = await gameMint();
  if (!mint) return { holder: false, liker: false, tokens: 0, sol: 0, reason: "$TYPECADE is not live yet" };
  const res = await rpc("getTokenAccountsByOwner", [wallet, { mint }, { encoding: "jsonParsed", commitment: "confirmed" }]);
  const accounts = (res?.value ?? []).filter((a) => Number(a.account.data.parsed.info.tokenAmount.uiAmount ?? 0) > 0);
  const tokens = accounts.reduce((s, a) => s + Number(a.account.data.parsed.info.tokenAmount.uiAmount ?? 0), 0);
  const px = await prices([mint, SOL_MINT]);
  const pxSol = px[SOL_MINT] > 0 ? px[mint] / px[SOL_MINT] : 0;
  const sol = tokens * pxSol;
  let counted = sol, waitingSol = 0, unsure = false, unread = false;
  if (sol >= LIKE_MIN_SOL) {
    const w = await waitingGame(wallet, mint, accounts.map((a) => a.pubkey));
    waitingSol = Math.min(sol, w.waiting * pxSol);
    unsure = w.unsure;
    unread = Boolean(w.unread);
    counted = Math.max(0, sol - waitingSol);
  }
  const holder = counted >= HOLDER_MIN_SOL, liker = counted >= LIKE_MIN_SOL;
  const why = holder ? null
    : unread ? "Its recent $TYPECADE transactions could not be read just now; it is checked again within a minute"
    : waitingSol > 0 ? `${waitingSol.toFixed(3)} SOL of it came from another wallet and counts ${TRANSFER_WAIT_H} hours after it arrived; $TYPECADE you buy counts at once`
    : null;
  const out = { holder, liker, tokens, sol: Number(sol.toFixed(4)), counted: Number(counted.toFixed(4)), waiting: Number(waitingSol.toFixed(4)), at: Date.now(), ...(why ? { reason: why } : {}) };
  // a holder is kept for ten minutes; anyone else is rechecked within a minute, so a fresh purchase unlocks quickly
  await setJson(k, out, liker && !unsure ? 600 : 60).catch(() => {});
  return out;
}

