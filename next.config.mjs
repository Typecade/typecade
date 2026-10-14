// Every page carries the security headers below. The game files at /g/<id> are the exception: they set their own locked
// sandbox (app/g/[id]/route.js) and may be framed by Typecade's own pages. The CSP applies in production only: the dev
// server needs eval for hot reloading.
const prod = process.env.NODE_ENV === "production";
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");
const security = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(prod ? [{ key: "Content-Security-Policy", value: csp }] : []),
];

export default {
  async headers() {
    return [
      { source: "/((?!g/).*)", headers: security },
      { source: "/api/build", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
  // the starter games are read from disk by the game route
  outputFileTracingIncludes: { "/g/[id]": ["./starter/**"], "/api/games": ["./starter/**"], "/play/[id]": ["./starter/**"] },
  poweredByHeader: false,
  devIndicators: false,
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
