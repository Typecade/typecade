// The engine's quality test: sends a few real sentences through the local builder (npm run dev must be running), times each
// game, and plays each one headless (tools/check.mjs) for console errors and screenshots. Every game costs real AI money,
// so it runs only the number asked for (default 3).   node tools/quality.mjs [count] [base]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
const N = Number(process.argv[2] ?? 3), BASE = process.argv[3] ?? "http://localhost:5380";
const PROMPTS = [
  "Snake, but you're a chart eating green candles and dodging the red ones",
  "A frog hopping across a busy highway made of crypto charts",
  "Flappy bird but it's a burger escaping a hungry chef",
  "Space invaders where the aliens are tax forms",
  "A penguin sliding down an endless ice mountain collecting fish",
  "Whack-a-mole with bears popping out of holes",
  "A tiny wizard defending a castle from slimes with fireballs",
  "Pong against an AI that gets cockier every point",
  "A racing game where you dodge traffic as a shopping cart",
  "Doodle jump with a cat jumping on clouds to reach the moon",
];
fs.mkdirSync("tools/out/q", { recursive: true });
const rows = [];
for (const prompt of PROMPTS.slice(0, N)) {
  const t0 = Date.now();
  const r = await fetch(`${BASE}/api/build`, { method: "POST", headers: { "content-type": "application/json", origin: BASE, "x-dev-open": "1" }, body: JSON.stringify({ prompt }) });
  if (!r.ok) { rows.push({ prompt, ok: false, err: (await r.json().catch(() => ({}))).error ?? r.status }); continue; }
  const reader = r.body.getReader(), dec = new TextDecoder(); let buf = "", done = null, err = null, firstCode = null, chars = 0;
  for (;;) {
    const { value, done: end } = await reader.read(); if (end) break;
    buf += dec.decode(value, { stream: true }); const lines = buf.split("\n"); buf = lines.pop();
    for (const l of lines) { if (!l) continue; const m = JSON.parse(l); if (m.t === "c") { chars += m.d.length; firstCode ??= Date.now() - t0; } if (m.t === "done") done = m; if (m.t === "err") err = m.m; }
  }
  const row = { prompt, ok: !!done, id: done?.id, title: done?.title, seconds: ((Date.now() - t0) / 1000).toFixed(1), firstCodeS: firstCode && (firstCode / 1000).toFixed(1), kb: (chars / 1024).toFixed(1), err };
  if (done) {
    for (const [w, h, m] of [[1280, 800, "0"], [390, 844, "1"]]) {
      const out = execFileSync("node", ["tools/check.mjs", `${BASE}/g/${done.id}`, `tools/out/q/${done.id}-${m === "1" ? "m" : "d"}`, String(w), String(h), m]).toString();
      row[m === "1" ? "errorsPhone" : "errorsDesk"] = JSON.parse(out.trim().split("\n").pop()).errors.length;
    }
  }
  rows.push(row); console.log(JSON.stringify(row));
}
const ok = rows.filter((r) => r.ok && !r.errorsDesk && !r.errorsPhone).length;
console.log(`\n${ok}/${rows.length} complete without console errors. Screenshots: tools/out/q/`);
