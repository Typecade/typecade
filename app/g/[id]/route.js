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

// ?test=1: the test run the maker's page does right after a game is made. Before the game's own code it starts listening
// for errors (syntax errors included), then plays about four seconds by itself: Space, a click, a tap, the arrow keys and
// a few drags, and hands what went wrong to the page (components/Hero.js), which asks the engine for one repair.
const TEST = `<script>(function(){var errs=[],seen={};function rep(m){m=String(m).slice(0,240);if(seen[m]||errs.length>=6)return;seen[m]=1;errs.push(m)}
addEventListener("error",function(e){if(e.message)rep(e.message+(e.lineno?" (line "+e.lineno+")":""))},true);
addEventListener("unhandledrejection",function(e){var r=e.reason;rep("Unhandled promise: "+(r&&r.message||r))});
var oe=console.error;console.error=function(){try{rep("console.error: "+[].slice.call(arguments).join(" "))}catch(x){}return oe.apply(console,arguments)};
function tgt(){var c=[].slice.call(document.querySelectorAll("canvas")).sort(function(a,b){return b.width*b.height-a.width*a.height})[0];return c||document.body}
var KC={Space:32,Enter:13,ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40};
function key(type,code){var k=code==="Space"?" ":code,o={code:code,key:k,keyCode:KC[code]||0,which:KC[code]||0,bubbles:true,cancelable:true};try{(document.activeElement||document.body).dispatchEvent(new KeyboardEvent(type,o))}catch(e){}}
function ptr(type,x,y){var t=tgt(),o={clientX:x,clientY:y,bubbles:true,cancelable:true,pointerId:1,pointerType:"mouse",isPrimary:true,button:0,buttons:type==="pointerup"?0:1};try{t.dispatchEvent(new PointerEvent(type,o))}catch(e){}try{t.dispatchEvent(new MouseEvent({pointerdown:"mousedown",pointermove:"mousemove",pointerup:"mouseup"}[type],o))}catch(e){}if(type==="pointerup")try{t.dispatchEvent(new MouseEvent("click",o))}catch(e){}}
function touch(type,x,y){try{var t=tgt(),p=new Touch({identifier:7,target:t,clientX:x,clientY:y}),on=type!=="touchend"?[p]:[];t.dispatchEvent(new TouchEvent(type,{touches:on,targetTouches:on,changedTouches:[p],bubbles:true,cancelable:true}))}catch(e){}}
var steps=[],at=0;function s(ms,fn){at+=ms;steps.push([at,fn])}
addEventListener("load",function(){var W=innerWidth,H=innerHeight;
s(700,function(){key("keydown","Space")});s(80,function(){key("keyup","Space")});
s(150,function(){ptr("pointerdown",W/2,H/2)});s(80,function(){ptr("pointerup",W/2,H/2)});
s(150,function(){touch("touchstart",W/2,H*0.6)});s(80,function(){touch("touchmove",W/2+30,H*0.6)});s(60,function(){touch("touchend",W/2+30,H*0.6)});
["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space"].forEach(function(c){s(110,function(){key("keydown",c)});s(220,function(){key("keyup",c)})});
for(var i=0;i<6;i++)(function(i){var x=W*(0.2+0.12*i),y=H*(0.3+0.1*(i%3));s(110,function(){ptr("pointerdown",x,y)});s(60,function(){ptr("pointermove",x+24,y+12)});s(60,function(){ptr("pointerup",x+24,y+12)})})(i);
s(400,function(){parent.postMessage({tg:"test",errors:errs},"*")});
steps.forEach(function(p){setTimeout(p[1],p[0])})})})();</script>`;

export async function GET(req, { params }) {
  const { id } = await params;
  const g = await getGame(id).catch(() => null);
  if (!g) return new Response("This game does not exist.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  const test = new URL(req.url).searchParams.get("test") === "1" && g.by !== "team";
  const html = g.by === "team" ? g.html
    : test ? (/<head[^>]*>/i.test(g.html) ? g.html.replace(/<head[^>]*>/i, (m) => m + TEST) : TEST + g.html)
    : g.html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${SNAP}</body>`);
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": CSP,
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "cross-origin-resource-policy": "same-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
      // a game never changes after it is made (a repaired game is a new game with a new id); the test run is never cached
      "cache-control": test ? "no-store" : "public, max-age=3600, s-maxage=31536000, immutable",
    },
  });
}
