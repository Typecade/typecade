"use client";
// The opener: PRESS START, then a 15-second film that explains Typecade in seven cards, with sound, and glides into the
// page. Once per visit; ?nointro or reduced motion skips it; SKIP and Esc end it at any point.
import { useEffect, useRef, useState } from "react";
import { Heart, Play } from "./icons.js";

const SCENES = [
  { t: 0, h: "TYPE ONE SENTENCE." },
  { t: 2400, h: "AN AI WRITES THE WHOLE GAME." },
  { t: 4800, h: "PLAY IT A MINUTE LATER." },
  { t: 7000, h: "PEOPLE PLAY IT AND LIKE IT." },
  { t: 9300, h: "MAKERS GET PAID. EVERY DAY." },
  { t: 11800, h: "$TYPECADE PAYS FOR IT." },
  { t: 14000, h: "PRESS ENTER TO PLAY." },
];
const END = 15600;
const IDEA = "a cat in a raincoat catching fish in the rain";
const CODE = `const cat = { x: W / 2, face: 1, happy: 0 };
function spawn() {
  const kind = Math.random() < 0.15 ? "boot" : "fish";
  items.push({ kind, x: rand(W), y: -40, vy: 260 });
}
function update(dt) {
  cat.x += (target - cat.x) * dt * 10;
  for (const f of items) f.y += f.vy * dt;
  if (hit(f, cat)) { score += 10; beep(784); }
}
function drawCat(x, y) {
  ctx.fillStyle = "#f29e4c"; ellipse(x, y, 30, 22);
  ctx.fillStyle = "#ffd166"; hood(x, y - 40);
}`;

// a tiny synth: key clicks, data chirps, a ding, pops, coins, a chord
function useSound() {
  const ac = useRef(null), gain = useRef(null), [on, setOn] = useState(true);
  const start = () => { try { ac.current = new (window.AudioContext || window.webkitAudioContext)(); gain.current = ac.current.createGain(); gain.current.gain.value = 0.5; gain.current.connect(ac.current.destination); } catch {} };
  const tone = (f, d = 0.06, type = "square", v = 0.05, slide = 0, at = 0) => {
    const c = ac.current; if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(gain.current); o.start(t); o.stop(t + d + 0.02);
  };
  const mute = () => { const next = !on; setOn(next); if (gain.current) gain.current.gain.value = next ? 0.5 : 0; };
  return { start, tone, on, mute, close: () => ac.current?.close?.() };
}

export default function Intro() {
  const [stage, setStage] = useState("off"); // off | gate | film | out
  const [pct, setPct] = useState(0);
  const [scene, setScene] = useState(0);
  const [typed, setTyped] = useState(0);
  const [likes, setLikes] = useState(0);
  const timers = useRef([]);
  const snd = useSound();

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("tg:intro") === "1"; } catch {}
    if (seen || location.search.includes("nointro") || location.search.includes("still") || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setStage("gate");
    document.documentElement.dataset.intro = "1"; // the hero headline waits for the film (components/fx.js)
    if (location.search.includes("introtest")) setTimeout(() => document.querySelector(".gate-start")?.click(), 50);
    const t0 = performance.now(), id = setInterval(() => { const p = Math.min(100, Math.round((performance.now() - t0) / 9)); setPct(p); if (p >= 100) clearInterval(id); }, 30);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (stage !== "gate" && stage !== "film") return;
    const key = (e) => {
      if (e.key === "Tab") return;
      if (stage === "gate") { e.preventDefault(); play(); }
      else if (e.key === "Escape" || (e.key === "Enter" && scene >= 6)) finish();
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const at = (ms, fn) => timers.current.push(setTimeout(fn, ms));
  function play() {
    if (stage !== "gate") return;
    snd.start();
    try { sessionStorage.setItem("tg:intro", "1"); } catch {}
    setStage("film");
    snd.tone(220, 0.25, "sawtooth", 0.05, 660);
    SCENES.forEach((s, i) => at(s.t, () => { setScene(i); if (i) snd.tone([0, 330, 523, 392, 659, 440, 523][i], 0.16, "triangle", 0.06, 120); }));
    // scene 1: the sentence types itself, with key clicks
    for (let i = 1; i <= IDEA.length; i++) at(300 + i * 42, () => { setTyped(i); if (i % 2) snd.tone(1600 + Math.random() * 600, 0.015, "square", 0.02); });
    // scene 2: data chirps while the code pours in
    for (let i = 0; i < 14; i++) at(2500 + i * 150, () => snd.tone(900 + Math.random() * 900, 0.03, "square", 0.018));
    // scene 3: a ding when the game appears
    at(4900, () => { snd.tone(784, 0.18, "triangle", 0.07); snd.tone(1175, 0.24, "triangle", 0.05, 0, 0.09); });
    // scene 4: likes climb with pops
    for (let i = 1; i <= 16; i++) at(7100 + i * 120, () => { setLikes(Math.round((i / 16) * 128)); snd.tone(600 + i * 40, 0.05, "sine", 0.05, 200); });
    // scene 5: coins
    for (let i = 0; i < 6; i++) at(9500 + i * 220, () => snd.tone(1318, 0.09, "square", 0.035, 600));
    // scene 6: a chord under the coin
    at(11900, () => [262, 330, 392, 523].forEach((f, i) => snd.tone(f, 1.1, "triangle", 0.035, 0, i * 0.04)));
    at(END, finish);
  }
  function finish() {
    if (stage === "out" || stage === "off") return;
    timers.current.forEach(clearTimeout);
    setStage("out");
    delete document.documentElement.dataset.intro;
    dispatchEvent(new Event("tg:intro-done"));
    setTimeout(() => { setStage("off"); snd.close(); }, 900);
  }
  if (stage === "off") return null;

  return (
    <div className={`intro intro-${stage}`} role="dialog" aria-label="Typecade intro" onClick={stage === "gate" ? play : undefined}>
      {stage === "gate" && (
        <div className="gate-inner">
          <div className="gate-key"><img src="/icon-256.png" width="150" height="150" alt="" /></div>
          <p className="gate-name">TYPECADE</p>
          <div className="gate-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
          <p className="gate-pct">{pct}%</p>
          <button type="button" className="gate-start" onClick={play} autoFocus>PRESS START</button>
          <p className="gate-hint">click / any key · sound on</p>
        </div>
      )}
      {stage !== "gate" && (
        <div className="film" data-scene={scene}>
          <p className="film-step mono">{String(scene + 1).padStart(2, "0")} / 07</p>
          <h2 key={scene} className="film-h">{SCENES[scene].h}</h2>
          <div className="film-art">
            {scene === 0 && <div className="f-prompt"><span>{IDEA.slice(0, typed)}</span><i className="cursor" /></div>}
            {scene === 1 && <pre className="f-code">{CODE}</pre>}
            {scene === 2 && <div className="f-game"><img src="/thumbs/rainycat.jpg" alt="" /><span className="f-play"><Play width={22} height={22} /> PLAY</span></div>}
            {scene === 3 && (
              <div className="f-game liked">
                <img src="/thumbs/rainycat.jpg" alt="" />
                {Array.from({ length: 9 }, (_, i) => <span key={i} className="f-heart" style={{ "--i": i }}><Heart width={26} height={26} filled /></span>)}
                <span className="f-count"><Heart width={18} height={18} filled /> {likes}</span>
              </div>
            )}
            {scene === 4 && (
              <div className="f-pool">
                {[["Rainy Day Cat", 50], ["Candle Snake", 33], ["Bug Blaster", 17]].map(([n, p], i) => (
                  <div key={n} className="f-bar" style={{ "--p": `${p}%`, "--d": `${i * 160}ms` }}><span>{n}</span><b>{p}%</b></div>
                ))}
                <p className="f-note mono">example: the day's pool shared by likes</p>
              </div>
            )}
            {scene === 5 && <div className="f-coin"><img src="/icon-512.png" alt="" /><p>Its creator fees pay the AI that writes the games and fill the makers' prize pool.</p></div>}
            {scene === 6 && <button type="button" className="f-enter" onClick={finish}><Play width={20} height={20} /> ENTER</button>}
          </div>
          <div className="film-bar" aria-hidden="true"><span /></div>
          <div className="film-ctl">
            <button type="button" onClick={snd.mute}>{snd.on ? "SOUND ON" : "SOUND OFF"}</button>
            <button type="button" onClick={finish}>SKIP</button>
          </div>
        </div>
      )}
    </div>
  );
}
