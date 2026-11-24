// Oxford.dna: a retro-futuristic genomics lab console.
// DA: deep night-blue glass, perspective grid, cyan + magenta neon vectors with a soft bloom,
// HUD corner brackets, Space Grotesk headings and large, high-contrast labels (readability first).
// The visuals are explanatory illustrations on synthetic sequences (no thesis results).

const C = { cyan: '#5ef2e0', mag: '#ff6fb5', ink: '#e8f2ff', dim: 'rgba(232,242,255,0.55)', line: 'rgba(94,242,224,0.16)' };
const BASES = 'ACGT';

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
  const r = rng(1906);
  const seq = Array.from({ length: 400 }, () => BASES[Math.floor(r() * 4)]);
  // planted "motifs" so the saliency view has something to find (illustrative)
  const motifs = [[12, 'TATAAA'], [33, 'CACGTG'], [51, 'GGGCGG']];
  const short = Array.from({ length: 64 }, () => BASES[Math.floor(r() * 4)]);
  motifs.forEach(([at, m]) => [...m].forEach((c, i) => (short[at + i] = c)));
  const sal = short.map(() => 0.08 + r() * 0.14);
  motifs.forEach(([at, m]) => { for (let i = at; i < at + m.length; i++) sal[i] = 0.55 + r() * 0.45; });
  const T = 48;
  const profile = Array.from({ length: T }, (_, i) => {
    const x = i / (T - 1);
    return 0.15 + 0.7 * Math.exp(-((x - 0.32) ** 2) / 0.018) + 0.35 * Math.exp(-((x - 0.7) ** 2) / 0.03);
  });
  const obs = profile.map((v) => v + (r() - 0.5) * 0.09);
  const N = 24;
  const att = [0, 1].map((h) =>
    Array.from({ length: N }, (_, q) => {
      const w = Array.from({ length: N }, (_, k) => {
        const local = Math.exp(-((q - k) ** 2) / (h ? 30 : 4));
        const far = h ? Math.exp(-((((q + k) % N) - N / 2) ** 2) / 6) * 0.6 : 0;
        return local + far + r() * 0.08;
      });
      const s = w.reduce((a, b) => a + b, 0);
      return w.map((v) => v / s);
    })
  );
  const groups = [0.86, 0.64, 0.47, 0.33, 0.21, 0.12];
  return { seq, short, sal, motifs, profile, obs, att, N, groups, T, r };
}

// ------------------------------------------------ drawing helpers
function neon(ctx, pts, color, w = 2) {
  if (pts.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineJoin = ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}
function text(ctx, s, x, y, { color = C.ink, size = 13, weight = 500, align = 'left', font = '"IBM Plex Mono", monospace' } = {}) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}
function hudBox(ctx, x, y, w, h, color = C.cyan, fill = 'rgba(94,242,224,0.06)') {
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(94,242,224,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // corner brackets
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  const k = 9;
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    ctx.beginPath(); ctx.moveTo(cx, cy + sy * k); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx * k, cy); ctx.stroke();
  }
}
function arrow(ctx, x0, y0, x1, y1, color = C.cyan) {
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 5, y1 - 8); ctx.lineTo(x1 + 5, y1 - 8); ctx.fill();
}
function axes(ctx, x0, y0, x1, y1) {
  ctx.strokeStyle = C.line; ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) { const y = y0 + ((y1 - y0) * i) / 6; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(232,242,255,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
}

// ------------------------------------------------ the four views (same ideas as before)
const VIEWS = {
  // DNA sequence -> Transformer -> temporal profile
  seq(ctx, W, H, t, D, L) {
    const pad = 26;
    // scrolling strand of bases with a scan window
    const cw = 13, off = (t * 30) % cw, start = Math.floor((t * 30) / cw);
    const wx = W * 0.3, ww = W * 0.4;
    for (let i = 0; i < Math.ceil(W / cw) + 2; i++) {
      const x = pad + i * cw - off;
      const inside = x > wx && x < wx + ww;
      text(ctx, D.seq[(start + i) % D.seq.length], x, pad + 16, { color: inside ? C.cyan : C.dim, size: 15, weight: inside ? 600 : 400 });
    }
    ctx.strokeStyle = C.cyan; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(wx, pad - 6, ww, 30, 6); ctx.stroke();
    text(ctx, L.input, wx, pad - 12, { color: C.cyan, size: 12 });
    // the model: holographic layers
    const bx = W * 0.31, bw = W * 0.38, by = pad + 58, bh = 30, gap = 10;
    L.blocks.forEach((nm, i) => {
      const y = by + i * (bh + gap);
      hudBox(ctx, bx, y, bw, bh);
      // a slow, soft pulse travelling down the stack (one full pass every ~5 s)
      const k = (((t * 0.2 - i * 0.16) % 1) + 1) % 1;
      if (k < 0.55) {
        const e = k / 0.55;
        const grow = e < 0.6 ? 1 - Math.pow(1 - e / 0.6, 3) : 1; // ease-out fill
        const fade = e < 0.6 ? 1 : 1 - (e - 0.6) / 0.4; // then fade away
        ctx.fillStyle = `rgba(255,111,181,${0.32 * fade})`;
        ctx.beginPath(); ctx.roundRect(bx, y, Math.max(1, bw * grow), bh, 8); ctx.fill();
      }
      text(ctx, nm, bx + bw / 2, y + 20, { size: 14, weight: 600, align: 'center', font: '"Space Grotesk", sans-serif' });
    });
    arrow(ctx, W / 2, pad + 28, W / 2, by - 4);
    const outTop = by + L.blocks.length * (bh + gap) - gap;
    arrow(ctx, W / 2, outTop + 2, W / 2, outTop + 22);
    // predicted temporal profile
    const gx0 = pad + 24, gx1 = W - pad, gy0 = outTop + 32, gy1 = H - pad - 16;
    axes(ctx, gx0, gy0, gx1, gy1);
    text(ctx, L.output, gx0 + 8, gy0 + 12, { color: C.ink, size: 12 });
    text(ctx, L.time, gx1, gy1 + 18, { color: C.dim, size: 12, align: 'right' });
    const px = (i) => gx0 + ((gx1 - gx0) * i) / (D.T - 1);
    const py = (v) => gy1 - v * (gy1 - gy0) * 0.95;
    const shown = Math.min(D.T, Math.floor(t * 18) + 2);
    const g = ctx.createLinearGradient(0, gy0, 0, gy1);
    g.addColorStop(0, 'rgba(94,242,224,0.28)'); g.addColorStop(1, 'rgba(94,242,224,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(px(0), gy1);
    for (let i = 0; i < shown; i++) ctx.lineTo(px(i), py(D.profile[i]));
    ctx.lineTo(px(shown - 1), gy1); ctx.fill();
    neon(ctx, D.profile.slice(0, shown).map((v, i) => [px(i), py(v)]), C.cyan, 2.6);
    ctx.fillStyle = C.mag;
    for (let i = 0; i < shown; i += 2) { ctx.beginPath(); ctx.arc(px(i), py(D.obs[i]), 3.2, 0, Math.PI * 2); ctx.fill(); }
    text(ctx, L.legPred, gx1, gy0 + 12, { color: C.cyan, size: 12, align: 'right' });
    text(ctx, L.legObs, gx1, gy0 + 30, { color: C.mag, size: 12, align: 'right' });
  },

  // attention arcs; hover picks the query base
  att(ctx, W, H, t, D, L, mouse) {
    const pad = 30, N = D.N, cw = (W - 2 * pad) / N, ty = H * 0.5;
    let q = Math.floor((t * 0.6) % N);
    if (mouse.in) q = Math.max(0, Math.min(N - 1, Math.floor((mouse.x - pad) / cw)));
    const qx = pad + q * cw + cw / 2;
    for (let k = 0; k < N; k++) {
      if (k === q) continue;
      const kx = pad + k * cw + cw / 2;
      const h = Math.abs(kx - qx) * 0.45 + 20;
      const w1 = D.att[0][q][k], w2 = D.att[1][q][k];
      ctx.globalAlpha = Math.min(1, 0.25 + w1 * 6);
      ctx.strokeStyle = C.cyan; ctx.lineWidth = 0.8 + w1 * 22;
      ctx.beginPath(); ctx.moveTo(qx, ty - 18); ctx.quadraticCurveTo((qx + kx) / 2, ty - 18 - h, kx, ty - 18); ctx.stroke();
      ctx.globalAlpha = Math.min(1, 0.25 + w2 * 6);
      ctx.strokeStyle = C.mag; ctx.lineWidth = 0.8 + w2 * 22;
      ctx.beginPath(); ctx.moveTo(qx, ty + 18); ctx.quadraticCurveTo((qx + kx) / 2, ty + 18 + h, kx, ty + 18); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < N; i++) {
      const x = pad + i * cw;
      const on = i === q;
      ctx.fillStyle = on ? 'rgba(94,242,224,0.9)' : 'rgba(10,16,40,0.85)';
      ctx.beginPath(); ctx.roundRect(x + 2, ty - 16, cw - 4, 32, 6); ctx.fill();
      ctx.strokeStyle = on ? C.cyan : 'rgba(94,242,224,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
      text(ctx, D.short[i + 20], x + cw / 2, ty + 6, { color: on ? '#061024' : C.ink, size: Math.min(17, cw * 0.6), weight: 600, align: 'center' });
    }
    text(ctx, L.head1, pad, pad + 8, { color: C.cyan, size: 13 });
    text(ctx, L.head2, pad, H - pad - 4, { color: C.mag, size: 13 });
    text(ctx, L.hover, W - pad, pad + 8, { color: C.ink, size: 13, align: 'right' });
  },

  // saliency as a sequence logo: letter height = importance
  sal(ctx, W, H, t, D, L) {
    const pad = 28, N = D.short.length, cw = (W - 2 * pad) / N, base = H * 0.66;
    const reveal = Math.min(1, t / 2.2);
    D.motifs.forEach(([at, m]) => {
      const x = pad + at * cw - 3, w = m.length * cw + 6;
      const g = ctx.createLinearGradient(0, pad + 24, 0, base);
      g.addColorStop(0, 'rgba(255,111,181,0)'); g.addColorStop(1, 'rgba(255,111,181,0.22)');
      ctx.fillStyle = g; ctx.fillRect(x, pad + 24, w, base - pad - 18);
      ctx.strokeStyle = 'rgba(255,111,181,0.6)'; ctx.setLineDash([4, 4]);
      ctx.strokeRect(x, pad + 24, w, base - pad - 18); ctx.setLineDash([]);
    });
    for (let i = 0; i < N; i++) {
      const s = D.sal[i] * reveal;
      const x = pad + i * cw;
      const hgt = 18 + s * (base - pad - 60);
      const hot = s > 0.45;
      ctx.save();
      ctx.translate(x + cw / 2, base);
      ctx.scale(1, hgt / 20);
      text(ctx, D.short[i], 0, 0, { color: hot ? C.mag : 'rgba(94,242,224,0.75)', size: Math.min(22, cw * 1.3), weight: 700, align: 'center' });
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(232,242,255,0.6)'; ctx.fillRect(pad, base + 8, W - 2 * pad, 1.5);
    const sx = pad + ((t * 0.18) % 1) * (W - 2 * pad);
    const g2 = ctx.createLinearGradient(sx - 40, 0, sx, 0);
    g2.addColorStop(0, 'rgba(94,242,224,0)'); g2.addColorStop(1, 'rgba(94,242,224,0.5)');
    ctx.fillStyle = g2; ctx.fillRect(sx - 40, base + 14, 40, 18);
    ctx.fillStyle = C.cyan; ctx.fillRect(sx, base + 12, 2, 22);
    text(ctx, L.salTop, pad, pad + 8, { color: C.ink, size: 13 });
    text(ctx, L.motifs, W - pad, base + 50, { color: C.mag, size: 13, align: 'right' });
  },

  // permutation importance: scramble a feature group, watch the prediction degrade
  perm(ctx, W, H, t, D, L) {
    const pad = 28, split = W * 0.46, G = D.groups.length;
    const cur = Math.floor(t / 2.4) % G, k = (t % 2.4) / 2.4;
    const bh = 22, gap = 18, top = pad + 40;
    text(ctx, L.permTop, pad, pad + 8, { color: C.ink, size: 13 });
    D.groups.forEach((v, i) => {
      const y = top + i * (bh + gap);
      text(ctx, L.groups[i], pad, y - 6, { color: i === cur ? C.mag : C.dim, size: 12 });
      ctx.fillStyle = 'rgba(94,242,224,0.08)';
      ctx.beginPath(); ctx.roundRect(pad, y, split - pad - 20, bh, 6); ctx.fill();
      const full = split - pad - 20;
      const len = full * v * (i < cur ? 1 : i === cur ? Math.min(1, Math.max(0, (k - 0.3) / 0.5)) : 0);
      const g = ctx.createLinearGradient(pad, 0, pad + full, 0);
      g.addColorStop(0, i === cur ? C.mag : 'rgba(94,242,224,0.9)'); g.addColorStop(1, i === cur ? 'rgba(255,111,181,0.5)' : 'rgba(94,242,224,0.4)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(pad, y, Math.max(0.1, len), bh, 6); ctx.fill();
    });
    const sx0 = split + 10, sx1 = W - pad;
    const snippet = D.short.slice(8, 34);
    const scr = k > 0.15 && k < 0.85;
    snippet.forEach((c, i) => {
      const inGroup = i % G === cur;
      const ch = scr && inGroup ? BASES[Math.floor(D.r() * 4)] : c;
      text(ctx, ch, sx0 + i * ((sx1 - sx0) / snippet.length), pad + 46, { color: inGroup ? C.mag : C.ink, size: 15, weight: inGroup ? 700 : 400 });
    });
    const gy0 = pad + 74, gy1 = H - pad - 12;
    axes(ctx, sx0, gy0, sx1, gy1);
    const px = (i) => sx0 + ((sx1 - sx0) * i) / (D.T - 1);
    const py = (v) => gy1 - v * (gy1 - gy0) * 0.95;
    ctx.setLineDash([6, 6]);
    neon(ctx, D.profile.map((v, i) => [px(i), py(v)]), 'rgba(94,242,224,0.85)', 2);
    ctx.setLineDash([]);
    const deg = D.groups[cur] * Math.sin(Math.PI * Math.min(1, k * 1.3)) * 0.9;
    neon(ctx, D.profile.map((v, i) => [px(i), py(v * (1 - deg) + 0.35 * deg + Math.sin(i * 0.9 + t * 3) * 0.04 * deg)]), C.mag, 2.8);
    text(ctx, L.base, sx1, gy0 + 6, { color: C.cyan, size: 12, align: 'right' });
    text(ctx, L.permuted, sx1, gy0 + 24, { color: C.mag, size: 12, align: 'right' });
  },
};
const ORDER = ['seq', 'att', 'sal', 'perm'];

export function createOxford(root, { t }) {
  const D = makeData();
  let raf = 0, current = 'seq', t0 = 0, running = false;
  const mouse = { x: 0, in: false };

  root.innerHTML = `
    <div class="oxd">
      <div class="oxd__strip">
        <span class="oxd__live"><i></i>OXFORD.DNA</span><span data-o="strip1"></span><span data-o="strip2"></span><span class="oxd__sp"></span><span data-o="strip3"></span>
      </div>
      <div class="oxd__main">
        <aside class="oxd__side">
          <h3 class="oxd__title" data-o="title"></h3>
          <p class="oxd__role" data-o="role"></p>
          <p class="oxd__meta" data-o="where"></p>
          <p class="oxd__meta" data-o="sup"></p>
          <p class="oxd__meta oxd__dates" data-o="dates"></p>
          <ol class="oxd__mods">
            ${ORDER.map((id, i) => `<li><button data-mod="${id}"><span class="oxd__n">0${i + 1}</span><span data-o="m.${id}"></span></button></li>`).join('')}
          </ol>
          <p class="oxd__note" data-o="note"></p>
        </aside>
        <section class="oxd__poster">
          <p class="oxd__desc" id="oxdDesc"></p>
          <div class="oxd__plate"><canvas id="oxdCanvas"></canvas></div>
        </section>
      </div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const canvas = $('#oxdCanvas');
  const ctx = canvas.getContext('2d');
  const layer = document.createElement('canvas');
  const lx = layer.getContext('2d');
  const L = {};

  function texts() {
    root.querySelectorAll('[data-o]').forEach((el) => (el.textContent = t('oxd.' + el.dataset.o)));
    Object.assign(L, {
      input: t('oxd.l.input'), time: t('oxd.l.time'), output: t('oxd.l.output'),
      legPred: t('oxd.l.pred'), legObs: t('oxd.l.obs'),
      blocks: [t('oxd.l.b1'), t('oxd.l.b2'), t('oxd.l.b3'), t('oxd.l.b4')],
      head1: t('oxd.l.head1'), head2: t('oxd.l.head2'), hover: t('oxd.l.hover'),
      salTop: t('oxd.l.sal'), motifs: t('oxd.l.motifs'),
      permTop: t('oxd.l.perm'), base: t('oxd.l.base'), permuted: t('oxd.l.permuted'),
      groups: [1, 2, 3, 4, 5, 6].map((i) => t('oxd.l.g') + ' ' + i),
    });
    select(current, true);
  }
  function select(id, quiet = false) {
    current = id;
    root.querySelectorAll('[data-mod]').forEach((b) => b.classList.toggle('is-on', b.dataset.mod === id));
    const desc = $('#oxdDesc');
    const esc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    desc.innerHTML = esc(t('oxd.d.' + id)).replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>');
    desc.classList.remove('is-in');
    void desc.offsetWidth;
    desc.classList.add('is-in');
    if (!quiet) t0 = performance.now();
  }
  root.querySelectorAll('[data-mod]').forEach((b) => b.addEventListener('click', () => select(b.dataset.mod)));
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * canvas.parentElement.offsetWidth;
    mouse.in = true;
  });
  canvas.addEventListener('pointerleave', () => (mouse.in = false));

  function size() {
    const box = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = layer.width = Math.max(10, Math.round(box.width * dpr));
    canvas.height = layer.height = Math.max(10, Math.round(box.height * dpr));
  }

  function frame(now) {
    if (!running) return;
    const box = canvas.parentElement.getBoundingClientRect();
    if (Math.abs(canvas.width - box.width * Math.min(devicePixelRatio || 1, 2)) > 2) size();
    const cssW = canvas.parentElement.offsetWidth, cssH = canvas.parentElement.offsetHeight;
    const k = canvas.width / cssW;
    lx.setTransform(1, 0, 0, 1, 0, 0);
    lx.clearRect(0, 0, layer.width, layer.height);
    lx.setTransform(k, 0, 0, k, 0, 0);
    VIEWS[current](lx, cssW, cssH, (now - t0) / 1000, D, L, mouse);
    // neon bloom: a blurred copy added under the sharp drawing
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = `blur(${Math.round(6 * k)}px)`;
    ctx.globalAlpha = 0.55;
    ctx.drawImage(layer, 0, 0);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(layer, 0, 0);
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
