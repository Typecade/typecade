// GET /g/<id>: the game file itself, locked down. The CSP sandbox gives it an opaque origin (no cookies or storage of
// typecade.app), and connect-src/form-action 'none' mean it can never send anything anywhere: a fake login or wallet
// page made here would be useless. Only Typecade's own pages may frame it.
import { getGame } from "../../../lib/games.js";

export const runtime = "nodejs";

const CSP = [
  "sandbox allow-scripts allow-pointer-lock",
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "media-src data: blob:",
  "font-src data:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "frame-ancestors 'self'",
].join("; ");

// After 2.5 s the game hands its own title screen to the page that framed it, as a small JPEG: the mosaic's thumbnail.
// The page uploads it once (app/api/thumb), only for a game its visitor just made.
const SNAP = `<script>setTimeout(function(){try{var c=[].slice.call(document.querySelectorAll("canvas")).sort(function(a,b){return b.width*b.height-a.width*a.height})[0];if(!c||!c.width)return;var s=Math.min(c.width,c.height),t=document.createElement("canvas");t.width=t.height=360;t.getContext("2d").drawImage(c,(c.width-s)/2,(c.height-s)/2,s,s,0,0,360,360);parent.postMessage({tg:"thumb",data:t.toDataURL("image/jpeg",0.74)},"*")}catch(e){}},2500)</script>`;

export async function GET(_req, { params }) {
  const { id } = await params;
  const g = await getGame(id).catch(() => null);
  if (!g) return new Response("This game does not exist.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  const html = g.by === "team" ? g.html : g.html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${SNAP}</body>`);
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": CSP,
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "cross-origin-resource-policy": "same-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
      // a game never changes after it is made
      "cache-control": "public, max-age=3600, s-maxage=31536000, immutable",
    },
  });
}
