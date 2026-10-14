// Icon variants from an image model through OpenRouter, using our 3D render as the shape reference, so the controller
// keeps Typecade's form. Each image costs real AI money (a few cents), so it makes only the number asked for.
//   node --env-file=.env.local tools/genicon.mjs [count] [model]     writes brand/ai/icon-<n>.png
import fs from "node:fs";
const N = Number(process.argv[2] ?? 4), MODEL = process.argv[3] ?? "google/gemini-nano-banana-2.1";
const KEY = (process.env.OPENROUTER_API_KEY ?? "").replace(/^"|"$/g, "");
if (!KEY) throw new Error("OPENROUTER_API_KEY fehlt in .env.local");
const ref = "data:image/png;base64," + fs.readFileSync("brand/typecade-icon-1000.png").toString("base64");
const PROMPT = `Square coin icon for a crypto project called Typecade. One retro game controller, the exact shape and button layout of the reference image, made entirely of flawless clear crystal glass: transparent, with crisp bright edge highlights, subtle refraction and caustics inside, slightly frosted white light inside the body so it reads white on black. The d-pad and the four round buttons are deep glossy black. Centered, tilted slightly toward the viewer, filling about 70% of the frame with even margin. Pure black background (#000000), no glow, no halo, no floor, no reflection plane, no shadow, no text, no logo, no frame. Studio product photography, ultra sharp, clean, premium, readable at 48 pixels.`;
fs.mkdirSync("brand/ai", { recursive: true });
for (let i = 1; i <= N; i++) {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json", "x-title": "Typecade icon" },
    body: JSON.stringify({ model: MODEL, modalities: ["image", "text"], messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: ref } }] }], usage: { include: true } }),
  });
  const j = await r.json();
  const url = j?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) { console.log(`variant ${i}: no image`, JSON.stringify(j).slice(0, 300)); continue; }
  fs.writeFileSync(`brand/ai/icon-${i}.png`, Buffer.from(url.slice(url.indexOf(",") + 1), "base64"));
  console.log(`variant ${i}: brand/ai/icon-${i}.png  cost $${j.usage?.cost ?? "?"}`);
}
