// Starter-game pictures from each game's own #cover still (the game's real drawing code, no HUD, the hero mid-frame),
// captured headless: a square thumbnail for the mosaic and a 16:10 cover for the game's page.
// node tools/thumbs.mjs   (writes public/thumbs/<id>.jpg and public/covers/<id>.jpg; needs Chrome + ffmpeg)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { STARTER } from "../lib/starter.js";
fs.mkdirSync("public/covers", { recursive: true });
for (const g of STARTER) {
  for (const [dir, w, h, out] of [["thumbs", 720, 720, "480:480"], ["covers", 1280, 800, "1200:750"]]) {
    execFileSync("node", ["tools/check.mjs", `starter/${g.id}.html#cover`, `tools/out/${dir}-${g.id}`, String(w), String(h), "0"]);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", `tools/out/${dir}-${g.id}-title.png`, "-vf", `scale=${out}:flags=lanczos`, "-q:v", "4", `public/${dir}/${g.id}.jpg`]);
  }
  console.log(g.id);
}
