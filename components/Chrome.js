"use client";
// Everything around the pages: the nav with the wallet, the wallet picker, the ticker, the footer (the opener is Intro.js).
import { useEffect, useState } from "react";
import { openPicker, short, signInWith, signOut, useAccount } from "./account.js";
import { Close, GitHub, Logo, XMark } from "./icons.js";

export function WalletPicker() {
  const { picking, wallets, busy, error } = useAccount();
  if (!picking) return null;
  return (
    <div className="picker-wrap" role="dialog" aria-modal="true" aria-labelledby="pick-h" onClick={() => openPicker(false)}>
      <div className="picker" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <h2 id="pick-h">Connect a wallet</h2>
          <button className="icon-btn" type="button" aria-label="Close" onClick={() => openPicker(false)}><Close /></button>
        </div>
        <p>You sign one message to log in. It costs nothing and sends no transaction.</p>
        {wallets.length ? (
          <ul>
            {wallets.map((w) => (
              <li key={w.name}><button type="button" disabled={busy} onClick={() => signInWith(w.name)}><img src={w.icon} alt="" width={28} height={28} />{w.name}{busy ? "…" : ""}</button></li>
            ))}
          </ul>
        ) : (
          <p className="picker-none">No Solana wallet found in this browser. Install Phantom, Solflare or Backpack, or open this page in your wallet's browser.</p>
        )}
        {error && <p className="picker-err" role="alert">{error}</p>}
      </div>
    </div>
  );
}

export function WalletButton() {
  const { me } = useAccount();
  const [open, setOpen] = useState(false);
  if (!me?.wallet) return <button type="button" className="btn-line" onClick={() => openPicker(true)}>CONNECT</button>;
  const h = me.hold;
  return (
    <div className="wallet-menu">
      <button type="button" className="btn-line" aria-expanded={open} onClick={() => setOpen(!open)}>{short(me.wallet)}</button>
      {open && (
        <div className="wallet-pop">
          <p className="mono">{short(me.wallet)}</p>
          <p>{h ? <>$TYPECADE worth <strong>{(h.sol ?? 0).toFixed(2)} SOL</strong></> : "Reading your $TYPECADE…"}</p>
          <p className="dim">{h?.holder ? "You can make games and like them." : h?.liker ? `Liking unlocked. Making games takes ${me.holderMinSol} SOL.` : `Making games takes ${me.holderMinSol} SOL, liking ${me.likeMinSol} SOL.`}</p>
          <button type="button" className="btn-line" onClick={() => { setOpen(false); signOut(); }}>DISCONNECT</button>
        </div>
      )}
    </div>
  );
}

export function Nav({ mint, links }) {
  return (
    <header className="nav">
      <a className="nav-brand" href="/" aria-label="Typecade home"><Logo size={36} /><span>TYPECADE</span></a>
      <nav aria-label="Sections">
        <a href="/#games">GAMES</a>
        <a href="/#create">CREATE</a>
        <a href="/#leaderboard">LEADERBOARD</a>
        <a href="/#coin">$TYPECADE</a>
        <a href="/docs">DOCS</a>
        <a href={links.source} target="_blank" rel="noopener">GITHUB</a>
      </nav>
      <div className="nav-right">
        <a className="icon-btn" href={links.x} target="_blank" rel="noopener" aria-label="Typecade on X"><XMark size={18} /></a>
        <a className="icon-btn" href={links.source.replace(/\/[^/]+$/, "")} target="_blank" rel="noopener" aria-label="Typecade on GitHub"><GitHub size={19} /></a>
        <WalletButton />
        {mint ? <a className="btn-solid" href={`https://pump.fun/coin/${mint}`} target="_blank" rel="noopener">BUY $TYPECADE</a> : <span className="btn-solid off" aria-disabled="true">$TYPECADE SOON</span>}
      </div>
    </header>
  );
}

const TICK = ["TYPE A GAME", "PLAY IT IN A MINUTE", "MAKERS GET PAID WHEN THEIR GAMES GET PLAYED", "HOLD 1 SOL OF $TYPECADE TO MAKE GAMES", "THE TOP 10 GAMES SHARE THE POOL EVERY DAY", "EVERY GAME IS OPEN SOURCE", "GAMES RUN SEALED: NO LOGINS, NO DRAINERS"];
export function Ticker() {
  const row = TICK.map((t) => <span key={t}>{t}<i aria-hidden="true" /></span>);
  return <div className="ticker" aria-label={TICK.join(". ")}><div className="ticker-run" aria-hidden="true">{row}{row}</div></div>;
}

export function Footer({ mint, links }) {
  const [copied, setCopied] = useState(false);
  return (
    <footer className="foot">
      <p className="foot-big">PRESS ENTER<br />TO PLAY</p>
      {mint && <button type="button" className="foot-ca" onClick={() => { navigator.clipboard?.writeText(mint); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><span>CA</span>{mint}<em>{copied ? "copied" : "copy"}</em></button>}
      <p className="foot-links"><a href="/docs">Docs</a><a href={links.source} target="_blank" rel="noopener"><GitHub size={16} /> Site code</a><a href={links.games} target="_blank" rel="noopener"><GitHub size={16} /> Games</a><a href={links.x} target="_blank" rel="noopener"><XMark size={14} /> X</a></p>
      <p className="foot-fine">Games run sealed: no network, no logins, no wallets inside a game. $TYPECADE is a memecoin; nobody promises it any value, and you can lose what you put in. $TYPECADE's creator fees split on-chain: 50% to the developer, 35% to the AI tank that pays for the games, 15% to the daily prize pool for makers.</p>
    </footer>
  );
}
