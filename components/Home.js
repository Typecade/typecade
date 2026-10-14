"use client";
// The landing page: the builder hero, then the platform: the live mosaic of games, today's prize race, how it works,
// the coin and the open source. Games, stats and the race refresh every 20 s; new games pop into the mosaic.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Footer, Nav, Ticker, WalletPicker } from "./Chrome.js";
import Intro from "./Intro.js";
import GameTile from "./GameTile.js";
import Hero from "./Hero.js";
import { Code, GitHub, Heart, Search } from "./icons.js";
import { tilePlaces } from "./mosaic.js";
import { short } from "./account.js";
import { Decode, useReveal } from "./fx.js";

const ORD = ["1ST", "2ND", "3RD", "4TH", "5TH", "6TH", "7TH", "8TH", "9TH", "10TH"];
const MOVES = [
  ["coin", "Hold $TYPECADE"],
  ["key", "Type a game"],
  ["heart", "Collect likes"],
  ["trophy", "Get paid"],
];

function untilMidnightUtc() {
  const n = new Date(), end = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1);
  const s = Math.max(0, Math.floor((end - n.getTime()) / 1000));
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function Home({ initial, stats: s0, board: b0, links }) {
  const [games, setGames] = useState(initial);
  const [stats, setStats] = useState(s0);
  const [board, setBoard] = useState(b0);
  const [fresh, setFresh] = useState(() => new Set());
  const [q, setQ] = useState("");
  const [clock, setClock] = useState("--:--:--");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("today");
  useReveal();

  useEffect(() => {
    setClock(untilMidnightUtc());
    const id = setInterval(() => setClock(untilMidnightUtc()), 1000);
    return () => clearInterval(id);
  }, []);
  const merge = useCallback((list) => {
    setGames((old) => {
      const known = new Set(old.map((g) => g.id));
      const added = list.filter((g) => !known.has(g.id)).map((g) => g.id);
      if (added.length) setFresh((f) => new Set([...f, ...added]));
      const byId = new Set(list.map((g) => g.id));
      return [...list.map((g) => ({ ...g, thumb: old.find((o) => o.id === g.id)?.thumb ?? g.thumb })), ...old.filter((o) => !byId.has(o.id))];
    });
  }, []);
  useEffect(() => {
    const tick = async () => {
      try {
        const [g, s, b] = await Promise.all(["/api/games", "/api/stats", "/api/leaderboard"].map((u) => fetch(u).then((r) => r.json())));
        merge(g.games); setStats(s); setBoard(b);
      } catch {}
    };
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, [merge]);
  const onMade = useCallback((g) => {
    setGames((old) => [{ ...old.find((o) => o.id === g.id), ...g }, ...old.filter((o) => o.id !== g.id)]);
    setFresh((f) => new Set([...f, g.id]));
  }, []);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? games.filter((g) => `${g.title} ${g.prompt}`.toLowerCase().includes(t)) : games;
  }, [games, q]);
  const rankOf = useMemo(() => new Map((board?.rows ?? []).map((r, i) => [r.id, i + 1])), [board]);
  const mint = stats?.mint ?? null;
  const places = useMemo(() => tilePlaces(shown.length), [shown.length]);
  // the hi-score table always shows ten places; the ones nobody holds yet stay as dashes
  const table = useMemo(() => {
    const rows = tab === "today" ? (board?.rows ?? []).filter((r) => !r.team).slice(0, 10).map((r) => {
      const w = (board?.winners ?? []).find((x) => x.id === r.id);
      return { key: r.id, href: `/play/${r.id}`, name: r.title, sub: `by ${short(r.wallet)}${w && typeof stats?.tankSol === "number" ? `, earns about ${(w.share * Math.max(0, stats.tankSol - 0.02)).toFixed(3)} SOL now` : ""}`, score: r.likes };
    }) : tab === "games" ? (board?.allTime?.games ?? []).filter((g) => !g.team).slice(0, 10).map((g) => ({ key: g.id, href: `/play/${g.id}`, name: g.title, sub: `by ${short(g.wallet)}`, score: g.likes }))
      : (board?.allTime?.makers ?? []).slice(0, 10).map((m) => ({ key: m.wallet, href: `https://solscan.io/account/${m.wallet}`, ext: true, name: short(m.wallet), mono: true, sub: "paid out by the pool", score: `${m.sol.toFixed(3)}` }));
    return rows;
  }, [tab, board, stats]);
  const emptyNote = { today: "No likes yet today. Make a game, share its page, and the top spot is yours.", games: "The all-time board fills with the first likes after launch.", makers: "Nobody has been paid yet. The first payout lands at 00:00 UTC after launch." }[tab];

  return (
    <>
      <Intro />
      <WalletPicker />
      <Nav mint={mint} links={links} />
      <main>
        <Hero onMade={onMade} />
        <Ticker />

        <section className="sec" id="games" aria-labelledby="games-h">
          <div className="sec-head">
            <div>
              <Decode id="games-h" text={(stats?.count ?? 0) > 0 ? `${stats.count.toLocaleString("en-US")} ${stats.count === 1 ? "GAME" : "GAMES"} MADE` : "THE ARCADE"} />
            </div>
            <label className="search">
              <Search width={18} height={18} />
              <span className="sr">Search games</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search games" />
            </label>
          </div>
          <div className="mosaic-box">
            <div className="mosaic" data-reveal>
              {shown.map((g, i) => <GameTile key={g.id} g={g} place={places[i]} fresh={fresh.has(g.id)} rank={rankOf.get(g.id) ?? null} />)}
              {!shown.length && <p className="empty">No game matches “{q}”. Type it in the box above and it will exist in a minute.</p>}
            </div>
          </div>
        </section>

        <section className="sec board" id="leaderboard" aria-labelledby="board-h">
          <div className="board-copy" data-reveal>
            <Decode id="board-h" text={"GET PAID WHEN\nPEOPLE PLAY\nYOUR GAME."} />
            <p>15% of $TYPECADE's creator fees fill the prize pool. Every day at 00:00 UTC the pool is shared among the makers of the {board?.slots ?? 10} most-liked games of the day, in proportion to their likes. Holders of $TYPECADE worth {stats?.likeMinSol ?? 0.1} SOL can like, once per game, and nobody can like their own.</p>
            <dl className="prize-stats">
              <div><dt>POOL</dt><dd>{typeof stats?.tankSol === "number" ? `${stats.tankSol.toFixed(3)} SOL` : "fills at launch"}</dd></div>
              <div><dt>ROUND ENDS IN</dt><dd className="mono clockface">{clock}</dd></div>
              <div><dt>TO EARN</dt><dd>{board?.minLikes ?? 3}+ likes</dd></div>
            </dl>
          </div>
          <div className="lb" data-reveal>
            <div className="lb-tabs" role="tablist" aria-label="Leaderboard">
              {[["today", "TODAY"], ["games", "ALL TIME"], ["makers", "TOP MAKERS"]].map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
              ))}
            </div>
            <table className="hs" aria-label={tab === "today" ? "Today's most-liked games" : tab === "games" ? "Most-liked games of all time" : "Makers by earnings"}>
              <thead><tr><th scope="col">RANK</th><th scope="col">{tab === "makers" ? "MAKER" : "GAME"}</th><th scope="col">{tab === "makers" ? "SOL PAID" : "LIKES"}</th></tr></thead>
              <tbody>
                {ORD.map((o, i) => {
                  const r = table[i];
                  if (!r) return <tr key={o} className="hs-open"><td>{o}</td><td>- - -</td><td>0</td></tr>;
                  return (
                    <tr key={r.key}>
                      <td>{o}</td>
                      <td><a href={r.href} {...(r.ext ? { target: "_blank", rel: "noopener" } : {})}><strong className={r.mono ? "mono" : ""}>{r.name}</strong><span>{r.sub}</span></a></td>
                      <td>{tab !== "makers" && <Heart width={14} height={14} filled />}{r.score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!table.length && <p className="lb-note">{emptyNote}</p>}
            {tab === "today" && (board?.payouts ?? []).length > 0 && (
              <p className="lb-past">Last payouts: {board.payouts.slice(0, 3).map((p, i) => <span key={p.day}>{i ? ", " : ""}<a href={`https://solscan.io/tx/${p.signature}`} target="_blank" rel="noopener">{p.day}: {p.sol.toFixed(3)} SOL to {p.winners?.length ?? 1} maker{(p.winners?.length ?? 1) === 1 ? "" : "s"}</a></span>)}</p>
            )}
          </div>
        </section>

        <section className="sec how" aria-labelledby="how-h">
          <Decode id="how-h" text="FOUR MOVES" />
          <ol className="moves" data-reveal>
            {MOVES.map(([icon, title], i) => (
              <li key={icon}>
                <img src={`/moves/${icon}.png`} width="160" height="160" alt="" loading="lazy" decoding="async" />
                <strong>{title}</strong>
                <span>{[
                  `Worth ${stats?.holderMinSol ?? 1} SOL in your wallet to make games, ${stats?.likeMinSol ?? 0.1} SOL to like them.`,
                  "One sentence. Any idea, any language. The AI writes it while you watch.",
                  "Share your game's page. Holders like it, once each.",
                  `Every day at 00:00 UTC the pool is shared among the ${board?.slots ?? 10} most-liked games' makers, by likes.`,
                ][i]}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="sec coin" id="coin" aria-labelledby="coin-h">
          <div>
            <Decode id="coin-h" text={"$TYPECADE RUNS\nTHE ARCADE."} />
          </div>
          <div className="coin-body" data-reveal>
            <div className="fees">
              <p className="fees-cap">Every trade of $TYPECADE pays a creator fee. It splits three ways:</p>
              <div className="feebar" role="img" aria-label="Creator fees: 50% to the developer, 35% to the AI tank, 15% to the prize pool">
                <span className="fb dev" style={{ "--w": 50 }}><b className="num">50%</b></span>
                <span className="fb ai" style={{ "--w": 35 }}><b className="num">35%</b></span>
                <span className="fb pool" style={{ "--w": 15 }}><b className="num">15%</b></span>
              </div>
              <ul className="fee-key">
                <li><i className="sw dev" aria-hidden="true" /><strong>Developer <b className="num">50%</b></strong><span>Runs the servers and builds Typecade.</span></li>
                <li><i className="sw ai" aria-hidden="true" /><strong>AI tank <b className="num">35%</b></strong><span>Pays the AI that writes the games, only as games are made.</span>{stats?.aiTank && <a className="mono" href={`https://solscan.io/account/${stats.aiTank}`} target="_blank" rel="noopener">{short(stats.aiTank)}</a>}</li>
                <li><i className="sw pool" aria-hidden="true" /><strong>Prize pool <b className="num">15%</b></strong><span>Shared every day among the makers of the most-liked games.</span>{stats?.tank && <a className="mono" href={`https://solscan.io/account/${stats.tank}`} target="_blank" rel="noopener">{short(stats.tank)}</a>}</li>
              </ul>
            </div>
            <p>The split is set on-chain with pump.fun's fee sharing; anyone can check it on the coin page. The AI tank holds SOL and buys AI credit only as it is used, so nothing piles up as unused prepaid credit. <a href="/docs#coin">How the money moves</a>.</p>
            {mint ? (
              <div className="ca-row">
                <button type="button" className="ca" onClick={() => { navigator.clipboard?.writeText(mint); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><span>CA</span><code>{mint}</code><em>{copied ? "copied" : "copy"}</em></button>
                <a className="btn-solid" href={`https://pump.fun/coin/${mint}`} target="_blank" rel="noopener">BUY $TYPECADE</a>
              </div>
            ) : <p className="soon">$TYPECADE launches on pump.fun soon. The CA appears here the moment it is live.</p>}
          </div>
        </section>

        <section className="sec open" aria-labelledby="open-h">
          <GitHub size={34} />
          <div>
            <Decode id="open-h" text="EVERY GAME IS OPEN SOURCE." />
            <p>Each game's code and the sentence it came from land in a public repo the moment it is made. So does the code of this site.</p>
          </div>
          <div className="open-links">
            <a className="btn-line" href={links.games} target="_blank" rel="noopener"><Code width={16} height={16} /> GAMES REPO</a>
            <a className="btn-line" href={links.source} target="_blank" rel="noopener"><GitHub size={16} /> SITE CODE</a>
          </div>
        </section>
      </main>
      <Footer mint={mint} links={links} />
    </>
  );
}
