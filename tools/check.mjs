// Plays a game file headless through Chrome's DevTools protocol: console errors, then screenshots of the title, a few
// seconds of play (keys or taps) and later. node tools/check.mjs <file-or-url> <outprefix> [width height mobile]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const [src, out, W = "1280", H = "800", mobile = "0"] = process.argv.slice(2);
const url = /^https?:/.test(src) ? src : "file://" + path.resolve(src);
const port = 9500 + Math.floor(Math.random() * 300), prof = fs.mkdtempSync(path.join(os.tmpdir(), "chk-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--hide-scrollbars", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 60 && !target; i++) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page"); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(), errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map((a) => a.value ?? a.description).join(" "));
};
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: mobile === "1" ? 2 : 1, mobile: mobile === "1" });
if (mobile === "1") await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Page.enable");
await send("Page.navigate", { url });
await sleep(1500);
const shot = async (name) => { const s = await send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(`${out}-${name}.png`, Buffer.from(s.data, "base64")); };
await shot("title");
const key = async (code, key, ms = 80) => { await send("Input.dispatchKeyEvent", { type: "keyDown", code, key, windowsVirtualKeyCode: { Space: 32, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 }[code] }); await sleep(ms); await send("Input.dispatchKeyEvent", { type: "keyUp", code, key }); };
const tap = async (x, y, hold = 60) => {
  if (mobile === "1") { await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }); await sleep(hold); await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); }
  else { await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }); await sleep(hold); await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }); }
};
if (mobile === "1") await tap(+W / 2, +H / 2); else await key("Space", " ");
await sleep(900);
await shot("play1");
for (let i = 0; i < 10; i++) { if (mobile === "1") await tap(+W * (0.3 + 0.4 * (i % 2)), +H * 0.6, 120); else { await key(["ArrowLeft", "ArrowUp", "ArrowRight", "Space"][i % 4], " ", 120); } await sleep(150); }
await shot("play2");
await sleep(2500);
await shot("later");
console.log(JSON.stringify({ src, errors }));
ws.close(); chrome.kill(); await sleep(300); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
process.exit(0);
