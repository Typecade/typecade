// Captures a page at several moments (ms after load): node tools/frames.mjs <url> <outprefix> <w> <h> <ms,ms,...>
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const [url, out, W, H, list] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random() * 200), prof = fs.mkdtempSync(path.join(os.tmpdir(), "frm-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--hide-scrollbars", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 60 && !target; i++) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page"); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });
await send("Page.enable");
await send("Page.navigate", { url });
const t0 = Date.now();
for (const ms of list.split(",").map(Number)) {
  await sleep(Math.max(0, ms - (Date.now() - t0)));
  const s = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(`${out}-${ms}.png`, Buffer.from(s.data, "base64"));
}
ws.close(); chrome.kill(); await sleep(300); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
