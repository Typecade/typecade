// The mosaic's layout: Poki's rhythm of big and small tiles, worked out for 2, 4, 6 and 8 columns so that every row closes
// flush whatever the number of games. The columns come in 2-wide blocks. A block holds one big tile, a wide tile over two
// small ones, two wide tiles, or four small ones. The blocks of each band (two rows) follow a repeating pattern; the last
// band shrinks its blocks until the games left fill it exactly, and a remainder too small for a band of its own joins
// the band above. The CSS picks the column count by container width.
const PATTERNS = { 2: [[1], [4], [4]], 4: [[1, 4], [4, 1]], 6: [[1, 1, 4], [1, 4, 1], [4, 1, 1]], 8: [[1, 4, 1, 4], [4, 1, 4, 1]] };

function block(n, c, r) {
  if (n === 1) return [[c, r, 2, 2]];
  if (n === 2) return [[c, r, 2, 1], [c, r + 1, 2, 1]];
  if (n === 3) return [[c, r, 2, 1], [c, r + 1, 1, 1], [c + 1, r + 1, 1, 1]];
  return [[c, r, 1, 1], [c + 1, r, 1, 1], [c, r + 1, 1, 1], [c + 1, r + 1, 1, 1]];
}

function layout(n, C) {
  const pats = PATTERNS[C], B = C / 2, sum = (a) => a.reduce((x, y) => x + y, 0), bands = [];
  for (let left = n; left > 0; ) {
    const sizes = [...pats[bands.length % pats.length]];
    if (left < B && bands.length) {
      // too few games for a band of their own: the band above takes them, its last blocks holding more tiles
      const last = bands[bands.length - 1];
      for (let d = left; d > 0; d--) last[last.findLastIndex((s) => s < 4)]++;
      break;
    }
    if (left < B) { bands.push(left); break; } // fewer games than blocks in all: they share the width
    for (let i = sizes.length - 1, s = sum(sizes); s > left; ) { if (sizes[i] > 1) { sizes[i]--; s--; } else i--; }
    bands.push(sizes); left -= sum(sizes);
  }
  const out = [];
  bands.forEach((sizes, b) => {
    const r = b * 2 + 1;
    if (typeof sizes === "number") for (let i = 0, c = 1; i < sizes; i++) { const w = Math.floor(C / sizes) + (i < C % sizes ? 1 : 0); out.push([c, r, w, 2]); c += w; }
    else sizes.forEach((s, k) => out.push(...block(s, k * 2 + 1, r)));
  });
  return out;
}

// one style object per tile: its grid area at each column count, as custom properties the CSS reads
export function tilePlaces(n) {
  const all = [2, 4, 6, 8].map((C) => [C, layout(n, C)]);
  return Array.from({ length: n }, (_, i) => Object.fromEntries(all.flatMap(([C, l]) => [[`--c${C}`, `${l[i][0]} / span ${l[i][2]}`], [`--r${C}`, `${l[i][1]} / span ${l[i][3]}`]])));
}
