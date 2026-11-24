// The room, drawn as a fine-line night illustration (see DA.md §12.e): thin ink outlines, real
// volumes (gradients on plastic, metal, ceramic, wood), soft contact shadows, a fine halftone
// only where print texture helps (posters). Three SVG layers share one art board:
//   back  : the wall (posters, records, window on the sea, surfboard) — moves most with the mouse
//   front : the desk and everything on it, including the computer whose glass is a real hole
//   fx    : light (lamp pool, screen glow, moonlight, night vignette), blended over both
// The WebGL canvas shows through the hole: the malOS desktop and the island world live there.

export const ART = { w: 1600, h: 1000 };
/** The glass of the monitor, in art units (4:3, like the old 3D screen). */
export const SCREEN = { x: 640, y: 290, w: 320, h: 240, r: 18 };

const INK = '#1e1922';
const C = {
  wall: '#24443f', wallD: '#182e2b',
  cream: '#efe3c8', paper: '#f4ead4',
  beige: '#e4d5b5', beigeL: '#f1e8d2', beigeD: '#c9b591', beigeDD: '#a08c69',
  red: '#c8432b', redD: '#962f1e', mustard: '#e7b04a', teal: '#2c6662', tealD: '#1d4744',
  wood: '#764b31', woodD: '#55351f', woodL: '#9a6744',
  night: '#0d1633',
};

// ------------------------------------------------------------------ helpers
const f = (n) => (Math.round(n * 100) / 100).toString();
const rr = (x, y, w, h, r) =>
  `M${f(x + r)} ${f(y)}h${f(w - 2 * r)}a${r} ${r} 0 0 1 ${r} ${r}v${f(h - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${r}h${f(-(w - 2 * r))}a${r} ${r} 0 0 1 ${-r} ${-r}v${f(-(h - 2 * r))}a${r} ${r} 0 0 1 ${r} ${-r}z`;

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const hexRGB = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function mix(a, b, t) {
  const A = hexRGB(a), B = hexRGB(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
/** k < 0 darkens (towards a plum black), k > 0 lightens (towards warm white) */
const shade = (c, k) => (k < 0 ? mix(c, '#140f18', -k) : mix(c, '#fff6e6', k));

// thin ink: 1.2 for silhouettes, 0.6 for details
const LW = 1.2, LW2 = 0.6;
const K = `stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round" stroke-linecap="round"`;
const K2 = `stroke="${INK}" stroke-width="${LW2}" stroke-linejoin="round" stroke-linecap="round"`;
const S = (w, c = INK, o = 1) => `stroke="${c}" stroke-width="${w}" stroke-opacity="${o}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

/** A small registry of gradients for one SVG (ids prefixed, each defined once). */
function Grads(p) {
  const out = [], seen = new Set();
  const add = (id, s) => { if (!seen.has(id)) { seen.add(id); out.push(s); } return `url(#${p}-${id})`; };
  return {
    p,
    // vertical: lit from above
    v: (id, c, top = 0.16, bot = -0.22) =>
      add(id, `<linearGradient id="${p}-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c, top)}"/><stop offset="1" stop-color="${shade(c, bot)}"/></linearGradient>`),
    // horizontal: lit from the left (the lamp)
    h: (id, c, l = 0.14, r = -0.24) =>
      add(id, `<linearGradient id="${p}-${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(c, l)}"/><stop offset="1" stop-color="${shade(c, r)}"/></linearGradient>`),
    // cylinder seen from the front: dark rim, a highlight a third of the way in
    cyl: (id, c) =>
      add(id, `<linearGradient id="${p}-${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(c, -0.38)}"/><stop offset=".16" stop-color="${shade(c, -0.04)}"/><stop offset=".3" stop-color="${shade(c, 0.3)}"/><stop offset=".42" stop-color="${c}"/><stop offset=".82" stop-color="${shade(c, -0.22)}"/><stop offset="1" stop-color="${shade(c, -0.42)}"/></linearGradient>`),
    // sphere / dome
    rad: (id, c, cx = 0.36, cy = 0.32) =>
      add(id, `<radialGradient id="${p}-${id}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${shade(c, 0.35)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -0.4)}"/></radialGradient>`),
    raw: (id, s) => add(id, s.replace(/ID/g, `${p}-${id}`)),
    defs: () => out.join(''),
  };
}
const patterns = (p) => `
  <pattern id="${p}-ht" width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2.25" cy="2.25" r=".85" fill="${INK}"/></pattern>
  <pattern id="${p}-htf" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="1.5" cy="1.5" r=".55" fill="${INK}"/></pattern>
  <radialGradient id="${p}-soft"><stop offset="0" stop-color="#0b0710" stop-opacity="1"/><stop offset=".55" stop-color="#0b0710" stop-opacity=".55"/><stop offset="1" stop-color="#0b0710" stop-opacity="0"/></radialGradient>`;
/** soft contact shadow (an ellipse that fades out) */
const soft = (p, cx, cy, rx, ry, o = 0.5) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${p}-soft)" opacity="${o}"/>`;

/** strict XML for the rasterised copies: in each tag, keep the first of any repeated attribute
 *  (the stroke shorthand S() adds fill="none", which may follow an explicit fill) */
const dedupe = (svg) =>
  svg.replace(/<[a-zA-Z][^<>]*>/g, (tag) => {
    const seen = new Set();
    return tag.replace(/\s([a-zA-Z:-]+)="[^"]*"/g, (m, name) => (seen.has(name) ? '' : (seen.add(name), m)));
  });

const qpt = (x0, y0, cx, cy, x1, y1, t) => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1];
/** a spring: zig-zag along a segment */
function coil(x0, y0, x1, y1, n, amp) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  let d = `M${f(x0)} ${f(y0)}`;
  for (let i = 1; i <= n; i++) {
    const t = i / n, s = i % 2 ? amp : -amp;
    d += ` L${f(x0 + dx * (t - 0.5 / n) + nx * s)} ${f(y0 + dy * (t - 0.5 / n) + ny * s)}`;
  }
  return d + ` L${f(x1)} ${f(y1)}`;
}
const tape = (x, y, a) =>
  `<path d="M${x - 15} ${y - 5.5} l2 1.5 l2 -1.5 l26 0 l-1.5 2 l1.5 2 l0 7 l-2 -1.5 l-2 1.5 l-26 0 l1.5 -2 l-1.5 -2z" fill="#f4ecd6" opacity=".62" transform="rotate(${a} ${x} ${y})"/>`;
/** a drop shadow behind a flat rectangle (two layers = a soft penumbra) */
const paperShadow = (x, y, w, h) =>
  `<rect x="${x + 3}" y="${y + 5}" width="${w}" height="${h}" fill="#08060c" opacity=".2"/><rect x="${x + 1.5}" y="${y + 2.5}" width="${w}" height="${h}" fill="#08060c" opacity=".22"/>`;

// ================================================================== the wall
function wallTexture(g) {
  const R = rng(3);
  let marks = '';
  for (let i = 0; i < 520; i++) {
    const x = R() * ART.w, y = R() * 690, a = R() * Math.PI, l = 1.5 + R() * 4;
    const light = R() > 0.72;
    marks += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" ${S(0.5, light ? '#e8f2ea' : '#081210', light ? 0.05 : 0.14)}/>`;
  }
  let stripes = '';
  for (let x = 12; x < ART.w; x += 44) stripes += `<path d="M${x} 0V690M${x + 5} 0V690" ${S(0.6, '#dff0e6', 0.035)}/>`;
  return `<rect width="${ART.w}" height="${ART.h}" fill="${g.raw('wall', `<linearGradient id="ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.wallD}"/><stop offset=".55" stop-color="${C.wall}"/><stop offset="1" stop-color="#2b4c45"/></linearGradient>`)}"/>
    ${stripes}${marks}
    <rect x="0" y="600" width="${ART.w}" height="80" fill="${g.raw('wallAO', `<linearGradient id="ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05090a" stop-opacity="0"/><stop offset="1" stop-color="#05090a" stop-opacity=".45"/></linearGradient>`)}"/>`;
}

function stringLights(g) {
  const pts = [];
  for (let i = 0; i <= 22; i++) {
    const t = i / 22, x = -20 + t * 1120;
    pts.push([x, 34 + Math.sin(t * Math.PI * 3) * 6 + Math.sin(t * Math.PI) * 26]);
  }
  const wire = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('');
  const bulbG = g.raw('bulb', `<radialGradient id="ID" cx=".45" cy=".6" r=".7"><stop offset="0" stop-color="#fffbe6"/><stop offset=".5" stop-color="#ffd98a"/><stop offset="1" stop-color="#e89a3a"/></radialGradient>`);
  const halo = g.raw('bulbGlow', `<radialGradient id="ID"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".7"/><stop offset=".4" stop-color="#ffcf7a" stop-opacity=".22"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>`);
  let bulbs = '', halos = '';
  pts.forEach(([x, y], i) => {
    if (i % 2) return;
    const d = ((i * 0.61) % 3).toFixed(2);
    halos += `<circle class="room-bulb" style="--d:${d}s" cx="${f(x)}" cy="${f(y + 11)}" r="24" fill="${halo}"/>`;
    bulbs += `<path d="M${f(x)} ${f(y)} v3" ${S(0.8)}/><rect x="${f(x - 2.2)}" y="${f(y + 2.5)}" width="4.4" height="3.4" rx=".8" fill="#5b5550" ${K2}/>
      <path d="M${f(x)} ${f(y + 5.6)} c-3.6 0 -4.4 3.6 -4.4 5.6 c0 2.8 2 4.6 4.4 4.6 c2.4 0 4.4 -1.8 4.4 -4.6 c0 -2 -0.8 -5.6 -4.4 -5.6z" fill="${bulbG}" ${K2}/>
      <path d="M${f(x - 1.2)} ${f(y + 8)} q1.2 2.4 2.4 0" ${S(0.5, '#a0601e')}/>`;
  });
  return `<g><path d="${wire}" ${S(1.1)}/><path d="${wire}" ${S(0.4, '#6d665e')} transform="translate(0 -.4)"/>${bulbs}<g style="mix-blend-mode:screen">${halos}</g></g>`;
}

// ---------------------------------------------------------------- posters
function heli(x, y, s, flip = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s * flip} ${s})" fill="${INK}">
    <path d="M-24 -2 C-24 -10 -12 -12 0 -11 C10 -10 16 -6 18 -1 L60 -4 L62 0 L20 4 C14 9 4 10 -6 10 C-18 10 -24 6 -24 -2z"/>
    <path d="M56 -4 L60 -16 L63 -16 L62 -3z"/><circle cx="60" cy="-5" r="6" fill="none" stroke="${INK}" stroke-width=".8" opacity=".6"/>
    <rect x="-2" y="-17" width="3.4" height="7"/><ellipse cx="0" cy="-17" rx="50" ry="1.6" opacity=".85"/>
    <path d="M-14 10 l-4 7 M10 10 l4 7 M-24 17.5 H24" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M-16 -4 q4 -6 12 -6 l0 8z" fill="#f6c14a" opacity=".3"/>
  </g>`;
}
function palm(x, y, h, lean, s = 1) {
  const tx = x + lean, ty = y - h;
  let out = `<path d="M${x - 5 * s} ${y} Q${f(x + lean * 0.25 - 3 * s)} ${f(y - h * 0.55)} ${f(tx - 1.5 * s)} ${f(ty)} L${f(tx + 1.5 * s)} ${f(ty)} Q${f(x + lean * 0.25 + 3 * s)} ${f(y - h * 0.55)} ${x + 5 * s} ${y}z" fill="${INK}"/>`;
  for (let k = 0; k < 9; k++) out += `<path d="M${f(x - 4 * s + lean * 0.25 * (k / 9) * 1.5)} ${f(y - (h * k) / 9)} h${f(8 * s)}" ${S(0.5, '#000', 0.6)}/>`;
  const fronds = [[-60, 18], [-46, 40], [-20, -26], [54, 16], [40, 40], [16, -30], [-4, 50], [64, -4], [-64, -2]];
  for (const [dx, dy] of fronds) {
    const ex = tx + dx * s, ey = ty + dy * s, cx = tx + dx * 0.45 * s, cy = ty + (dy * 0.2 - 26) * s;
    out += `<path d="M${f(tx)} ${f(ty)} Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}" ${S(2.4 * s)}/>`;
    // leaflets: dense, swept towards the tip, drooping under their weight
    for (let t = 0.08; t < 0.98; t += 0.045) {
      const [px, py] = qpt(tx, ty, cx, cy, ex, ey, t);
      const [qx, qy] = qpt(tx, ty, cx, cy, ex, ey, Math.min(1, t + 0.04));
      const ang = Math.atan2(qy - py, qx - px), L = (19 - t * 13) * s;
      for (const side of [1, -1]) {
        const a = ang + side * 0.62;
        const mx = px + Math.cos(a) * L * 0.55, my = py + Math.sin(a) * L * 0.55 + 3 * s;
        out += `<path d="M${f(px)} ${f(py)} Q${f(mx)} ${f(my)} ${f(px + Math.cos(a) * L)} ${f(py + Math.sin(a) * L + 6 * s)}" ${S(1.5 * s)}/>`;
      }
    }
  }
  return out;
}
function apocalypse(g) {
  const x = 70, y = 92, w = 252, h = 362, m = 8; // m = the white border of the print
  const ix = x + m, iy = y + m, iw = w - 2 * m, ih = h - 2 * m - 54;
  const R = rng(19);
  let canopy = `M${ix} ${iy + ih - 50}`;
  for (let cx = ix; cx < ix + iw; cx += 9 + R() * 8) canopy += ` q${f(4 + R() * 3)} ${f(-6 - R() * 10)} ${f(9 + R() * 6)} ${f(R() * 4 - 1)}`;
  canopy += ` V${iy + ih} H${ix}z`;
  let bands = '';
  for (let i = 0; i < 16; i++) bands += `<path d="M${ix} ${f(iy + 138 + i * 7.5)} h${iw}" ${S(0.6 + i * 0.05, '#7a1e0c', 0.12 + i * 0.012)}/>`;
  const sun = g.raw('apoSun', `<radialGradient id="ID" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff3b8"/><stop offset=".55" stop-color="#f7c548"/><stop offset="1" stop-color="#ef9a35"/></radialGradient>`);
  const sky = g.raw('apoSky', `<linearGradient id="ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0a13c"/><stop offset=".55" stop-color="#e5652a"/><stop offset="1" stop-color="#a8301a"/></linearGradient>`);
  return `<g transform="rotate(-1.6 ${x + w / 2} ${y + h / 2})">
    ${paperShadow(x, y, w, h)}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#efe5cd"/>
    <clipPath id="rb-apo"><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}"/></clipPath>
    <g clip-path="url(#rb-apo)">
      <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${sky}"/>
      <circle cx="${ix + 124}" cy="${iy + 160}" r="96" fill="${sun}"/>
      ${bands}
      <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="url(#rb-htf)" opacity=".07"/>
      ${heli(ix + 64, iy + 78, 0.9)}${heli(ix + 186, iy + 52, 0.58)}${heli(ix + 140, iy + 116, 0.38)}${heli(ix + 30, iy + 150, 0.26, -1)}
      <path d="${canopy}" fill="${INK}"/>
      ${palm(ix + 34, iy + ih + 4, 128, 16, 1)}${palm(ix + 204, iy + ih + 4, 150, -20, 1.05)}${palm(ix + 112, iy + ih, 80, 8, 0.7)}
    </g>
    <rect x="${ix}" y="${iy + ih}" width="${iw}" height="${h - 2 * m - ih}" fill="#1a1416"/>
    <text x="${x + w / 2}" y="${iy + ih + 30}" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="29" letter-spacing="2" fill="#f6c14a">APOCALYPSE NOW</text>
    <path d="M${ix + 18} ${iy + ih + 37} h${iw - 36}" ${S(0.5, '#f6c14a', 0.6)}/>
    <text x="${x + w / 2}" y="${iy + ih + 45}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="5.4" letter-spacing="1.4" fill="${C.cream}" opacity=".82">MARLON BRANDO · ROBERT DUVALL · MARTIN SHEEN</text>
    <text x="${x + w / 2}" y="${iy + ih + 52}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="4.6" letter-spacing="1.6" fill="${C.cream}" opacity=".6">A FILM BY FRANCIS FORD COPPOLA · 1979</text>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" ${K2}/>
    <path d="M${x + w - 26} ${y + h} L${x + w} ${y + h - 26} V${y + h}z" fill="#08060c" opacity=".12"/>
    ${tape(x + 8, y + 2, -32)}${tape(x + w - 8, y + 2, 30)}
  </g>`;
}

function parisTexas(g) {
  const x = 352, y = 132, w = 214, h = 296, m = 7;
  const ix = x + m, iy = y + m, iw = w - 2 * m, ih = h - 2 * m - 34, hz = iy + 186;
  const vx = ix + 110;
  const sky = g.raw('ptSky', `<linearGradient id="ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#173f37"/><stop offset=".35" stop-color="#2f5f4c"/><stop offset=".72" stop-color="#c9452c"/><stop offset="1" stop-color="#f3ab5e"/></linearGradient>`);
  const ground = g.raw('ptGround', `<linearGradient id="ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9714a"/><stop offset="1" stop-color="#dca06c"/></linearGradient>`);
  const R = rng(23);
  let hatch = '';
  for (let i = 0; i < 70; i++) {
    const yy = hz + 4 + Math.pow(R(), 1.6) * (iy + ih - hz), xx = ix + R() * iw, l = 2 + (yy - hz) * 0.12;
    hatch += `<path d="M${f(xx)} ${f(yy)} h${f(l)}" ${S(0.5, '#7a4128', 0.5)}/>`;
  }
  let dashes = '';
  for (let i = 0; i < 9; i++) {
    const t0 = Math.pow(i / 9, 1.8), t1 = Math.pow((i + 0.45) / 9, 1.8);
    dashes += `<path d="M${vx} ${f(hz + 2 + t0 * (iy + ih - hz))} V${f(hz + 2 + t1 * (iy + ih - hz))}" ${S(0.6 + t0 * 2, '#efd27a')}/>`;
  }
  let poles = '', wire = `M${vx + 4} ${hz}`;
  for (let i = 0; i < 5; i++) {
    const t = Math.pow((i + 1) / 5, 1.7), px = vx + 6 + t * 96, py = hz + t * 70, ph = 4 + t * 52;
    poles += `<path d="M${f(px)} ${f(py)} v${f(-ph)} M${f(px - 1.5 - t * 6)} ${f(py - ph + 2 + t * 2)} h${f(3 + t * 12)}" ${S(0.5 + t * 0.9)}/>`;
    wire += ` Q${f(px - 8 * t - 4)} ${f(py - ph + 6 + 8 * t)} ${f(px)} ${f(py - ph + 2)}`;
  }
  return `<g transform="rotate(1.3 ${x + w / 2} ${y + h / 2})">
    ${paperShadow(x, y, w, h)}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#efe5cd"/>
    <clipPath id="rb-pt"><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}"/></clipPath>
    <g clip-path="url(#rb-pt)">
      <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${sky}"/>
      <circle cx="${ix + 150}" cy="${hz - 30}" r="16" fill="#f9d58b" opacity=".85"/>
      <path d="M${ix} ${hz} l0 -10 q14 -4 22 -16 h22 q6 12 18 14 q20 -2 30 -10 q14 6 24 4 l18 -12 h16 q8 10 20 12 q20 2 30 8 V${hz}z" fill="#6c3434"/>
      <path d="M${ix} ${hz} q40 -8 86 -3 q50 -8 116 -2 V${hz + 2} H${ix}z" fill="#8e4838"/>
      <rect x="${ix}" y="${hz}" width="${iw}" height="${ih}" fill="${ground}"/>
      ${hatch}
      <path d="M${vx - 1.5} ${hz} L${vx + 1.5} ${hz} L${ix + 168} ${iy + ih} L${ix + 50} ${iy + ih}z" fill="#3a3231"/>
      <path d="M${vx - 1.5} ${hz} L${ix + 52} ${iy + ih} M${vx + 1.5} ${hz} L${ix + 166} ${iy + ih}" ${S(0.6, '#d9c08a', 0.7)}/>
      ${dashes}
      <path d="${wire}" ${S(0.4, INK, 0.8)}/>${poles}
      <g transform="translate(${vx - 24} ${hz + 50}) scale(1.1)">
        <path d="M-4 2 l-1.8 20 h3 l2.6 -12 l2.6 12 h3 l-1.6 -20z" fill="#2a2426"/>
        <path d="M-6.5 -10 q6.5 -3 13 0 l1.2 13 h-15.4z" fill="#3d3434"/>
        <path d="M-6.5 -10 l-1.6 11 M6.5 -10 l1.6 11" ${S(1.6, '#3d3434')}/>
        <circle cx="0" cy="-13.5" r="3.8" fill="#d6a07a"/>
        <path d="M-4.2 -15 q4.2 -6 8.4 0 h2.8 v1.4 h-11.2z" fill="${C.red}"/>
        <path d="M-9 22 h18" ${S(0.6, '#000', 0.4)}/>
      </g>
    </g>
    <text x="${ix + 12}" y="${iy + 42}" font-family="Anton, Impact, sans-serif" font-size="36" letter-spacing="1" fill="${C.cream}">PARIS,</text>
    <text x="${ix + 12}" y="${iy + 80}" font-family="Anton, Impact, sans-serif" font-size="36" letter-spacing="1" fill="#e2563a">TEXAS</text>
    <text x="${x + w / 2}" y="${iy + ih + 14}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="5.4" letter-spacing="1.4" fill="${INK}">HARRY DEAN STANTON · NASTASSJA KINSKI</text>
    <text x="${x + w / 2}" y="${iy + ih + 23}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="4.8" letter-spacing="1.6" fill="${INK}" opacity=".7">A FILM BY WIM WENDERS · 1984</text>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" ${K2}/>
    ${tape(x + w / 2, y + 1, 4)}
  </g>`;
}

// ---------------------------------------------------------------- records
function sleeve(g, x, y, kind) {
  const s = 118;
  let art = '';
  if (kind === 'grace') {
    // Jeff Buckley — Grace: a warm sepia sleeve, a vintage ribbon microphone, a soft serif
    let grille = '';
    for (let i = 0; i < 8; i++) grille += `<path d="M-8.5 ${f(-18 + i * 4)} h17" ${S(0.5, '#a59383')}/>`;
    for (let i = 0; i < 5; i++) grille += `<path d="M${f(-7 + i * 3.5)} -19 v30" ${S(0.4, '#a59383', 0.7)}/>`;
    art = `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${g.v('grace', '#dcc6a8', 0.08, -0.12)}"/>
      <circle cx="${x + 80}" cy="${y + 46}" r="35" fill="#b3869a" opacity=".5"/>
      <circle cx="${x + 80}" cy="${y + 46}" r="35" fill="none" ${S(0.5, '#8a5d70', 0.5)}/>
      <g transform="translate(${x + 80} ${y + 42})">
        <rect x="-11" y="-22" width="22" height="36" rx="11" fill="${g.cyl('mic', '#4b3d38')}" ${K2}/>
        <clipPath id="rb-micc"><rect x="-10" y="-21" width="20" height="34" rx="10"/></clipPath><g clip-path="url(#rb-micc)">${grille}</g>
        <path d="M-11 -2 h22" ${S(1, '#c9b8a6')}/>
        <path d="M-16 2 q0 20 16 20 q16 0 16 -20" ${S(1.2, '#3b302c')}/><path d="M0 22 v11 M-9 33 h18" ${S(1.6, '#3b302c')}/>
      </g>
      <text x="${x + 11}" y="${y + 97}" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="26" fill="#8a2f45">Grace</text>
      <text x="${x + 11}" y="${y + 109}" font-family="IBM Plex Mono, monospace" font-size="6.6" letter-spacing="1.8" fill="${INK}">JEFF BUCKLEY</text>`;
  } else if (kind === 'rainbows') {
    // Radiohead — In Rainbows: abstract arcs of colour that drip, on black
    const cols = ['#e8463a', '#f08a2b', '#f2c94c', '#5fb36a', '#3d8fd1', '#8a5cc6', '#d55fa0'];
    art = `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="#141217"/>
      ${cols.map((c, i) => { const r = 46 - i * 6; return `<path d="M${x + 59 - r} ${y + 92} a${r} ${r} 0 0 1 ${2 * r} 0" ${S(3.2, c)}/><path d="M${x + 59 - r} ${y + 92} v${4 + (i * 7) % 11}" ${S(2.2, c)}/>`; }).join('')}
      <path d="M${x + 26} ${y + 30} q8 6 3 13 q-7 7 2 14" ${S(1.4, '#f2c94c', 0.75)}/>
      <text x="${x + 10}" y="${y + 19}" font-family="Space Grotesk, sans-serif" font-weight="700" font-size="10" letter-spacing="1" fill="#f4ead4">IN RAINBOWS</text>
      <text x="${x + 10}" y="${y + 110}" font-family="IBM Plex Mono, monospace" font-size="6.6" letter-spacing="2" fill="#f4ead4" opacity=".8">RADIOHEAD</text>`;
  } else {
    // The Strokes — Is This It: a bold, typographic sleeve
    art = `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${g.v('strokes', '#ece4d2', 0.05, -0.08)}"/>
      <text x="${x + 10}" y="${y + 42}" font-family="Anton, Impact, sans-serif" font-size="33" fill="${INK}">IS THIS</text>
      <text x="${x + 10}" y="${y + 78}" font-family="Anton, Impact, sans-serif" font-size="33" fill="${INK}">IT</text>
      <path d="M${x + 52} ${y + 66} h54" ${S(3, C.red)}/>
      <text x="${x + 10}" y="${y + 106}" font-family="IBM Plex Mono, monospace" font-size="7" letter-spacing="2" fill="${INK}">THE STROKES</text>`;
  }
  return `<g>
    ${paperShadow(x, y, s, s)}
    ${art}
    <circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s * 0.43}" fill="none" ${S(1.2, '#fff', 0.06)}/>
    <rect x="${x}" y="${y}" width="${s}" height="${s}" fill="none" ${K2}/>
    <path d="M${x + 1.5} ${y + 1.5} h${s - 3} M${x + 1.5} ${y + 1.5} v${s - 3}" ${S(0.8, '#fff', 0.35)}/>
  </g>`;
}
function vinyl(cx, cy, r, label) {
  let grooves = '';
  for (let k = r - 3; k > r * 0.38; k -= 2.2) grooves += `<circle cx="${cx}" cy="${cy}" r="${f(k)}" ${S(0.45, '#3a3540', 0.8)}/>`;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#121014" ${K2}/>${grooves}
    <path d="M${cx} ${cy} L${f(cx + r * 0.82)} ${f(cy - r * 0.52)} A${r} ${r} 0 0 1 ${f(cx + r * 0.96)} ${f(cy - r * 0.16)}z" fill="#fff" opacity=".1"/>
    <circle cx="${cx}" cy="${cy}" r="${f(r * 0.32)}" fill="${label}" ${K2}/><circle cx="${cx}" cy="${cy}" r="1.6" fill="#ddd"/>`;
}

function polaroid(x, y, a, photo, caption) {
  return `<g transform="rotate(${a} ${x + 40} ${y + 46})">
    ${paperShadow(x, y, 80, 94)}
    <rect x="${x}" y="${y}" width="80" height="94" fill="#f5f1e6" ${K2}/>
    <clipPath id="rb-pol-${x}"><rect x="${x + 7}" y="${y + 7}" width="66" height="62"/></clipPath>
    <g clip-path="url(#rb-pol-${x})">${photo(x + 7, y + 7)}</g>
    <rect x="${x + 7}" y="${y + 7}" width="66" height="62" fill="none" ${S(0.8, '#000', 0.5)}/>
    <text x="${x + 40}" y="${y + 86}" text-anchor="middle" font-family="Caveat, cursive" font-size="14" fill="#3b3340">${caption}</text>
    <circle cx="${x + 41}" cy="${y + 5}" r="4" fill="#000" opacity=".25"/>
    <circle cx="${x + 40}" cy="${y + 3}" r="4" fill="url(#rb-pin)" ${K2}/>
  </g>`;
}
const photoWave = (x, y) => `<rect x="${x}" y="${y}" width="66" height="62" fill="#a7cdd0"/>
  <rect x="${x}" y="${y + 28}" width="66" height="34" fill="#2f7a80"/>
  <path d="M${x - 4} ${y + 44} q16 -30 40 -18 q-16 2 -14 16 q10 -10 24 -4 q12 6 24 -2 V${y + 62} H${x - 4}z" fill="#eef6f2"/>
  <path d="M${x + 12} ${y + 40} q10 -18 28 -16 M${x + 18} ${y + 44} q10 -14 22 -13" ${S(0.6, '#1d4f55')}/>
  <path d="M${x + 40} ${y + 31} l9 -2" ${S(1.6)}/><path d="M${x + 45} ${y + 30} l1 -5 l3 -2 M${x + 46} ${y + 27} l-3 1" ${S(1.1)}/><circle cx="${x + 49}" cy="${y + 21}" r="1.6" fill="${INK}"/>`;
const photoPitch = (x, y) => `<rect x="${x}" y="${y}" width="66" height="62" fill="#3f8b4e"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="${x + i * 16.5}" y="${y}" width="8.25" height="62" fill="#4b9a5a"/>`).join('')}
  <path d="M${x} ${y + 40} H${x + 66} M${x + 33} ${y + 40} m-12 0 a12 6 0 0 0 24 0" ${S(0.9, '#f3eee2')}/>
  <rect x="${x}" y="${y}" width="66" height="18" fill="#2c3c66"/>
  ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<circle cx="${x + 4 + i * 7.4}" cy="${y + 8 + (i % 2) * 4}" r="1.3" fill="#f3d6b0" opacity=".7"/>`).join('')}
  <circle cx="${x + 38}" cy="${y + 50}" r="3.4" fill="#fff" ${K2}/>
  <path d="M${x + 22} ${y + 36} v-10 M${x + 46} ${y + 32} v-10" ${S(3.4, C.red)}/><circle cx="${x + 22}" cy="${y + 23}" r="2" fill="#d6a07a"/><circle cx="${x + 46}" cy="${y + 19}" r="2" fill="#d6a07a"/>`;

function ticket(x, y) {
  let holes = '';
  for (let i = 0; i < 9; i++) holes += `<circle cx="${x + 92}" cy="${f(y + 3 + i * 4)}" r=".7" fill="${INK}" opacity=".6"/>`;
  return `<g transform="rotate(-4 ${x + 60} ${y + 18})">
    ${paperShadow(x, y, 122, 38)}
    <rect x="${x}" y="${y}" width="122" height="38" fill="#ead9b0" ${K2}/>
    <rect x="${x + 3}" y="${y + 3}" width="86" height="32" fill="none" ${S(0.5, C.red, 0.6)}/>
    ${holes}
    <text x="${x + 8}" y="${y + 17}" font-family="Anton, Impact, sans-serif" font-size="13" letter-spacing="1" fill="${C.red}">THE STROKES</text>
    <text x="${x + 8}" y="${y + 29}" font-family="IBM Plex Mono, monospace" font-size="6.6" fill="${INK}">LIVE · ADMIT ONE</text>
    <text x="${x + 98}" y="${y + 23}" font-family="IBM Plex Mono, monospace" font-size="7" fill="${INK}">№ 07</text>
  </g>`;
}

function football(g, cx, cy, r) {
  const pent = (x, y, s, a) => {
    let d = '';
    for (let i = 0; i < 5; i++) { const t = a + (i * Math.PI * 2) / 5; d += `${i ? 'L' : 'M'}${f(x + Math.cos(t) * s)} ${f(y + Math.sin(t) * s)}`; }
    return `<path d="${d}z" fill="#2a2630"/>`;
  };
  const P = [[-2, -1, 0.3, -1.57], [-0.85, -0.5, 0.26, 0.3], [0.75, -0.62, 0.26, 1.2], [0.7, 0.7, 0.26, 0.6], [-0.7, 0.75, 0.26, 2], [0.05, 1.05, 0.2, 1]];
  return `<g>${soft(g.p, cx + 4, cy + r - 1, r * 1.1, 4, 0.55)}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${g.rad('ball', '#f1ece0')}"/>
    <clipPath id="rb-ball"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    <g clip-path="url(#rb-ball)">
      ${P.map(([dx, dy, s, a]) => pent(cx + (dx === -2 ? -2 : dx * r), cy + (dx === -2 ? -1 : dy * r), r * s, a)).join('')}
      <path d="M${cx - r} ${cy + 4} q${r} -6 ${2 * r} 2 M${cx - 4} ${cy - r} q-6 ${r} 2 ${2 * r}" ${S(0.4, '#6d665e', 0.6)}/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${g.raw('ballShade', `<radialGradient id="ID" cx=".3" cy=".28" r=".85"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>`)}"/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" ${K}/></g>`;
}

// ---------------------------------------------------------------- window
function windowSea(g) {
  const x = 1164, y = 84, w = 262, h = 372, hz = 330;
  const R = rng(7);
  let stars = '';
  for (let i = 0; i < 40; i++) {
    const sx = x + 6 + R() * (w - 12), sy = y + 6 + R() * (hz - y - 46), big = R() > 0.86;
    stars += big
      ? `<path class="room-star" style="--d:${(R() * 4).toFixed(2)}s" d="M${f(sx)} ${f(sy - 3.5)}v7M${f(sx - 3.5)} ${f(sy)}h7" ${S(0.7, '#f5e9c8')}/>`
      : `<circle class="room-star" style="--d:${(R() * 4).toFixed(2)}s" cx="${f(sx)}" cy="${f(sy)}" r="${f(0.5 + R() * 0.8)}" fill="#f5e9c8"/>`;
  }
  let glitter = '';
  for (let i = 0; i < 26; i++) {
    const t = i / 26, yy = hz + 5 + Math.pow(t, 1.25) * 122, ww = 3 + t * 26 + R() * 8, xx = 1360 + (R() - 0.5) * (6 + t * 30);
    glitter += `<path class="room-shim" style="--d:${(R() * 2.4).toFixed(2)}s" d="M${f(xx - ww / 2)} ${f(yy)}h${f(ww)}" ${S(0.8 + t * 1.2, '#f5e9c8', 0.9)}/>`;
  }
  let crests = '';
  for (let i = 0; i < 7; i++) {
    const t = i / 6, yy = hz + 10 + Math.pow(t, 1.4) * 112, amp = 1.5 + t * 6, len = 18 + t * 22;
    let p = `M${x - 80} ${f(yy)}`;
    for (let k = 0; k < 14; k++) p += ` q${f(len / 2)} ${f(-amp)} ${f(len)} 0`;
    crests += `<path class="room-wave" style="--d:${(-i * 1.3).toFixed(1)}s;--w:${f(len)}px" d="${p}" ${S(0.5 + t * 1.1, '#d9efe9', 0.25 + t * 0.55)}/>`;
  }
  const moonG = g.raw('moon', `<radialGradient id="ID" cx=".4" cy=".38" r=".7"><stop offset="0" stop-color="#fffaf0"/><stop offset=".7" stop-color="#f2e4bf"/><stop offset="1" stop-color="#d9c79c"/></radialGradient>`);
  const sky = g.raw('nightSky', `<linearGradient id="ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080e2a"/><stop offset=".7" stop-color="#232c66"/><stop offset="1" stop-color="#4c4a88"/></linearGradient>`);
  const sea = g.raw('sea', `<linearGradient id="ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22465f"/><stop offset=".4" stop-color="#16324a"/><stop offset="1" stop-color="#0a1824"/></linearGradient>`);
  const beam = g.raw('beam', `<linearGradient id="ID" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff2c4" stop-opacity=".55"/><stop offset="1" stop-color="#fff2c4" stop-opacity="0"/></linearGradient>`);
  const frame = g.v('frame', '#d3c6a6', 0.1, -0.14);
  return `<g>
    <clipPath id="rb-glass"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>
    <g clip-path="url(#rb-glass)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${sky}"/>
      <path d="M${x - 10} 200 q60 -10 120 -2 q40 4 90 -6 q30 -4 70 4" ${S(5, '#8d96c9', 0.12)}/>
      <path d="M${x + 40} 228 q50 -6 100 0 q40 4 80 -2" ${S(3, '#8d96c9', 0.1)}/>
      ${stars}
      <circle cx="1360" cy="150" r="74" fill="#f5e9c8" opacity=".06"/><circle cx="1360" cy="150" r="48" fill="#f5e9c8" opacity=".08"/>
      <circle cx="1360" cy="150" r="29" fill="${moonG}"/>
      <circle cx="1351" cy="143" r="5" fill="#d9c9a2" opacity=".7"/><circle cx="1369" cy="160" r="3.4" fill="#d9c9a2" opacity=".7"/><circle cx="1366" cy="139" r="2" fill="#d9c9a2" opacity=".6"/>
      <path d="M${x} ${hz - 4} l0 -18 q14 -8 30 -6 q20 2 30 12 q16 4 30 6 V${hz} H${x}z" fill="#0f1531"/>
      <g transform="translate(${x + 34} ${hz - 30})">
        <path class="room-beam" d="M0 0 L120 -16 L120 16z" fill="${beam}"/>
        <path d="M-3 10 l1.4 -14 h3.2 l1.4 14z" fill="#e9e1cf" ${K2}/><path d="M-2.6 2 h5.2 v3 h-5.2z" fill="${C.red}"/>
        <rect x="-2.4" y="-7" width="4.8" height="3.4" fill="#ffe49a"/><path d="M-3 -7 l3 -3 l3 3z" fill="#2a2630"/>
      </g>
      <rect x="${x}" y="${hz}" width="${w}" height="${h}" fill="${sea}"/>
      <path d="M${x} ${hz} h${w}" ${S(0.6, '#9fb1d6', 0.5)}/>
      ${glitter}${crests}
      <g transform="translate(1236 ${hz + 56})">
        <path d="M-12 6 q12 5 26 0" ${S(1.6)}/>
        <path d="M0 5 l2 -9 l5 -4 M2 -4 l-6 1 M2 -4 l6 4" ${S(1.3)}/><circle cx="7" cy="-11" r="2.2" fill="${INK}"/>
        <path d="M-16 8 q10 -4 18 0 q10 4 22 0" ${S(0.8, '#e9f6f1', 0.8)}/>
      </g>
      <path d="M${x + 20} ${y} l60 0 l-120 ${h} l-60 0z" fill="#fff" opacity=".035"/>
      <path d="M${x + 110} ${y} l14 0 l-120 ${h} l-14 0z" fill="#fff" opacity=".035"/>
    </g>
    <path fill-rule="evenodd" d="M${x - 14} ${y - 14}h${w + 28}v${h + 28}h${-(w + 28)}z M${x} ${y}v${h}h${w}v${-h}z" fill="${frame}" ${K2}/>
    <path d="M${x - 4} ${y - 4}h${w + 8}v${h + 8}h${-(w + 8)}z" ${S(0.6, '#8f8164', 0.8)}/>
    <path d="M${x - 13} ${y - 13}h${w + 26}" ${S(1, '#fff', 0.35)}/>
    <path d="M${x + w / 2 - 4} ${y}h8v${h}h-8z M${x} ${y + 184}h${w}v8h${-w}z" fill="${frame}" ${K2}/>
    <path d="M${x + w / 2 - 3} ${y}v${h} M${x} ${y + 185}h${w}" ${S(0.7, '#fff', 0.35)}/>
    <path d="M${x - 30} ${y + h + 12}h${w + 60}v16h${-(w + 60)}z" fill="${g.v('sill', '#d9cbac', 0.12, -0.08)}" ${K2}/>
    <path d="M${x - 30} ${y + h + 13}h${w + 60}" ${S(0.8, '#fff', 0.4)}/>
    <path d="M${x - 30} ${y + h + 28}h${w + 60}v9h${-(w + 60)}z" fill="#a4957a" ${K2}/>
    ${soft(g.p, 1404, y + h + 12, 18, 3, 0.6)}
    <g transform="translate(1404 ${y + h + 12})">
      <rect x="-8" y="-24" width="16" height="24" rx="1.5" fill="${g.cyl('candle', '#efe5cf')}" ${K2}/>
      <path d="M-8 -22 q3 6 0 10 M5 -24 q2 4 0 7" ${S(0.8, '#fffaf0', 0.8)}/>
      <ellipse cx="0" cy="-24" rx="8" ry="1.8" fill="#f7efdc" ${K2}/>
      <path d="M0 -25 v-4" ${S(0.8)}/>
      <path class="room-flame" d="M0 -42 q6 8 0 13 q-6 -5 0 -13z" fill="${g.raw('flame', `<linearGradient id="ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c8"/><stop offset=".6" stop-color="#ffc84a"/><stop offset="1" stop-color="#e2701e"/></linearGradient>`)}" ${S(0.4, '#a3501a')}/>
    </g>
    <!-- a shell from the beach on the sill -->
    <g transform="translate(1330 ${y + h + 12})">
      ${soft(g.p, 2, 0, 14, 2.4, 0.55)}
      <path d="M-11 0 q-2 -12 11 -14 q13 2 11 14z" fill="${g.v('shell', '#eecfb5', 0.14, -0.14)}" ${K2}/>
      ${[-8, -4, 0, 4, 8].map((d) => `<path d="M0 -1 L${d * 1.1} -12" ${S(0.5, '#a9806a', 0.9)}/>`).join('')}
      <path d="M-4 0 q4 2 8 0" ${S(0.6, '#a9806a')}/>
    </g>
  </g>`;
}

function curtainAndScarf(g) {
  // linen curtain: a horizontal gradient with many stops = the folds catching the light
  let stops = '';
  for (let i = 0; i <= 12; i++) stops += `<stop offset="${f(i / 12)}" stop-color="${i % 2 ? '#b8a684' : '#ddcdaa'}"/>`;
  const linen = g.raw('linen', `<linearGradient id="ID" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient>`);
  let folds = '';
  for (let i = 0; i < 11; i++) folds += `<path d="M${f(1120 + i * 5.4)} 72 q${i % 2 ? 2.5 : -2.5} 110 ${f(-1 + i * 0.4)} 226 q${i % 2 ? -4 : 4} 110 ${f(-i * 0.6)} 228" ${S(0.5, '#7f6f53', 0.55)}/>`;
  let rings = '';
  for (let i = 0; i < 6; i++) rings += `<circle cx="${1122 + i * 11}" cy="62" r="3.4" ${S(0.8, '#a88a48')}/>`;
  let stripes = '';
  for (let i = 0; i < 7; i++) stripes += `<rect x="1420" y="${96 + i * 34}" width="34" height="17" fill="${C.cream}"/>`;
  let knit = '';
  for (let yy = 66; yy < 334; yy += 3.2) knit += `<path d="M1421 ${f(yy)} h32" ${S(0.35, '#000', 0.12)}/>`;
  let fringe = '';
  for (let i = 0; i < 9; i++) fringe += `<path d="M${f(1422 + i * 3.8)} 334 q${i % 2 ? 1 : -1} 6 0 12" ${S(0.9, C.red)}/>`;
  return `<g>
    <path d="M1116 68 h66 q-8 118 -4 236 q-14 8 -8 26 q6 100 -2 194 h-56 q-6 -100 2 -196 q-4 -16 6 -24 q-6 -120 -4 -236z" fill="${linen}" ${K2}/>
    ${folds}
    <path d="M1116 68 h66 q-8 118 -4 236 q-14 8 -8 26 q6 100 -2 194 h-56" fill="url(#rb-htf)" opacity=".06"/>
    <path d="M1112 300 q36 20 68 2" ${S(4, C.red)}/><path d="M1112 300 q36 20 68 2" ${S(0.6)}/>
    <circle cx="1150" cy="310" r="4" fill="${C.red}" ${K2}/>
    <path d="M1100 60 H1478" ${S(4.4, '#2f2a30')}/><path d="M1100 59 H1478" ${S(1, '#8c8078', 0.8)}/>
    ${rings}
    <circle cx="1097" cy="60" r="6.5" fill="${g.rad('finial', C.mustard)}" ${K2}/><circle cx="1481" cy="60" r="6.5" fill="${g.rad('finial', C.mustard)}" ${K2}/>
    <path d="M1414 56 q22 -8 46 0 l-6 22 h-34z" fill="${g.v('scarfTop', C.red, 0.1, -0.2)}" ${K2}/>
    <rect x="1420" y="62" width="34" height="272" fill="${C.red}"/>
    ${stripes}${knit}
    <text font-family="Anton, Impact, sans-serif" font-size="11" fill="${INK}" text-anchor="middle">
      ${'ALLEZ'.split('').map((ch, i) => `<tspan x="1437" y="${110 + i * 34}">${ch}</tspan>`).join('')}
    </text>
    <path d="M1420 62 h8 v272 h-8z" fill="#000" opacity=".12"/><path d="M1448 62 h6 v272 h-6z" fill="#000" opacity=".18"/>
    <rect x="1420" y="62" width="34" height="272" fill="none" ${K2}/>
    ${fringe}
  </g>`;
}

function surfboard(g) {
  const board = 'M1500 120 q40 -44 80 0 q30 120 14 600 h-108 q-16 -480 14 -600z';
  return `<g transform="rotate(4 1540 420)">
    <path d="${board}" fill="#06080a" opacity=".22" transform="translate(-20 10)"/>
    <path d="${board}" fill="#06080a" opacity=".18" transform="translate(-10 5)"/>
    <path d="${board}" fill="${g.cyl('board', '#efe3c6')}" ${K}/>
    <clipPath id="rb-board"><path d="${board}"/></clipPath>
    <g clip-path="url(#rb-board)">
      <path d="M1480 188 q60 -12 120 0 v24 q-60 -12 -120 0z" fill="${g.cyl('boardRed', C.red)}"/>
      <path d="M1480 222 q60 -10 120 0 v7 q-60 -10 -120 0z" fill="${C.teal}"/>
      <path d="M1580 100 q26 160 14 640 h-20 q10 -400 -6 -640z" fill="#000" opacity=".14"/>
    </g>
    <path d="M1540 84 V720" ${S(0.8, '#8a6a48')}/>
    <g transform="translate(1540 330)"><circle r="11" ${S(0.8, INK, 0.7)}/><path d="M-7 3 q4 -8 8 -3 q-3 1 -2 5 q3 -4 7 -1" ${S(0.8, INK, 0.8)}/></g>
    <path d="M1512 128 q-10 80 -12 200" ${S(2.4, '#fff', 0.45)}/>
    <path d="${board}" fill="none" ${K}/>
  </g>`;
}

export function backSVG() {
  const g = Grads('rb');
  const body = `
  ${wallTexture(g)}
  ${stringLights(g)}
  ${apocalypse(g)}
  ${parisTexas(g)}
  <!-- the computer's shadow on the wall (the lamp is on the left): a soft penumbra -->
  <path d="${rr(640, 252, 420, 356, 30)}" fill="#05090a" opacity=".16"/>
  <path d="${rr(630, 250, 410, 350, 28)}" fill="#05090a" opacity=".14"/>
  <path d="${rr(620, 248, 396, 344, 26)}" fill="#05090a" opacity=".12"/>
  <!-- records on a ledge, right above the computer -->
  <g transform="rotate(-2 680 112)">${vinyl(680, 112, 50, C.red)}</g>
  ${sleeve(g, 612, 104, 'grace')}
  <g transform="rotate(1.5 800 163)">${sleeve(g, 741, 104, 'rainbows')}</g>
  ${sleeve(g, 870, 104, 'strokes')}
  <path d="M592 222 h420 v6 h-420z" fill="${g.v('ledgeTop', '#b07c55', 0.18, 0)}" ${K2}/>
  <path d="M592 228 h420 v8 h-420z" fill="${g.v('ledgeFront', C.woodL, 0, -0.2)}" ${K2}/>
  <path d="M598 236 h408 l-6 9 h-396z" fill="#05090a" opacity=".22"/>
  <path d="M618 236 v16 h10 M986 236 v16 h-10" ${S(1.6, '#3a3530')}/><circle cx="621" cy="248" r=".9" fill="#999"/><circle cx="983" cy="248" r=".9" fill="#999"/>
  <!-- souvenirs: polaroids of a wave and a match, a concert ticket -->
  ${polaroid(1018, 96, -7, photoWave, 'la vague')}
  ${polaroid(1042, 206, 6, photoPitch, 'le match')}
  ${ticket(156, 478)}
  <!-- little shelf: a ball and a trophy -->
  <path d="M1026 432 h102 v5 h-102z" fill="${g.v('ledgeTop', '#b07c55', 0.18, 0)}" ${K2}/>
  <path d="M1026 437 h102 v7 h-102z" fill="${g.v('ledgeFront', C.woodL, 0, -0.2)}" ${K2}/>
  <path d="M1030 444 h94 l-5 8 h-84z" fill="#05090a" opacity=".22"/>
  ${football(g, 1060, 406, 25)}
  <g transform="translate(1108 432)">
    ${soft(g.p, 0, 0, 16, 2.5, 0.6)}
    <path d="M-11 0 h22 v-6 h-22z" fill="${g.v('tBase', C.woodD, 0.15, -0.1)}" ${K2}/>
    <path d="M-5 -6 h10 v-8 h-10z" fill="${g.cyl('tStem', C.mustard)}" ${K2}/>
    <path d="M-14 -40 h28 q0 22 -14 26 q-14 -4 -14 -26z" fill="${g.cyl('tCup', C.mustard)}" ${K2}/>
    <ellipse cx="0" cy="-40" rx="14" ry="2.2" fill="#f7d98a" ${K2}/>
    <path d="M-14 -36 q-9 0 -8 7 q2 6 10 6 M14 -36 q9 0 8 7 q-2 6 -10 6" ${S(1.2, '#a87a1f')}/>
    <rect x="-6" y="-4.6" width="12" height="3" fill="#e9d7a8" opacity=".8"/>
  </g>
  ${windowSea(g)}
  ${curtainAndScarf(g)}
  ${surfboard(g)}`;
  return dedupe(`<svg class="room__svg" viewBox="0 0 ${ART.w} ${ART.h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>${patterns('rb')}${g.defs()}
    <radialGradient id="rb-pin" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ff9b84"/><stop offset=".6" stop-color="${C.red}"/><stop offset="1" stop-color="${C.redD}"/></radialGradient>
    <!-- the wall has a hole behind the glass too (wider: the wall drifts with the mouse; the bezel hides the margin) -->
    <clipPath id="rb-hole"><path clip-rule="evenodd" d="M-50 -50h${ART.w + 100}v${ART.h + 100}h${-(ART.w + 100)}z ${rr(SCREEN.x - 30, SCREEN.y - 30, SCREEN.w + 60, SCREEN.h + 60, 30)}"/></clipPath>
  </defs>
  <g clip-path="url(#rb-hole)">${body}</g>
</svg>`);
}

// ================================================================== the desk
const KEYROWS = [
  ['ESC', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '⌫'],
  ['TAB', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'],
  ['CAPS', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", '⏎'],
  ['⇧', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', '⇧', '↑'],
];
function keyboard(g) {
  // slightly foreshortened: the top edge is narrower than the front edge
  const top = 716, bot = 786, xl0 = 616, xr0 = 984, xl1 = 598, xr1 = 1002;
  const lerp = (a, b, t) => a + (b - a) * t;
  const keyTop = g.v('keyTop', '#f6efdc', 0.2, -0.04), keySide = g.v('keySide', C.beigeD, 0, -0.18);
  const modTop = g.v('modTop', '#d6c39e', 0.15, -0.05);
  const key = (x, y, w, h, top, label, light) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="1.6" fill="${keySide}" ${K2}/>
    <rect x="${f(x + 1)}" y="${f(y + 0.6)}" width="${f(w - 2)}" height="${f(h - 3.2)}" rx="1.2" fill="${top}"/>
    ${label ? `<text x="${f(x + 2.2)}" y="${f(y + 4.8)}" font-family="IBM Plex Mono, monospace" font-size="${label.length > 1 ? 2.8 : 3.6}" fill="${light ? '#fff6e6' : '#5d5242'}">${label}</text>` : ''}`;
  let keys = '';
  const rows = 5;
  for (let r = 0; r < rows; r++) {
    const t0 = (r + 0.16) / rows, t1 = (r + 0.9) / rows;
    const y0 = lerp(top + 6, bot - 10, t0), y1 = lerp(top + 6, bot - 10, t1);
    const tm = (t0 + t1) / 2, l = lerp(xl0 + 12, xl1 + 12, tm), rgt = lerp(xr0 - 12, xr1 - 12, tm);
    const W = rgt - l, H = y1 - y0;
    if (r === rows - 1) {
      keys += key(l, y0, W * 0.12, H, modTop, 'CTRL');
      keys += key(l + W * 0.13, y0, W * 0.1, H, modTop, 'ALT');
      keys += key(l + W * 0.24, y0, W * 0.46, H, keyTop, '');
      keys += key(l + W * 0.71, y0, W * 0.1, H, modTop, 'ALT');
      keys += key(l + W * 0.82, y0, W * 0.18, H, modTop, '← →');
      continue;
    }
    const labels = KEYROWS[r], n = labels.length;
    const wide = 1.5, unit = W / (n - 2 + 2 * wide);
    let xx = l;
    labels.forEach((lab, k) => {
      const kw = (k === 0 || k === n - 1 ? wide : 1) * unit;
      let top = keyTop, light = false;
      if (k === 0 || k === n - 1) top = modTop;
      if (r === 0 && k === 0) { top = g.v('esc', C.red, 0.2, -0.08); light = true; }
      if (r === 2 && k === n - 1) top = g.v('enter', C.mustard, 0.2, -0.06);
      keys += key(xx + 0.6, y0, kw - 1.4, H, top, lab, light);
      xx += kw;
    });
  }
  return `<g>
    ${soft(g.p, 800, bot + 9, 230, 9, 0.7)}
    <path d="M${xl0} ${top} L${xr0} ${top} L${xr1} ${bot} L${xl1} ${bot}z" fill="${g.v('kbCase', C.beige, 0.12, -0.08)}" ${K}/>
    <path d="M${xl1} ${bot} L${xr1} ${bot} L${xr1 - 1} ${bot + 8} L${xl1 + 1} ${bot + 8}z" fill="${g.v('kbFront', C.beigeD, -0.02, -0.25)}" ${K}/>
    <path d="M${xl0 + 3} ${top + 2} L${xr0 - 3} ${top + 2}" ${S(0.9, '#fff', 0.55)}/>
    ${keys}
    ${[0, 1, 2].map((i) => `<circle cx="${960 + i * 6}" cy="${top + 3.2}" r="1" fill="${i === 1 ? '#79e08a' : '#8a7e66'}"/>`).join('')}
    <!-- coiled cable to the computer -->
    <path d="${coil(800, top, 812, 694, 16, 2.6)}" ${S(1.1, '#d8c9a8')}/><path d="${coil(800, top, 812, 694, 16, 2.6)}" ${S(0.4, INK, 0.6)}/>
  </g>`;
}

function computer(g) {
  const Sc = SCREEN;
  const hole = rr(Sc.x, Sc.y, Sc.w, Sc.h, Sc.r);
  const shell = g.raw('shell', `<linearGradient id="ID" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${shade(C.beige, 0.22)}"/><stop offset=".5" stop-color="${C.beige}"/><stop offset="1" stop-color="${shade(C.beige, -0.16)}"/></linearGradient>`);
  const bezel = g.raw('bezel', `<linearGradient id="ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(C.beige, -0.12)}"/><stop offset="1" stop-color="${shade(C.beige, 0.05)}"/></linearGradient>`);
  const recess = g.raw('recess', `<linearGradient id="ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14110f"/><stop offset="1" stop-color="#3b342c"/></linearGradient>`);
  const knob = g.rad('knob', '#3b3631');
  let sideVents = '';
  for (let i = 0; i < 12; i++) sideVents += `<path d="M1008 ${300 + i * 8} l16 7" ${S(0.8, '#6d5e45')}/><path d="M1008 ${301 + i * 8} l16 7" ${S(0.5, '#fff', 0.3)}/>`;
  let topVents = '';
  for (let i = 0; i < 26; i++) topVents += `<path d="M${640 + i * 12} 253 h7" ${S(0.8, '#8f7c5c')}/>`;
  let frontVents = '';
  for (let i = 0; i < 9; i++) frontVents += `<rect x="${586 + i * 6.2}" y="662" width="2.6" height="18" rx="1.3" fill="#6d5e45"/>`;
  const drive = (y) => `<rect x="820" y="${y}" width="196" height="30" rx="3" fill="${g.v('bay', C.beigeL, 0.1, -0.1)}" ${K2}/>
    <rect x="832" y="${y + 10}" width="124" height="8" rx="2" fill="${g.v('slot', '#1c1916', 0, 0.3)}" ${K2}/>
    <path d="M834 ${y + 11.5} h120" ${S(0.6, '#000', 0.6)}/>
    <rect x="968" y="${y + 8}" width="20" height="12" rx="2" fill="${g.v('eject', C.beigeD, 0.15, -0.1)}" ${K2}/>
    <circle cx="1002" cy="${y + 15}" r="2.4" fill="#4a3d30" ${K2}/>`;
  return `<g>
    <!-- cables behind the computer -->
    <path d="M1048 640 q34 6 30 40 q-2 12 14 14" ${S(3, '#1b181c')}/><path d="M1044 620 q60 2 52 60" ${S(2.4, '#d8c9a8')}/><path d="M1044 620 q60 2 52 60" ${S(0.4)}/>
    <!-- base unit -->
    ${soft(g.p, 806, 694, 290, 12, 0.85)}
    <path d="M1040 596 l20 9 v82 l-20 8z" fill="${g.v('baseSide', C.beigeD, 0, -0.3)}" ${K}/>
    <path d="${rr(560, 590, 480, 105, 7)}" fill="${shell}" ${K}/>
    <path d="M566 594 h468" ${S(1, '#fff', 0.6)}/>
    <path d="M562 684 h476" ${S(0.6, '#8f7c5c', 0.8)}/>
    <path d="M560 684 h480 v4 a7 7 0 0 1 -7 7 h-466 a7 7 0 0 1 -7 -7z" fill="${C.beigeD}"/>
    <rect x="580" y="612" width="200" height="38" rx="3" fill="${g.v('badge', '#3e3832', 0.1, -0.15)}" ${K2}/>
    <rect x="582" y="614" width="196" height="34" rx="2" fill="none" ${S(0.5, '#fff', 0.15)}/>
    <text x="593" y="639" font-family="Anton, Impact, sans-serif" font-size="20" letter-spacing="1.5" fill="${C.beigeL}">MALO</text>
    <text x="651" y="638" font-family="Space Grotesk, sans-serif" font-weight="600" font-size="11" letter-spacing="2" fill="${C.beigeL}">SYSTEMS</text>
    <path d="M736 622 l12 0 l-6 10z" fill="${C.red}"/><path d="M742 627 l12 0 l-6 10z" fill="${C.mustard}" opacity=".9"/>
    <text x="768" y="676" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="7.6" fill="${C.beigeDD}">ME-1994 · 640K</text>
    ${frontVents}
    <circle cx="797" cy="631" r="6.5" fill="${g.v('pwr', C.beigeD, 0.1, -0.2)}" ${K2}/>
    <circle class="room-led" cx="797" cy="648" r="2" fill="#79e08a"/>
    ${drive(606)}${drive(644)}
    <rect x="574" y="694" width="20" height="3" rx="1" fill="#2a2420"/><rect x="1006" y="694" width="20" height="3" rx="1" fill="#2a2420"/>
    <!-- the monitor's feet -->
    <rect x="660" y="585" width="40" height="7" rx="2" fill="#3a332c"/><rect x="900" y="585" width="40" height="7" rx="2" fill="#3a332c"/>
    <!-- monitor -->
    <path d="M1004 262 l24 12 v300 l-24 12z" fill="${g.v('monSide', C.beigeD, -0.02, -0.28)}" ${K}/>
    ${sideVents}
    <path fill-rule="evenodd" d="${rr(596, 248, 408, 340, 24)} ${hole}" fill="${shell}" ${K}/>
    <path d="M612 250 h376" ${S(1, '#fff', 0.7)}/>
    ${topVents}
    <path d="M599 268 v300" ${S(1.2, '#fff', 0.35)}/>
    <!-- a stepped bezel, the recess, then the glass -->
    <path fill-rule="evenodd" d="${rr(620, 270, 360, 280, 38)} ${hole}" fill="${bezel}" ${K2}/>
    <path d="M626 548 q174 6 348 0" ${S(0.8, '#fff', 0.45)}/>
    <path fill-rule="evenodd" d="${rr(630, 280, 340, 260, 28)} ${hole}" fill="${recess}" ${K2}/>
    <path d="${rr(639, 289, 322, 242, 19)}" ${S(0.8, '#5e5448', 0.9)}/>
    <!-- chin -->
    <text x="852" y="574" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="16" fill="#fff" opacity=".5">malo</text>
    <text x="851" y="573" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="16" fill="#8a7a60">malo</text>
    <circle cx="904" cy="567" r="5" fill="#79e08a" opacity=".25"/><circle class="room-led" cx="904" cy="567" r="2.2" fill="#79e08a"/>
    <circle cx="936" cy="568" r="9.5" fill="#000" opacity=".2"/>
    <circle cx="935" cy="566" r="9" fill="${knob}" ${K2}/><path d="M935 559 v5" ${S(1.4, C.beigeL)}/>
    <circle cx="964" cy="568" r="9.5" fill="#000" opacity=".2"/>
    <circle cx="963" cy="566" r="9" fill="${knob}" ${K2}/><path d="M958.5 561.5 l3 3" ${S(1.4, C.beigeL)}/>
    <!-- post-its: the big one is translated (Projects / coming soon) -->
    <g transform="rotate(8 1000 266)">
      <path d="M970 238 h70 v66 h-70z" fill="#000" opacity=".25" transform="translate(3 4)"/>
      <path d="M968 234 h70 v62 q-30 2 -70 4z" fill="${g.v('note', '#f2d16a', 0.1, -0.08)}" ${K2}/>
      <path d="M968 234 h70 v7 h-70z" fill="#000" opacity=".06"/>
      <text id="room-note-a" x="1003" y="261" text-anchor="middle" font-family="Caveat, cursive" font-weight="600" font-size="19" fill="#3d3220">Projects</text>
      <text id="room-note-b" x="1003" y="283" text-anchor="middle" font-family="Caveat, cursive" font-size="16" fill="#3d3220">coming ✿</text>
    </g>
    <g transform="rotate(-5 676 566)">
      <path d="M648 548 h58 v33 q-30 3 -58 2z" fill="${g.v('note2', '#f6b8a4', 0.1, -0.08)}" ${K2}/>
      <text x="677" y="570" text-anchor="middle" font-family="Caveat, cursive" font-weight="600" font-size="15" fill="#3d3220">surf 7h</text>
    </g>
    <g transform="rotate(4 744 566)">
      <path d="M714 549 h62 v33 q-30 2 -62 1z" fill="${g.v('note3', '#cfe3b8', 0.1, -0.08)}" ${K2}/>
      <text x="745" y="571" text-anchor="middle" font-family="Caveat, cursive" font-weight="600" font-size="15" fill="#3d3220">foot 21h</text>
    </g>
  </g>`;
}

function turntable(g) {
  let grooves = '';
  for (let r = 84; r > 30; r -= 2.6) grooves += `<circle r="${f(r)}" fill="none" stroke="#2f2a36" stroke-width="${r % 13 < 2.6 ? 1.6 : 0.7}"/>`;
  let strobe = '';
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    if (Math.sin(a) < -0.1) continue; // only the visible front rim
    strobe += `<rect x="${f(200 + Math.cos(a) * 92 - 0.8)}" y="${f(661 + Math.sin(a) * 24.5)}" width="1.6" height="2.4" fill="#5a5c5e"/>`;
  }
  const wood = g.v('plinth', C.wood, 0.14, -0.12);
  const alu = g.raw('alu', `<linearGradient id="ID" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8f9294"/><stop offset=".3" stop-color="#e3e5e3"/><stop offset=".55" stop-color="#a7aaab"/><stop offset="1" stop-color="#6f7274"/></linearGradient>`);
  let grain = '';
  for (let i = 0; i < 7; i++) grain += `<path d="M90 ${634 + i * 8} q90 ${i % 2 ? 3 : -3} 280 0" ${S(0.5, C.woodD, 0.5)}/>`;
  return `<g class="room-tt" role="button" aria-label="lofi.fm">
    <title>lofi.fm ♪</title>
    ${soft(g.p, 230, 727, 170, 10, 0.85)}
    <path d="${rr(84, 626, 290, 66, 9)}" fill="${wood}" ${K}/>
    ${grain}
    <path d="M92 629 h274" ${S(0.8, '#fff', 0.3)}/>
    <path d="M84 688 h290 v28 a8 8 0 0 1 -8 8 h-274 a8 8 0 0 1 -8 -8z" fill="${g.v('plinthFront', C.woodD, 0.05, -0.2)}" ${K}/>
    <path d="M86 690 h286" ${S(0.6, '#fff', 0.2)}/>
    <circle cx="110" cy="706" r="5" fill="${g.rad('ttKnob', '#cfcbc0')}" ${K2}/><circle cx="128" cy="706" r="5" fill="${g.rad('ttKnob', '#cfcbc0')}" ${K2}/>
    <rect x="142" y="700" width="14" height="9" rx="1.5" fill="#d9d4c6" ${K2}/><rect x="160" y="700" width="14" height="9" rx="1.5" fill="#bdb7a8" ${K2}/>
    <text x="149" y="707" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="5" fill="${INK}">33</text>
    <text x="167" y="707" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="5" fill="${INK}">45</text>
    <rect x="290" y="703" width="44" height="3" rx="1.5" fill="#2a1d16"/><rect x="306" y="700" width="6" height="9" rx="1" fill="#d9d4c6" ${K2}/>
    <circle class="room-tt__led" cx="352" cy="705" r="2.6" fill="#5a2a20" ${K2}/>
    <!-- platter + record -->
    <ellipse cx="200" cy="663" rx="94" ry="26" fill="#3a3530"/>
    <ellipse cx="200" cy="659" rx="94" ry="25" fill="${alu}" ${K2}/>
    ${strobe}
    <g transform="translate(200 656.5) scale(1 0.26)">
      <g class="room-rec">
        <circle r="86" fill="#121014"/>
        ${grooves}
        <path d="M0 0 L70 -48 A85 85 0 0 1 83 -14z" fill="#fff" opacity=".12"/>
        <path d="M0 0 L-70 48 A85 85 0 0 1 -83 14z" fill="#fff" opacity=".07"/>
        <circle r="27" fill="${C.red}"/><circle r="27" fill="none" stroke="#7a2416" stroke-width="1.2"/>
        <rect x="-14" y="7" width="28" height="5" fill="${C.cream}" opacity=".9"/><rect x="-10" y="-14" width="20" height="3" fill="${C.cream}" opacity=".7"/>
        <circle r="3.2" fill="#d9d9d9"/>
      </g>
    </g>
    <!-- tonearm: base, counterweight, tube, headshell -->
    <circle cx="330" cy="642" r="12" fill="${g.rad('ttBase', '#c9c5bb')}" ${K2}/><circle cx="330" cy="642" r="5" fill="#57534e" ${K2}/>
    <rect x="340" y="668" width="6" height="12" rx="2" fill="#b9b4a8" ${K2}/>
    <g class="room-arm">
      <rect x="324" y="624" width="12" height="12" rx="2.5" fill="${g.cyl('cw', '#8a8780')}" ${K2}/>
      <path d="M330 636 L334 690 L322 702" ${S(3.2, '#dedad0')}/>
      <path d="M330 636 L334 690 L322 702" ${S(0.5, INK)}/>
      <path d="M331 640 L335 688" ${S(0.8, '#fff', 0.6)}/>
      <rect x="312" y="698" width="14" height="7" rx="1.6" fill="#2a2630" transform="rotate(-30 319 702)"/>
    </g>
  </g>`;
}

function lamp(g) {
  const enamel = g.raw('enamel', `<linearGradient id="ID" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(C.red, 0.3)}"/><stop offset=".5" stop-color="${C.red}"/><stop offset="1" stop-color="${shade(C.red, -0.38)}"/></linearGradient>`);
  const rod = (x0, y0, x1, y1) => `<path d="M${x0} ${y0} L${x1} ${y1}" ${S(2.4, '#2a2630')}/><path d="M${x0} ${y0} L${x1} ${y1}" ${S(1, '#d9d2c2')}/>`;
  // a spring beside an arm, hooked onto it at both ends
  const spring = (x0, y0, x1, y1, t0, t1, side) => {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = (-dy / L) * side * 7, ny = (dx / L) * side * 7;
    const a = [x0 + dx * t0, y0 + dy * t0], b = [x0 + dx * t1, y0 + dy * t1];
    const d = coil(a[0] + nx, a[1] + ny, b[0] + nx, b[1] + ny, 22, 2.6);
    return `<path d="M${f(a[0])} ${f(a[1])} L${f(a[0] + nx)} ${f(a[1] + ny)} M${f(b[0])} ${f(b[1])} L${f(b[0] + nx)} ${f(b[1] + ny)}" ${S(0.8, '#2a2630')}/>
      <path d="${d}" ${S(1.4, '#2a2630')}/><path d="${d}" ${S(0.6, '#c9c2b2')}/>`;
  };
  const joint = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${g.rad('joint', C.red)}" ${K2}/><path d="M${cx - r * 0.45} ${cy} h${r * 0.9}" ${S(0.6)}/>`;
  return `<g>
    <!-- cable -->
    <path d="M410 714 q-40 4 -70 14" ${S(1.6, '#1b181c')}/>
    ${soft(g.p, 452, 720, 66, 9, 0.85)}
    <path d="M402 716 q0 -22 50 -24 q50 2 50 24z" fill="${g.rad('lampBase', C.red, 0.35, 0.2)}" ${K}/>
    <path d="M402 716 h100" ${S(1.6, '#5c1d12')}/>
    <path d="M414 706 q18 -10 38 -11" ${S(1.6, '#fff', 0.4)}/>
    ${rod(444, 694, 388, 476)}${rod(458, 694, 402, 476)}
    ${spring(444, 694, 388, 476, 0.22, 0.62, -1)}
    ${rod(394, 470, 500, 332)}${rod(404, 482, 510, 344)}
    ${spring(394, 470, 500, 332, 0.2, 0.6, 1)}
    ${joint(398, 476, 9)}${joint(452, 694, 7)}${joint(506, 338, 8.5)}
    <!-- the shade, opening down towards the keyboard -->
    <path d="M492 322 L534 296 Q560 318 616 384 Q586 414 548 422 Q526 372 492 322z" fill="${enamel}" ${K}/>
    <path d="M502 320 L530 303 Q546 316 562 336" ${S(2.4, '#fff', 0.35)}/>
    ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${512 + i * 5}" cy="${314 - i * 3}" r=".9" fill="#5c1d12"/>`).join('')}
    <path d="M548 422 Q586 414 616 384" ${S(2.4, '#7a2416')}/>
    <path d="M552 418 Q584 410 610 386 Q590 402 556 410z" fill="${g.raw('bulbIn', `<linearGradient id="ID" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#ffcf6a"/></linearGradient>`)}"/>
  </g>`;
}

function penCup(g) {
  return `<g>
    ${soft(g.p, 532, 702, 26, 5, 0.8)}
    <g>
      <path d="M520 646 L510 604 l3 -1 l10 42z" fill="${C.mustard}" ${K2}/><path d="M510 604 l3 -1 l-0.4 -5 l-3 1z" fill="#f2a2a2" ${K2}/>
      <path d="M529 644 L532 600 l3.2 .2 l-3 44z" fill="#3d8fd1" ${K2}/><path d="M532 600 l1.6 -6 l1.6 6.2z" fill="#e9d9b0" ${K2}/>
      <path d="M536 646 L550 612 l3 1.2 l-14 34z" fill="#2f2a30" ${K2}/>
      <path d="M541 646 L546 596 l6 .6 l-5 50z" fill="#efe3c8" ${K2}/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${f(546 - i * 0.6)} ${600 + i * 7} l3 .3" ${S(0.5)}/>`).join('')}
    </g>
    <path d="M514 640 h36 l-3 58 h-30z" fill="${g.cyl('cup', C.teal)}" ${K}/>
    <ellipse cx="532" cy="640" rx="18" ry="3.2" fill="#163432" ${K2}/>
    <path d="M517 652 h31" ${S(0.6, '#fff', 0.35)}/>
  </g>`;
}

function floppies(g) {
  const disk = (x, y, c, label, top = false) => `<g transform="translate(${x} ${y})">
    <path d="M0 0 h64 l4 6 h-64z" fill="${shade(c, 0.12)}" ${K2}/>
    <path d="M-4 6 h72 v4 h-72z" fill="${shade(c, -0.15)}" ${K2}/>
    ${top ? `<rect x="14" y="0.6" width="22" height="4.4" fill="#b8bcbf" ${S(0.4)}/><rect x="40" y="1" width="20" height="4" fill="#f3ead6" ${S(0.4)}/><text x="41" y="4.2" font-family="IBM Plex Mono, monospace" font-size="2.6" fill="${INK}">${label}</text>` : ''}
  </g>`;
  return `<g>${soft(g.p, 1102, 699, 44, 4, 0.7)}
    ${disk(1068, 688, '#3d405b', '')}${disk(1066, 678, C.red, '')}${disk(1070, 668, '#2f6b6a', 'SURF.EXE', true)}</g>`;
}

function mug(g) {
  const body = g.cyl('mug', C.cream);
  let steam = '';
  [['M1160 690 q-10 -18 0 -34 q10 -16 0 -36', '0s'], ['M1182 690 q10 -20 0 -38 q-10 -16 2 -34', '-1.4s'], ['M1172 688 q-7 -14 2 -27 q9 -14 -2 -27', '-2.7s'], ['M1192 692 q-6 -10 1 -20 q7 -10 0 -20', '-0.7s']].forEach(([d, del]) => {
    steam += `<path style="--d:${del}" d="${d}"/>`;
  });
  return `<g>
    ${soft(g.p, 1180, 777, 62, 9, 0.8)}
    <ellipse cx="1176" cy="775" rx="52" ry="9" fill="${g.v('cork', '#b98557', 0.1, -0.15)}" ${K2}/>
    <path d="M1124 775 v3 a52 9 0 0 0 104 0 v-3" fill="#8f6440" ${K2}/>
    <path d="M1212 712 q34 0 32 26 q-2 24 -34 22" ${S(9, '#3a3436')}/>
    <path d="M1212 712 q34 0 32 26 q-2 24 -34 22" ${S(7, C.cream)}/>
    <path d="M1214 715 q26 1 25 22" ${S(1.6, '#fff', 0.6)}/>
    <path d="M1138 700 h76 v54 q0 20 -20 20 h-36 q-20 0 -20 -20z" fill="${body}" ${K}/>
    <path d="M1138 724 h76 v11 h-76z" fill="${g.cyl('mugStripe', C.red)}"/>
    <path d="M1138 724 h76 M1138 735 h76" ${S(0.5, '#6a1c10', 0.6)}/>
    <ellipse cx="1176" cy="700" rx="38" ry="7" fill="${g.v('rim', '#c9b99a', 0.2, -0.3)}" ${K2}/>
    <ellipse cx="1176" cy="701.5" rx="33" ry="5" fill="${g.raw('tea', `<radialGradient id="ID" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#b8662e"/><stop offset="1" stop-color="#5e2e12"/></radialGradient>`)}"/>
    <path d="M1162 700 q10 -2 18 0" ${S(0.8, '#ffd3a0', 0.6)}/>
    <path d="M1198 700 q12 10 22 28" ${S(0.5)}/>
    <g transform="rotate(10 1224 736)">
      <rect x="1214" y="726" width="20" height="22" rx="1" fill="${g.v('tag', C.mustard, 0.12, -0.12)}" ${K2}/>
      <circle cx="1224" cy="730" r="1" fill="${INK}"/>
      <text x="1224" y="743" text-anchor="middle" font-family="Caveat, cursive" font-weight="600" font-size="11" fill="${INK}">thé</text>
    </g>
    <g class="room-steam" fill="none" stroke="${C.cream}" stroke-linecap="round" stroke-width="2.4">${steam}</g>
  </g>`;
}

function walkmanAndHeadphones(g) {
  const cup = (cx) => `<ellipse cx="${cx}" cy="770" rx="26" ry="18" fill="#000" opacity=".25"/>
    <ellipse cx="${cx}" cy="767" rx="26" ry="18" fill="${g.rad('cupShell', C.cream)}" ${K}/>
    <ellipse cx="${cx}" cy="767" rx="17" ry="11.5" fill="${g.raw('pad', `<radialGradient id="ID" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#1e1a1c"/><stop offset="1" stop-color="#4a4246"/></radialGradient>`)}" ${K2}/>
    <ellipse cx="${cx}" cy="767" rx="9" ry="6" ${S(0.5, '#6d6468')}/>`;
  return `<g>
    ${soft(g.p, 1306, 784, 104, 9, 0.75)}
    <path d="${rr(1258, 716, 92, 64, 8)}" fill="${g.raw('wm', `<linearGradient id="ID" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${shade(C.red, 0.18)}"/><stop offset="1" stop-color="${shade(C.red, -0.25)}"/></linearGradient>`)}" ${K}/>
    <path d="M1264 720 h80" ${S(1, '#fff', 0.4)}/>
    <rect x="1269" y="727" width="70" height="40" rx="4" fill="#241e22" ${K2}/>
    <rect x="1276" y="732" width="56" height="8" fill="${C.cream}"/><path d="M1280 736 h30" ${S(0.8, C.red)}/>
    <text x="1314" y="738.4" font-family="Caveat, cursive" font-size="5.4" fill="${INK}">mix</text>
    <circle cx="1291" cy="752" r="7.5" fill="#e9dfcf" ${K2}/><circle cx="1317" cy="752" r="7.5" fill="#e9dfcf" ${K2}/>
    ${[1291, 1317].map((cx) => `<circle cx="${cx}" cy="752" r="2.6" fill="#241e22"/>${[0, 60, 120, 180, 240, 300].map((a) => `<path d="M${cx} 752 l${f(Math.cos((a * Math.PI) / 180) * 2.6)} ${f(Math.sin((a * Math.PI) / 180) * 2.6)}" ${S(0.5, '#e9dfcf')}/>`).join('')}`).join('')}
    <path d="M1276 762 h56" ${S(0.6, '#fff', 0.2)}/>
    ${[1270, 1290, 1310, 1328].map((x) => `<path d="M${x} 716 v-5 h13 v5" fill="${g.v('wmBtn', '#2a2328', 0.2, 0)}" ${K2}/>`).join('')}
    <path d="M1340 744 q30 10 24 30" ${S(1, INK)}/>
    <!-- headphones lying around it -->
    <path d="M1232 760 Q1240 676 1306 672 Q1372 676 1380 758" ${S(7, '#2a2630')}/>
    <path d="M1232 760 Q1240 676 1306 672 Q1372 676 1380 758" ${S(4.4, '#57505a')}/>
    <path d="M1252 712 Q1270 684 1306 682 Q1342 684 1360 712" ${S(5, C.cream)}/><path d="M1252 712 Q1270 684 1306 682 Q1342 684 1360 712" ${S(0.5)}/>
    ${cup(1226)}${cup(1384)}
  </g>`;
}

function magazinesAndPlant(g) {
  let leaves = '';
  const L = [[1488, 652, -38, 1.1], [1480, 650, -70, 1.25], [1494, 650, 18, 1.15], [1500, 652, 52, 1], [1470, 654, -110, 0.95], [1486, 648, -10, 1.35], [1508, 654, 86, 0.9], [1476, 652, -54, 0.85], [1498, 650, 34, 1.3], [1490, 650, 4, 0.8]];
  L.forEach(([x, y, a, s], i) => {
    const c = i % 3 === 0 ? '#3c6a48' : i % 3 === 1 ? '#57895b' : '#4a7a52';
    leaves += `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M0 0 q-13 -40 0 -80 q13 40 0 80z" fill="${g.h('leaf' + (i % 3), c, 0.18, -0.2)}" ${K2}/><path d="M0 -4 q-1 -34 0 -72" ${S(0.5, '#1f3b26', 0.8)}/>${[0.2, 0.35, 0.5, 0.65].map((t) => `<path d="M0 ${f(-80 * t)} l-5 -6 M0 ${f(-80 * t - 3)} l5 -6" ${S(0.35, '#1f3b26', 0.6)}/>`).join('')}</g>`;
  });
  return `<g>
    ${soft(g.p, 1492, 797, 112, 9, 0.75)}
    <path d="M1400 760 l176 -4 l8 30 l-180 6z" fill="${g.v('match', '#2f6b4f', 0.1, -0.2)}" ${K}/>
    <path d="M1404 792 l180 -6 v4 l-180 6z" fill="#e9e1cc" ${K2}/>
    <text x="1418" y="784" font-family="Anton, Impact, sans-serif" font-size="16" letter-spacing="2" fill="${C.cream}" transform="rotate(-1.3 1418 784)">MATCH</text>
    <g transform="rotate(-4 1490 750)">
      <path d="M1410 738 h168 v28 h-168z" fill="${g.v('swell', '#efe6d0', 0.1, -0.1)}" ${K2}/>
      <path d="M1410 756 q20 -14 40 -4 q-10 2 -8 10 q16 -10 30 0 q16 8 30 -2 q20 -8 40 2 v4 h-132z" fill="#2f7a80"/>
      <path d="M1420 755 q12 -8 24 -3" ${S(0.6, '#fff', 0.7)}/>
      <text x="1420" y="751" font-family="Anton, Impact, sans-serif" font-size="12.5" letter-spacing="2.4" fill="${INK}">SWELL</text>
      <text x="1530" y="751" font-family="IBM Plex Mono, monospace" font-size="6" fill="${INK}">N°12 · SURF</text>
    </g>
    ${soft(g.p, 1490, 722, 44, 5, 0.8)}
    ${leaves}
    <path d="M1452 650 h76 l-10 72 h-56z" fill="${g.cyl('pot', '#c4683f')}" ${K}/>
    <path d="M1446 642 h88 v12 h-88z" fill="${g.v('potRim', '#d27a4f', 0.12, -0.12)}" ${K}/>
    <ellipse cx="1490" cy="643" rx="40" ry="2.6" fill="#3a2a1c"/>
    <path d="M1460 664 l-3 0 M1462 690 l-2 0" ${S(0.6, '#fff', 0.3)}/>
  </g>`;
}

export function frontSVG() {
  const g = Grads('rf');
  const R = rng(11);
  let grain = '';
  for (let i = 0; i < 70; i++) {
    const y = 682 + R() * 118, x0 = R() * ART.w - 100;
    grain += `<path d="M${f(x0)} ${f(y)} q${f(60 + R() * 80)} ${f(R() * 3 - 1.5)} ${f(160 + R() * 240)} ${f(R() * 2 - 1)}" ${S(0.4 + R() * 0.6, '#3e2615', 0.25 + R() * 0.3)}/>`;
  }
  const knots = [[230, 760], [1260, 790], [930, 800]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="2.2" ${S(0.5, '#3e2615', 0.5)}/><ellipse cx="${x}" cy="${y}" rx="4" ry="1" ${S(0.5, '#3e2615', 0.5)}/>`).join('');
  const body = `
  <!-- the desk -->
  <rect x="-10" y="676" width="${ART.w + 20}" height="130" fill="${g.raw('desk', `<linearGradient id="ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c2f1f"/><stop offset=".25" stop-color="${C.wood}"/><stop offset="1" stop-color="#8e5d3d"/></linearGradient>`)}"/>
  ${grain}${knots}
  <path d="M520 676 l-6 130 M1180 676 l8 130" ${S(0.7, '#2a180d', 0.6)}/>
  <rect x="-10" y="676" width="${ART.w + 20}" height="16" fill="${g.raw('deskAO', `<linearGradient id="ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`)}"/>
  <path d="M-10 676 H${ART.w + 10}" ${S(1)}/>
  <rect x="-10" y="804" width="${ART.w + 20}" height="20" fill="${g.v('deskEdge', C.woodL, 0.1, -0.22)}"/>
  <path d="M-10 804 H${ART.w + 10}" ${S(1)}/><path d="M-10 805.5 H${ART.w + 10}" ${S(1, '#ffd9b0', 0.35)}/>
  <path d="M-10 824 H${ART.w + 10}" ${S(1)}/>
  <rect x="-10" y="824" width="${ART.w + 20}" height="190" fill="${g.raw('under', `<linearGradient id="ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1b13"/><stop offset=".3" stop-color="#160f0e"/><stop offset="1" stop-color="#0a0709"/></linearGradient>`)}"/>
  <!-- felt desk mat -->
  ${soft(g.p, 818, 799, 280, 6, 0.6)}
  <path d="${rr(548, 706, 540, 92, 12)}" fill="${g.v('mat', C.tealD, 0.08, -0.12)}" ${K2}/>
  <path d="${rr(555, 712, 526, 80, 9)}" ${S(0.7, '#6f9d93', 0.8)} stroke-dasharray="3 3"/>
  ${turntable(g)}
  ${lamp(g)}
  ${penCup(g)}
  ${floppies(g)}
  ${computer(g)}
  ${keyboard(g)}
  <!-- mouse + cord -->
  <path d="M1106 740 q-6 -34 -40 -42 q-16 -4 -22 -10" ${S(1.2, '#d8c9a8')}/><path d="M1106 740 q-6 -34 -40 -42 q-16 -4 -22 -10" ${S(0.4)}/>
  ${soft(g.p, 1110, 786, 30, 6, 0.8)}
  <path d="M1086 760 q0 -22 20 -22 q20 0 20 22 q0 22 -20 24 q-20 -2 -20 -24z" fill="${g.rad('mouse', C.beige, 0.35, 0.3)}" ${K}/>
  <path d="M1106 739 v15 M1087.5 754 q18.5 4 37 0" ${S(0.6)}/>
  <path d="M1093 748 q4 -6 10 -7" ${S(1.6, '#fff', 0.6)}/>
  ${mug(g)}
  ${walkmanAndHeadphones(g)}
  ${magazinesAndPlant(g)}`;
  return dedupe(`<svg class="room__svg" viewBox="0 0 ${ART.w} ${ART.h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>${patterns('rf')}${g.defs()}</defs>
  ${body}
</svg>`);
}

// ================================================================== light
export function fxSVG(kind) {
  const Sc = SCREEN;
  const id = 'fx' + kind;
  const body = kind === 'mul'
    ? `<rect x="-100" y="-100" width="${ART.w + 200}" height="${ART.h + 200}" fill="url(#${id}-night)"/>`
    : `<rect x="-100" y="-100" width="${ART.w + 200}" height="${ART.h + 200}" fill="url(#${id}-screen)"/>
      <path d="M548 420 L616 384 L1010 800 L330 810z" fill="url(#${id}-cone)"/>
      <rect x="0" y="560" width="1300" height="400" fill="url(#${id}-pool)"/>
      <rect x="900" y="0" width="700" height="800" fill="url(#${id}-moon)"/>
      <circle class="room-flicker" cx="1404" cy="440" r="90" fill="url(#${id}-candle)"/>`;
  return `<svg class="room__svg" viewBox="0 0 ${ART.w} ${ART.h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <clipPath id="${id}-hole"><path clip-rule="evenodd" d="M-100 -100h${ART.w + 200}v${ART.h + 200}h${-(ART.w + 200)}z ${rr(Sc.x, Sc.y, Sc.w, Sc.h, Sc.r)}"/></clipPath>
    <radialGradient id="${id}-night" cx="700" cy="560" r="980" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#dcd7ec"/><stop offset="1" stop-color="#433e68"/>
    </radialGradient>
    <radialGradient id="${id}-pool" cx="610" cy="760" r="430" gradientUnits="userSpaceOnUse" gradientTransform="translate(610 760) scale(1 .42) translate(-610 -760)">
      <stop offset="0" stop-color="#ffbf6b" stop-opacity=".58"/><stop offset="1" stop-color="#ffbf6b" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-cone" x1="580" y1="400" x2="660" y2="800" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffd48a" stop-opacity=".38" /><stop offset=".55" stop-color="#ffd48a" stop-opacity=".14"/><stop offset="1" stop-color="#ffd48a" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id}-screen" cx="800" cy="410" r="460" gradientUnits="userSpaceOnUse" gradientTransform="translate(800 410) scale(1.15 .8) translate(-800 -410)">
      <stop offset="0" stop-color="#8f86ff" stop-opacity=".38"/><stop offset=".5" stop-color="#8f86ff" stop-opacity=".1"/><stop offset="1" stop-color="#8f86ff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}-moon" cx="1300" cy="280" r="420" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#7fa2ff" stop-opacity=".28"/><stop offset="1" stop-color="#7fa2ff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}-candle" cx="1404" cy="440" r="90" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffc36b" stop-opacity=".5"/><stop offset="1" stop-color="#ffc36b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g clip-path="url(#${id}-hole)">${body}</g>
</svg>`;
}
