"use client";
// The hero is the builder. Left: TYPE A GAME. and the one-sentence form. Right: the 3D Enter key, which presses down when a
// game starts; then the same space becomes the console where the code pours in, and then the game itself.
// A new game is not shown straight away: it first plays itself for about four seconds in the stage (/g/<id>?test=1 sends
// back any errors). If it threw, the engine gets one try to repair it (/api/build {fix}), the repaired game is test-played
// again, and only then is it handed over. Making games takes a connected wallet with $TYPECADE worth HOLDER_MIN_SOL (checked again on the server). The button
// says up front what is missing: OPENS AT LAUNCH before the coin exists, CONNECT WALLET without a wallet, and a note with
// a buy link when the wallet holds too little.
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { openPicker, refresh, useAccount } from "./account.js";
import { Again, Code, Expand, Link, Play, Wallet, XMark } from "./icons.js";
import Key3D from "./Key3D.js";
import { Typed, useTypingPlaceholder } from "./fx.js";

const EXAMPLES = [
  "Snake, but every apple is a green candle",
  "Flappy bird, but it's a burger escaping a hungry chef",
  "A penguin sliding down an endless ice mountain",
  "Space invaders where the aliens are tax forms",
];
const MAX = 280;
function morph(fn) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (document.startViewTransition && !reduce) document.startViewTransition(() => flushSync(fn));
  else fn();
}

export default function Hero({ onMade }) {
  const { me } = useAccount();
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState("idle");
  const [code, setCode] = useState("");
  const [game, setGame] = useState(null);
  const [note, setNote] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [focused, setFocused] = useState(false);
  const ph = useTypingPlaceholder(EXAMPLES, phase === "idle" && !focused && !prompt);
  const [bug, setBug] = useState(null);
  const keyRef = useRef(null), codeRef = useRef(null), started = useRef(0), inputRef = useRef(null), frameRef = useRef(null), sent = useRef(null), test = useRef(null);

  useEffect(() => {
    if (phase !== "building" && phase !== "fixing") return;
    const id = setInterval(() => setElapsed((Date.now() - started.current) / 1000), 100);
    return () => clearInterval(id);
  }, [phase]);
  useEffect(() => { if (codeRef.current) codeRef.current.scrollTop = codeRef.current.scrollHeight; }, [code]);
  useEffect(() => {
    const on = (e) => {
      if (!game || sent.current === game.id || e.source !== frameRef.current?.contentWindow || e.data?.tg !== "thumb") return;
      sent.current = game.id;
      fetch("/api/thumb", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: game.id, data: e.data.data }) })
        .then(() => onMade?.({ ...game, thumb: `/api/thumb/${game.id}?v=1` })).catch(() => {});
    };
    addEventListener("message", on);
    return () => removeEventListener("message", on);
  }, [game, onMade]);
  // the test run's report (or silence: a game that reports nothing in 10 s is let through)
  useEffect(() => {
    const on = (e) => {
      const t = test.current;
      if (!t || e.data?.tg !== "test" || e.source !== frameRef.current?.contentWindow) return;
      test.current = null; clearTimeout(t.timer);
      t.done(Array.isArray(e.data.errors) ? e.data.errors.map(String) : []);
    };
    addEventListener("message", on);
    return () => removeEventListener("message", on);
  }, []);

  // what stands between this visitor and a game, in plain words (null: nothing)
  function blocker() {
    if (me?.devOpen) return null;
    if (!me) return { text: "Checking your wallet…" };
    if (!me.mint) return { text: "Making games opens the moment $TYPECADE launches on pump.fun. Until then, play the starter games below." };
    if (!me.wallet) return { text: `Connect a wallet that holds $TYPECADE worth ${me.holderMinSol} SOL to make games.`, action: "connect" };
    if (!me.hold?.holder) return { text: `This wallet holds $TYPECADE worth ${(me.hold?.sol ?? 0).toFixed(2)} SOL; making games takes ${me.holderMinSol} SOL.${me.hold?.reason ? " " + me.hold.reason + "." : ""}`, action: "buy" };
    return null;
  }

  // reads one /api/build stream into the console; resolves {id, title} or throws with the reason
  async function stream(body) {
    const r = await fetch("/api/build", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) {
      const j = await r.json().catch(() => null);
      if (r.status === 402) refresh(true);
      throw new Error(j?.error ?? "The engine did not answer. Try again.");
    }
    const reader = r.body.getReader(), dec = new TextDecoder();
    let buf = "", full = "", result = null;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const l of lines) {
        if (!l) continue;
        const m = JSON.parse(l);
        if (m.t === "c") { full += m.d; setCode(full.length > 20000 ? full.slice(-20000) : full); }
        if (m.t === "done") result = { id: m.id, title: m.title };
        if (m.t === "err") throw new Error(m.m);
      }
    }
    if (!result) throw new Error("The game came out incomplete. Try again.");
    return result;
  }
  // plays the game in the stage for a few seconds and resolves with the errors it threw
  const testRun = (g) => new Promise((done) => {
    morph(() => { setGame({ ...g, test: true }); setPhase("testing"); });
    test.current = { id: g.id, done, timer: setTimeout(() => { test.current = null; done([]); }, 10000) };
  });

  async function build(e) {
    e?.preventDefault();
    const p = prompt.trim();
    if (["building", "testing", "fixing"].includes(phase)) return;
    const b = blocker();
    if (b?.action === "connect") { setNote(null); openPicker(true); return; }
    if (b) { setNote(b); return; }
    if (p.length < 3) { setNote({ text: "Type your game idea first, in one sentence." }); inputRef.current?.focus(); return; }
    keyRef.current?.press();
    setNote(null); setBug(null);
    await new Promise((r) => setTimeout(r, 260));
    morph(() => { setPhase("building"); setCode(""); setGame(null); setElapsed(0); });
    started.current = Date.now();
    try {
      const made = await stream({ prompt: p });
      let g = { ...made, prompt: p, s: Math.max(1, Math.round((Date.now() - started.current) / 1000)), at: Date.now() }, replaces = null;
      let errors = await testRun(g);
      if (errors.length) {
        // one repair: the engine gets its game back with the errors; the maker does not pay a game for it
        setBug(errors[0]);
        morph(() => { setPhase("fixing"); setCode(""); });
        const fixed = await stream({ fix: g.id, errors }).catch(() => null);
        if (fixed) {
          replaces = g.id;
          g = { ...fixed, prompt: p, s: Math.max(1, Math.round((Date.now() - started.current) / 1000)), at: Date.now() };
          errors = await testRun(g);
        }
        if (errors.length) setNote({ text: "Our test run still found a bug in this game, so it may misbehave. A new sentence usually comes out cleaner." });
      }
      morph(() => { setGame(g); setPhase("done"); setBug(null); });
      onMade?.({ id: g.id, title: g.title, prompt: p, at: g.at, by: null, wallet: me?.wallet ?? null, ms: Date.now() - started.current, plays: 0, likes: 0, thumb: null, replaces });
    } catch (err) {
      morph(() => { setNote({ text: err.message, error: true }); setPhase("idle"); setBug(null); });
    }
  }
  const again = () => { morph(() => { setPhase("idle"); setGame(null); setCode(""); setPrompt(""); }); setTimeout(() => inputRef.current?.focus(), 60); };
  const link = game ? `${location.origin}/play/${game.id}` : "";
  const post = game ? `https://x.com/intent/post?text=${encodeURIComponent(`I typed “${game.prompt}” and got a game:`)}&url=${encodeURIComponent(link)}` : "";
  const pump = me?.mint ? `https://pump.fun/coin/${me.mint}` : null;
  const busy = phase === "building" || phase === "testing" || phase === "fixing";
  // what the button and the standing note say before anyone clicks
  const gate = phase === "idle" ? blocker() : null;
  const closed = Boolean(gate && me && !me.mint), tooLittle = gate?.action === "buy";
  const shown = note ?? (closed || tooLittle ? gate : null);

  return (
    <section className={`hero hero-${phase}`} id="create" aria-labelledby="hero-h">
      <div className="hero-copy">
        <Typed id="hero-h" lines={["TYPE A", "GAME."]} />
        <p className="usp-big">GET PAID WHEN PEOPLE PLAY IT.</p>
        <p className="hero-sub">Write one sentence and an AI writes the whole game while you watch. Share the link: every day the prize pool goes to the makers of the 10 most-liked games.</p>
        <form className="make" onSubmit={build}>
          <label htmlFor="idea" className="sr">Your game in one sentence</label>
          <div className="make-field">
            <textarea id="idea" ref={inputRef} value={prompt} maxLength={MAX} rows={2} autoComplete="off" disabled={busy}
              placeholder={ph} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) build(e); }} />
            <button type="submit" className="make-btn" disabled={busy || closed || tooLittle}>
              {phase === "building" ? `WRITING ${elapsed.toFixed(0)}S`
                : phase === "testing" ? "TESTING"
                : phase === "fixing" ? `FIXING ${elapsed.toFixed(0)}S`
                : closed ? "OPENS AT LAUNCH"
                : gate?.action === "connect" ? <><Wallet width={17} height={17} /> CONNECT WALLET</>
                : <><Play width={16} height={16} /> MAKE MY GAME</>}
            </button>
          </div>
          {shown && (
            <p className={`make-note${shown.error ? " err" : ""}`} role={shown.error ? "alert" : "status"}>
              {shown.text}
              {shown.action === "buy" && pump && <a href={pump} target="_blank" rel="noopener">Buy $TYPECADE</a>}
            </p>
          )}
          {phase === "idle" && (
            <ul className="chips" aria-label="Ideas to try">
              {EXAMPLES.map((x) => <li key={x}><button type="button" onClick={() => { setPrompt(x); inputRef.current?.focus(); }}>{x}</button></li>)}
            </ul>
          )}
          <p className="make-fine">Connect a wallet that holds $TYPECADE worth {me?.holderMinSol ?? 1} SOL to make games. Every game is public and open source.</p>
        </form>
      </div>

      <div className="hero-stage" style={{ viewTransitionName: "stage" }}>
        {phase === "idle" && <><div className="halftone" aria-hidden="true" /><Key3D ref={keyRef} /><p className="drag">drag to tilt</p></>}
        {(phase === "building" || phase === "fixing") && (
          <div className="console" aria-live="polite">
            <div className="console-head"><span className="rec" aria-hidden="true" /><span className="mono">{phase === "fixing" ? "FIXING A BUG" : "WRITING"}</span><span className="console-q">{phase === "fixing" ? bug : `“${prompt.trim()}”`}</span><span className="mono clock">{elapsed.toFixed(0)}s</span></div>
            <pre ref={codeRef} className="code" aria-label="The game's code as the AI writes it">{code || (phase === "fixing" ? "reading the bug…" : "reading your idea…")}</pre>
            <p className="console-foot mono"><Code width={14} height={14} /> {phase === "fixing" ? "Our test run found a bug. The AI is fixing it, free for you." : `${(code.length / 1024).toFixed(1)} KB written. It plays here when it's done.`}</p>
          </div>
        )}
        {phase === "testing" && game && (
          <div className="console played" aria-live="polite">
            <iframe ref={frameRef} className="game" style={{ pointerEvents: "none" }} src={`/g/${game.id}?test=1`} title={`${game.title}, test run`} sandbox="allow-scripts allow-pointer-lock" allow="autoplay" />
            <div className="played-bar">
              <p className="played-title"><strong><span className="rec" aria-hidden="true" /> TEST RUN</strong><span>Playing {game.title} for a few seconds to catch bugs before it's yours.</span></p>
            </div>
          </div>
        )}
        {phase === "done" && game && (
          <div className="console played">
            <iframe ref={frameRef} className="game" src={`/g/${game.id}`} title={game.title} sandbox="allow-scripts allow-pointer-lock" allow="fullscreen; gamepad; autoplay" />
            <div className="played-bar">
              <p className="played-title"><strong>{game.title}</strong><span>Written in {game.s}s. Click the game to play.</span></p>
              <div className="actions">
                <a className="btn-solid sm" href={post} target="_blank" rel="noopener"><XMark size={15} /> POST</a>
                <button className="btn-line sm" type="button" onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><Link width={15} height={15} /> {copied ? "COPIED" : "LINK"}</button>
                <a className="btn-line sm" href={`/play/${game.id}`}><Expand width={15} height={15} /> PAGE</a>
                <button className="btn-line sm" type="button" onClick={again}><Again width={15} height={15} /> NEW</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
