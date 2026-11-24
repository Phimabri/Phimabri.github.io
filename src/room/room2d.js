// The room as a 2D illustration (DOM + SVG). The "camera" is a 2D view: a centre in art units
// and a scale (screen pixels per art unit). The glass of the monitor is a hole in the drawing;
// the WebGL canvas underneath draws the malOS desktop / the island world exactly in that hole.
//
// Performance: repainting the SVG at a new scale every frame (halftone patterns, masks, blended
// light) is far too slow for the zooms. So every layer is also rasterised once into a bitmap
// (canvas) while the site loads. During camera moves we show the bitmaps, which the GPU simply
// scales; when the view rests on the desk we switch back to the live, crisp, animated SVG and
// promote it to its own compositor layer, so the mouse parallax only moves pixels.
import { ART, SCREEN, backSVG, frontSVG, fxSVG } from './art.js';

export { ART, SCREEN };

// the same stylesheet as index.html: the font files come straight from the browser cache
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Anton&family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..700,0..100,0..1&family=Caveat:wght@500;600&family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap';

/** @font-face rules (latin only) with the font files inlined: an SVG drawn as an image can't load anything. */
async function inlineFonts() {
  const css = await (await fetch(FONTS_URL)).text();
  const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)].filter((m) => m[1] === 'latin').map((m) => m[2]);
  const toData = async (url) => {
    const b = await (await fetch(url)).blob();
    return new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); });
  };
  const out = await Promise.all(blocks.map(async (b) => {
    const m = b.match(/url\(([^)]+)\)/);
    return m ? b.replace(m[0], `url(${await toData(m[1].replace(/['"]/g, ''))})`) : b;
  }));
  return out.join('\n');
}

async function rasterise(svg, k, css, target) {
  const W = Math.round(ART.w * k), H = Math.round(ART.h * k);
  const src = svg
    .replace('<svg class="room__svg"', `<svg width="${W}" height="${H}"`)
    .replace('<defs>', `<defs><style>${css}</style>`);
  const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = target || document.createElement('canvas');
    c.width = W; c.height = H;
    c.getContext('2d').drawImage(img, 0, 0);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function createRoom2D(el) {
  const LAYERS = [
    { key: 'back', svg: backSVG, cls: 'room__back', k: 2 },
    { key: 'front', svg: frontSVG, cls: 'room__front', k: 2 },
    // the light: smooth gradients, so a low-res bitmap is invisible, and always a bitmap (never live)
    { key: 'mul', svg: () => fxSVG('mul'), cls: 'room__fx room__fx--mul', k: 0.5, bmpOnly: true },
    { key: 'add', svg: () => fxSVG('add'), cls: 'room__fx room__fx--add', k: 0.5, bmpOnly: true },
  ];
  el.innerHTML =
    LAYERS.map((L) => `${L.bmpOnly ? '' : `<div class="room__layer room__live ${L.cls}" data-k="${L.key}">${L.svg()}</div>`}<canvas class="room__layer room__bmp ${L.cls}" data-k="${L.key}"></canvas>`).join(''); // no grain over the room: the fine lines stay crisp
  const live = Object.fromEntries([...el.querySelectorAll('.room__live')].map((n) => [n.dataset.k, n]));
  const bmp = Object.fromEntries([...el.querySelectorAll('.room__bmp')].map((n) => [n.dataset.k, n]));
  const noteA = el.querySelector('#room-note-a'), noteB = el.querySelector('#room-note-b');
  const tt = el.querySelector('.room-tt');

  let fontCSS = null, ready = false, notes = null, playing = false;
  // what the bitmaps freeze of the animated bits (steam half visible, the arm where it is)
  const frozenCSS = () => `.room-steam path{opacity:.35}${playing ? '.room-arm{transform-box:view-box;transform-origin:330px 642px;transform:rotate(38deg)}' : ''}`;
  const frontSource = () => {
    let s = frontSVG();
    if (notes) s = s.replace(/(id="room-note-a"[^>]*>)[^<]*/, `$1${notes[0]}`).replace(/(id="room-note-b"[^>]*>)[^<]*/, `$1${notes[1]}`);
    return s;
  };
  async function paint(keys) {
    const css = fontCSS + frozenCSS();
    await Promise.all(LAYERS.filter((L) => keys.includes(L.key)).map((L) =>
      rasterise(L.key === 'front' ? frontSource() : L.svg(), L.k * (window.devicePixelRatio > 1.5 ? 1 : 0.75), css, bmp[L.key])));
  }
  let frontTimer = 0;
  const repaintFront = () => { if (!ready) return; clearTimeout(frontTimer); frontTimer = setTimeout(() => paint(['front']).catch(() => {}), 120); };

  const rect = { x: 0, y: 0, w: 0, h: 0 };
  let lastB = '', lastF = '', visible = false;
  let still = false, stillScale = 0, promoteT = 0;

  function show(isStill, s) {
    // moving: bitmaps · resting: live SVG, promoted to a layer once painted at its final scale
    const want = isStill || !ready;
    if (want !== still || (want && Math.abs(s - stillScale) / s > 0.01)) {
      still = want;
      stillScale = s;
      el.classList.toggle('is-moving', !want);
      el.classList.remove('is-promoted');
      cancelAnimationFrame(promoteT);
      if (want) promoteT = requestAnimationFrame(() => (promoteT = requestAnimationFrame(() => el.classList.add('is-promoted'))));
    }
  }

  /**
   * Place the view. (cx, cy) = art point at the centre of the viewport, s = px per art unit.
   * px, py in [-1, 1] = smoothed pointer; k = how much parallax (0 = none); rest = the view is
   * not zooming (crisp SVG). Returns the glass rect in viewport pixels.
   */
  function setView(cx, cy, s, px = 0, py = 0, k = 0, rest = false) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const tx = vw / 2 - cx * s, ty = vh / 2 - cy * s;
    // the wall drifts more than the desk: a little depth without any 3D
    const bx = -px * 16 * k, by = py * 9 * k, fx = -px * 5 * k, fy = py * 3 * k;
    if (visible) {
      show(rest, s);
      const tb = `translate3d(${(tx + bx).toFixed(2)}px, ${(ty + by).toFixed(2)}px, 0) scale(${s.toFixed(5)})`;
      const tf = `translate3d(${(tx + fx).toFixed(2)}px, ${(ty + fy).toFixed(2)}px, 0) scale(${s.toFixed(5)})`;
      if (tb !== lastB) { live.back.style.transform = bmp.back.style.transform = tb; lastB = tb; }
      if (tf !== lastF) {
        for (const key of ['front', 'mul', 'add']) { bmp[key].style.transform = tf; if (live[key]) live[key].style.transform = tf; }
        lastF = tf;
      }
    }
    rect.x = tx + fx + SCREEN.x * s;
    rect.y = ty + fy + SCREEN.y * s;
    rect.w = SCREEN.w * s;
    rect.h = SCREEN.h * s;
    return rect;
  }

  return {
    el,
    rect,
    setView,
    /** Rasterise the layers (call behind the loader). Without it, the live SVG is used everywhere. */
    async prepare() {
      try {
        fontCSS = await inlineFonts();
        await paint(LAYERS.map((L) => L.key));
        ready = true;
      } catch (err) {
        console.warn('room: bitmaps unavailable, using the live SVG', err);
        fontCSS = ''; paint(['mul', 'add']).catch(() => {}); // the light has no text: it does not need the fonts
      }
    },
    setVisible(on) {
      if (on === visible) return;
      visible = on;
      el.classList.toggle('is-on', on);
      if (on) { lastB = lastF = ''; stillScale = 0; }
    },
    get visible() { return visible; },
    setNotes(a, b) { if (!noteA) return; noteA.textContent = a; noteB.textContent = b; notes = [a, b]; repaintFront(); },
    setPlaying(on) { playing = on; el.classList.toggle('is-playing', on); repaintFront(); },
    onTurntable(f) { tt.addEventListener('click', f); },
  };
}
