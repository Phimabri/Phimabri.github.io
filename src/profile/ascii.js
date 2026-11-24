// The Profile's scene: a pale page of dense text (Rimbaud, « Le Bateau ivre ») that Malo's
// Silhouette walks through. The Silhouette is drawn by the density of the characters; the letters
// around it are pushed aside and darken in a ring; the cursor pushes them a little too.
// Decoration only (aria-hidden canvas). After *black hole.mp4* by buildwithsid (Inspora).
import { POEM_STREAM } from './poem.js';

const PAPER = '#f3efe6', INK = '#15131a';
const RAMP = ' .:-=+*#%@'; // light -> dense
const Q = 1 / 3; // mask resolution (relative to CSS pixels)
const WALK_S = 18; // seconds to cross the page
const FIELD_DOWN = 5; // the field is computed this many times coarser than the masks

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * Draws the Silhouette, seen from the side and facing right, feet at (x, y), height u.
 * tone(v) sets the grey (0..1) of each part: hair, glasses and shoes are the densest,
 * the skin the lightest, so the face and the glasses read in characters.
 * Young adult, medium build, glasses, short hair just above the ears.
 */
function figure(g, x, y, u, phase, tone) {
  const s = Math.sin(phase);
  y -= 0.012 * u * Math.abs(Math.cos(phase)); // bob
  const limb = (x0, y0, a1, l1, a2, l2, w1, w2, v) => {
    const x1 = x0 + Math.sin(a1) * l1, y1 = y0 + Math.cos(a1) * l1;
    const x2 = x1 + Math.sin(a2) * l2, y2 = y1 + Math.cos(a2) * l2;
    tone(v); g.lineCap = 'round';
    g.lineWidth = w1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.lineWidth = w2; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    return [x2, y2];
  };
  const leg = (p, v) => {
    const th = 0.42 * Math.sin(p);
    const knee = th - 0.55 * Math.max(0, Math.sin(p + 1.9)); // the swinging leg bends
    const [fx, fy] = limb(x, y - 0.5 * u, th, 0.25 * u, knee, 0.25 * u, 0.085 * u, 0.065 * u, v);
    tone(1); g.beginPath(); g.ellipse(fx + 0.03 * u, fy - 0.005 * u, 0.055 * u, 0.022 * u, 0, 0, Math.PI * 2); g.fill(); // shoe
  };
  const arm = (p, v) => {
    const a = -0.38 * Math.sin(p);
    const [hx, hy] = limb(x + 0.01 * u, y - 0.8 * u, a, 0.17 * u, a - 0.35, 0.15 * u, 0.058 * u, 0.05 * u, v);
    tone(0.42); g.beginPath(); g.arc(hx, hy, 0.024 * u, 0, Math.PI * 2); g.fill(); // hand
  };
  // far side first, a little lighter (depth)
  arm(phase + Math.PI, 0.5);
  leg(phase + Math.PI, 0.68);
  // torso (shirt) and hips (trousers)
  tone(0.84); g.beginPath(); g.roundRect(x - 0.075 * u, y - 0.6 * u, 0.15 * u, 0.13 * u, 0.04 * u); g.fill();
  tone(0.62); g.beginPath(); g.roundRect(x - 0.085 * u, y - 0.835 * u, 0.17 * u, 0.29 * u, 0.06 * u); g.fill();
  leg(phase, 0.84);
  // neck and head
  const cx = x + 0.018 * u, cy = y - 0.925 * u, rx = 0.058 * u, ry = 0.068 * u;
  tone(0.4); g.fillRect(cx - 0.022 * u, cy + 0.04 * u, 0.04 * u, 0.06 * u);
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(cx + rx * 0.95, cy + ry * 0.1, 0.014 * u, 0.02 * u, 0, 0, Math.PI * 2); g.fill(); // nose
  // short hair: the top and the back of the head, cut just above the ear
  g.save();
  g.beginPath();
  g.moveTo(cx + rx * 1.4, cy - ry * 0.55); g.lineTo(cx - rx * 0.1, cy - ry * 0.25); g.lineTo(cx - rx * 1.6, cy + ry * 0.12);
  g.lineTo(cx - rx * 1.6, cy - ry * 2); g.lineTo(cx + rx * 1.4, cy - ry * 2); g.closePath(); g.clip();
  tone(1); g.beginPath(); g.ellipse(cx - 0.006 * u, cy - 0.01 * u, rx * 1.1, ry * 1.06, 0, 0, Math.PI * 2); g.fill();
  g.restore();
  tone(0.58); g.beginPath(); g.ellipse(cx - rx * 0.15, cy + ry * 0.12, 0.013 * u, 0.02 * u, 0, 0, Math.PI * 2); g.fill(); // ear
  // glasses: a lens in front of the eye and its temple back to the ear
  const lx = cx + rx * 0.62, ly = cy - ry * 0.08;
  tone(0.12); g.beginPath(); g.roundRect(lx - 0.02 * u, ly - 0.016 * u, 0.04 * u, 0.032 * u, 0.008 * u); g.fill();
  tone(1); g.lineWidth = 0.011 * u; g.beginPath(); g.roundRect(lx - 0.02 * u, ly - 0.016 * u, 0.04 * u, 0.032 * u, 0.008 * u); g.stroke();
  g.lineWidth = 0.009 * u; g.beginPath(); g.moveTo(lx - 0.02 * u, ly - 0.006 * u); g.lineTo(cx - rx * 0.15, cy + ry * 0.02); g.stroke();
}

/** avoid() returns the rects (canvas CSS px) kept free of text, e.g. the contact block. */
/** ground() (optional) is the y the Silhouette walks on, e.g. above the contact block on phones. */
export function createAsciiScene(canvas, { reduced = false, avoid = () => [], ground = () => Infinity } = {}) {
  const ctx = canvas.getContext('2d');
  const bg = document.createElement('canvas');
  const toneC = document.createElement('canvas'), fieldC = document.createElement('canvas');
  const smallC = document.createElement('canvas'); // the field is drawn small then scaled up: a blur every browser does
  const smallG = smallC.getContext('2d');
  const toneG = toneC.getContext('2d', { willReadFrequently: true });
  const fieldG = fieldC.getContext('2d', { willReadFrequently: true });
  let W = 0, H = 0, dpr = 1, fs = 11, cw = 7, ch = 14, cols = 0, rows = 0, u = 600, floorY = 0, font = '';
  let chars = [], skip = null;
  let raf = 0, running = false, t0 = 0, lastDraw = 0;
  let px = -1e4, py = -1e4;

  function size() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    bg.width = canvas.width; bg.height = canvas.height;
    const mobile = W < 700;
    fs = mobile ? 12 : 11; // fewer, larger characters on phones
    font = `${fs}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.font = font;
    cw = ctx.measureText('M').width; ch = Math.round(fs * 1.28);
    cols = Math.ceil(W / cw); rows = Math.ceil(H / ch);
    floorY = Math.min(H * 0.97, ground() - 6);
    u = Math.min(H * 0.8, W * 1.1, (floorY - 90) * 0.96); // the head stays below the top bar
    toneC.width = fieldC.width = Math.ceil(W * Q); toneC.height = fieldC.height = Math.ceil(H * Q);
    smallC.width = Math.ceil(toneC.width / FIELD_DOWN); smallC.height = Math.ceil(toneC.height / FIELD_DOWN);
    // the page of text, and the cells kept empty around the contact block
    const zones = [].concat(avoid() || []);
    const m = 22;
    skip = new Uint8Array(cols * rows);
    chars = new Array(cols * rows);
    let k = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, x = c * cw, y = r * ch;
      if (zones.some((a) => x + cw > a.left - m && x < a.right + m && y + ch > a.top - m && y < a.bottom + m)) { skip[i] = 1; chars[i] = ' '; continue; }
      chars[i] = POEM_STREAM[k++ % POEM_STREAM.length];
    }
    const b = bg.getContext('2d');
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.fillStyle = PAPER; b.fillRect(0, 0, W, H);
    b.font = font; b.textBaseline = 'top'; b.fillStyle = INK; b.globalAlpha = 0.5;
    for (let i = 0; i < chars.length; i++) if (!skip[i] && chars[i] !== ' ') b.fillText(chars[i], (i % cols) * cw, Math.floor(i / cols) * ch);
    b.globalAlpha = 1;
  }

  // the Silhouette at time t: tones and blurred field, both in mask space
  function paintMasks(x, y, phase) {
    toneG.setTransform(1, 0, 0, 1, 0, 0);
    toneG.fillStyle = '#000'; toneG.fillRect(0, 0, toneC.width, toneC.height);
    toneG.setTransform(Q, 0, 0, Q, 0, 0);
    figure(toneG, x, y, u, phase, (v) => { const c = Math.round(v * 255); toneG.fillStyle = toneG.strokeStyle = `rgb(${c},${c},${c})`; });
    // the soft field around the Silhouette: drawn at low resolution, then smoothed by the upscale
    smallG.setTransform(1, 0, 0, 1, 0, 0);
    smallG.fillStyle = '#000'; smallG.fillRect(0, 0, smallC.width, smallC.height);
    smallG.setTransform(Q / FIELD_DOWN, 0, 0, Q / FIELD_DOWN, 0, 0);
    figure(smallG, x, y, u, phase, () => { smallG.fillStyle = smallG.strokeStyle = '#fff'; });
    fieldG.setTransform(1, 0, 0, 1, 0, 0);
    fieldG.imageSmoothingEnabled = true; fieldG.imageSmoothingQuality = 'high';
    fieldG.drawImage(smallC, 0, 0, fieldC.width, fieldC.height);
  }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (now - lastDraw < 33) return; // ~30 fps is plenty for a slow walk
    lastDraw = now;
    draw((now - t0) / 1000);
  }

  function draw(sec) {
    const margin = 0.3 * u;
    const span = W + 2 * margin;
    const x = reduced ? W * 0.64 : ((sec / WALK_S) % 1) * span - margin;
    const y = floorY;
    const phase = reduced ? 0.9 : (x / (0.5 * u)) * Math.PI;
    paintMasks(x, y, phase);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(bg, 0, 0, W, H);
    // the regions that move: around the Silhouette, and around the cursor
    const rects = [[x - 0.32 * u, y - 1.08 * u, x + 0.34 * u, y + 0.02 * u]];
    const R = 110;
    if (!reduced && px > -1e3) {
      const c = [px - R, py - R, px + R, py + R];
      const f = rects[0];
      if (c[0] < f[2] && c[2] > f[0] && c[1] < f[3] && c[3] > f[1]) rects[0] = [Math.min(f[0], c[0]), Math.min(f[1], c[1]), Math.max(f[2], c[2]), Math.max(f[3], c[3])];
      else rects.push(c);
    }
    const mw = toneC.width, mh = toneC.height;
    ctx.font = font; ctx.textBaseline = 'top'; ctx.fillStyle = INK;
    for (const [x0, y0, x1, y1] of rects) {
      const c0 = Math.max(0, Math.floor(x0 / cw)), c1 = Math.min(cols - 1, Math.ceil(x1 / cw));
      const r0 = Math.max(0, Math.floor(y0 / ch)), r1 = Math.min(rows - 1, Math.ceil(y1 / ch));
      if (c1 < c0 || r1 < r0) continue;
      ctx.fillStyle = PAPER; ctx.fillRect(c0 * cw, r0 * ch, (c1 - c0 + 1) * cw, (r1 - r0 + 1) * ch);
      ctx.fillStyle = INK;
      // read the masks once for this region
      const mx0 = Math.max(0, Math.floor(c0 * cw * Q) - 2), my0 = Math.max(0, Math.floor(r0 * ch * Q) - 2);
      const mx1 = Math.min(mw, Math.ceil((c1 + 1) * cw * Q) + 2), my1 = Math.min(mh, Math.ceil((r1 + 1) * ch * Q) + 2);
      if (mx1 <= mx0 || my1 <= my0) continue;
      const rw = mx1 - mx0;
      const tone = toneG.getImageData(mx0, my0, rw, my1 - my0).data;
      const field = fieldG.getImageData(mx0, my0, rw, my1 - my0).data;
      const at = (d, mx, my) => {
        const ix = Math.min(rw - 1, Math.max(0, mx - mx0)), iy = Math.min(my1 - my0 - 1, Math.max(0, my - my0));
        return d[(iy * rw + ix) * 4] / 255;
      };
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const i = r * cols + c;
        if (skip[i]) continue;
        const bx = c * cw, by = r * ch;
        const mx = Math.round((bx + cw / 2) * Q), my = Math.round((by + ch / 2) * Q);
        const v = at(tone, mx, my);
        if (v > 0.05) { // inside the Silhouette: a character by density
          ctx.globalAlpha = 1;
          ctx.fillText(RAMP[Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1)))], bx, by);
          continue;
        }
        const f = at(field, mx, my);
        let dx = -(at(field, mx + 1, my) - at(field, mx - 1, my)) * 160;
        let dy = -(at(field, mx, my + 1) - at(field, mx, my - 1)) * 160;
        if (!reduced && px > -1e3) {
          const ox = bx - px, oy = by - py, d2 = ox * ox + oy * oy;
          if (d2 < R * R) { const d = Math.sqrt(d2) || 1, k = 18 * Math.exp(-d2 / 2600); dx += (ox / d) * k; dy += (oy / d) * k; }
        }
        const len = Math.hypot(dx, dy);
        if (len > 24) { dx *= 24 / len; dy *= 24 / len; }
        const ch_ = chars[i];
        if (ch_ === ' ') continue;
        ctx.globalAlpha = 0.5 + 0.45 * smooth(0.05, 0.3, f) * (1 - smooth(0.45, 0.8, f)); // the dark ring at the edge
        ctx.fillText(ch_, bx + dx, by + dy);
      }
    }
    ctx.globalAlpha = 1;
  }

  const onMove = (e) => { const r = canvas.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; };
  const onLeave = () => { px = py = -1e4; };
  const onResize = () => { if (running) { size(); draw((performance.now() - t0) / 1000); } };

  return {
    start() {
      if (running) return;
      running = true;
      size();
      t0 = performance.now() - WALK_S * 1000 * 0.18; // enter already a little inside the page
      draw((performance.now() - t0) / 1000);
      // the grid is measured with the real font once it is there (not the fallback)
      document.fonts?.load(font).then(() => { if (running) onResize(); }).catch(() => {});
      window.addEventListener('resize', onResize);
      if (!reduced) {
        window.addEventListener('pointermove', onMove, { passive: true });
        document.addEventListener('pointerleave', onLeave);
        raf = requestAnimationFrame(frame);
      }
    },
    /** lay the page out again (new size, new card), the walk carries on where it was */
    relayout() { onResize(); },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      px = py = -1e4;
    },
  };
}
