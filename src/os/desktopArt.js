// malOS: shared layout + art. The wallpaper is painted once on a canvas and used both by the
// 3D screen (texture) and by the HTML desktop (background image), so they match exactly.
import * as THREE from 'three';

export const DESK_W = 1024;
export const DESK_H = 768;
export const BAR_H = 30;

// desktop icons. The chapter doors (two folders and the Shop's cart) are big and sit in the middle
// of the desktop (that is where the visitor should click); the small utilities stay in the right column.
// Each rect = the picture, in desktop pixels (x, y = top-left).
export const ICON_RECT = {
  edu: { x: 520, y: 100, w: 124, h: 104 },
  exp: { x: 660, y: 100, w: 124, h: 104 },
  shop: { x: 800, y: 100, w: 124, h: 104 },
  profile: { x: 934, y: 58, w: 64, h: 56 },
  lofi: { x: 934, y: 160, w: 64, h: 56 },
  notes: { x: 934, y: 262, w: 64, h: 56 },
  github: { x: 934, y: 364, w: 64, h: 56 },
};
export const ICONS = Object.keys(ICON_RECT);
export const BIG_ICONS = ['edu', 'exp', 'shop'];
export const iconRect = (id) => ICON_RECT[id];

export const WIN = {
  welcome: { x: 52, y: 78, w: 440, h: 372 },
  exp: { x: 44, y: 72, w: 512, h: 392 },
  lofi: { x: 40, y: 560, w: 330, h: 156 },
  term: { x: 400, y: 512, w: 420, h: 206 },
};

// ------------------------------------------------ icons (soft, skeuomorphic, no pixels)
// Big folder: back panel with its tab, two sheets of paper peeking out (with a tiny preview of
// what is inside), and a front flap that tilts forward on hover while the sheets rise.
// Every gradient id is prefixed: the SVGs are inlined in the same page, ids must not collide.
const folder = (id, c, paper, badge) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" class="fd">
  <defs>
    <linearGradient id="${id}-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.b1}"/><stop offset="1" stop-color="${c.b2}"/></linearGradient>
    <linearGradient id="${id}-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.f1}"/><stop offset="1" stop-color="${c.f2}"/></linearGradient>
    <linearGradient id="${id}-s" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>
  <path class="fd-back" d="M8 21a7 7 0 0 1 7-7h25.5a6 6 0 0 1 4.6 2.2l4.3 5.3H105a7 7 0 0 1 7 7V88a7 7 0 0 1-7 7H15a7 7 0 0 1-7-7z" fill="url(#${id}-b)"/>
  <g class="fd-paper">
    <rect x="20" y="14" width="66" height="54" rx="4" fill="#efe5d3" transform="rotate(-5 53 41)"/>
    <rect x="33" y="10" width="68" height="56" rx="4" fill="#fffaf1" transform="rotate(4 67 38)"/>
    ${paper}
  </g>
  <g class="fd-front">
    <path d="M5 42a7 7 0 0 1 7-7h96a7 7 0 0 1 7 7l-3.2 46a7 7 0 0 1-7 6.5H15.2a7 7 0 0 1-7-6.5z" fill="url(#${id}-f)"/>
    <path d="M5 42a7 7 0 0 1 7-7h96a7 7 0 0 1 7 7l-3.2 46a7 7 0 0 1-7 6.5H15.2a7 7 0 0 1-7-6.5z" fill="url(#${id}-s)"/>
    <path d="M12 36.2h96" stroke="#fff" stroke-opacity=".75" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M17 88.5h86" stroke="#000" stroke-opacity=".08" stroke-width="2" stroke-linecap="round"/>
    ${badge}
  </g>
</svg>`;
const badge = (glyph) => `
    <circle cx="60" cy="65" r="13.5" fill="#000" opacity=".08"/>
    <circle cx="60" cy="64" r="13" fill="#fff8ee"/>
    <circle cx="60" cy="64" r="13" fill="none" stroke="#000" stroke-opacity=".08"/>
    ${glyph}`;

// The Profile's icon: a little page of Rimbaud in monospace, Malo's Silhouette set in dense
// characters in the middle, a red dog-ear: what opening it shows (DA.md §18).
const PROFILE_ICON = (() => {
  const text = 'CommejedescendaisdesFleuvesimpassiblesJenemesentispluguidéparleshaleursDesPeauxRougescriards';
  const mask = [ // a bust seen from the side, facing right: short hair, glasses, shoulders
    '.........',
    '...@@@...',
    '..@@@@□..',
    '..@@@@%..',
    '...@@%...',
    '..#####..',
    '.#######.',
  ];
  let k = 0;
  const rows = mask.map((m, r) => {
    const spans = [...m].map((c) => {
      const ch = text[k++ % text.length];
      return c === '.' ? `<tspan fill="#b3ab9d">${ch}</tspan>` : `<tspan fill="#15131a" font-weight="800">${c}</tspan>`;
    }).join('');
    return `<text x="12" y="${11.4 + r * 6.6}" textLength="38" lengthAdjust="spacing">${spans}</text>`;
  }).join('');
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 56">
  <path d="M10 4h36l8 8v41a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#000" opacity=".18" transform="translate(1.5 1.5)"/>
  <path d="M10 3h36l8 8v41a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#f3efe6"/>
  <path d="M46 3v6a2 2 0 0 0 2 2h6z" fill="#e5372c"/>
  <g font-family="ui-monospace, Menlo, 'IBM Plex Mono', monospace" font-size="7">${rows}</g>
</svg>`;
})();

export const ICON_SVG = {
  // Education: a sheet with a tiny floating island and the balloon
  edu: folder('fe', { b1: '#e2a65e', b2: '#c98a45', f1: '#fbe0a8', f2: '#eab36a' }, `
    <g transform="rotate(4 67 38)">
      <rect x="39" y="15" width="56" height="26" rx="3" fill="#b9cbe8"/>
      <rect x="39" y="30" width="56" height="11" rx="0" fill="#f4d6b8" opacity=".7"/>
      <ellipse cx="62" cy="31" rx="12" ry="3.2" fill="#86b86a"/>
      <path d="M50.5 31.5h23L62 40z" fill="#a8794f"/>
      <rect x="58" y="25" width="7" height="5.5" fill="#fff1dc"/>
      <path d="M57 25.5l4.5-4 4.5 4z" fill="#c8664b"/>
      <circle cx="84" cy="21" r="4.2" fill="#e07a5f"/>
      <path d="M84 16.8v8.4" stroke="#fff6e9" stroke-width="1.4"/>
      <rect x="82.6" y="27.2" width="2.8" height="2.4" fill="#8a5a3b"/>
    </g>`,
    badge(`<path d="M50 62l10-5 10 5-10 5z" fill="#3d405b"/><path d="M54 64.2v4.3c3.6 2.4 8.4 2.4 12 0v-4.3l-6 3z" fill="#3d405b"/><path d="M69 62.3v5" stroke="#e07a5f" stroke-width="1.5" stroke-linecap="round"/>`)),
  // Experience: an amber trading chart on top of a stack of files
  exp: folder('fx', { b1: '#cf6a4f', b2: '#ad4f37', f1: '#f7b29a', f2: '#df785b' }, `
    <g transform="rotate(4 67 38)">
      <rect x="39" y="15" width="56" height="26" rx="3" fill="#2a2433"/>
      <path d="M43 35l7-6 6 3 8-9 7 4 8-8 8 3" stroke="#ffb347" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M43 38.5h48" stroke="#ffb347" stroke-opacity=".3"/>
      <circle cx="87" cy="22" r="1.8" fill="#ffd79a"/>
    </g>`,
    badge(`<rect x="51" y="60" width="18" height="12" rx="2.5" fill="#3d405b"/><path d="M56 60v-2.6a1.6 1.6 0 0 1 1.6-1.6h4.8a1.6 1.6 0 0 1 1.6 1.6V60" stroke="#3d405b" stroke-width="1.8" fill="none"/><rect x="51" y="64.4" width="18" height="1.6" fill="#f2cc8f"/>`)),
  // the Shop: a little shopping cart, cyan basket, carrying a cup of coffee (the Shop's currency)
  shop: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" class="fd">
  <defs>
    <linearGradient id="sc-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd0f0"/><stop offset="1" stop-color="#1f9cc9"/></linearGradient>
    <linearGradient id="sc-s" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>
  <path d="M6 20h14l5 10" stroke="#2e2a3a" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <g class="fd-paper">
    <path d="M47 33c0-10 4-16 11-16s11 6 11 16z" fill="#fffaf1"/>
    <path d="M47 33h22" stroke="#d8c7a8" stroke-width="2"/>
    <path d="M54 14c-2-4 2-6 0-10M62 14c-2-4 2-6 0-10" stroke="#fff" stroke-opacity=".8" stroke-width="2" fill="none" stroke-linecap="round"/>
    <rect x="73" y="18" width="20" height="16" rx="3" fill="#ffd84d"/>
    <path d="M78 26h10" stroke="#2e2a3a" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g class="fd-front">
    <path d="M22 30h90l-9 40a6 6 0 0 1-6 5H36a6 6 0 0 1-6-5z" fill="url(#sc-b)" stroke="#2e2a3a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M22 30h90l-9 40a6 6 0 0 1-6 5H36a6 6 0 0 1-6-5z" fill="url(#sc-s)"/>
    <path d="M27 45h80M30 60h74M50 31l3 43M70 31v43M90 31l-3 43" stroke="#2e2a3a" stroke-opacity=".35" stroke-width="2"/>
    <path d="M36 75l-4 9h68" stroke="#2e2a3a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="42" cy="91" r="6" fill="#2e2a3a"/><circle cx="42" cy="91" r="2.2" fill="#fffaf1"/>
    <circle cx="90" cy="91" r="6" fill="#2e2a3a"/><circle cx="90" cy="91" r="2.2" fill="#fffaf1"/>
  </g>
</svg>`,
  profile: PROFILE_ICON,
  lofi: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 56">
  <rect x="4" y="10" width="56" height="38" rx="6" fill="#efe4cc" stroke="#000" stroke-opacity=".12"/>
  <rect x="10" y="15" width="44" height="13" rx="2" fill="#e07a5f"/>
  <rect x="10" y="19" width="44" height="5" fill="#fff6e9"/>
  <rect x="14" y="30" width="36" height="12" rx="6" fill="#3d405b"/>
  <circle cx="22" cy="36" r="4" fill="#efe4cc"/><circle cx="42" cy="36" r="4" fill="#efe4cc"/>
  <circle cx="22" cy="36" r="1.5" fill="#3d405b"/><circle cx="42" cy="36" r="1.5" fill="#3d405b"/>
</svg>`,
  notes: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 56">
  <path d="M12 4h40v44l-8 6H12z" fill="#ffe58f" stroke="#000" stroke-opacity=".1"/>
  <path d="M44 54v-6h8z" fill="#e9c967"/>
  <rect x="12" y="4" width="40" height="7" fill="#000" opacity=".06"/>
  <path d="M18 20h26M18 27h22M18 34h25M18 41h14" stroke="#b08a3a" stroke-width="2" stroke-linecap="round" opacity=".6"/>
</svg>`,
  github: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 56">
  <rect x="8" y="4" width="48" height="48" rx="11" fill="#2e2a3a"/>
  <path d="M25 20l-8 8 8 8M39 20l8 8-8 8M35 17l-6 22" stroke="#f2cc8f" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
};

export const FILE_SVG = (accent, glyph) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48">
  <path d="M4 3h22l10 10v32H4z" fill="#fffaf1" stroke="#000" stroke-opacity=".14"/>
  <path d="M26 3v10h10" fill="#efe4cc"/>
  <rect x="4" y="33" width="32" height="12" fill="${accent}"/>
  ${glyph}
</svg>`;

// ------------------------------------------------ wallpaper: a lofi night over the hills
export function paintWallpaper() {
  const c = document.createElement('canvas');
  c.width = DESK_W; c.height = DESK_H;
  const x = c.getContext('2d');
  const sky = x.createLinearGradient(0, 0, 0, DESK_H);
  sky.addColorStop(0, '#1b1f3d');
  sky.addColorStop(0.45, '#3b3466');
  sky.addColorStop(0.78, '#a5687a');
  sky.addColorStop(1, '#e3a07f');
  x.fillStyle = sky;
  x.fillRect(0, 0, DESK_W, DESK_H);
  // stars
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 140; i++) {
    const px = rnd() * DESK_W, py = rnd() * DESK_H * 0.55;
    x.fillStyle = `rgba(255,244,225,${0.25 + rnd() * 0.6})`;
    x.beginPath(); x.arc(px, py, rnd() < 0.1 ? 1.6 : 0.9, 0, Math.PI * 2); x.fill();
  }
  // moon with a soft halo
  const mg = x.createRadialGradient(250, 190, 0, 250, 190, 190);
  mg.addColorStop(0, 'rgba(255,236,210,0.35)'); mg.addColorStop(1, 'rgba(255,236,210,0)');
  x.fillStyle = mg; x.fillRect(0, 0, DESK_W, DESK_H);
  x.fillStyle = '#fff0d6'; x.beginPath(); x.arc(250, 190, 44, 0, Math.PI * 2); x.fill();
  x.fillStyle = 'rgba(59,52,102,0.9)'; x.beginPath(); x.arc(270, 178, 40, 0, Math.PI * 2); x.fill();
  // soft clouds
  const cloud = (cx, cy, w, a) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, w);
    g.addColorStop(0, `rgba(255,214,200,${a})`); g.addColorStop(1, 'rgba(255,214,200,0)');
    x.fillStyle = g; x.save(); x.translate(cx, cy); x.scale(1, 0.28); x.translate(-cx, -cy);
    x.beginPath(); x.arc(cx, cy, w, 0, Math.PI * 2); x.fill(); x.restore();
  };
  cloud(560, 330, 260, 0.16); cloud(820, 260, 180, 0.12); cloud(180, 420, 220, 0.12);
  // two little floating islands far away (a wink to the Education folder)
  const isle = (cx, cy, k) => {
    // soft silhouette: grassy top, rounded rocky belly, one lit window
    x.fillStyle = 'rgba(52,40,84,0.8)';
    x.beginPath();
    x.moveTo(cx - 36 * k, cy);
    x.quadraticCurveTo(cx - 20 * k, cy + 26 * k, cx, cy + 30 * k);
    x.quadraticCurveTo(cx + 22 * k, cy + 22 * k, cx + 36 * k, cy);
    x.closePath(); x.fill();
    x.fillStyle = 'rgba(86,74,120,0.85)';
    x.beginPath(); x.ellipse(cx, cy, 37 * k, 6 * k, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(52,40,84,0.9)';
    x.fillRect(cx - 8 * k, cy - 12 * k, 14 * k, 10 * k);
    x.beginPath(); x.moveTo(cx - 10 * k, cy - 11 * k); x.lineTo(cx - 1 * k, cy - 19 * k); x.lineTo(cx + 8 * k, cy - 11 * k); x.fill();
    x.fillStyle = 'rgba(255,200,130,0.9)'; x.fillRect(cx - 3 * k, cy - 8 * k, 4 * k, 4 * k);
  };
  isle(640, 360, 1.1); isle(760, 410, 0.7);
  // hills, layered
  const hill = (y0, amp, col, ph) => {
    x.fillStyle = col; x.beginPath(); x.moveTo(0, DESK_H);
    for (let px = 0; px <= DESK_W; px += 8) x.lineTo(px, y0 + Math.sin(px * 0.006 + ph) * amp + Math.sin(px * 0.017 + ph * 2) * amp * 0.35);
    x.lineTo(DESK_W, DESK_H); x.fill();
  };
  hill(590, 30, '#6d4a68', 0.5);
  hill(640, 26, '#4c3653', 2.1);
  hill(700, 18, '#33253d', 4.0);
  // a tiny house with a warm window on the last hill
  x.fillStyle = '#271c30'; x.fillRect(150, 648, 34, 26); x.beginPath(); x.moveTo(146, 650); x.lineTo(167, 632); x.lineTo(188, 650); x.fill();
  x.fillStyle = '#ffc979'; x.fillRect(160, 656, 9, 8);
  // fine grain
  const img = x.getImageData(0, 0, DESK_W, DESK_H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 9;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  x.putImageData(img, 0, 0);
  return c;
}

/** The desktop as painted on the 3D screen (wallpaper + menu bar + icons + widgets, no text). */
export function createDeskTexture(wallpaper) {
  const c = document.createElement('canvas');
  c.width = DESK_W; c.height = DESK_H;
  const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  const paint = (imgs = {}) => {
    x.drawImage(wallpaper, 0, 0);
    x.fillStyle = 'rgba(24,20,40,0.55)'; x.fillRect(0, 0, DESK_W, BAR_H);
    const card = (r, a) => { x.fillStyle = `rgba(255,246,233,${a})`; x.beginPath(); x.roundRect(r.x, r.y, r.w, r.h, 12); x.fill(); };
    card(WIN.welcome, 0.9);
    ICONS.forEach((id) => {
      const r = iconRect(id);
      if (imgs[id]) x.drawImage(imgs[id], r.x, r.y, r.w, r.h);
      x.fillStyle = 'rgba(20,16,32,0.45)';
      const big = BIG_ICONS.includes(id);
      const lw = big ? r.w - 24 : r.w + 12;
      x.beginPath(); x.roundRect(r.x + (r.w - lw) / 2, r.y + r.h + 8, lw, big ? 20 : 14, 6); x.fill();
    });
    card(WIN.lofi, 0.82);
    x.fillStyle = 'rgba(24,20,36,0.9)'; x.beginPath(); x.roundRect(WIN.term.x, WIN.term.y, WIN.term.w, WIN.term.h, 12); x.fill();
    tex.needsUpdate = true;
  };
  paint();
  // draw the SVG icons once they are decoded
  const imgs = {};
  let left = ICONS.length;
  ICONS.forEach((id) => {
    const im = new Image();
    im.onload = () => { imgs[id] = im; if (--left === 0) paint(imgs); };
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ICON_SVG[id]);
  });
  return tex;
}

/** Education icon rect in screen-uv space (for the "window shrinks into its folder" effect). */
export function eduIconUV() {
  const r = iconRect('edu');
  return { x0: r.x / DESK_W, y0: 1 - (r.y + r.h) / DESK_H, x1: (r.x + r.w) / DESK_W, y1: 1 - r.y / DESK_H };
}
