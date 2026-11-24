// QRT.app: a research terminal in amber phosphor.
// DA: glowing vector lines on near-black, IBM Plex Mono, slow scanning cursors, afterglow.
// Every chart is an illustration drawn from synthetic data (nothing confidential).

const AMBER = '255,179,71';
const amber = (a) => `rgba(${AMBER},${a})`;
const BG = '#120b05';

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
const gauss = (r) => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());

// ------------------------------------------------ synthetic series
function makeData() {
  const r = rng(2025);
  const N = 420;
  const under = [], implied = [], equity = [], bench = [];
  let u = 0, e = 0, b = 0, vol = 1;
  for (let i = 0; i < N; i++) {
    vol = 0.96 * vol + 0.04 * (0.7 + Math.abs(gauss(r)) * 0.8);
    u += gauss(r) * vol;
    under.push(u);
  }
  // an "options-implied" view that moves a little ahead of the underlying (illustrative lead-lag)
  for (let i = 0; i < N; i++) {
    const ahead = under[Math.min(N - 1, i + 9)];
    implied.push(ahead * 0.85 + gauss(r) * 1.4);
  }
  // illustrative only: a steady systematic curve vs a noisier benchmark
  for (let i = 0; i < N; i++) {
    e += 0.11 + gauss(r) * 0.45;
    b += 0.025 + gauss(r) * 0.7;
    equity.push(e);
    bench.push(b);
  }
  if (equity[N - 1] < bench[N - 1] + 8) {
    const lift = (bench[N - 1] + 8 - equity[N - 1]) / N;
    for (let i = 0; i < N; i++) equity[i] += lift * i;
  }
  const boot = Array.from({ length: 900 }, () => 0.35 + gauss(r) * 0.32);
  const pts = Array.from({ length: 260 }, () => {
    const x = gauss(r), y = gauss(r);
    const score = Math.tanh(1.3 * x + 0.9 * Math.sin(1.6 * y) + gauss(r) * 0.35);
    return { x, y, c: score > 0 ? 1 : 0 };
  });
  const cloud = Array.from({ length: 1400 }, () => [r(), gauss(r) * 0.18]);
  return { N, under, implied, equity, bench, boot, pts, cloud };
}

// ------------------------------------------------ drawing helpers
function glowLine(ctx, pts, { a = 1, w = 1.6, dash = null } = {}) {
  if (pts.length < 2) return;
  ctx.save();
  if (dash) ctx.setLineDash(dash);
  ctx.lineJoin = ctx.lineCap = 'round';
  for (const [lw, al] of [[w * 5, 0.08 * a], [w * 2.4, 0.18 * a], [w, 0.95 * a]]) {
    ctx.strokeStyle = amber(al);
    ctx.lineWidth = lw;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  ctx.restore();
}
function grid(ctx, W, H, pad) {
  ctx.strokeStyle = amber(0.07);
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const x = pad + ((W - 2 * pad) * i) / 8;
    ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke();
  }
  for (let i = 0; i <= 5; i++) {
    const y = pad + ((H - 2 * pad) * i) / 5;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  }
}
const series = (arr, n, W, H, pad, lo, hi) =>
  arr.slice(0, n).map((v, i) => [pad + ((W - 2 * pad) * i) / (arr.length - 1), H - pad - ((v - lo) / (hi - lo)) * (H - 2 * pad)]);
const ext = (...arrs) => {
  let lo = Infinity, hi = -Infinity;
  arrs.flat().forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); });
  const m = (hi - lo) * 0.12;
  return [lo - m, hi + m];
};
const label = (ctx, txt, x, y, a = 0.6, align = 'left') => {
  ctx.fillStyle = amber(a);
  ctx.font = '500 11px "IBM Plex Mono", monospace';
  ctx.textAlign = align;
  ctx.fillText(txt, x, y);
};

// ------------------------------------------------ the four modules
const MODULES = {
  options(ctx, W, H, t, D, L) {
    const pad = 28;
    grid(ctx, W, H, pad);
    // the sheer amount of data: a faint cloud of ticks
    ctx.fillStyle = amber(0.12);
    const shown = Math.min(D.cloud.length, Math.floor(t * 500));
    const [lo, hi] = ext(D.under, D.implied);
    for (let i = 0; i < shown; i++) {
      const [fx, n] = D.cloud[i];
      const k = Math.floor(fx * (D.N - 1));
      const y = H - pad - ((D.under[k] + n * (hi - lo) - lo) / (hi - lo)) * (H - 2 * pad);
      ctx.fillRect(pad + fx * (W - 2 * pad), y, 1.2, 1.2);
    }
    const n = Math.min(D.N, Math.floor(t * 140) + 2);
    glowLine(ctx, series(D.under, n, W, H, pad, lo, hi), { w: 1.6 });
    glowLine(ctx, series(D.implied, n, W, H, pad, lo, hi), { w: 1.2, a: 0.55, dash: [5, 6] });
    // scanning cursor with a lead-lag readout
    const cx = pad + ((W - 2 * pad) * ((t * 0.12) % 1));
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = amber(0.05 * (6 - k));
      ctx.fillRect(cx - k * 5, pad, 2, H - 2 * pad);
    }
    label(ctx, L.legendU, pad + 8, pad + 16, 0.95);
    label(ctx, L.legendI, pad + 8, pad + 32, 0.55);
    label(ctx, L.leadlag, W - pad - 8, H - pad - 10, 0.55, 'right');
  },
  backtest(ctx, W, H, t, D, L) {
    const pad = 28;
    grid(ctx, W, H, pad);
    const n = Math.min(D.N, Math.floor(t * 120) + 2);
    const [lo, hi] = ext(D.equity, D.bench);
    // drawdown band at the bottom
    let peak = -Infinity;
    ctx.fillStyle = amber(0.1);
    for (let i = 0; i < n; i++) {
      peak = Math.max(peak, D.equity[i]);
      const dd = (peak - D.equity[i]) / (hi - lo);
      const x = pad + ((W - 2 * pad) * i) / (D.N - 1);
      ctx.fillRect(x, H - pad - 2, (W - 2 * pad) / D.N + 0.6, -dd * (H - 2 * pad) * 1.6 - 1);
    }
    glowLine(ctx, series(D.bench, n, W, H, pad, lo, hi), { w: 1.1, a: 0.4, dash: [3, 5] });
    const eq = series(D.equity, n, W, H, pad, lo, hi);
    glowLine(ctx, eq, { w: 1.8 });
    const [hx, hy] = eq[eq.length - 1];
    ctx.fillStyle = amber(1);
    ctx.beginPath(); ctx.arc(hx, hy, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = amber(0.18);
    ctx.beginPath(); ctx.arc(hx, hy, 9 + Math.sin(t * 4) * 2, 0, Math.PI * 2); ctx.fill();
    label(ctx, L.legendS, pad + 8, pad + 16, 0.95);
    label(ctx, L.legendB, pad + 8, pad + 32, 0.5);
    label(ctx, L.legendDD, pad + 8, H - pad - 10, 0.5);
  },
  robust(ctx, W, H, t, D, L) {
    const pad = 28;
    grid(ctx, W, H, pad);
    const bins = 34, lo = -0.8, hi = 1.5, counts = new Array(bins).fill(0);
    const n = Math.min(D.boot.length, Math.floor(t * 260));
    for (let i = 0; i < n; i++) {
      const b = Math.floor(((D.boot[i] - lo) / (hi - lo)) * bins);
      if (b >= 0 && b < bins) counts[b]++;
    }
    const maxC = 95;
    const bw = (W - 2 * pad) / bins;
    const base = H - pad - 34;
    for (let i = 0; i < bins; i++) {
      const h = (counts[i] / maxC) * (base - pad - 10);
      ctx.fillStyle = amber(0.16);
      ctx.fillRect(pad + i * bw + 1, base - h, bw - 3, h);
      ctx.fillStyle = amber(0.85);
      ctx.fillRect(pad + i * bw + 1, base - h, bw - 3, 2);
    }
    const zx = pad + ((0 - lo) / (hi - lo)) * (W - 2 * pad);
    ctx.strokeStyle = amber(0.5); ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(zx, pad); ctx.lineTo(zx, base); ctx.stroke(); ctx.setLineDash([]);
    label(ctx, '0', zx + 4, pad + 12, 0.5);
    // walk-forward folds lighting up one after another
    const folds = 6, fw = (W - 2 * pad) / folds;
    for (let i = 0; i < folds; i++) {
      const on = (t * 0.9) % (folds + 2) > i;
      ctx.fillStyle = amber(on ? 0.55 : 0.1);
      ctx.fillRect(pad + i * fw + 2, H - pad - 18, fw * 0.7 - 4, 10);
      ctx.fillStyle = amber(on ? 0.25 : 0.06);
      ctx.fillRect(pad + i * fw + fw * 0.7, H - pad - 18, fw * 0.3 - 4, 10);
    }
    label(ctx, L.legendBoot, pad + 8, pad + 16, 0.95);
    label(ctx, L.legendWF, W - pad - 8, H - pad - 24, 0.5, 'right');
  },
  ml(ctx, W, H, t, D, L) {
    const pad = 28;
    grid(ctx, W, H, pad);
    const split = W * 0.64;
    const sx = (x) => pad + ((x + 3) / 6) * (split - 2 * pad);
    const sy = (y) => H - pad - ((y + 3) / 6) * (H - 2 * pad);
    const n = Math.min(D.pts.length, Math.floor(t * 120));
    for (let i = 0; i < n; i++) {
      const p = D.pts[i];
      ctx.fillStyle = amber(p.c ? 0.9 : 0.28);
      ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), p.c ? 2.4 : 2, 0, Math.PI * 2); ctx.fill();
    }
    // the learnt boundary, slowly settling
    const settle = Math.min(1, t / 4);
    const bd = [];
    for (let y = -3; y <= 3; y += 0.1) bd.push([sx((-0.9 * Math.sin(1.6 * y)) / 1.3 * settle + (1 - settle) * 0.8 * Math.sin(t + y)), sy(y)]);
    glowLine(ctx, bd, { w: 1.6 });
    // feature importance bars
    const imp = [0.92, 0.71, 0.55, 0.41, 0.3, 0.22, 0.15, 0.1];
    const bx = split + 18, bwid = W - pad - bx;
    imp.forEach((v, i) => {
      const y = pad + 22 + i * 26;
      const k = Math.min(1, Math.max(0, t * 0.8 - i * 0.12));
      ctx.fillStyle = amber(0.12); ctx.fillRect(bx, y, bwid, 8);
      ctx.fillStyle = amber(0.85); ctx.fillRect(bx, y, bwid * v * k, 8);
      label(ctx, 'f' + String(i + 1).padStart(2, '0'), bx, y - 4, 0.45);
    });
    label(ctx, L.legendML, pad + 8, pad + 16, 0.95);
    label(ctx, L.legendImp, bx, pad + 8, 0.6);
  },
};
const ORDER = ['options', 'backtest', 'robust', 'ml'];

export function createQRT(root, { t }) {
  const D = makeData();
  let raf = 0, current = 'options', t0 = 0, running = false;

  root.innerHTML = `
    <div class="qrt">
      <div class="qrt__status">
        <span class="qrt__live"><i></i>QRT·RESEARCH</span>
        <span data-q="session"></span>
        <span class="qrt__sp"></span>
        <span class="qrt__count"><b id="qrtCount">0</b> <span data-q="pts"></span></span>
      </div>
      <div class="qrt__main">
        <aside class="qrt__side">
          <p class="qrt__boot" id="qrtBoot"></p>
          <h3 class="qrt__role" data-q="role"></h3>
          <p class="qrt__firm">Qube Research &amp; Technologies</p>
          <p class="qrt__dates" data-q="dates"></p>
          <ol class="qrt__mods">
            ${ORDER.map((id, i) => `<li><button data-mod="${id}"><span class="qrt__n">0${i + 1}</span><span data-q="m.${id}"></span></button></li>`).join('')}
          </ol>
          <p class="qrt__note" data-q="note"></p>
        </aside>
        <section class="qrt__screen">
          <p class="qrt__desc" id="qrtDesc"></p>
          <header class="qrt__title"><span class="qrt__prompt">&gt;</span> <span id="qrtTitle"></span><span class="qrt__cur"></span></header>
          <div class="qrt__chart"><canvas id="qrtCanvas"></canvas></div>
        </section>
      </div>
      <div class="qrt__tape"><div class="qrt__tape-in" id="qrtTape"></div></div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const canvas = $('#qrtCanvas');
  const ctx = canvas.getContext('2d');
  const L = {};

  function texts() {
    root.querySelectorAll('[data-q]').forEach((el) => (el.textContent = t('qrt.' + el.dataset.q)));
    Object.assign(L, {
      legendU: t('qrt.l.u'), legendI: t('qrt.l.i'), leadlag: t('qrt.l.ll'),
      legendS: t('qrt.l.s'), legendB: t('qrt.l.b'), legendDD: t('qrt.l.dd'),
      legendBoot: t('qrt.l.boot'), legendWF: t('qrt.l.wf'),
      legendML: t('qrt.l.ml'), legendImp: t('qrt.l.imp'),
    });
    const tape = ORDER.map((id) => t('qrt.m.' + id).toUpperCase()).join('   ·   ') + '   ·   ' + t('qrt.tape');
    $('#qrtTape').textContent = (tape + '   ·   ').repeat(4);
    select(current, true);
  }

  function typeInto(el, text, speed = 22) {
    clearInterval(el._tw);
    let i = 0;
    el.textContent = '';
    el._tw = setInterval(() => {
      el.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(el._tw);
    }, speed);
  }

  function select(id, quiet = false) {
    current = id;
    root.querySelectorAll('[data-mod]').forEach((b) => b.classList.toggle('is-on', b.dataset.mod === id));
    typeInto($('#qrtTitle'), t('qrt.title.' + id), quiet ? 0 : 26);
    const desc = $('#qrtDesc');
    const esc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    desc.innerHTML = esc(t('qrt.d.' + id)).replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>');
    desc.classList.remove('is-in');
    void desc.offsetWidth;
    desc.classList.add('is-in');
    if (!quiet) t0 = performance.now();
  }
  root.querySelectorAll('[data-mod]').forEach((b) => b.addEventListener('click', () => select(b.dataset.mod)));

  function size() {
    const box = canvas.parentElement.getBoundingClientRect(); // includes the desktop's CSS scale
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(10, Math.round(box.width * dpr));
    canvas.height = Math.max(10, Math.round(box.height * dpr));
    return box;
  }

  function frame(now) {
    if (!running) return;
    const box = canvas.parentElement.getBoundingClientRect();
    if (Math.abs(canvas.width - box.width * Math.min(devicePixelRatio || 1, 2)) > 2) size();
    const cssW = canvas.parentElement.offsetWidth, cssH = canvas.parentElement.offsetHeight;
    const k = canvas.width / cssW;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, cssW, cssH);
    const tt = (now - t0) / 1000;
    MODULES[current](ctx, cssW, cssH, tt, D, L);
    // live counter of data points
    let c = Math.floor(1.5e9 * (1 - Math.exp(-(now - bootAt) / 2200)));
    if (c > 1.4999e9) c = 1.5e9; // land exactly on the real figure
    countEl.textContent = c.toLocaleString(document.documentElement.lang === 'fr' ? 'fr-FR' : 'en-US') + (c >= 1.5e9 ? '+' : '');
    raf = requestAnimationFrame(frame);
  }
  const countEl = $('#qrtCount');
  let bootAt = 0;

  texts();
  return {
    start() {
      if (running) return;
      running = true;
      bootAt = performance.now();
      t0 = performance.now();
      typeInto($('#qrtBoot'), t('qrt.boot'), 18);
      size();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    refresh: texts,
  };
}
