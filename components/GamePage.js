"use client";
// A game's own landing page: its cover (the game's title screen) with one big PLAY, the sentence it was made from, who
// made it, its likes and today's rank, sharing, its code, and more games. PLAY swaps the cover for the running game.
import { useEffect, useRef, useState } from "react";
import { openPicker, refresh, short, useAccount } from "./account.js";
import { Footer, Nav, WalletPicker } from "./Chrome.js";
import GameTile from "./GameTile.js";
import { Code, Expand, Heart, Link, Play, XMark } from "./icons.js";
import { tilePlaces } from "./mosaic.js";

export default function GamePage({ game, more, mint, links }) {
  const { me } = useAccount();
  const [playing, setPlaying] = useState(false);
  const [likes, setLikes] = useState(game.likes);
  const [liked, setLiked] = useState(false);
  const [note, setNote] = useState(null);
  const [link, setLink] = useState(`/play/${game.id}`);
  const [copied, setCopied] = useState(false);
  const [broken, setBroken] = useState(!game.thumb);
  const stage = useRef(null);
  const places = tilePlaces(more.length);
  useEffect(() => { setLink(location.href); }, []);
  function play() {
    setPlaying(true);
    fetch("/api/games", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: game.id }) }).catch(() => {});
    setTimeout(() => stage.current?.querySelector("iframe")?.focus(), 300);
  }
  async function like() {
    setNote(null);
    if (!me?.wallet) { openPicker(true); return; }
    if (game.wallet && game.wallet === me.wallet) { setNote("This is your game. Share it and let others like it."); return; }
    const r = await fetch("/api/like", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: game.id }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setNote(j.error ?? "That like did not count. Try again."); if (r.status === 402) refresh(true); return; }
    setLikes(j.likes); setLiked(true);
  }
  const post = `https://x.com/intent/post?text=${encodeURIComponent(`Play “${game.title}”, a game made from one sentence:`)}&url=${encodeURIComponent(link)}`;
  const made = game.by === "team" ? "A starter game written by the Typecade team" : game.wallet ? `Made by ${short(game.wallet)}` : "Made by the engine";

  return (
    <>
      <WalletPicker />
      <Nav mint={mint} links={links} />
      <main>
        <section className="gp">
          <div className="gp-stage" ref={stage}>
            {!playing ? (
              <button type="button" className="gp-cover" onClick={play} aria-label={`Play ${game.title}`}>
                {!broken ? <img src={game.thumb} alt="" onError={() => setBroken(true)} /> : <span className="gp-ph" aria-hidden="true" />}
                <span className="gp-play"><Play width={30} height={30} /> PLAY</span>
              </button>
            ) : (
              <iframe className="game" src={`/g/${game.id}`} title={game.title} sandbox="allow-scripts allow-pointer-lock" allow="fullscreen; gamepad; autoplay" />
            )}
          </div>
          <div className="gp-info">
            <h1>{game.title}</h1>
            <blockquote>“{game.prompt}”</blockquote>
            <p className="gp-by">{made}{game.ms ? `, written in ${Math.round(game.ms / 1000)}s` : ""}.</p>
            <dl className="gp-stats">
              <div><dt>LIKES</dt><dd>{likes}</dd></div>
              <div><dt>PLAYS</dt><dd>{game.plays}</dd></div>
              <div><dt>TODAY</dt><dd>{game.rank ? `#${game.rank}` : "–"}</dd></div>
            </dl>
            <div className="gp-actions">
              {!playing ? <button type="button" className="btn-solid" onClick={play}><Play width={16} height={16} /> PLAY</button>
                : <button type="button" className="btn-solid" onClick={() => stage.current?.requestFullscreen?.()}><Expand width={16} height={16} /> FULL SCREEN</button>}
              <button type="button" className={`btn-line like${liked ? " on" : ""}`} onClick={like} disabled={liked} aria-pressed={liked}><Heart width={16} height={16} filled={liked} /> {liked ? "LIKED" : "LIKE"}</button>
              <a className="btn-line" href={post} target="_blank" rel="noopener"><XMark size={14} /> POST</a>
              <button type="button" className="btn-line" onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><Link width={16} height={16} /> {copied ? "COPIED" : "LINK"}</button>
              {game.repo && <a className="btn-line" href={game.repo} target="_blank" rel="noopener"><Code width={16} height={16} /> CODE</a>}
            </div>
            {note && <p className="gp-note" role="status">{note}</p>}
            <p className="gp-fine">Likes come from wallets holding $TYPECADE, once per game. Every day at 00:00 UTC the prize pool is shared among the makers of the 10 most-liked games.</p>
          </div>
        </section>

        <section className="sec gp-make">
          <img className="gp-make-key" src="/moves/key.png" width="88" height="88" alt="" loading="lazy" decoding="async" />
          <div><h2>TYPE YOUR OWN.</h2><p>One sentence, one minute, your game on a page like this one.</p></div>
          <a className="btn-solid" href="/#create">MAKE A GAME</a>
        </section>

        <section className="sec more" aria-labelledby="more-h">
          <h2 id="more-h">MORE GAMES</h2>
          <div className="mosaic-box"><div className="mosaic">{more.map((g, i) => <GameTile key={g.id} g={g} place={places[i]} />)}</div></div>
        </section>
      </main>
      <Footer mint={mint} links={links} />
    </>
  );
}
