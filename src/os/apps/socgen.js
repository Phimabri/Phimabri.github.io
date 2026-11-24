// SocGen.chat: a soft "clay" chat app explaining a RAG chatbot.
// DA: warm putty background, puffy rounded cards with soft drop shadows and a top highlight,
// coral / navy / sage / sand palette, rounded sans (Nunito). Friendly, modern, tactile.
// Documents, questions and answers are fictional: they illustrate the method, not the internal tool.

const CORAL = '#e07a5f', NAVY = '#3d405b', SAGE = '#6fa58a', SAND = '#f2cc8f', CARD = '#fbf6ef', TEXT = '#3d405b', MUTED = '#8a8296';
const DOC_COL = [CORAL, NAVY, SAGE];
const FONT = 'Nunito, "Instrument Sans", sans-serif';

// chunk positions in the embedding map (unit square), grouped by document
const CHUNKS = [
  // 0 · home policy
  [0.3, 0.5], [0.12, 0.26], [0.22, 0.17], [0.24, 0.44], [0.4, 0.22], [0.08, 0.4], [0.31, 0.32], [0.12, 0.56],
  // 1 · car policy
  [0.7, 0.48], [0.74, 0.18], [0.88, 0.24], [0.9, 0.42], [0.68, 0.32], [0.58, 0.2], [0.84, 0.1], [0.8, 0.34],
  // 2 · claims FAQ
  [0.6, 0.62], [0.52, 0.82], [0.66, 0.8], [0.42, 0.88], [0.58, 0.92], [0.36, 0.64],
].map(([x, y], i) => ({ x, y, d: i < 8 ? 0 : i < 16 ? 1 : 2, k: i < 8 ? i : i < 16 ? i - 8 : i - 16 }));
const QUERIES = [[0.33, 0.58], [0.65, 0.55], [0.49, 0.15]];

function topK(q, k = 3) {
  const [qx, qy] = QUERIES[q];
  return CHUNKS.map((c, i) => ({ i, d: Math.hypot(c.x - qx, c.y - qy) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map((r) => ({ i: r.i, score: Math.max(0.3, 0.95 - r.d * 1.3) }));
}

const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
const clamp01 = (x) => Math.max(0, Math.min(1, x));

// ------------------------------------------------------------ clay primitives
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function clay(ctx, x, y, w, h, r, color, { lift = 1, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = 'rgba(110, 80, 60, 0.22)';
  ctx.shadowBlur = 18 * lift;
  ctx.shadowOffsetY = 7 * lift;
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  // soft top highlight and bottom shade, like a pressed piece of clay
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(255,255,255,0.38)');
  g.addColorStop(0.45, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(60,40,30,0.10)');
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
}
function blob(ctx, x, y, r, color, { alpha = 1, lift = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = 'rgba(110, 80, 60, 0.25)';
  ctx.shadowBlur = 10 * lift;
  ctx.shadowOffsetY = 4 * lift;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = 'transparent';
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  g.addColorStop(1, 'rgba(40,30,40,0.12)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function txt(ctx, s, x, y, { color = TEXT, size = 14, weight = 700, align = 'left', base = 'alphabetic', alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.fillText(s, x, y);
  ctx.restore();
}
function wrap(ctx, s, maxW, size, weight = 600) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  const out = [];
  let line = '';
  for (const w of s.split(' ')) {
    const tryL = line ? line + ' ' + w : w;
    if (ctx.measureText(tryL).width > maxW && line) { out.push(line); line = w; } else line = tryL;
  }
  if (line) out.push(line);
  return out;
}
function flow(ctx, pts, { t = 0, on = true } = {}) {
  // a soft dashed path with a little bead travelling along it
  ctx.save();
  ctx.strokeStyle = on ? 'rgba(61,64,91,0.32)' : 'rgba(61,64,91,0.13)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.setLineDash([2, 9]);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 4) ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
  else ctx.lineTo(pts[1][0], pts[1][1]);
  ctx.stroke();
  ctx.restore();
  if (!on) return;
  const k = t % 1;
  let x, y;
  if (pts.length === 4) {
    const u = 1 - k;
    x = u * u * u * pts[0][0] + 3 * u * u * k * pts[1][0] + 3 * u * k * k * pts[2][0] + k * k * k * pts[3][0];
    y = u * u * u * pts[0][1] + 3 * u * u * k * pts[1][1] + 3 * u * k * k * pts[2][1] + k * k * k * pts[3][1];
  } else { x = pts[0][0] + (pts[1][0] - pts[0][0]) * k; y = pts[0][1] + (pts[1][1] - pts[0][1]) * k; }
  blob(ctx, x, y, 5, SAND, { lift: 0.5 });
}
function star(ctx, x, y, r, color) {
  ctx.save();
  ctx.shadowColor = 'rgba(110,80,60,0.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r * 0.48 : r;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// the embedding map: a sunken clay tray with all the chunk dots
function tray(ctx, R) {
  ctx.save();
  rr(ctx, R.x, R.y, R.w, R.h, 22);
  ctx.fillStyle = '#ebe1d5';
  ctx.fill();
  ctx.clip();
  // inner shadow
  ctx.shadowColor = 'rgba(110,80,60,0.28)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.001)'; ctx.lineWidth = 30;
  rr(ctx, R.x - 15, R.y - 15, R.w + 30, R.h + 30, 36); ctx.stroke();
  ctx.restore();
}
const mapPos = (R, c) => [R.x + 26 + c.x * (R.w - 52), R.y + 26 + c.y * (R.h - 52)];
function chipLabel(ctx, s, x, y, color, { size = 13, alpha = 1 } = {}) {
  ctx.font = `700 ${size}px ${FONT}`;
  const w = ctx.measureText(s).width + 18;
  clay(ctx, x - w / 2, y - size - 4, w, size + 12, 99, CARD, { lift: 0.5, alpha });
  txt(ctx, s, x, y + 2, { color, size, align: 'center', alpha });
}

// ------------------------------------------------------------ the three canvas views
const VIEWS = {
  // documents are cut into passages; each passage becomes a point in the embedding space
  embed(ctx, W, H, t, S) {
    const L = S.L;
    const docW = Math.min(250, W * 0.25), gap = 16, dh = (H - 20 - gap * 2) / 3;
    const R = { x: docW + 60, y: 10, w: W - docW - 70, h: H - 20 };
    tray(ctx, R);
    txt(ctx, L.space, R.x + 22, R.y + 30, { color: MUTED, size: 13, weight: 800 });
    const docs = [];
    for (let d = 0; d < 3; d++) {
      const y = 10 + d * (dh + gap);
      clay(ctx, 6, y, docW, dh, 20, CARD);
      rr(ctx, 6, y, 10, dh, 0); // colour tab
      ctx.save(); rr(ctx, 6, y, docW, dh, 20); ctx.clip(); ctx.fillStyle = DOC_COL[d]; ctx.fillRect(6, y, 9, dh); ctx.restore();
      txt(ctx, L.docs[d], 30, y + 30, { size: 15, weight: 800, color: DOC_COL[d] === SAND ? NAVY : DOC_COL[d] });
      for (let l = 0; l < 4 && 48 + l * 16 < dh - 8; l++) {
        rr(ctx, 30, y + 44 + l * 16, (docW - 60) * (l === 3 ? 0.55 : 0.92 - l * 0.08), 6, 3);
        ctx.fillStyle = 'rgba(61,64,91,0.12)'; ctx.fill();
      }
      docs.push([6 + docW - 30, y + dh / 2]);
    }
    // passages fly from their document to their place in the space
    CHUNKS.forEach((c, i) => {
      const st = 0.5 + i * 0.09, e = ease((t - st) / 1.2);
      const [tx, ty] = mapPos(R, c);
      const [sx, sy] = docs[c.d];
      const bob = e >= 1 ? Math.sin(t * 1.2 + i) * 1.6 : 0;
      const x = sx + (tx - sx) * e, y = sy + (ty - sy) * e - Math.sin(e * Math.PI) * 50 + bob;
      if (t < st) return;
      blob(ctx, x, y, 7 + 2 * (1 - e), DOC_COL[c.d], { alpha: Math.min(1, (t - st) * 4) });
    });
    // group names once everything has landed
    const a = clamp01((t - 3.4) / 0.8);
    if (a > 0) {
      [[0.17, 0.7], [0.84, 0.58], [0.5, 1.03]].forEach(([x, y], d) => {
        const [px, py] = mapPos(R, { x, y });
        chipLabel(ctx, L.docs[d], px, py, DOC_COL[d], { alpha: a });
      });
      txt(ctx, L.close, R.x + R.w - 22, R.y + 30, { color: CORAL, size: 14, weight: 800, align: 'right', alpha: a });
    }
  },

  // the question is embedded too, and we fetch its nearest passages
  retrieve(ctx, W, H, t, S) {
    const L = S.L;
    const listW = Math.min(330, W * 0.34);
    const R = { x: 6, y: 10, w: W - listW - 36, h: H - 20 };
    tray(ctx, R);
    txt(ctx, L.space, R.x + 22, R.y + 30, { color: MUTED, size: 13, weight: 800 });
    const tq = t - S.tq;
    const top = topK(S.q);
    const hit = new Set(top.map((r) => r.i));
    const found = clamp01((tq - 1.1) / 0.6);
    const [qx, qy] = mapPos(R, { x: QUERIES[S.q][0], y: QUERIES[S.q][1] });
    // search ripples
    if (tq > 0.8) {
      for (let k = 0; k < 2; k++) {
        const p = ((tq - 0.8) * 0.35 + k * 0.5) % 1;
        ctx.save();
        ctx.strokeStyle = `rgba(224,122,95,${0.35 * (1 - p)})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(qx, qy, 14 + p * 120, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    }
    // links to the nearest passages
    top.forEach((r, j) => {
      const e = ease((tq - 1.1 - j * 0.18) / 0.5);
      if (e <= 0) return;
      const [x, y] = mapPos(R, CHUNKS[r.i]);
      ctx.save();
      ctx.strokeStyle = 'rgba(224,122,95,0.75)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.setLineDash([2, 7]);
      ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(qx + (x - qx) * e, qy + (y - qy) * e); ctx.stroke();
      ctx.restore();
    });
    CHUNKS.forEach((c, i) => {
      const [x, y] = mapPos(R, c);
      const on = hit.has(i);
      blob(ctx, x, y, on ? 7 + 3 * found : 7, DOC_COL[c.d], { alpha: on ? 1 : 1 - 0.6 * found });
    });
    // labels pushed outward, away from the question, so they never sit on top of it
    top.forEach((r) => {
      const c = CHUNKS[r.i];
      const [x, y] = mapPos(R, c);
      const s = L.chunks[c.d][c.k];
      ctx.font = `700 12.5px ${FONT}`;
      const w = ctx.measureText(s).width + 18;
      let dx = x - qx, dy = y - qy;
      const n = Math.hypot(dx, dy) || 1;
      dx /= n; dy /= n;
      chipLabel(ctx, s, x + dx * (w / 2 + 12), y + dy * 16 + 5, DOC_COL[c.d], { size: 12.5, alpha: found });
    });
    // the question arrives from above
    const e = ease(tq / 0.9);
    star(ctx, qx, qy - (1 - e) * 140, 15, SAND);
    if (e > 0.9) {
      ctx.font = `700 12.5px ${FONT}`;
      const w = ctx.measureText(L.you).width + 18;
      chipLabel(ctx, L.you, Math.max(R.x + w / 2 + 8, qx - w / 2 - 6), qy - 22, CORAL, { size: 12.5 });
    }

    // ranked list on the right
    const lx = W - listW - 6;
    txt(ctx, L.top, lx + 4, 34, { size: 15, weight: 800 });
    const ch = Math.min(96, (H - 70) / 3 - 14);
    top.forEach((r, j) => {
      const a = clamp01((tq - 1.3 - j * 0.2) / 0.5);
      const y = 52 + j * (ch + 14) + (1 - ease(a)) * 12;
      const c = CHUNKS[r.i];
      clay(ctx, lx, y, listW, ch, 20, CARD, { alpha: a });
      ctx.save(); ctx.globalAlpha = a; rr(ctx, lx, y, listW, ch, 20); ctx.clip(); ctx.fillStyle = DOC_COL[c.d]; ctx.fillRect(lx, y, 9, ch); ctx.restore();
      txt(ctx, `${j + 1}. ${L.chunks[c.d][c.k]}`, lx + 24, y + 28, { size: 15, weight: 800, alpha: a });
      txt(ctx, L.docs[c.d], lx + 24, y + 48, { size: 13, weight: 600, color: MUTED, alpha: a });
      const bw = listW - 110, by = y + ch - 22;
      ctx.save(); ctx.globalAlpha = a;
      rr(ctx, lx + 24, by, bw, 9, 5); ctx.fillStyle = 'rgba(61,64,91,0.1)'; ctx.fill();
      rr(ctx, lx + 24, by, Math.max(9, bw * r.score * ease(a)), 9, 5); ctx.fillStyle = CORAL; ctx.fill();
      ctx.restore();
      txt(ctx, (r.score * ease(a)).toFixed(2), lx + listW - 20, by + 9, { size: 14, weight: 800, color: CORAL, align: 'right', alpha: a });
    });
    wrap(ctx, L.sim, listW - 8, 12.5, 600).forEach((l, i, a) => txt(ctx, l, lx + 4, H - 8 - (a.length - 1 - i) * 17, { size: 12.5, weight: 600, color: MUTED }));
  },

  // retrieved passages + question go into the LLM, which writes a grounded, cited answer
  generate(ctx, W, H, t, S) {
    const L = S.L;
    const P = 13, p = (t - S.tq) % P;
    const on = (k) => p > k * 1.1;
    const y1 = H * 0.27, y2 = H * 0.73;
    const qW = Math.min(260, W * 0.27), qH = 100;
    // 1 · question
    clay(ctx, 6, y1 - qH / 2, qW, qH, 24, CORAL);
    txt(ctx, L.q, 26, y1 - qH / 2 + 24, { size: 12.5, weight: 800, color: 'rgba(255,255,255,0.8)' });
    wrap(ctx, L.questions[S.q], qW - 40, 14.5, 700).slice(0, 3).forEach((l, i) => txt(ctx, l, 26, y1 - qH / 2 + 46 + i * 19, { size: 14.5, color: '#fff' }));
    // 2 · retriever
    const rx = qW + Math.min(110, W * 0.11), rR = 36;
    blob(ctx, rx, y1, rR, NAVY, { alpha: on(1) ? 1 : 0.35 });
    ctx.save(); ctx.strokeStyle = CARD; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.globalAlpha = on(1) ? 1 : 0.5;
    ctx.beginPath(); ctx.arc(rx - 4, y1 - 4, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rx + 4, y1 + 4); ctx.lineTo(rx + 13, y1 + 13); ctx.stroke(); ctx.restore();
    txt(ctx, L.search, rx, y1 + rR + 22, { size: 13, weight: 800, align: 'center', color: MUTED });
    flow(ctx, [[6 + qW + 6, y1], [rx - rR - 6, y1]], { t: p, on: on(0.5) });
    // 3 · retrieved context
    const cx = rx + rR + 60, cW = W - cx - 8, top = topK(S.q), ch = 30;
    flow(ctx, [[rx + rR + 6, y1], [cx - 8, y1]], { t: p, on: on(1.5) });
    top.forEach((r, j) => {
      const a = clamp01((p - 2 - j * 0.25) / 0.5);
      const y = y1 - (ch * 3 + 16) / 2 + j * (ch + 8);
      const c = CHUNKS[r.i];
      clay(ctx, cx + (1 - ease(a)) * 20, y, cW, ch, 99, CARD, { alpha: Math.max(0.25, a), lift: 0.6 });
      blob(ctx, cx + 18 + (1 - ease(a)) * 20, y + ch / 2, 6, DOC_COL[c.d], { alpha: Math.max(0.25, a), lift: 0.3 });
      txt(ctx, `${L.chunks[c.d][c.k]} · ${L.docs[c.d]}`, cx + 34 + (1 - ease(a)) * 20, y + ch / 2 + 1, { size: 13.5, weight: 700, base: 'middle', alpha: Math.max(0.25, a) });
    });
    txt(ctx, L.context, cx + 6, y1 - (ch * 3 + 16) / 2 - 12, { size: 13, weight: 800, color: MUTED });
    // 4 · prompt
    const pW = Math.min(240, W * 0.25), pH = 128, py = y2 - pH / 2;
    flow(ctx, [[cx + cW * 0.35, y1 + (ch * 3 + 16) / 2 + 6], [cx + cW * 0.3, y2 - 20], [6 + pW + 120, py - 30], [6 + pW * 0.6, py - 4]], { t: p, on: on(3) });
    clay(ctx, 6, py, pW, pH, 24, CARD, { alpha: on(3.3) ? 1 : 0.4 });
    txt(ctx, L.prompt, 26, py + 26, { size: 12.5, weight: 800, color: MUTED });
    [[L.rules, SAND], [L.ctx3, SAGE], [L.q, CORAL]].forEach(([s, col], i) => {
      rr(ctx, 26, py + 40 + i * 27, pW - 40, 21, 99);
      ctx.fillStyle = col + (on(3.3) ? '55' : '22'); ctx.fill();
      txt(ctx, s, 38, py + 55 + i * 27, { size: 13, weight: 700, alpha: on(3.3) ? 1 : 0.5 });
    });
    // 5 · LLM
    const lx = 6 + pW + Math.min(120, W * 0.12), lR = 46 + (on(4.3) && p < 6.2 ? Math.sin(t * 5) * 3 : 0);
    flow(ctx, [[6 + pW + 6, y2], [lx - lR - 8, y2]], { t: p, on: on(4) });
    blob(ctx, lx, y2, lR, SAND, { alpha: on(4.3) ? 1 : 0.4 });
    txt(ctx, 'LLM', lx, y2 + 2, { size: 19, weight: 800, align: 'center', base: 'middle', alpha: on(4.3) ? 1 : 0.5 });
    // 6 · grounded answer
    const ax = lx + lR + 50, aW = W - ax - 8, aH = Math.min(H * 0.42, 170), ay = y2 - aH / 2;
    flow(ctx, [[lx + lR + 8, y2], [ax - 8, y2]], { t: p, on: on(5.3) });
    clay(ctx, ax, ay, aW, aH, 24, on(5.6) ? NAVY : CARD, { alpha: on(5.6) ? 1 : 0.55 });
    txt(ctx, L.answer, ax + 20, ay + 26, { size: 12.5, weight: 800, color: on(5.6) ? 'rgba(255,255,255,0.65)' : MUTED });
    const lines = wrap(ctx, L.answers[S.q], aW - 40, 14, 600);
    const shown = Math.floor(clamp01((p - 5.8) / 2.2) * lines.join(' ').length);
    let used = 0;
    const maxL = Math.floor((aH - 80) / 19);
    lines.slice(0, maxL).forEach((l, i) => {
      const s = l.slice(0, Math.max(0, shown - used));
      used += l.length + 1;
      txt(ctx, s + (i === maxL - 1 && lines.length > maxL && s.length === l.length ? '…' : ''), ax + 20, ay + 50 + i * 19, { size: 14, weight: 600, color: '#fbf6ef' });
    });
    const ca = clamp01((p - 8.1) / 0.4);
    top.slice(0, 2).forEach((r, j) => {
      const c = CHUNKS[r.i];
      const s = `[${j + 1}] ${L.chunks[c.d][c.k]}`;
      ctx.font = `800 12px ${FONT}`;
      const w = ctx.measureText(s).width + 18;
      const x = ax + 20 + (j ? ctx.measureText(`[1] ${L.chunks[CHUNKS[top[0].i].d][CHUNKS[top[0].i].k]}`).width + 30 : 0);
      rr(ctx, x, ay + aH - 34, w, 22, 99);
      ctx.save(); ctx.globalAlpha = ca; ctx.fillStyle = SAND; ctx.fill(); ctx.restore();
      txt(ctx, s, x + 9, ay + aH - 19, { size: 12, weight: 800, alpha: ca });
    });
    txt(ctx, L.cites, ax + aW, ay + aH + 22, { size: 13, weight: 700, color: MUTED, align: 'right', alpha: ca });
  },
};
const ORDER = ['chat', 'embed', 'retrieve', 'generate'];

export function createSocgen(root, { t }) {
  let raf = 0, current = 'chat', t0 = 0, running = false;
  const S = { q: 0, tq: 0, L: {} };
  let msgs = []; // {who:'u'|'b', q, at, el, done}

  root.innerHTML = `
    <div class="sg">
      <div class="sg__main">
        <aside class="sg__side">
          <span class="sg__kicker" data-c="kicker"></span>
          <h3 class="sg__title" data-c="title"></h3>
          <p class="sg__stand" data-c="stand"></p>
          <div class="sg__byline">
            <span class="sg__logo"></span>
            <div><b data-c="role"></b><span>Société Générale · <span data-c="where"></span></span><span class="sg__dates" data-c="dates"></span></div>
          </div>
          <ol class="sg__mods">
            ${ORDER.map((id, i) => `<li><button data-mod="${id}"><span class="sg__n">${i + 1}</span><span data-c="m.${id}"></span></button></li>`).join('')}
          </ol>
          <p class="sg__note" data-c="note"></p>
        </aside>
        <section class="sg__page">
          <p class="sg__desc" id="sgDesc"></p>
          <div class="sg__stage">
            <div class="sg__chat" id="sgChat">
              <header class="sg__chathead"><span class="sg__avatar"><i></i><i></i></span><div><b data-c="bot"></b><small><span class="sg__live"></span><span data-c="botsub"></span></small></div></header>
              <div class="sg__msgs" id="sgMsgs"></div>
            </div>
            <canvas id="sgCanvas"></canvas>
          </div>
          <div class="sg__ask" id="sgAsk"><span data-c="ask"></span><div class="sg__chips" id="sgChips"></div></div>
        </section>
      </div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const canvas = $('#sgCanvas');
  const ctx = canvas.getContext('2d');
  const msgBox = $('#sgMsgs');
  const esc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  function sourcesHTML(q) {
    return topK(q).slice(0, 2).map((r, j) => {
      const c = CHUNKS[r.i];
      return `<span class="sg__src" style="--c:${DOC_COL[c.d]}"><b>${j + 1}</b>${esc(S.L.docs[c.d])} · ${esc(S.L.chunks[c.d][c.k])}</span>`;
    }).join('');
  }
  function renderMsgs() {
    msgBox.innerHTML = '';
    msgs.forEach((m) => {
      const el = document.createElement('div');
      el.className = 'sg__msg sg__msg--' + m.who;
      if (m.who === 'u') el.innerHTML = `<p>${esc(S.L.questions[m.q])}</p>`;
      else el.innerHTML = `<p class="sg__typing"><i></i><i></i><i></i></p><div class="sg__srcs"></div>`;
      m.el = el;
      if (m.who === 'b' && m.done) finish(m);
      msgBox.appendChild(el);
    });
    msgBox.scrollTop = msgBox.scrollHeight;
  }
  function finish(m) {
    m.done = true;
    m.el.querySelector('p').className = '';
    m.el.querySelector('p').textContent = S.L.answers[m.q];
    const s = m.el.querySelector('.sg__srcs');
    s.innerHTML = `<small>${esc(S.L.sources)}</small>${sourcesHTML(m.q)}`;
    s.classList.add('is-in');
  }
  function ask(q) {
    S.q = q;
    S.tq = (performance.now() - t0) / 1000;
    root.querySelectorAll('[data-q]').forEach((b) => b.classList.toggle('is-on', +b.dataset.q === q));
    if (current === 'chat') {
      msgs.forEach((m) => { if (m.who === 'b' && !m.done) m.done = true; });
      const now = performance.now();
      msgs.push({ who: 'u', q, at: now }, { who: 'b', q, at: now + 450 });
      msgs = msgs.slice(-4);
      renderMsgs();
    }
  }
  function chatTick(now) {
    for (const m of msgs) {
      if (m.who !== 'b' || m.done || !m.el) continue;
      const el = now - m.at;
      const p = m.el.querySelector('p');
      if (el < 1100) continue; // typing dots
      const full = S.L.answers[m.q];
      const n = Math.floor((el - 1100) * 0.07);
      if (n >= full.length) { finish(m); msgBox.scrollTop = msgBox.scrollHeight; continue; }
      if (p.classList.contains('sg__typing')) p.className = 'sg__stream';
      p.textContent = full.slice(0, n);
      msgBox.scrollTop = msgBox.scrollHeight;
    }
  }

  function texts() {
    root.querySelectorAll('[data-c]').forEach((el) => (el.textContent = t('sg.' + el.dataset.c)));
    const L = S.L;
    for (const k of ['space', 'close', 'you', 'top', 'sim', 'q', 'search', 'context', 'prompt', 'rules', 'ctx3', 'answer', 'cites', 'sources'])
      L[k] = t('sg.l.' + k);
    L.docs = t('sg.docs').split('|');
    L.chunks = [0, 1, 2].map((d) => t('sg.c' + d).split('|'));
    L.questions = [0, 1, 2].map((i) => t('sg.q' + i));
    L.answers = [0, 1, 2].map((i) => t('sg.a' + i));
    $('#sgChips').innerHTML = L.questions.map((q, i) => `<button data-q="${i}" class="${i === S.q ? 'is-on' : ''}">${esc(q)}</button>`).join('');
    root.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => ask(+b.dataset.q)));
    msgs.forEach((m) => { if (m.who === 'b') m.done = true; });
    renderMsgs();
    select(current, true);
  }
  function select(id, quiet = false) {
    current = id;
    root.querySelectorAll('[data-mod]').forEach((b) => b.classList.toggle('is-on', b.dataset.mod === id));
    root.querySelector('.sg').dataset.view = id;
    const desc = $('#sgDesc');
    desc.innerHTML = esc(t('sg.d.' + id)).replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>');
    desc.classList.remove('is-in');
    void desc.offsetWidth;
    desc.classList.add('is-in');
    if (!quiet) {
      t0 = performance.now();
      S.tq = 0;
      if (id === 'chat' && !msgs.length) setTimeout(() => running && current === 'chat' && !msgs.length && ask(S.q), 500);
    }
    if (id !== 'chat') size();
  }
  root.querySelectorAll('[data-mod]').forEach((b) => b.addEventListener('click', () => select(b.dataset.mod)));

  function size() {
    const box = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(10, Math.round(box.width * dpr));
    canvas.height = Math.max(10, Math.round(box.height * dpr));
  }
  function frame(now) {
    if (!running) return;
    if (current === 'chat') chatTick(now);
    else {
      const box = canvas.parentElement.getBoundingClientRect();
      if (Math.abs(canvas.width - box.width * Math.min(devicePixelRatio || 1, 2)) > 2) size();
      const cssW = canvas.parentElement.offsetWidth, cssH = canvas.parentElement.offsetHeight;
      const k = canvas.width / cssW;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      VIEWS[current](ctx, cssW, cssH, (now - t0) / 1000, S);
    }
    raf = requestAnimationFrame(frame);
  }

  texts();
  return {
    start() {
      if (running) return;
      running = true;
      t0 = performance.now();
      S.tq = 0;
      raf = requestAnimationFrame(frame);
      if (current === 'chat' && !msgs.length) setTimeout(() => running && !msgs.length && ask(S.q), 600);
    },
    stop() { running = false; cancelAnimationFrame(raf); },
    refresh: texts,
  };
}
