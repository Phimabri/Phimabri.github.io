// The Shop's items (Objets): one pixel-art item per Project, each with a short animation loop.
// Drawn on a small pixel grid (48 × 36) and scaled up with crisp pixels (image-rendering: pixelated).
// An item stands literally for what the Project is about (GLOSSARY.md: Objet).

// The drawers are written in design units (a 32 × 24 board); the pen draws them RES times finer,
// so outlines and lines get thinner and the shapes rounder while the composition stays the same.
const RES = 1.5;
export const GRID_W = 32 * RES, GRID_H = 24 * RES;
/** The frame shown when motion is reduced: every item complete (the chart fully drawn). */
export const STILL_FRAME = 21;
const INK = '#111014', PAPER = '#fff7e8', CYAN = '#1fb5e8', RED = '#ff4d4d', GREEN = '#2fc46b', YELLOW = '#ffd84d', GREY = '#8a8478';

function pen(g) {
  const dot = (X, Y, c) => { g.fillStyle = c; g.fillRect(X, Y, 1, 1); }; // one fine pixel
  const R = (v) => Math.round(v * RES);
  const px = (x, y, c) => dot(R(x), R(y), c);
  const rect = (x, y, w, h, c) => { g.fillStyle = c; const X = R(x), Y = R(y); g.fillRect(X, Y, R(x + w) - X, R(y + h) - Y); };
  const line = (x0, y0, x1, y1, c, every = 1) => { // Bresenham on the fine grid (every = 3: dotted)
    x0 = R(x0); y0 = R(y0); x1 = R(x1); y1 = R(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy, k = 0;
    for (;;) { if (k++ % every === 0) dot(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  };
  const thick = (x0, y0, x1, y1, c) => { line(x0, y0, x1, y1, c); line(x0 + 1 / RES, y0, x1 + 1 / RES, y1, c); }; // two fine pixels wide
  const ring = (cx, cy, r, c) => { const n = Math.ceil(r * RES * 8); for (let a = 0; a < n; a++) dot(Math.round((cx + Math.cos((a / n) * Math.PI * 2) * r) * RES), Math.round((cy + Math.sin((a / n) * Math.PI * 2) * r) * RES), c); };
  const disc = (cx, cy, r, c) => {
    const CX = cx * RES, CY = cy * RES, rr = r * RES;
    for (let Y = Math.floor(CY - rr); Y <= Math.ceil(CY + rr); Y++) for (let X = Math.floor(CX - rr); X <= Math.ceil(CX + rr); X++) {
      const ox = X + 0.5 - CX, oy = Y + 0.5 - CY;
      if (ox * ox + oy * oy <= rr * rr) dot(X, Y, c);
    }
  };
  // a filled polygon (design units), pixel by pixel on the fine grid, with a 1-pixel ink outline
  const poly = (pts, c, outline) => {
    const P = pts.map(([x, y]) => [x * RES, y * RES]);
    const inside = (X, Y) => { let o = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > Y) !== (yj > Y) && X < ((xj - xi) * (Y - yi)) / (yj - yi) + xi) o = !o; } return o; };
    const xs = P.map((q) => q[0]), ys = P.map((q) => q[1]);
    const x0 = Math.floor(Math.min(...xs)) - 1, x1 = Math.ceil(Math.max(...xs)) + 1, y0 = Math.floor(Math.min(...ys)) - 1, y1 = Math.ceil(Math.max(...ys)) + 1;
    for (let Y = y0; Y <= y1; Y++) for (let X = x0; X <= x1; X++) {
      const at = (dx, dy) => inside(X + 0.5 + dx, Y + 0.5 + dy);
      if (at(0, 0)) dot(X, Y, c);
      else if (outline && (at(1, 0) || at(-1, 0) || at(0, 1) || at(0, -1))) dot(X, Y, outline);
    }
  };
  return { px, rect, line, thick, ring, disc, poly };
}

// Each drawer gets the pen and a frame counter f (8 frames a second).
const ITEMS = {
  // time series: a chart that draws itself, its head blinking
  chart(p, f) {
    p.thick(4, 3, 4, 20, INK); p.thick(4, 20, 28, 20, INK);
    for (let y = 6; y < 20; y += 4) for (let x = 6; x < 28; x += 2) p.px(x, y, GREY);
    const pts = [[5, 16], [8, 14], [11, 15], [14, 10], [17, 12], [20, 8], [23, 9], [27, 5]];
    const n = (f % 28) / 3; // grow, then hold
    for (let i = 0; i < Math.min(pts.length - 1, n); i++) p.thick(...pts[i], ...pts[i + 1], CYAN);
    const k = Math.min(pts.length - 1, Math.floor(n));
    if (f % 2 === 0) p.rect(pts[k][0] - 1, pts[k][1] - 1, 3, 3, RED);
  },
  // the PureOptics website: a world-wide-web globe that turns
  globe(p, f) {
    const cx = 16, cy = 12, r = 9;
    p.disc(cx, cy, r + 0.8, INK); // outline = a slightly bigger ink disc behind: clean on the fine grid
    p.disc(cx, cy, r, CYAN);
    for (let i = 0; i < 4; i++) { // meridians sliding round
      const a = ((f / 10 + i / 4) % 1) * Math.PI;
      const ex = Math.cos(a) * r;
      for (let y = -r; y <= r; y += 1 / RES) { const w = Math.sqrt(Math.max(0, r * r - y * y)) / r; p.px(cx + ex * w, cy + y, INK); } // every fine row: a continuous line
    }
    for (const yy of [-5, 0, 5]) { const w = Math.round(Math.sqrt(r * r - yy * yy)); p.line(cx - w, cy + yy, cx + w, cy + yy, INK); }
    p.px(cx - 4, cy - 6, PAPER); p.px(cx - 5, cy - 5, PAPER); // shine
  },
  // the GAN: a small neural network, an impulse crossing it layer by layer
  neurons(p, f) {
    const layers = [[6, [6, 12, 18]], [16, [4, 9, 15, 20]], [26, [9, 15]]];
    const lit = Math.floor(f / 3) % 4; // which layer the impulse is in (3 = rest)
    // quiet links dotted, the ones the impulse travels along solid
    for (let l = 0; l < 2; l++) for (const y0 of layers[l][1]) for (const y1 of layers[l + 1][1]) p.line(layers[l][0], y0, layers[l + 1][0], y1, lit === l + 1 ? INK : GREY, lit === l + 1 ? 1 : 3);
    layers.forEach(([x, ys], l) => ys.forEach((y) => { p.disc(x, y, 2.7, INK); p.disc(x, y, 1.9, lit === l ? YELLOW : PAPER); }));
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
    p.rect(11, 14, 10, 6, INK); p.rect(12, 15, 8, 4, GREY);
    p.rect(13, 11.5, 2, 2.5, INK); p.rect(17, 11.5, 2, 2.5, INK); // prongs
    p.thick(16, 20, 16, 22.5, INK); p.thick(16, 22.5, 27, 22.5, INK); // cable
    // a solid lightning bolt with an ink outline: reads on a yellow (rare) card too
    const on = f % 3 !== 2;
    p.poly([[19.5, 0.5], [11.5, 6.2], [15.5, 6.2], [12, 10.8], [22.5, 4], [18.4, 4], [23.5, 0.5]], on ? PAPER : GREY, INK);
    if (on) { const s = f % 4; p.px(9 - s, 4 + s, INK); p.px(24 + s, 5 - s, INK); p.px(23, 1 + s, INK); }
  },
};

export const ITEM_NAMES = Object.keys(ITEMS);

/** Draws one frame of an item on a GRID_W × GRID_H canvas context (transparent background). */
export function drawItem(g, item, f) {
  g.clearRect(0, 0, GRID_W, GRID_H);
  ITEMS[item]?.(pen(g), f); // an unknown name draws nothing (the catalogue test guards the names)
}
