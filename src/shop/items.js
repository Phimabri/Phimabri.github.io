// The Shop's items (Objets): one pixel-art item per Project, each with a short animation loop.
// Drawn on a tiny pixel grid (32 × 24) and scaled up with crisp pixels (image-rendering: pixelated).
// An item stands literally for what the Project is about (GLOSSARY.md: Objet).

export const GRID_W = 32, GRID_H = 24;
/** The frame shown when motion is reduced: every item complete (the chart fully drawn). */
export const STILL_FRAME = 21;
const INK = '#111014', PAPER = '#fff7e8', CYAN = '#1fb5e8', RED = '#ff4d4d', GREEN = '#2fc46b', YELLOW = '#ffd84d', GREY = '#8a8478';

function pen(g) {
  const px = (x, y, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const line = (x0, y0, x1, y1, c, every = 1) => { // Bresenham: hard pixel lines (every = 2: dotted)
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy, k = 0;
    for (;;) { if (k++ % every === 0) px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  };
  const ring = (cx, cy, r, c) => { for (let a = 0; a < 64; a++) px(cx + Math.cos((a / 64) * Math.PI * 2) * r, cy + Math.sin((a / 64) * Math.PI * 2) * r, c); };
  const disc = (cx, cy, r, c) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) px(cx + x, cy + y, c); };
  return { px, rect, line, ring, disc };
}

// Each drawer gets the pen and a frame counter f (8 frames a second).
const ITEMS = {
  // time series: a chart that draws itself, its head blinking
  chart(p, f) {
    p.line(4, 3, 4, 20, INK); p.line(4, 20, 28, 20, INK);
    for (let y = 6; y < 20; y += 4) for (let x = 6; x < 28; x += 2) p.px(x, y, GREY);
    const pts = [[5, 16], [8, 14], [11, 15], [14, 10], [17, 12], [20, 8], [23, 9], [27, 5]];
    const n = (f % 28) / 3; // grow, then hold
    for (let i = 0; i < Math.min(pts.length - 1, n); i++) p.line(...pts[i], ...pts[i + 1], CYAN);
    const k = Math.min(pts.length - 1, Math.floor(n));
    if (f % 2 === 0) p.rect(pts[k][0] - 1, pts[k][1] - 1, 3, 3, RED);
  },
  // the PureOptics website: a world-wide-web globe that turns
  globe(p, f) {
    const cx = 16, cy = 12, r = 9;
    p.disc(cx, cy, r, CYAN);
    for (let i = 0; i < 4; i++) { // meridians sliding round
      const a = ((f / 10 + i / 4) % 1) * Math.PI;
      const ex = Math.cos(a) * r;
      for (let y = -r; y <= r; y++) { const w = Math.sqrt(Math.max(0, r * r - y * y)) / r; p.px(cx + ex * w, cy + y, INK); }
    }
    for (const yy of [-5, 0, 5]) { const w = Math.round(Math.sqrt(r * r - yy * yy)); p.line(cx - w, cy + yy, cx + w, cy + yy, INK); }
    p.ring(cx, cy, r, INK);
    p.px(cx - 4, cy - 6, PAPER); p.px(cx - 5, cy - 5, PAPER); // shine
  },
  // the GAN: a small neural network, an impulse crossing it layer by layer
  neurons(p, f) {
    const layers = [[6, [6, 12, 18]], [16, [4, 9, 15, 20]], [26, [9, 15]]];
    const lit = Math.floor(f / 3) % 4; // which layer the impulse is in (3 = rest)
    // quiet links dotted, the ones the impulse travels along solid
    for (let l = 0; l < 2; l++) for (const y0 of layers[l][1]) for (const y1 of layers[l + 1][1]) p.line(layers[l][0], y0, layers[l + 1][0], y1, lit === l + 1 ? INK : GREY, lit === l + 1 ? 1 : 3);
    layers.forEach(([x, ys], l) => ys.forEach((y) => { p.disc(x, y, 2, lit === l ? YELLOW : PAPER); p.ring(x, y, 2.4, INK); }));
  },
  // market making on Polymarket: an order book, asks in red above, bids in green below, the spread blinking
  orderbook(p, f) {
    const wob = (i) => Math.round(2 * Math.sin(f * 0.9 + i * 1.7));
    for (let i = 0; i < 4; i++) {
      const w = 8 + i * 4 + wob(i);
      p.rect(16 - w / 2, 2 + i * 2.5 - 0.5, w, 2, RED); // asks, widening away from the mid
      const wb = 8 + i * 4 + wob(i + 4);
      p.rect(16 - wb / 2, 14 + i * 2.5, wb, 2, GREEN); // bids
    }
    p.line(3, 12, 29, 12, f % 4 < 2 ? INK : GREY); // the spread
    p.rect(12, 11, 8, 3, PAPER); p.rect(13, 12, 6, 1, f % 4 < 2 ? INK : GREY);
  },
  // courtier-mcp, an energy broker: a plug, a lightning bolt crackling above
  plug(p, f) {
    p.rect(11, 12, 10, 7, INK); p.rect(12, 13, 8, 5, GREY);
    p.rect(13, 9, 2, 3, INK); p.rect(17, 9, 2, 3, INK); // prongs
    p.line(16, 19, 16, 22, INK); p.line(16, 22, 27, 22, INK); // cable
    const bolt = [[18, 1], [14, 5], [17, 5], [13, 9]];
    const on = f % 3 !== 2;
    // inked outline first: the bolt must read on a yellow (rare) card too
    for (let i = 0; i < bolt.length - 1; i++) for (const [ox, oy] of [[-1, 0], [2, 0], [0, -1], [1, 1]]) p.line(bolt[i][0] + ox, bolt[i][1] + oy, bolt[i + 1][0] + ox, bolt[i + 1][1] + oy, INK);
    for (let i = 0; i < bolt.length - 1; i++) { p.line(...bolt[i], ...bolt[i + 1], on ? PAPER : GREY); p.line(bolt[i][0] + 1, bolt[i][1], bolt[i + 1][0] + 1, bolt[i + 1][1], on ? PAPER : GREY); }
    if (on) { const s = f % 4; p.px(9 - s, 4 + s, INK); p.px(23 + s, 6 - s, INK); p.px(22, 1 + s, INK); }
  },
};

export const ITEM_NAMES = Object.keys(ITEMS);

/** Draws one frame of an item on a GRID_W × GRID_H canvas context (transparent background). */
export function drawItem(g, item, f) {
  g.clearRect(0, 0, GRID_W, GRID_H);
  ITEMS[item]?.(pen(g), f); // an unknown name draws nothing (the catalogue test guards the names)
}
