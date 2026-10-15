// The site's icons: one stroke family (2px, round caps and joins) drawn for Typecade, plus the X and GitHub marks.
const S = (props) => ({ width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, ...props });
export const Search = (p) => <svg {...S(p)}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.8-4.8" /></svg>;
export const Close = (p) => <svg {...S(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const Play = (p) => <svg {...S(p)}><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>;
export const Link = (p) => <svg {...S(p)}><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></svg>;
export const Expand = (p) => <svg {...S(p)}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>;
export const Again = (p) => <svg {...S(p)}><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" /><path d="M4 4v4.5h4.5" /></svg>;
export const Type = (p) => <svg {...S(p)}><rect x="3" y="6" width="18" height="12" rx="3" /><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8" /></svg>;
export const Code = (p) => <svg {...S(p)}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" /></svg>;
export const Share = (p) => <svg {...S(p)}><path d="M12 15V4M8 8l4-4 4 4" /><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>;
export const Coin = (p) => <svg {...S(p)}><circle cx="12" cy="12" r="8.5" /><path d="M9.5 9.5h4a1.75 1.75 0 0 1 0 3.5h-3a1.75 1.75 0 0 0 0 3.5h4M12 7.5v1.5M12 16.5V18" /></svg>;
export const Heart = ({ filled, ...p }) => <svg {...S(p)}><path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10Z" fill={filled ? "currentColor" : "none"} /></svg>;
export const Wallet = (p) => <svg {...S(p)}><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M16 12.5h.01M3 9.5h18" /></svg>;
export const Trophy = (p) => <svg {...S(p)}><path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5a2.5 2.5 0 0 0 3 3.5M16 6h3a2.5 2.5 0 0 1-3 3.5M12 13v4M8.5 20h7" /></svg>;
export const XMark = (p) => <svg width={p?.size ?? 22} height={p?.size ?? 22} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.17h1.7L7.4 4.74H5.58l11.09 14.43Z" /></svg>;
export const GitHub = (p) => <svg width={p?.size ?? 22} height={p?.size ?? 22} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg>;
// the mark on the site: a pixel controller in the logo's lavender, on the same pixel grid as the Pixelify wordmark (2 px a
// cell); the buttons are holes that show the ground. The glass controller on its lavender tile is the app icon (favicon, X, pump.fun).
const PAD = "M4 0h12v1h-12zM2 1h16v1h-16zM1 2h3v1h-3zM5 2h10v1h-10zM16 2h3v1h-3zM0 3h3v1h-3zM6 3h8v1h-8zM15 3h1v1h-1zM17 3h3v1h-3zM0 4h4v1h-4zM5 4h3v1h-3zM9 4h2v1h-2zM12 4h3v1h-3zM16 4h4v1h-4zM0 5h20v1h-20zM0 6h20v1h-20zM0 7h7v1h-7zM13 7h7v1h-7zM0 8h6v1h-6zM14 8h6v1h-6zM1 9h4v1h-4zM15 9h4v1h-4zM2 10h2v1h-2zM16 10h2v1h-2z";
export const Logo = ({ size = 36 }) => {
  const p = Math.max(2, Math.round(size / 18));
  return <svg width={20 * p} height={11 * p} viewBox="0 0 20 11" shapeRendering="crispEdges" aria-hidden="true"><path fill="var(--lav)" d={PAD} /></svg>;
};
