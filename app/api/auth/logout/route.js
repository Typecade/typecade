// POST /api/auth/logout: ends the session on the server and clears the cookie.
import { sameOrigin } from "../../../../lib/guard.js";
import { endCookie, endSession } from "../../../../lib/session.js";

export const runtime = "nodejs";

export async function POST(req) {
  if (!sameOrigin(req)) return Response.json({ ok: false }, { status: 403 });
  await endSession(req);
  return Response.json({ ok: true }, { headers: { "set-cookie": endCookie } });
}
