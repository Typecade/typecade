// POST /api/admin {mint}: the server's go-live script puts $TYPECADE's CA on the site at launch (bearer BOT_KEY), no redeploy.
import { BOT_KEY } from "../../../lib/config.js";
import { redis } from "../../../lib/store.js";

export const runtime = "nodejs";

export async function POST(req) {
  const auth = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!BOT_KEY || auth !== BOT_KEY) return Response.json({ error: "no" }, { status: 401 });
  const { mint } = (await req.json().catch(() => null)) ?? {};
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint ?? "")) return Response.json({ error: "not a mint" }, { status: 400 });
  await redis(["SET", "tg:mint", mint]);
  return Response.json({ ok: true, mint });
}
