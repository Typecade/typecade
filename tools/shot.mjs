// Full-page screenshots through Chrome's DevTools protocol at a true device width (headless Chrome's window has a minimum
// width, so phone widths need device emulation).   node tools/shot.mjs <url> <out.png> [width] [height] [mobile]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const [url, out, W = "1440", H = "900", mobile = "0"] = process.argv.slice(2);
const port = 9700 + Math.floor(Math.random() * 200), prof = fs.mkdtempSync(path.join(os.tmpdir(), "shot-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--hide-scrollbars", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 60 && !target; i++) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page"); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: Number(process.env.DPR ?? (mobile === "1" ? 2 : 1)), mobile: mobile === "1" });
await send("Page.enable");
// REDUCED=1: captures with prefers-reduced-motion, so reveals and typing have settled and nothing is caught mid-animation
if (process.env.REDUCED === "1") await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await send("Page.navigate", { url });
await sleep(Number(process.env.SHOT_WAIT ?? 9000));
// SHOT_AT=<selector>: scroll that element to the top and capture one viewport (full pages past ~8000px tile badly)
if (process.env.SHOT_AT) {
  await send("Runtime.evaluate", { expression: `document.documentElement.style.scrollBehavior="auto";document.querySelector(${JSON.stringify(process.env.SHOT_AT)}).scrollIntoView()` });
  await sleep(800);
  const s = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(out, Buffer.from(s.data, "base64"));
  ws.close(); chrome.kill(); await sleep(500); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
  console.log(out, "at", process.env.SHOT_AT); process.exit(0);
}
// scroll once through the page so lazy images load and anything waiting for the viewport has run, then back to the top
await send("Runtime.evaluate", { awaitPromise: true, expression: `(async()=>{document.querySelectorAll("img[loading=lazy]").forEach(i=>i.loading="eager");document.documentElement.style.scrollBehavior="auto";for(let y=0;y<document.documentElement.scrollHeight;y+=500){scrollTo(0,y);await new Promise(r=>setTimeout(r,90));}scrollTo(0,0);await new Promise(r=>setTimeout(r,1200));})()` });
const { contentSize } = await send("Page.getLayoutMetrics");
// short enough for one capture texture: keep the real viewport (so 100vh stays one screen) and capture beyond it;
// taller pages (phones at 2x): one tall viewport instead of stitched tiles, which repeat blocks past ~8000 px
const dpr = Number(process.env.DPR ?? (mobile === "1" ? 2 : 1)), tall = Math.ceil(contentSize.height);
let shot;
if (tall * dpr <= 8000) shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: +W, height: tall, scale: 1 } });
else {
  await send("Emulation.setDeviceMetricsOverride", { width: +W, height: tall, deviceScaleFactor: dpr, mobile: mobile === "1" });
  await sleep(1500);
  shot = await send("Page.captureScreenshot", { format: "png" });
}
fs.writeFileSync(out, Buffer.from(shot.data, "base64"));
ws.close(); chrome.kill(); await sleep(500); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
console.log(out, Math.ceil(contentSize.height), "px tall");
