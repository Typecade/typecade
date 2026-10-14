// POST /api/admin {mint}: the server's go-live script puts $TYPECADE's CA on the site at launch (bearer BOT_KEY), no redeploy.
// The CA is set once: a second, different CA is refused, so even a leaked key cannot point the BUY button at another coin.
// To change it on purpose, delete tg:mint in the store first.
import { BOT_KEY } from "../../../lib/config.js";
import { botAuth } from "../../../lib/guard.js";
import { redis } from "../../../lib/store.js";

export const runtime = "nodejs";

export async function POST(req) {
  if (!(await botAuth(req, BOT_KEY))) return Response.json({ error: "no" }, { status: 401 });
  const { mint } = (await req.json().catch(() => null)) ?? {};
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint ?? "")) return Response.json({ error: "not a mint" }, { status: 400 });
  if ((await redis(["SET", "tg:mint", mint, "NX"])) !== "OK") {
    const set = await redis(["GET", "tg:mint"]);
    if (set !== mint) return Response.json({ error: `a different CA is already set: ${set}` }, { status: 409 });
  }
  return Response.json({ ok: true, mint });
}
