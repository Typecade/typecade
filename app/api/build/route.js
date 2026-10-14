// POST /api/build {prompt}: one sentence in, one game out, streamed while the model writes it. Only for $TYPECADE holders:
// the signed-in wallet needs $TYPECADE worth HOLDER_MIN_SOL (lib/holding.js).
// The answer is newline-delimited JSON: {t:"start",id}, many {t:"c",d:<code>}, then {t:"done",id,title} or {t:"err",m}.
// Before the call: the wallet's games for the day, a backstop per address, one build at a time per wallet, and the day's
// AI fuse (the worst case is booked first, so parallel builds cannot pass it; the real cost replaces it at the end). The
// model keeps writing and the game is saved even if the visitor closes the page, because the money is spent either way.
import { waitUntil } from "@vercel/functions";
import { HOLDER_MIN_SOL, LIMITS, MODEL, OPENROUTER_KEY, SITE, worstCaseMicro } from "../../../lib/config.js";
import { extractHtml, newId, publishGame, saveGame, screen, setGame, titleOf } from "../../../lib/games.js";
import { clientIp, ipHash, sameOrigin } from "../../../lib/guard.js";
import { gameMint, holding } from "../../../lib/holding.js";
import { SYSTEM, userMessage } from "../../../lib/prompt.js";
import { sessionWallet } from "../../../lib/session.js";
import { K, redis, today } from "../../../lib/store.js";

export const runtime = "nodejs";
export const maxDuration = 300;

const json = (status, m) => Response.json({ error: m }, { status, headers: { "cache-control": "no-store" } });

export async function POST(req) {
  if (!sameOrigin(req)) return json(403, "Games are made on typecade.app.");
  const body = await req.json().catch(() => null);
  const prompt = String(body?.prompt ?? "").replace(/\s+/g, " ").trim();
  if (prompt.length < LIMITS.promptMin) return json(400, "Describe your game in a few words.");
  if (prompt.length > LIMITS.promptMax) return json(400, `Keep it to ${LIMITS.promptMax} characters.`);
  const no = screen(prompt);
  if (no) return json(400, no);
  // development only: with MOCK_ENGINE=1 and no key, a starter game streams in as if the model wrote it (no AI money spent)
  const mock = !OPENROUTER_KEY && process.env.NODE_ENV !== "production" && process.env.MOCK_ENGINE === "1";
  if (!OPENROUTER_KEY && !mock) return json(503, "The game engine is not connected yet.");

  // holders only. On a dev machine with DEV_OPEN=1, only the quality tool (tools/quality.mjs sends x-dev-open: 1) may build
  // without a coin; the browser always goes through the holder check, exactly as on the live site
  const devOpen = process.env.NODE_ENV !== "production" && process.env.DEV_OPEN === "1" && req.headers.get("x-dev-open") === "1";
  const wallet = (await sessionWallet(req)) ?? (devOpen ? "dev" : null);
  if (!wallet) return json(401, "Connect your wallet to make a game.");
  if (!devOpen) {
    if (!(await gameMint())) return json(403, "Making games opens when $TYPECADE launches.");
    const hold = await holding(wallet, true).catch(() => null);
    if (!hold?.holder) return json(402, `Making a game takes $TYPECADE worth ${HOLDER_MIN_SOL} SOL in this wallet.${hold?.reason ? " " + hold.reason + "." : ""}`);
  }
  const ip = clientIp(req), day = today();
  const ipKey = K("ip", ip, day), walletKey = K("made", wallet, day), busyKey = K("busy", wallet), usdKey = K("usd", day);
  const [n, nw] = [await redis(["INCRBY", ipKey, "1"]), await redis(["INCRBY", walletKey, "1"])];
  if (n === 1) await redis(["EXPIRE", ipKey, "90000"]);
  if (nw === 1) await redis(["EXPIRE", walletKey, "90000"]);
  const refundIp = () => Promise.all([redis(["INCRBY", ipKey, "-1"]), redis(["INCRBY", walletKey, "-1"])]).catch(() => {});
  if (nw > LIMITS.perWalletDay || n > LIMITS.perIpDay) {
    await refundIp();
    return json(429, `That's ${LIMITS.perWalletDay} games for this wallet today. New ones from 00:00 UTC.`);
  }
  if (!(await redis(["SET", busyKey, "1", "NX", "EX", "300"]))) {
    await refundIp();
    return json(429, "Your last game is still being made.");
  }
  const reserved = worstCaseMicro(Math.ceil((SYSTEM.length + prompt.length) / 3.2));
  const used = await redis(["INCRBY", usdKey, String(reserved)]);
  if (used === reserved) await redis(["EXPIRE", usdKey, "172800"]);
  const release = (actual = 0) => Promise.all([redis(["INCRBY", usdKey, String(actual - reserved)]), redis(["DEL", busyKey])]).catch(() => {});
  if (used > LIMITS.globalUsdDay * 1e6) {
    await Promise.all([release(0), refundIp()]);
    return json(503, "Today's AI budget is used up. New games from 00:00 UTC.");
  }

  let up;
  if (mock) up = await mockUpstream();
  else try {
    up = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${OPENROUTER_KEY}`, "content-type": "application/json", "http-referer": SITE, "x-title": "Typecade" },
      body: JSON.stringify({
        model: MODEL.id,
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userMessage(prompt) }],
        max_tokens: LIMITS.maxOutputTokens,
        reasoning: { effort: MODEL.effort, exclude: true },
        temperature: 0.7,
        stream: true,
        usage: { include: true },
      }),
    });
  } catch {
    up = null;
  }
  if (!up?.ok) {
    await Promise.all([release(0), refundIp()]);
    const status = up?.status === 402 ? 503 : 502;
    return json(status, status === 503 ? "The engine's AI credit is being refilled. Try again in a few minutes." : "The engine did not answer. Try again.");
  }

  const id = newId(), started = Date.now(), enc = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const out = writable.getWriter();
  let open = true;
  const send = (o) => { if (open) out.write(enc.encode(JSON.stringify(o) + "\n")).catch(() => (open = false)); };

  const work = (async () => {
    let full = "", usage = null, finish = null, carry = "";
    const dec = new TextDecoder();
    send({ t: "start", id });
    try {
      const reader = up.body.getReader();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        carry += dec.decode(value, { stream: true });
        const lines = carry.split("\n");
        carry = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          let j;
          try { j = JSON.parse(data); } catch { continue; }
          const d = j.choices?.[0]?.delta?.content;
          if (d) { full += d; send({ t: "c", d }); }
          if (j.choices?.[0]?.finish_reason) finish = j.choices[0].finish_reason;
          if (j.usage) usage = j.usage;
        }
      }
    } catch {
      finish = "error";
    }
    const costUsd = Number(usage?.cost ?? ((usage?.prompt_tokens ?? 0) * MODEL.in + (usage?.completion_tokens ?? 0) * MODEL.out) / 1e6);
    await release(Math.ceil(costUsd * 1e6));
    const refused = full.trim().match(/^REFUSED:\s*(.{0,160})/);
    const html = refused ? null : extractHtml(full);
    if (refused) {
      await refundIp();
      send({ t: "err", m: `Not a game we can make: ${refused[1]}` });
    } else if (!html) {
      await refundIp();
      send({ t: "err", m: finish === "length" ? "The game got too long. Try a simpler idea." : "The game came out incomplete. Try again." });
    } else {
      const g = { id, prompt, title: titleOf(html, prompt), html, model: MODEL.id, ms: Date.now() - started, costUsd: +costUsd.toFixed(4), at: Date.now(), by: null, wallet: wallet === "dev" ? null : wallet, plays: 0, repo: null, ipHash: ipHash(ip) };
      await saveGame(g);
      send({ t: "done", id, title: g.title, ms: g.ms });
      // open source: the file goes to the public games repo; the link lands on the game when GitHub has it
      try {
        const repo = await publishGame(g);
        if (repo) await setGame({ ...g, repo });
      } catch {}
    }
    if (open) await out.close().catch(() => {});
  })();
  waitUntil(work);
  return new Response(readable, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}

// an OpenRouter-shaped stream of a starter game, about 10 s long, for building the site without spending AI money
async function mockUpstream() {
  const { readFile } = await import("node:fs/promises");
  const { STARTER } = await import("../../../lib/starter.js");
  const pick = STARTER[Math.floor(Math.random() * STARTER.length)];
  const html = await readFile(`${process.cwd()}/starter/${pick.id}.html`, "utf8");
  const enc = new TextEncoder(), size = Math.ceil(html.length / 160);
  const body = new ReadableStream({
    async start(c) {
      for (let i = 0; i < html.length; i += size) {
        c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: html.slice(i, i + size) } }] })}\n\n`));
        await new Promise((r) => setTimeout(r, 60));
      }
      c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 1500, completion_tokens: 9000, cost: 0 } })}\n\ndata: [DONE]\n\n`));
      c.close();
    },
  });
  return new Response(body, { status: 200 });
}
