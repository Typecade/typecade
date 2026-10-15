// The pixel controller: a 90s pad drawn on a 50 x 50 grid (beige body, dark d-pad, lavender buttons like the old SNES pad),
// shaded the way pixel artists do it (light top edge, dark bottom band, a one-pixel outline), blown up with hard edges
// and set at 90% on a 1000 x 1000 canvas. node tools/pixel-controller.mjs <out.png> [glow 0|1] [bg hex]
import sharp from "sharp";

const [out = "brand/pixel/controller.png", glowArg = "0", bgArg = "08080a"] = process.argv.slice(2);
const N = 50, SCALE = 20, GLOW = glowArg === "1";
const hex = (h) => h === "none" ? [0, 0, 0] : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
const C = {
  bg: hex(bgArg), outline: hex("1b1a1e"),
  hi: hex("ece6da"), body: hex("d3ccbe"), mid: hex("bdb6a8"), low: hex("948d80"), deep: hex("6e685e"),
  pad: hex("35343b"), padHi: hex("55535c"), padLo: hex("232227"),
  lav: hex("b3a0ff"), lavHi: hex("dcd2ff"), lavLo: hex("8b76e6"), pur: hex("6f5cc4"), purHi: hex("9a88ec"), purLo: hex("4e3f99"),
  slot: hex("5a554c"), sh: hex("a49d90"), cable: hex("6b6672"),
};
const px = Array.from({ length: N }, () => Array(N).fill(null));
const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < N && y < N) px[y][x] = c; };

// the body: a dog-bone, two round grips and a narrower bar between them, so the waist dips in at the top and bottom
const L = [14.5, 27.5], R = [35.5, 27.5], RAD = 10.6;
const inBody = (x, y) => { const cx = x + 0.5, cy = y + 0.5; return Math.hypot(cx - L[0], cy - L[1]) <= RAD || Math.hypot(cx - R[0], cy - R[1]) <= RAD || (cx >= L[0] && cx <= R[0] && cy >= L[1] - 7.2 && cy <= L[1] + 6.4); };
// the cable: out of the top of the waist, curling away to the top right
for (const [x, y] of [[25, 20], [25, 19], [25, 18], [25, 17], [26, 16], [26, 15], [27, 14], [28, 13], [29, 13], [30, 12], [31, 12], [32, 11], [33, 11], [34, 11], [35, 10], [36, 10], [37, 10], [38, 9], [39, 9], [40, 8], [41, 8], [42, 7], [43, 6], [44, 5], [45, 4], [46, 3], [47, 2]]) set(x, y, C.cable);
// shoulder buttons: grey caps on the top of each grip
for (const [cx] of [L, R]) for (let x = Math.round(cx) - 6; x <= Math.round(cx) + 5; x++) for (let y = 15; y <= 18; y++) if (!inBody(x, y) && inBody(x, y + 2)) set(x, y, C.sh);
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  if (!inBody(x, y)) continue;
  const up = !inBody(x, y - 1), up2 = !inBody(x, y - 2), down = !inBody(x, y + 1), down2 = !inBody(x, y + 2), left = !inBody(x - 1, y), right = !inBody(x + 1, y);
  let c = C.body;
  if (up) c = C.hi; else if (down) c = C.deep; else if (down2) c = C.low; else if (up2) c = C.body; else if (y > 31) c = C.mid;
  if ((left || right) && !up && !down) c = y > 28 ? C.low : C.mid;
  set(x, y, c);
}
// d-pad: a clean plus on the left grip, lit from the top left
const D = [14, 27];
for (let i = -4; i <= 4; i++) for (let j = -1; j <= 1; j++) { set(D[0] + i, D[1] + j, C.pad); set(D[0] + j, D[1] + i, C.pad); }
for (let i = -1; i <= 1; i++) { set(D[0] + i, D[1] - 4, C.padHi); set(D[0] - 4, D[1] + i, i < 1 ? C.padHi : C.pad); set(D[0] + i, D[1] + 4, C.padLo); set(D[0] + 4, D[1] + i, i > -1 ? C.padLo : C.pad); }
set(D[0], D[1], C.padLo);
// select and start: two slanted pills in the waist
for (const sx of [21, 26]) { set(sx, 29, C.slot); set(sx + 1, 29, C.slot); set(sx + 1, 28, C.slot); set(sx + 2, 28, C.slot); }
// four round buttons on the right grip: lavender on top and left, deep purple on the right and bottom
const B = [36, 27];
const ROUND = [".###.", "#####", "#####", "#####", ".###."];
const btn = (cx, cy, base, hi, lo) => {
  ROUND.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== "#") return; const x = cx + i - 2, y = cy + j - 2; set(x, y, j === 4 || (j === 3 && (i === 0 || i === 4)) ? lo : base); }));
  set(cx - 1, cy - 1, hi); set(cx, cy - 1, hi); set(cx - 1, cy, hi);
};
btn(B[0], B[1] - 5, C.lav, C.lavHi, C.lavLo); btn(B[0] - 5, B[1], C.lav, C.lavHi, C.lavLo);
btn(B[0] + 5, B[1], C.pur, C.purHi, C.purLo); btn(B[0], B[1] + 5, C.pur, C.purHi, C.purLo);
// outline: every empty pixel next to the drawing becomes the dark line
const drawn = (x, y) => x >= 0 && y >= 0 && x < N && y < N && px[y][x] && px[y][x] !== C.outline;
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!px[y][x] && (drawn(x - 1, y) || drawn(x + 1, y) || drawn(x, y - 1) || drawn(x, y + 1))) px[y][x] = C.outline;

// to pixels, 20x, hard edges; with GLOW a soft lavender light around the pad on the dark ground, blurred on the big image
const W = N * SCALE, buf = Buffer.alloc(W * W * 3);
for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const c = px[Math.floor(y / SCALE)][Math.floor(x / SCALE)] ?? C.bg; const i = (y * W + x) * 3; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; }
let img = sharp(buf, { raw: { width: W, height: W, channels: 3 } });
if (GLOW) {
  const g = Buffer.alloc(W * W * 4);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const c = px[Math.floor(y / SCALE)][Math.floor(x / SCALE)]; if (c && c !== C.outline && c !== C.cable) { const i = (y * W + x) * 4; g[i] = 179; g[i + 1] = 160; g[i + 2] = 255; g[i + 3] = 70; } }
  const glow = await sharp(g, { raw: { width: W, height: W, channels: 4 } }).blur(38).png().toBuffer();
  const base = await img.png().toBuffer();
  // the glow goes under the pixels: only on the black ground it shows, the drawing stays crisp on top
  const mask = Buffer.alloc(W * W * 4);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const c = px[Math.floor(y / SCALE)][Math.floor(x / SCALE)]; const i = (y * W + x) * 4; if (c) { mask[i] = c[0]; mask[i + 1] = c[1]; mask[i + 2] = c[2]; mask[i + 3] = 255; } }
  const top = await sharp(mask, { raw: { width: W, height: W, channels: 4 } }).png().toBuffer();
  img = sharp(base).composite([{ input: glow, blend: "screen" }, { input: top }]);
}
// bg "none": the sprite alone on a clear ground, cropped to the drawing (for the site's logo, intro and share card)
if (bgArg === "none") {
  const W2 = N * SCALE, rgba = Buffer.alloc(W2 * W2 * 4);
  for (let y = 0; y < W2; y++) for (let x = 0; x < W2; x++) { const c = px[Math.floor(y / SCALE)][Math.floor(x / SCALE)]; const i = (y * W2 + x) * 4; if (c) { rgba[i] = c[0]; rgba[i + 1] = c[1]; rgba[i + 2] = c[2]; rgba[i + 3] = 255; } }
  await sharp(rgba, { raw: { width: W2, height: W2, channels: 4 } }).trim().png().toFile(out);
  console.log(out); process.exit(0);
}
// a margin all round, so the grips sit well inside a round profile picture: the pad at 90% of a 1000 x 1000 canvas
const framed = await img.resize(900, 900, { kernel: "nearest" }).png().toBuffer();
await sharp({ create: { width: 1000, height: 1000, channels: 3, background: { r: C.bg[0], g: C.bg[1], b: C.bg[2] } } }).composite([{ input: framed, left: 50, top: 50 }]).png().toFile(out);
console.log(out);
