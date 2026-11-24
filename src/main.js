import 'lenis/dist/lenis.css';
import './style.css';
import Lenis from 'lenis';
import { applyLang, getLang, t } from './i18n.js';
import { mountIcons, iconSVG } from './icons.js';
import { createWorld } from './world/world.js';
import { realHour } from './world/timeOfDay.js';
import { ICON_SVG, FILE_SVG } from './os/desktopArt.js';
import { createLofi } from './os/lofi.js';
import { createQRT } from './os/apps/qrt.js';
import { createOxford } from './os/apps/oxford.js';
import { createCrest } from './os/apps/crest.js';
import { createSocgen } from './os/apps/socgen.js';
import { createShop } from './shop/shop.js';
import { createProfile } from './profile/profile.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
// the site opens on the computer; a deep link to #education still opens the island world directly
const startInEdu = location.hash === '#education';
if (!startInEdu) document.body.classList.add('mode-desk'); // before the first paint: no fade-out of the island texts
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

// ------------------------------------------------------------------ text helpers
function split(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = '';
  let i = 0;
  text.split(' ').forEach((word, wi, arr) => {
    const w = document.createElement('span');
    w.className = 'w';
    w.setAttribute('aria-hidden', 'true');
    for (const c of word) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      s.style.setProperty('--i', i++);
      w.appendChild(s);
    }
    el.appendChild(w);
    if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
  });
}

const typers = new WeakMap();
function typeIn(el) {
  const full = el.dataset.full ?? el.textContent;
  el.dataset.full = full;
  clearInterval(typers.get(el));
  if (reduced) { el.textContent = full; return; }
  let n = 0;
  el.textContent = '';
  el.classList.add('typing');
  const id = setInterval(() => {
    n++;
    el.textContent = full.slice(0, n);
    if (n >= full.length) { clearInterval(id); setTimeout(() => el.classList.remove('typing'), 900); }
  }, 38);
  typers.set(el, id);
}

function applyAll(lang) {
  applyLang(lang);
  $$('[data-type]').forEach((el) => { el.dataset.full = el.textContent; });
  $$('[data-split]').forEach(split);
  $$('#langBtn [data-l]').forEach((s) => s.classList.toggle('is-on', s.dataset.l === getLang()));
}

// ------------------------------------------------------------------ boot
mountIcons();
applyAll(getLang());
// the Profile is reachable from everywhere: the avatar (top bar) and the name in welcome.txt
const profile = createProfile({ t, reduced });
$$('[data-profile]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); profile.open(); }));
$$('.reveal').forEach((r) => [...r.children].forEach((c, i) => c.style.setProperty('--d', i)));

const sections = $$('main [data-stop]');
const reveals = sections.map((s) => $('.reveal', s));
const railItems = $$('.rail__stops li[data-stop]');
const navLinks = $$('.nav a.nav__link');
const hero = $('.hero__title');

let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.85, touchMultiplier: 1.2 });
}
const scrollY = () => (lenis ? lenis.scroll : window.scrollY);

let anchors = [];
function measure() {
  const vh = window.innerHeight;
  const max = document.documentElement.scrollHeight - vh;
  anchors = sections.map((s, i) => (i === 0 ? 0 : Math.min(max, s.offsetTop + s.offsetHeight / 2 - vh / 2)));
}
measure();
window.addEventListener('resize', measure);

const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function progressAt(y) {
  for (let i = 0; i < anchors.length - 1; i++) {
    if (y < anchors[i + 1]) {
      const f = (y - anchors[i]) / (anchors[i + 1] - anchors[i]);
      return i + smoothstep(0.08, 0.92, f);
    }
  }
  return anchors.length - 1;
}

function goTo(stop) {
  const y = anchors[stop] ?? 0;
  if (lenis) lenis.scrollTo(y, { duration: 2.4, easing: (x) => 1 - Math.pow(1 - x, 4) });
  else window.scrollTo({ top: y });
}
$$('[data-scroll]').forEach((a) =>
  a.addEventListener('click', (e) => { e.preventDefault(); goTo(+a.dataset.scroll); })
);

// reveal cards around their stop
const shown = new Set();
let lastFill = -1;
function updateReveals(p) {
  reveals.forEach((card, i) => {
    if (!card) return;
    const on = Math.abs(p - i) < 0.42;
    if (on && !shown.has(i)) {
      shown.add(i);
      card.classList.add('is-in');
      $$('[data-type]', card).forEach(typeIn);
    } else if (!on && shown.has(i)) {
      shown.delete(i);
      card.classList.remove('is-in');
    }
  });
  // rail + nav
  const fill = Math.round((p / (sections.length - 1)) * 1000) / 10;
  if (fill !== lastFill) { $('#railFill').style.height = fill + '%'; lastFill = fill; }
  let best = 0, bd = 1e9;
  const inDesk = world && world.mode !== 'edu';
  const navOn = !inDesk ? 'edu' : openApp === 'shop' ? 'shop' : expWin.classList.contains('is-open') || openApp ? 'desk' : 'home';
  navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.go === navOn));
  railItems.forEach((li, j) => { const d = Math.abs(+li.dataset.stop - p); if (d < bd) { bd = d; best = j; } });
  railItems.forEach((li, j) => {
    li.classList.toggle('is-active', j === best);
    li.classList.toggle('is-done', j < best);
  });
}

// ------------------------------------------------------------------ language & pixel toggles
$('#langBtn').addEventListener('click', () => {
  applyAll(getLang() === 'fr' ? 'en' : 'fr');
  // re-show visible content instantly after a language switch
  hero.classList.add('is-in');
  shown.forEach((i) => {
    const card = reveals[i];
    if (card) $$('[data-type]', card).forEach(typeIn);
  });
  updateTimeUI(true);
  world?.refreshNotes();
  Object.values(APPS).forEach((a) => a.refresh());
  profile.refresh();
});

// ------------------------------------------------------------------ world
const loader = $('#loader');
const fmt = new Intl.NumberFormat('en-US');
let world = null;

function dissolve() {
  const c = $('#dissolve');
  const cell = 22;
  const w = Math.ceil(window.innerWidth / cell), h = Math.ceil(window.innerHeight / cell);
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff6e9';
  ctx.fillRect(0, 0, w, h);
  loader.classList.add('is-done');
  const cells = [];
  const md = Math.hypot(w / 2, h / 2);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) cells.push([x, y, Math.hypot(x - w / 2, y - h / 2) / md + Math.random() * 0.45]);
  cells.sort((a, b) => a[2] - b[2]);
  const dur = reduced ? 1 : 1100;
  const t0 = performance.now();
  let done = 0;
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    const n = Math.floor(k * k * cells.length);
    for (; done < n; done++) ctx.clearRect(cells[done][0], cells[done][1], 1, 1);
    if (k < 1) requestAnimationFrame(step);
    else loader.remove();
  };
  setTimeout(() => {
    requestAnimationFrame(step);
    if (startInEdu || !world) setTimeout(() => hero.classList.add('is-in'), 250);
    else arrive();
  }, 250);
}

// time-of-day UI
let autoTime = !params.has('h');
const timeBtn = $('#timeBtn'), timePop = $('#timePop'), range = $('#timeRange');
let lastPhase = '', lastNight = null, lastClock = '', lastTop = '', lastHor = '';
function updateTimeUI(force = false) {
  if (!world) return;
  const st = world.state;
  const h = world.hour;
  const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
  const clock = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  if (clock !== lastClock || force) { $('#clock').textContent = clock; $('#osClock').textContent = clock; lastClock = clock; }
  if (st.phase !== lastPhase || force) { $('#phase').textContent = t('phase.' + st.phase); lastPhase = st.phase; }
  const night = st.glow > 0.5;
  if (night !== lastNight || force) {
    document.body.classList.toggle('is-night', night);
    $('#timeIcon').innerHTML = iconSVG(night ? 'moon' : 'sun');
    lastNight = night;
  }
  $('#timeMode').textContent = t(autoTime ? 'time.local' : 'time.manual');
  $('#timeNow').disabled = autoTime;
  if (document.activeElement !== range) range.value = h.toFixed(2);
  // only touch CSS when the sky really changed (each write restyles the page)
  const top = st.top.getHexString(), hor = st.hor.getHexString();
  if (top !== lastTop || hor !== lastHor || force) {
    const root = document.documentElement.style;
    root.setProperty('--sky-top', '#' + top);
    root.setProperty('--sky-hor', '#' + hor);
    lastTop = top; lastHor = hor;
  }
}
timeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = !timePop.classList.contains('is-open');
  timePop.classList.toggle('is-open', open);
  timeBtn.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.time')) { timePop.classList.remove('is-open'); timeBtn.setAttribute('aria-expanded', 'false'); }
});
range.addEventListener('input', () => {
  autoTime = false;
  world?.setHour(parseFloat(range.value));
  updateTimeUI(true);
});
$('#timeNow').addEventListener('click', () => {
  autoTime = true;
  world?.setHour(realHour());
  updateTimeUI(true);
});
setInterval(() => { if (autoTime && world) world.setHour(realHour()); }, 1000);

// pixel toggle
const pixelBtn = $('#pixelBtn');
pixelBtn.addEventListener('click', () => {
  if (!world) return;
  world.setPixel(!world.pixel);
  pixelBtn.setAttribute('aria-pressed', String(world.pixel));
  store.set('pixel', world.pixel ? '1' : '0');
});

// hover / click islands
const tip = $('#tip');
let pointerX = -1, pointerY = -1, pointerDirty = false, hovered = -1;
window.addEventListener('pointermove', (e) => {
  pointerX = e.clientX; pointerY = e.clientY; pointerDirty = true;
  world?.setPointer((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
  tip.style.setProperty('--x', e.clientX + 'px');
  tip.style.setProperty('--y', e.clientY + 'px');
  pointerOverUI = !!e.target.closest('.card, .topbar, .btn, .time__pop, .rail, .malos, .app-layer, .profile');
}, { passive: true });
let pointerOverUI = false;
window.addEventListener('pointerleave', () => { pointerX = -1; pointerDirty = true; });
const ISLAND_TO_STOP = [0, 1, 2, 3];
window.addEventListener('click', (e) => {
  if (hovered < 0 || e.target.closest('a, button, .card, .time__pop, input, .malos, .profile')) return;
  goTo(ISLAND_TO_STOP[hovered]);
});

function updateHover() {
  if (!pointerDirty || !world) return;
  pointerDirty = false;
  const idx = pointerX < 0 || pointerOverUI ? -1 : world.pick(pointerX, pointerY);
  if (idx !== hovered) {
    hovered = idx;
    world.setHover(idx);
    document.body.classList.toggle('is-pointer', idx >= 0);
    tip.classList.toggle('is-on', idx >= 0);
    if (idx >= 0) tip.textContent = t('island.' + idx);
  }
}

// ------------------------------------------------------------------ malOS desktop
const malos = $('#malos'), malosScreen = $('#malosScreen'), osToast = $('#osToast');
let deskKey = '';
function updateDesk() {
  const d = world.desk;
  if (!d.active || d.alpha <= 0.002) {
    if (deskKey) { malos.classList.remove('is-on', 'is-live'); deskKey = ''; }
    return;
  }
  const mob = innerWidth < 820;
  let { x, y, w, h } = d;
  if (mob) { x = 8; y = 64; w = innerWidth - 16; h = innerHeight - 74; }
  const s = mob ? Math.min(1, w / 400) : w / 1024;
  const key = [x, y, w, h, d.alpha].map((v) => v.toFixed(2)).join('|');
  if (key === deskKey) return;
  deskKey = key;
  malos.classList.add('is-on');
  malos.classList.toggle('is-live', d.alpha > 0.95);
  if (d.alpha > 0.45 && introSkip) guide(); // the welcome text comes in while the desktop fades up
  malos.classList.toggle('is-mobile', mob);
  malos.style.left = x + 'px';
  malos.style.top = y + 'px';
  malos.style.width = w + 'px';
  malos.style.height = h + 'px';
  malos.style.opacity = d.alpha;
  malosScreen.style.setProperty('--s', s);
  malosScreen.style.setProperty('--W', w / s + 'px');
  malosScreen.style.setProperty('--H', h / s + 'px');
}

// icons
$$('[data-svg]').forEach((el) => (el.innerHTML = ICON_SVG[el.dataset.svg] || ''));
const FILES = {
  qrt: FILE_SVG('#f2b347', '<path d="M9 26l6-6 5 4 9-10" stroke="#3d405b" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
  oxford: FILE_SVG('#3d405b', '<path d="M13 12c8 4 6 12 14 16M27 12c-8 4-6 12-14 16" stroke="#e07a5f" stroke-width="2" fill="none"/>'),
  crest: FILE_SVG('#81b29a', '<path d="M10 26c4-10 8 2 12-6s6-2 8-4" stroke="#3d405b" stroke-width="2" fill="none" stroke-linecap="round"/>'),
  socgen: FILE_SVG('#e07a5f', '<rect x="9" y="12" width="22" height="13" rx="5" fill="#3d405b"/><circle cx="15" cy="18.5" r="1.5" fill="#fff6e9"/><circle cx="20" cy="18.5" r="1.5" fill="#fff6e9"/><circle cx="25" cy="18.5" r="1.5" fill="#fff6e9"/>'),
};
$$('[data-file]').forEach((el) => (el.innerHTML = FILES[el.dataset.file] || ''));

// windows
// full-screen screens: one program per experience (each with its own art direction) and the Shop.
// Every factory takes (root, { t }) and returns { start, stop, refresh }.
const SCREENS = { qrt: createQRT, oxford: createOxford, crest: createCrest, socgen: createSocgen, shop: createShop };
const APPS = {};
let zTop = 10;
function focusWin(w) { w.style.zIndex = ++zTop; }
function openWin(id) {
  const w = $('#win-' + id);
  if (!w) return;
  w.classList.add('is-open');
  focusWin(w);
  $$('.os-ico').forEach((i) => i.classList.toggle('is-sel', i.dataset.open === id));
}

// ------------------------------------------------------------------ full-screen programs
const appLayer = $('#appLayer');
let openApp = null;
async function launchApp(id, fromEl) {
  if (!world || busy || openApp || world.mode !== 'desk') return;
  const panel = $('#app-panel-' + id);
  if (!panel) return;
  busy = true;
  openApp = id;
  APPS[id] ??= SCREENS[id]($('#app-' + id), { t });
  // FLIP: the panel grows out of the row that was clicked while the camera dives into the screen
  appLayer.classList.add('is-on');
  panel.classList.add('is-open');
  const to = panel.getBoundingClientRect();
  const from = fromEl?.getBoundingClientRect() || { left: to.left + to.width / 2 - 40, top: to.top + to.height / 2 - 20, width: 80, height: 40 };
  panel.style.transition = 'none';
  panel.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
  panel.style.opacity = '0.2';
  panel.getBoundingClientRect();
  panel.style.transition = '';
  panel.style.transform = '';
  panel.style.opacity = '';
  document.body.classList.add('mode-app');
  const dive = world.goApp();
  setTimeout(() => APPS[id]?.start(), 700);
  await dive;
  busy = false;
}
async function closeApp() {
  if (!openApp || busy) return;
  busy = true;
  const id = openApp;
  const panel = $('#app-panel-' + id);
  panel.classList.remove('is-open');
  panel.classList.add('is-closing');
  document.body.classList.remove('mode-app');
  await world.leaveApp();
  APPS[id]?.stop();
  panel.classList.remove('is-closing');
  appLayer.classList.remove('is-on');
  openApp = null;
  busy = false;
}
$$('[data-app-close]').forEach((b) => b.addEventListener('click', closeApp));
function closeWin(id) {
  $('#win-' + id)?.classList.remove('is-open');
  APPS[id]?.stop();
}
const expWin = $('#win-exp');
function closeAll() { $$('.os-win').forEach((w) => w.classList.remove('is-open')); Object.values(APPS).forEach((a) => a.stop()); }
$$('.os-win').forEach((w) => w.addEventListener('pointerdown', () => focusWin(w)));
$$('[data-close]').forEach((b) => b.addEventListener('click', () => closeWin(b.dataset.close)));

let toastTimer = 0;
function toast(msg) {
  osToast.textContent = msg;
  osToast.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => osToast.classList.remove('is-on'), 2600);
}
const READY = Object.keys(SCREENS);
$$('.os-row').forEach((row) =>
  row.addEventListener('click', () => {
    $$('.os-row').forEach((r) => r.classList.toggle('is-sel', r === row));
    if (READY.includes(row.dataset.app)) launchApp(row.dataset.app, row);
    else toast(t('os.soon'));
  })
);

// lofi.fm
const lofi = createLofi();
const lofiCard = $('#lofi'), lofiBtn = $('#lofiPlay');
async function toggleLofi() {
  const on = await lofi.toggle();
  lofiCard.classList.toggle('is-playing', on);
  lofiBtn.setAttribute('aria-pressed', String(on));
  $('#osNow').classList.toggle('is-on', on);
  world?.room.setPlaying(on); // the record on the desk turns with the radio
}
lofiBtn.addEventListener('click', toggleLofi);

// the terminal types slowly, forever
const TERM = {
  fr: [
    ['p', 'malo@malOS ~ % '], ['t', 'brew install earl-grey\n'], ['o', '==> infusion… 4 min ☕ terminé\n'],
    ['p', 'malo@malOS ~ % '], ['t', 'python train.py --epochs 1\n'], ['o', 'loss 0.412 → 0.087  ✓\n'],
    ['p', 'malo@malOS ~ % '], ['t', 'lofi --play pluie\n'], ['c', '♪ en lecture : pluie sur la fenêtre\n'],
    ['p', 'malo@malOS ~ % '],
  ],
  en: [
    ['p', 'malo@malOS ~ % '], ['t', 'brew install earl-grey\n'], ['o', '==> steeping… 4 min ☕ done\n'],
    ['p', 'malo@malOS ~ % '], ['t', 'python train.py --epochs 1\n'], ['o', 'loss 0.412 → 0.087  ✓\n'],
    ['p', 'malo@malOS ~ % '], ['t', 'lofi --play rain\n'], ['c', '♪ now playing: rain on the window\n'],
    ['p', 'malo@malOS ~ % '],
  ],
};
const term = $('#term');
let termTimer = 0;
function runTerm() {
  clearTimeout(termTimer);
  const script = TERM[getLang()] || TERM.en;
  let i = 0, j = 0, html = '';
  const esc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const tick = () => {
    if (world?.mode !== 'desk') { termTimer = setTimeout(tick, 600); return; }
    if (i >= script.length) { termTimer = setTimeout(runTerm, 6000); return; }
    const [kind, text] = script[i];
    const cls = kind === 'p' ? 'p' : kind === 'c' ? 'c' : '';
    if (kind === 't') {
      html += esc(text[j]);
      j++;
      if (j >= text.length) { i++; j = 0; }
      term.innerHTML = html + '<span class="cur"></span>';
      termTimer = setTimeout(tick, 70 + Math.random() * 110);
    } else {
      html += cls ? `<span class="${cls}">${esc(text)}</span>` : esc(text);
      i++;
      term.innerHTML = html + '<span class="cur"></span>';
      termTimer = setTimeout(tick, kind === 'p' ? 900 : 500);
    }
  };
  term.innerHTML = '<span class="cur"></span>';
  tick();
}
runTerm();

// desktop icons
$$('.malos [data-open]').forEach((ico) =>
  ico.addEventListener('click', () => {
    const id = ico.dataset.open;
    if (id === 'edu' || id === 'exp' || id === 'shop') explored();
    if (id === 'edu') goEdu(0);
    else if (id === 'shop') openShop(ico);
    else if (id === 'lofi') { $$('.os-ico').forEach((i) => i.classList.toggle('is-sel', i === ico)); toggleLofi(); }
    else openWin(id);
  })
);
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (openApp) closeApp();
  else if (world?.mode === 'desk') closeAll();
});

// ------------------------------------------------------------------ Education <-> Desktop
let busy = false;
async function goDesk(openExp = true) {
  if (!world || busy) return;
  if (world.mode === 'desk') { if (openExp) openWin('exp'); else { closeAll(); openWin('welcome'); } return; }
  busy = true;
  document.body.classList.add('mode-desk');
  lenis?.stop();
  document.documentElement.style.overflow = 'hidden';
  hovered = -1; world.setHover(-1); tip.classList.remove('is-on'); document.body.classList.remove('is-pointer');
  await world.goDesk();
  busy = false;
  setTimeout(() => openWin(openExp ? 'exp' : 'welcome'), 250);
}
async function goEdu(stop = 0) {
  if (!world || busy) return;
  if (world.mode === 'edu') { goTo(stop); return; }
  busy = true;
  closeAll();
  // land on the requested page of the Education folder
  document.documentElement.style.overflow = '';
  if (lenis) lenis.scrollTo(anchors[stop] ?? 0, { immediate: true, force: true });
  else window.scrollTo(0, anchors[stop] ?? 0);
  hero.classList.remove('is-in');
  await world.goEdu();
  document.body.classList.remove('mode-desk');
  lenis?.start();
  if (stop === 0) setTimeout(() => hero.classList.add('is-in'), 120);
  busy = false;
}

// the Shop opens from anywhere: from the island world we first come back to the desktop
async function openShop(fromEl) {
  if (!world || busy || openApp === 'shop') return;
  explored();
  if (openApp) await closeApp();
  if (world.mode !== 'desk') await goDesk(false);
  launchApp('shop', fromEl || $('.os-ico[data-open="shop"]'));
}

// ------------------------------------------------------------------ arrival: the site opens on the computer
const welName = $('#wel-name');
let introSkip = null;
function arrive() {
  const skip = () => introSkip?.();
  const done = () => {
    introSkip = null;
    window.removeEventListener('pointerdown', skip, true);
    window.removeEventListener('keydown', skip, true);
    guide();
    busy = false;
  };
  busy = true;
  if (reduced) { world.intro(true); done(); return; }
  // a click or a key during the establishing shot skips straight to the desktop
  introSkip = () => { world.intro(true); done(); };
  window.addEventListener('pointerdown', skip, true);
  window.addEventListener('keydown', skip, true);
  world.intro().then(() => introSkip && done());
}
function guide() {
  if (guided) return;
  guided = true;
  malos.classList.add('is-guide');
  welName.classList.add('is-in');
}
let guided = false;
function explored() { malos.classList.add('is-explored'); }
$$('[data-go]').forEach((el) =>
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const go = el.dataset.go;
    if (go === 'shop') { openShop(); return; }
    if (openApp) {
      closeApp().then(() => { if (go === 'edu') goEdu(0); else if (go === 'home') goDesk(false); });
      return;
    }
    if (go === 'home') goDesk(false);
    else if (go === 'desk') goDesk(true);
    else goEdu(world?.mode === 'edu' ? 1 : 0);
  })
);

// main loop
let last = performance.now();
let frame = 0;
let lastP = -1;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  lenis?.raf(now);
  const p = window.__lockP ?? progressAt(scrollY()); // __lockP: debug override
  if (Math.abs(p - lastP) > 0.0005) { pointerDirty = true; lastP = p; } // camera moved under a still cursor
  updateReveals(p);
  if (world) {
    world.setProgress(p);
    if (frame++ % 2 === 0) updateHover();
    world.update(dt);
    updateDesk();
    if (frame % 30 === 0) updateTimeUI();
  }
  requestAnimationFrame(loop);
}

async function start() {
  try {
    world = await createWorld($('#world'), {
      roomEl: $('#room'),
      reducedMotion: reduced,
      onProgress: ({ step, total, voxels }) => {
        $('#loaderBar').style.width = `${(step / total) * 100}%`;
        $('#loaderCount').textContent = fmt.format(voxels);
      },
    });
    world.room.onTurntable(toggleLofi);
    if (store.get('pixel') === '1') { world.setPixel(true); pixelBtn.setAttribute('aria-pressed', 'true'); }
    world.setHour(params.has('h') ? parseFloat(params.get('h')) : realHour(), true);
    world.setProgress(progressAt(scrollY()));
    if (!startInEdu) {
      lenis?.stop();
      document.documentElement.style.overflow = 'hidden';
      world.intro(true); // the loader covers this frame; arrive() then plays the camera move
    }
    world.warmUp();
    world.snap();
    updateTimeUI(true);
    malosScreen.style.backgroundImage = `url(${world.wallpaper.toDataURL('image/jpeg', 0.92)})`;
    window.__world = world; // handy for debugging in the console
    window.__goDesk = goDesk;
    window.__goEdu = goEdu;
    window.__goTo = goTo;
    window.__jump = (i) => {
      if (lenis) lenis.scrollTo(anchors[i], { immediate: true }); else window.scrollTo(0, anchors[i]);
      const p = progressAt(anchors[i]);
      updateReveals(p);
      world.setProgress(p);
      world.snap();
      updateTimeUI(true);
      document.body.classList.add('no-anim');
      setTimeout(() => document.body.classList.remove('no-anim'), 50);
    };
  } catch (err) {
    console.error(err);
    document.body.classList.add('no-webgl');
    document.body.classList.remove('mode-desk'); // no computer without WebGL: show the texts
    lenis?.start();
    document.documentElement.style.overflow = '';
  }
  requestAnimationFrame(loop);
  dissolve();
}
start();
