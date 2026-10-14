"use client";
// The site's motion, in one place: headings that decode like an arcade screen when they scroll in, the hero headline
// typed key by key, placeholder ideas that type themselves, and a reveal for blocks. Everything settles at once under
// reduced motion, and nothing is hidden before the script runs (content stays visible by default).
import { useEffect, useRef, useState } from "react";

// ?still (screenshots for reviews) and reduced motion both show every animation already finished
const reduced = () => typeof matchMedia !== "undefined" && (matchMedia("(prefers-reduced-motion: reduce)").matches || location.search.includes("still"));
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#%&@";

// a heading that scrambles into its text the first time it scrolls into view
export function Decode({ text, as: Tag = "h2", className, id }) {
  const ref = useRef(null);
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (reduced()) return;
    const el = ref.current;
    let raf = 0, done = false;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done) return;
      done = true; io.disconnect();
      const t0 = performance.now(), dur = 700 + text.length * 18;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        setOut([...text].map((c, i) => (c === " " || c === "\n" || i / text.length < p ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(""));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [text]);
  return <Tag ref={ref} id={id} className={className} aria-label={text.replace(/\n/g, " ")}><span aria-hidden="true">{out.split("\n").map((l, i, a) => <span key={i}>{l}{i < a.length - 1 && <br />}</span>)}</span></Tag>;
}

// the hero headline, typed one key at a time after a short beat behind a block cursor that blinks out when it is done;
// while the intro film runs (html[data-intro]) it waits for the film to end, so the typing is actually seen
export function Typed({ lines, className, id, delay = 500 }) {
  const full = lines.join("\n");
  const [n, setN] = useState(full.length);
  useEffect(() => {
    if (reduced()) return;
    setN(0);
    let i = 0, t;
    const tick = () => { i++; setN(i); if (i < full.length) t = setTimeout(tick, 70 + Math.random() * 60); };
    const go = () => { t = setTimeout(tick, delay); };
    if (document.documentElement.dataset.intro) addEventListener("tg:intro-done", go, { once: true });
    else go();
    return () => { clearTimeout(t); removeEventListener("tg:intro-done", go); };
  }, [full, delay]);
  const shown = full.slice(0, n).split("\n");
  return (
    <h1 id={id} className={className} aria-label={lines.join(" ")}>
      <span aria-hidden="true">{shown.map((l, i) => <span key={i}>{l}{i < shown.length - 1 && <br />}</span>)}<i className={n >= full.length ? "cursor done" : "cursor"} /></span>
    </h1>
  );
}

// ideas that type themselves into an empty input's placeholder, one after the other
export function useTypingPlaceholder(ideas, active) {
  const [ph, setPh] = useState(ideas[0]);
  useEffect(() => {
    if (!active || reduced()) { setPh(ideas[0]); return; }
    let k = 0, i = 0, del = false, t;
    const tick = () => {
      const s = ideas[k % ideas.length];
      if (!del) { i++; setPh(s.slice(0, i)); if (i >= s.length) { del = true; t = setTimeout(tick, 1800); return; } }
      else { i -= 2; setPh(s.slice(0, Math.max(0, i))); if (i <= 0) { del = false; k++; i = 0; } }
      t = setTimeout(tick, del ? 18 : 45);
    };
    t = setTimeout(tick, 900);
    return () => clearTimeout(t);
  }, [active, ideas]);
  return ph;
}

// blocks rise in the first time they scroll into view (only hidden once JS has marked them, so no-JS shows everything)
export function useReveal() {
  useEffect(() => {
    if (reduced()) return;
    const els = [...document.querySelectorAll("[data-reveal]")];
    els.forEach((el) => el.classList.add("rv"));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// a tile that tilts toward the pointer and catches a light sweep
export function useTilt() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced() || matchMedia("(hover: none)").matches) return;
    const move = (e) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--rx", `${(-y * 9).toFixed(2)}deg`); el.style.setProperty("--ry", `${(x * 11).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`); el.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
    };
    const leave = () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); };
    el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, []);
  return ref;
}
