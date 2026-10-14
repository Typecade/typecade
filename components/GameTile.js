// One game in the mosaic: its thumbnail, its title, likes, and a badge for new or starter. `place` is its grid area at
// each column count (components/mosaic.js); a tile wide enough also shows the sentence it came from.
"use client";
import { useState } from "react";
import { useTilt } from "./fx.js";
import { Heart, Play } from "./icons.js";

const hue = (id) => [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
export default function GameTile({ g, place, fresh = false, rank = null }) {
  const [broken, setBroken] = useState(!g.thumb);
  const isNew = g.by !== "team" && Date.now() - (g.at ?? 0) < 3600_000;
  const tilt = useTilt();
  return (
    <a ref={tilt} className={`gt${fresh ? " pop" : ""}`} href={`/play/${g.id}`} style={{ "--h": hue(g.id), ...place }}>
      {!broken ? <img className={g.cover ? "gt-sq" : ""} src={g.thumb} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} /> : <span className="gt-ph" aria-hidden="true"><Play width={30} height={30} /></span>}
      {!broken && g.cover && <img className="gt-wide" src={g.cover} alt="" loading="lazy" decoding="async" />}
      <span className="gt-badges">
        {rank != null && <span className="badge rank">#{rank}</span>}
        {isNew && <span className="badge new">NEW</span>}
        {g.by === "team" && <span className="badge team">STARTER</span>}
      </span>
      <span className="gt-shine" aria-hidden="true" />
      <span className="gt-label"><strong>{g.title}</strong><em>“{g.prompt}”</em></span>
      {g.likes > 0 && <span className="gt-likes"><Heart width={13} height={13} /> {g.likes}</span>}
    </a>
  );
}
