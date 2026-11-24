// CREST.nb: a data-journalism magazine page.
// DA: cream paper, serif headlines, one burgundy accent + a slate blue, thin horizontal rules,
// numbered figures with a "Source" line, italic serif annotations. Clean and very readable.
// Every curve is an explanatory illustration on synthetic data.

const INK = '#3b5b7a', RED = '#8c1c13', PENCIL = '#cfc5b2', HL = 'rgba(140,28,19,0.13)', TEXT = '#2a2722';

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeData() {
  const r = rng(2024);
  const M = 160;
  const ts = Array.from({ length: M }, (_, i) => i / (M - 1));
  const X = ts.map((t) => 0.55 * Math.sin(2 * Math.PI * (t * 1.3 + 0.1)) + 0.3 * Math.sin(2 * Math.PI * t * 3.7 + 1) + 0.25 + (r() - 0.5) * 0.12);
  const beta = ts.map((t) => 1.2 * Math.exp(-(((t - 0.3) / 0.12) ** 2)) - 0.7 * Math.exp(-(((t - 0.72) / 0.1) ** 2)));
  const prod = X.map((x, i) => x * beta[i]);
  const Y = prod.reduce((a, b) => a + b, 0) / M;
  const noise = Array.from({ length: 24 }, () => (r() - 0.5) * 2);
  // daily series over 4 quarters, and the quarterly index it helps predict
  const Q = 4, perQ = 60;
  const daily = [];
  let lvl = 0;
  for (let i = 0; i < Q * perQ; i++) { lvl = 0.92 * lvl + (r() - 0.5) * 0.5; daily.push(lvl + Math.sin(i / 9) * 0.25); }
  const quarterly = Array.from({ length: Q }, (_, q) => {
    let s = 0;
    for (let d = 0; d < perQ; d++) s += daily[q * perQ + d] * Math.exp(-(((d / perQ) - 0.6) ** 2) / 0.08);
    return s / perQ;
  });
  const hist = [0.2, 0.35, 0.3, 0.5, 0.42, 0.61, 0.55, 0.7, 0.66, 0.78];
  return { M, ts, X, beta, prod, Y, noise, daily, quarterly, Q, perQ, hist, r };
}

// hand-drawn line: a tiny, stable wobble so it looks inked, revealed progressively
function inkLine(ctx, pts, { color = INK, w = 2.2, reveal = 1, dash = null } = {}) {
  const n = Math.max(2, Math.floor(pts.length * reveal));
  ctx.save();
  if (dash) ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i];
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}
function note(ctx, s, x, y, { color = RED, size = 22, align = 'left', rot = 0 } = {}) {
  size = Math.round(size * 0.68);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.font = `italic 500 ${size}px Fraunces, Georgia, serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(s, 0, 0);
  ctx.restore();
}
function lbl(ctx, s, x, y, { color = TEXT, size = 13, align = 'left', weight = 500 } = {}) {
  ctx.font = `${weight} ${size}px "Instrument Sans", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}
function handArrow(ctx, x0, y0, x1, y1, color = RED) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  const mx = (x0 + x1) / 2 + (y1 - y0) * 0.08, my = (y0 + y1) / 2 - (x1 - x0) * 0.08;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
  const a = Math.atan2(y1 - my, x1 - mx);
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x1 - 10 * Math.cos(a - 0.45), y1 - 10 * Math.sin(a - 0.45));
  ctx.moveTo(x1, y1); ctx.lineTo(x1 - 10 * Math.cos(a + 0.45), y1 - 10 * Math.sin(a + 0.45));
  ctx.stroke();
  ctx.restore();
}
function axis(ctx, x0, y0, x1, y1, mid = null) {
  ctx.save();
  ctx.strokeStyle = PENCIL; ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) { const y = y0 + ((y1 - y0) * i) / 4; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
  if (mid != null) { ctx.strokeStyle = '#a99f8c'; ctx.beginPath(); ctx.moveTo(x0, mid); ctx.lineTo(x1, mid); ctx.stroke(); }
  ctx.strokeStyle = TEXT; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------ the four pages
const PAGES = {
  // a whole curve in, one number out: Y = ∫ β(t) X(t) dt
  func(ctx, W, H, t, D, L) {
    const pad = 30, colW = W * 0.62, rowH = (H - 2 * pad) / 3;
    const rows = [
      { arr: D.X, label: L.x, color: INK, k: 0.9 },
      { arr: D.beta, label: L.beta, color: RED, k: 0.75 },
      { arr: D.prod, label: L.prod, color: INK, k: 1.6 },
    ];
    const reveal = Math.min(1, t / 2.4);
    rows.forEach((row, ri) => {
      const y0 = pad + ri * rowH + 18, y1 = pad + (ri + 1) * rowH - 10, mid = (y0 + y1) / 2;
      axis(ctx, pad, y0, colW, y1, mid);
      const pts = row.arr.map((v, i) => [pad + (colW - pad) * D.ts[i], mid - v * row.k * (y1 - y0) * 0.45]);
      if (ri === 2) {
        // highlighter under the product = the integral
        ctx.fillStyle = HL;
        ctx.beginPath(); ctx.moveTo(pts[0][0], mid);
        const n = Math.floor(pts.length * Math.min(1, Math.max(0, (t - 1.2) / 2)));
        for (let i = 0; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        if (n > 0) ctx.lineTo(pts[n - 1][0], mid);
        ctx.fill();
      }
      inkLine(ctx, pts, { color: row.color, reveal: Math.min(1, reveal * 1.5 - ri * 0.25) });
      lbl(ctx, row.label, pad + 6, y0 + 2, { color: row.color, size: 14, weight: 600 });
    });
    // the result
    const x = colW + 40;
    const shown = Math.min(1, Math.max(0, (t - 2.6) / 1.2));
    lbl(ctx, L.y, x, H / 2 - 30, { size: 15, weight: 600 });
    ctx.font = '500 52px Fraunces, Georgia, serif';
    ctx.fillStyle = RED;
    ctx.fillText((D.Y * shown).toFixed(3), x, H / 2 + 22);
    handArrow(ctx, colW - 20, pad + 2.5 * rowH, x - 10, H / 2 + 6);
    note(ctx, L.noteFunc, x, H / 2 + 70, { size: 24 });
  },

  // infinite dimension needs regularisation: drag the slider
  reg(ctx, W, H, t, D, L, ui) {
    const pad = 30, x0 = pad, x1 = W - pad, y0 = pad + 20, y1 = H - pad - 54, mid = (y0 + y1) / 2;
    axis(ctx, x0, y0, x1, y1, mid);
    const a = ui.alpha; // 0..1 (log scale inside)
    const lam = Math.pow(10, -4 + 4 * a);
    const est = D.beta.map((b, i) => {
      let wig = 0;
      // high-frequency components survive when λ is small, get damped as λ grows
      D.noise.forEach((c, k) => { wig += (c * Math.sin((k + 2) * Math.PI * D.ts[i])) / (1 + lam * 40 * (k + 2) ** 2); });
      const shrink = Math.min(0.92, lam * 1.1);
      return b * (1 - shrink) + wig * 0.16;
    });
    const map = (arr) => arr.map((v, i) => [x0 + (x1 - x0) * D.ts[i], mid - v * (y1 - y0) * 0.38]);
    inkLine(ctx, map(D.beta), { color: '#9a8f7b', w: 2, dash: [6, 6] });
    inkLine(ctx, map(est), { color: INK, w: 2.6 });
    lbl(ctx, L.trueBeta, x1, y0 + 4, { color: '#7a705e', align: 'right' });
    lbl(ctx, L.estBeta, x1, y0 + 22, { color: INK, align: 'right', weight: 600 });
    const verdict = a < 0.35 ? L.tooNoisy : a > 0.8 ? L.tooSmooth : L.justRight;
    note(ctx, verdict, x0 + 10, y0 + 14, { size: 30, color: a >= 0.35 && a <= 0.8 ? '#3b6d4a' : RED });
    lbl(ctx, L.slider, x0, H - pad - 18, { color: '#7a705e', size: 13 });
  },

  // high-frequency days -> low-frequency quarters
  mixed(ctx, W, H, t, D, L) {
    const pad = 30, x0 = pad, x1 = W - pad, top0 = pad + 18, top1 = H * 0.5, bot0 = H * 0.62, bot1 = H - pad - 10;
    const total = D.Q * D.perQ;
    const prog = Math.min(1, (t % 9) / 7);
    const n = Math.max(2, Math.floor(total * prog));
    const lo = Math.min(...D.daily), hi = Math.max(...D.daily);
    const pts = D.daily.map((v, i) => [x0 + ((x1 - x0) * i) / (total - 1), top1 - ((v - lo) / (hi - lo)) * (top1 - top0)]);
    inkLine(ctx, pts.slice(0, n), { color: INK, w: 1.6 });
    lbl(ctx, L.daily, x0, top0 - 4, { weight: 600 });
    const qW = (x1 - x0) / D.Q;
    for (let q = 0; q < D.Q; q++) {
      const qx = x0 + q * qW;
      ctx.save(); ctx.strokeStyle = PENCIL; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(qx, top0); ctx.lineTo(qx, bot1); ctx.stroke(); ctx.restore();
      note(ctx, 'T' + (q + 1), qx + qW / 2, top1 + 30, { color: '#7a705e', size: 24, align: 'center', rot: 0 });
      const done = n >= (q + 1) * D.perQ;
      const qv = D.quarterly[q];
      const qlo = Math.min(...D.quarterly) - 0.05, qhi = Math.max(...D.quarterly) + 0.05;
      const h = ((qv - qlo) / (qhi - qlo)) * (bot1 - bot0);
      if (done) {
        ctx.fillStyle = RED;
        ctx.fillRect(qx + qW * 0.32, bot1 - h, qW * 0.36, h);
      }
    }
    axis(ctx, x0, bot0, x1, bot1);
    lbl(ctx, L.quarterly, x0, bot0 - 6, { color: RED, weight: 600 });
    note(ctx, L.noteMixed, x1, top0 + 6, { size: 24, align: 'right' });
  },

  // nowcasting a macro index: the band tightens as the quarter's days come in
  nowcast(ctx, W, H, t, D, L) {
    const pad = 30, x0 = pad, x1 = W - pad, y0 = pad + 24, y1 = H - pad - 30;
    axis(ctx, x0, y0, x1, y1);
    const n = D.hist.length;
    const px = (i) => x0 + 20 + ((x1 - x0 - 60) * i) / n;
    const py = (v) => y1 - v * (y1 - y0) * 0.9;
    inkLine(ctx, D.hist.map((v, i) => [px(i), py(v)]), { color: INK, w: 2.4 });
    D.hist.forEach((v, i) => { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(px(i), py(v), 3, 0, Math.PI * 2); ctx.fill(); });
    const days = Math.min(1, (t % 8) / 6);
    const target = 0.84;
    const guess = 0.74 + (target - 0.74) * days;
    const band = 0.2 * (1 - days) + 0.035;
    const fx = px(n);
    ctx.fillStyle = 'rgba(140,28,19,0.16)';
    ctx.beginPath();
    ctx.moveTo(px(n - 1), py(D.hist[n - 1]));
    ctx.lineTo(fx, py(guess + band));
    ctx.lineTo(fx, py(guess - band));
    ctx.closePath(); ctx.fill();
    inkLine(ctx, [[px(n - 1), py(D.hist[n - 1])], [fx, py(guess)]], { color: RED, w: 2.4, dash: [6, 5] });
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(fx, py(guess), 5, 0, Math.PI * 2); ctx.fill();
    lbl(ctx, L.index, x0 + 6, y0 - 6, { weight: 600 });
    // "days observed" progress bar
    const bx = x0 + 6, bw = (x1 - x0) * 0.32, by = y1 + 16;
    ctx.fillStyle = '#e6dccb'; ctx.fillRect(bx, by, bw, 6);
    ctx.fillStyle = RED; ctx.fillRect(bx, by, bw * days, 6);
    lbl(ctx, `${L.days} ${Math.round(days * 90)}/90`, bx + bw + 12, by + 9, { size: 12.5 });
    note(ctx, L.noteNow, fx - 10, py(guess + band) - 16, { size: 24, align: 'right' });
  },
};
const ORDER = ['func', 'reg', 'mixed', 'nowcast'];

export function createCrest(root, { t }) {
  const D = makeData();
  let raf = 0, current = 'func', t0 = 0, running = false;
  const ui = { alpha: 0.08 };

  root.innerHTML = `
    <div class="mag">
      <div class="mag__bar"></div>
      <div class="mag__main">
        <aside class="mag__side">
          <p class="mag__kicker" data-c="kicker"></p>
          <h3 class="mag__title" data-c="title"></h3>
          <p class="mag__stand" data-c="stand"></p>
          <div class="mag__byline">
            <p><b data-c="role"></b> · CNRS · CREST</p>
            <p data-c="sup"></p>
            <p class="mag__dates" data-c="dates"></p>
          </div>
          <ol class="mag__mods">
            ${ORDER.map((id, i) => `<li><button data-mod="${id}"><span class="mag__n">${i + 1}</span><span data-c="m.${id}"></span></button></li>`).join('')}
          </ol>
        </aside>
        <section class="mag__page">
          <p class="mag__desc" id="nbDesc"></p>
          <figure class="mag__fig">
            <figcaption class="mag__cap"><b id="magFig"></b> <span id="magFigT"></span></figcaption>
            <div class="mag__chart">
              <canvas id="nbCanvas"></canvas>
              <label class="mag__slider" id="nbSlider"><span>λ</span><input type="range" min="0" max="1" step="0.001" value="0.08" aria-label="regularisation" /></label>
            </div>
            <p class="mag__src" data-c="note"></p>
          </figure>
        </section>
      </div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const canvas = $('#nbCanvas');
  const ctx = canvas.getContext('2d');
  const slider = $('#nbSlider');
  slider.querySelector('input').addEventListener('input', (e) => (ui.alpha = parseFloat(e.target.value)));
  const L = {};

  function texts() {
    root.querySelectorAll('[data-c]').forEach((el) => (el.textContent = t('crest.' + el.dataset.c)));
    for (const k of ['x', 'beta', 'prod', 'y', 'noteFunc', 'trueBeta', 'estBeta', 'tooNoisy', 'tooSmooth', 'justRight', 'slider', 'daily', 'quarterly', 'noteMixed', 'index', 'days', 'noteNow'])
      L[k] = t('crest.l.' + k);
    select(current, true);
  }
  function select(id, quiet = false) {
    current = id;
    root.querySelectorAll('[data-mod]').forEach((b) => b.classList.toggle('is-on', b.dataset.mod === id));
    slider.classList.toggle('is-on', id === 'reg');
    const desc = $('#nbDesc');
    const esc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    desc.innerHTML = esc(t('crest.d.' + id)).replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>');
    $('#magFig').textContent = t('crest.fig') + ' ' + (ORDER.indexOf(id) + 1);
    $('#magFigT').textContent = t('crest.m.' + id);
    desc.classList.remove('is-in');
    void desc.offsetWidth;
    desc.classList.add('is-in');
    if (!quiet) t0 = performance.now();
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
    const box = canvas.parentElement.getBoundingClientRect();
    if (Math.abs(canvas.width - box.width * Math.min(devicePixelRatio || 1, 2)) > 2) size();
    const cssW = canvas.parentElement.offsetWidth, cssH = canvas.parentElement.offsetHeight;
    const k = canvas.width / cssW;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    PAGES[current](ctx, cssW, cssH, (now - t0) / 1000, D, L, ui);
    raf = requestAnimationFrame(frame);
  }

  texts();
  return {
    start() {
      if (running) return;
      running = true;
      t0 = performance.now();
      size();
      raf = requestAnimationFrame(frame);
    },
    stop() { running = false; cancelAnimationFrame(raf); },
    refresh: texts,
  };
}
