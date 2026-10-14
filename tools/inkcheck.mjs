// Runs tools/inkcheck.js against a page in headless Chrome and fails (exit 1) when any glyph's ink touches a line below it.
//   node tools/inkcheck.mjs <url> --widths=320,375,768,1440 --sel="header, main > section, footer"
//   node tools/inkcheck.mjs <url> --size=1920x1080 --times=3,8.4,13 --sel="#s1, #s2"     film comps: checked at render(t)
// explainer.sh and banner.sh run it before rendering, so a $ or a comma sitting on the next line stops the render.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [url, ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.map((a) => { const i = a.indexOf("="); return [a.slice(2, i), a.slice(i + 1)]; }));
const sizes = opt.size ? [opt.size.split("x").map(Number)] : (opt.widths ?? "1440").split(",").map((w) => [Number(w), 900]);
const times = opt.times ? opt.times.split(",").map(Number) : [null];
const sel = opt.sel ?? "body";
const script = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "inkcheck.js"), "utf8");
const port = 9300 + Math.floor(Math.random() * 300), prof = fs.mkdtempSync(path.join(os.tmpdir(), "ink-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--hide-scrollbars", "--use-angle=metal", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 60 && !target; i++) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page"); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.value;
await send("Page.enable");

let bad = 0;
for (const [w, h] of sizes) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 });
  await send("Page.navigate", { url });
  for (let i = 0; i < 80; i++) { await sleep(250); if (await evaluate(`document.readyState === "complete" && (window.READY === true || typeof window.render !== "function")`)) break; }
  await evaluate("document.fonts.ready.then(() => true)");
  await sleep(600);
  await evaluate(script);
  // a page wider than the screen scrolls sideways on a phone
  const wide = await evaluate(`document.documentElement.scrollWidth`);
  if (wide > w + 1) { bad++; console.log(`overflow ${w}px: the page is ${wide}px wide`); }
  for (const t of times) {
    // film comps: show the frame at t with the motion taken out, so the settled layout is what gets measured
    const prep = t === null ? "" : `window.render(${t}); document.querySelectorAll(".w, .scene").forEach((e) => (e.style.transform = "none"));`;
    const found = await evaluate(`${prep} JSON.stringify(window.inkCheck(${JSON.stringify(sel)}, 0.04))`);
    for (const f of JSON.parse(found ?? "[]")) {
      bad++;
      console.log(`collision ${w}px${t === null ? "" : ` t=${t}`}: "${f.upper}" over "${f.lower}" in ${f.text}, gap ${f.gapEm}em at ${f.at}`);
    }
  }
}
ws.close(); chrome.kill(); await sleep(300); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
console.log(bad ? `${bad} type collision(s)` : `type clear (${sizes.length} size(s) × ${times.length} frame(s))`);
process.exit(bad ? 1 : 0);
