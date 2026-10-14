// Ink-collision check for multi-line type, run in the page (tools/inkcheck.mjs injects it). For every text element it finds
// each glyph's real ink box (canvas metrics at the element's own font, placed on the line's baseline) and reports any glyph
// whose ink comes closer than `clear` em to a glyph on any line below it inside the same container (pass whole scenes or
// sections, so stacked separate elements are compared too): a $ or a comma touching the next line.
window.inkCheck = (selector = "body", clear = 0.04, skip = ".t-back, [hidden], [aria-hidden=true] svg") => {
  const g = document.createElement("canvas").getContext("2d");
  const found = [];
  for (const el of document.querySelectorAll(selector)) {
    if (!el.getClientRects().length) continue;
    const glyphs = [];
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = walk.nextNode()); ) {
      if (skip && n.parentElement.closest(skip)) continue; // e.g. a ticket's back, hidden behind its face
      const cs = getComputedStyle(n.parentElement);
      g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const fb = g.measureText("H"), fs = parseFloat(cs.fontSize);
      // text clipped away by an overflow:hidden ancestor (a line-clamped paragraph, a ticket edge) is not on screen
      let clip = null;
      for (let e = n.parentElement; e && e !== document.body; e = e.parentElement) {
        const o = getComputedStyle(e);
        if (o.overflowX !== "visible" || o.overflowY !== "visible") { const r = e.getBoundingClientRect(); clip = clip ? { t: Math.max(clip.t, r.top), b: Math.min(clip.b, r.bottom), l: Math.max(clip.l, r.left), r: Math.min(clip.r, r.right) } : { t: r.top, b: r.bottom, l: r.left, r: r.right }; }
      }
      for (let i = 0; i < n.length; i++) {
        const raw = n.data[i];
        if (/\s/.test(raw)) continue;
        const ch = cs.textTransform === "uppercase" ? raw.toUpperCase() : raw;
        const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1);
        const box = r.getBoundingClientRect();
        if (!box.width || !box.height) continue;
        if (clip && (box.top + box.height / 2 > clip.b || box.top + box.height / 2 < clip.t || box.left + box.width / 2 > clip.r || box.left + box.width / 2 < clip.l)) continue;
        const k = box.height / (fb.fontBoundingBoxAscent + fb.fontBoundingBoxDescent); // scale from transforms
        const m = g.measureText(ch), base = box.top + fb.fontBoundingBoxAscent * k;
        glyphs.push({ ch, fs: fs * k, base, l: box.left - m.actualBoundingBoxLeft * k, r: box.left + m.actualBoundingBoxRight * k, top: base - m.actualBoundingBoxAscent * k, bot: base + m.actualBoundingBoxDescent * k });
      }
    }
    // every pair of glyphs on different lines that share any horizontal span, wherever they sit in the container
    let worst = new Map();
    for (const a of glyphs) for (const b of glyphs) {
      if (b.base - a.base < Math.min(a.fs, b.fs) * 0.3) continue; // same line, or b is not below a
      if (a.r <= b.l || b.r <= a.l) continue;
      const gap = (b.top - a.bot) / Math.max(a.fs, b.fs);
      const key = `${Math.round(a.base)}|${Math.round(b.base)}`;
      if (gap < clear && (!worst.has(key) || gap < worst.get(key).gapEm)) worst.set(key, { text: el.id || el.className || el.tagName, gapEm: +gap.toFixed(3), upper: a.ch, lower: b.ch, at: [Math.round(a.l), Math.round(a.base)] });
    }
    found.push(...worst.values());
  }
  return found;
};
