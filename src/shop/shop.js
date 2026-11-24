// The Shop (Projects chapter): a retro game's online shop, open in a malOS browser.
// Each Project is an Object for sale in cups of coffee. Same contract as the programs:
// create(root, { t, ask }) -> { start, stop, refresh }; ask() opens the Profile ("On request").
// See DA.md §17 and .scratch/boutique-projets/.
import { getLang } from '../i18n.js';
import { PROJECTS, byAisle, price, rarity, action, displayNumbers } from './catalog.js';
import { drawItem, GRID_W, GRID_H } from './items.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => innerWidth < 700;
const BUY_MS = 800; // the "item obtained" box, then the link (within the browser's user-activation window)

export function createShop(root, { t, ask }) {
  let running = false, raf = 0, frame = 0, lastTick = 0;
  let openId = null, returnFocus = null, buyTimer = 0;
  const byId = new Map(PROJECTS.map((p) => [p.id, p]));

  const itemCanvas = (p, cls) => `<canvas class="${cls}" width="${GRID_W}" height="${GRID_H}" data-item="${p.item}" aria-hidden="true"></canvas>`;

  function card(p, n, lang) {
    const r = rarity(p);
    return `
      <li>
        <button class="shop-card shop-card--${r}" data-project="${p.id}" aria-haspopup="dialog">
          <span class="shop-card__band"><span class="shop-card__price">${price(p)} ☕</span><span class="shop-card__rar">${esc(t('shop.rarity.' + r))}</span></span>
          <span class="shop-card__art">${itemCanvas(p, 'shop-item')}</span>
          <span class="shop-card__meta"><span>#${String(n).padStart(2, '0')} · ${n}/${PROJECTS.length}</span><span>${esc(p.date.slice(0, 4))}</span></span>
          <span class="shop-card__title">${esc(p.title[lang])}</span>
          <span class="shop-card__tags">${p.methods[lang].map((m) => `<i>${esc(m)}</i>`).join('')}</span>
        </button>
      </li>`;
  }

  function render() {
    const lang = getLang();
    const nums = displayNumbers(PROJECTS);
    const groups = byAisle(PROJECTS);
    root.innerHTML = `
      <div class="shop">
        <div class="shop__chrome">
          <span class="shop__nav" aria-hidden="true"><i>‹</i><i>›</i><i>↻</i></span>
          <span class="shop__url" aria-hidden="true"><b>https://</b>projets.malo.shop</span>
          <span class="shop__wallet" title="${esc(t('shop.walletTip'))}"><span aria-hidden="true">∞ ☕</span><span class="sr">${esc(t('shop.walletTip'))}</span></span>
        </div>
        <div class="shop__page" data-lenis-prevent>
          <header class="shop__hero">
            <p class="shop__kicker">${esc(t('shop.kicker'))}</p>
            <h1 class="shop__title">${esc(t('shop.title'))}</h1>
            <p class="shop__lede">${esc(t('shop.lede'))}</p>
          </header>
          <nav class="shop__tabs" aria-label="${esc(t('shop.aisles'))}">
            ${groups.map((g) => `<button class="shop__tab" data-aisle="${g.aisle}">${esc(t('shop.aisle.' + g.aisle))}</button>`).join('')}
          </nav>
          ${groups.map((g) => `
            <section class="shop__aisle" id="shop-aisle-${g.aisle}" data-aisle="${g.aisle}" aria-labelledby="shop-aisle-${g.aisle}-h">
              <h2 class="shop__aisle-h" id="shop-aisle-${g.aisle}-h">${esc(t('shop.aisle.' + g.aisle))}</h2>
              <ul class="shop__grid" role="list">${g.projects.map((p) => card(p, nums.get(p.id), lang)).join('')}</ul>
            </section>`).join('')}
          <footer class="shop__foot">${esc(t('shop.foot'))}</footer>
        </div>
        <div class="shop-fiche" hidden>
          <div class="shop-fiche__box" role="dialog" aria-modal="true" aria-labelledby="shop-fiche-title"></div>
        </div>
        <div class="shop-got" hidden role="status"></div>
      </div>`;
    wire();
    if (openId) showFiche(openId, false);
    paintItems();
  }

  // ------------------------------------------------------------------ the Fiche
  function ficheHTML(p, lang) {
    const r = rarity(p), act = action(p);
    const nums = displayNumbers(PROJECTS);
    const results = p.results?.[lang] || [];
    const live = p.preview && !narrow();
    return `
      <header class="shop-fiche__bar">
        <span>${esc(t('shop.ficheBar'))} #${String(nums.get(p.id)).padStart(2, '0')}</span>
        <button class="shop-fiche__x" data-fiche-close aria-label="${esc(t('shop.close'))}">×</button>
      </header>
      <div class="shop-fiche__body">
        <div class="shop-fiche__art shop-card--${r}">${itemCanvas(p, 'shop-item shop-item--big')}</div>
        <div class="shop-fiche__txt">
          <p class="shop-fiche__meta">${esc(t('shop.aisle.' + p.aisle))} · ${esc(p.date.slice(0, 4))} · <b>${price(p)} ☕</b> · ${esc(t('shop.rarity.' + r))}</p>
          <h2 class="shop-fiche__title" id="shop-fiche-title">${esc(p.title[lang])}</h2>
          <p class="shop-fiche__blurb">${esc(p.blurb[lang])}</p>
          <h3>${esc(t('shop.methods'))}</h3>
          <ul class="shop-fiche__list">${p.methods[lang].map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
          ${results.length ? `<h3>${esc(t('shop.results'))}</h3><ul class="shop-fiche__list">${results.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
        </div>
        ${p.preview ? `
        <figure class="shop-fiche__preview">
          <figcaption>${esc(t('shop.preview'))}</figcaption>
          ${live
            ? `<iframe src="${esc(p.preview)}" title="${esc(t('shop.preview'))} · ${esc(p.title[lang])}" loading="lazy" sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer"></iframe>`
            : `<img src="${esc(p.previewImage)}" alt="${esc(t('shop.preview'))} · ${esc(p.title[lang])}" loading="lazy">`}
        </figure>` : ''}
      </div>
      <footer class="shop-fiche__foot">
        ${act.kind === 'buy'
          ? `<button class="shop-buy" data-buy="${esc(act.href)}">${esc(t('shop.buy'))} · ${price(p)} ☕</button>`
          : `<button class="shop-buy shop-buy--ask" data-ask>${esc(t('shop.ask'))}</button>`}
      </footer>`;
  }

  function showFiche(id, focus = true) {
    const p = byId.get(id);
    if (!p) return;
    openId = id;
    const wrap = root.querySelector('.shop-fiche'), box = wrap.querySelector('.shop-fiche__box');
    box.innerHTML = ficheHTML(p, getLang());
    wrap.hidden = false;
    paintItems();
    if (focus) box.querySelector('[data-fiche-close]').focus({ preventScroll: true });
  }
  function closeFiche() {
    if (!openId) return;
    const wrap = root.querySelector('.shop-fiche');
    wrap.hidden = true;
    wrap.querySelector('.shop-fiche__box').innerHTML = ''; // drops the live preview
    const id = openId;
    openId = null;
    (returnFocus || root.querySelector(`[data-project="${id}"]`))?.focus({ preventScroll: true });
    returnFocus = null;
  }

  function buy(href) {
    const got = root.querySelector('.shop-got');
    got.innerHTML = `<div class="shop-got__box"><p class="shop-got__h">${esc(t('shop.downloading'))}</p><div class="shop-got__bar"><i></i></div><p class="shop-got__ok">${esc(t('shop.obtained'))}</p></div>`;
    got.hidden = false;
    clearTimeout(buyTimer);
    buyTimer = setTimeout(() => {
      got.hidden = true;
      window.open(href, '_blank', 'noopener');
    }, reduced ? 0 : BUY_MS);
  }

  // ------------------------------------------------------------------ events
  function wire() {
    const page = root.querySelector('.shop__page');
    root.querySelectorAll('.shop-card').forEach((b) => b.addEventListener('click', () => { returnFocus = b; showFiche(b.dataset.project); }));
    root.querySelectorAll('.shop__tab').forEach((b) => b.addEventListener('click', () => {
      const sec = root.querySelector(`#shop-aisle-${b.dataset.aisle}`);
      const tabs = root.querySelector('.shop__tabs');
      page.scrollTo({ top: sec.offsetTop - tabs.offsetHeight - 12, behavior: reduced ? 'auto' : 'smooth' });
    }));
    // the active tab follows the scroll
    const secs = [...root.querySelectorAll('.shop__aisle')];
    const onScroll = () => {
      const y = page.scrollTop + root.querySelector('.shop__tabs').offsetHeight + 40;
      let cur = secs[0]?.dataset.aisle;
      for (const s of secs) if (s.offsetTop <= y) cur = s.dataset.aisle;
      root.querySelectorAll('.shop__tab').forEach((b) => b.classList.toggle('is-on', b.dataset.aisle === cur));
    };
    page.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    const wrap = root.querySelector('.shop-fiche');
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap || e.target.closest('[data-fiche-close]')) return closeFiche();
      const b = e.target.closest('[data-buy]');
      if (b) return buy(b.dataset.buy);
      if (e.target.closest('[data-ask]')) ask?.();
    });
  }
  // Escape closes the Fiche before the Shop itself; Tab stays inside the open Fiche
  window.addEventListener('keydown', (e) => {
    if (!openId || !running || document.body.classList.contains('mode-profile')) return; // the Profile, over us, handles its own keys
    if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); closeFiche(); return; }
    if (e.key !== 'Tab') return;
    const f = [...root.querySelectorAll('.shop-fiche__box button, .shop-fiche__box iframe')];
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (i === -1 || (e.shiftKey && i === 0) || (!e.shiftKey && i === f.length - 1)) { e.preventDefault(); f[e.shiftKey ? f.length - 1 : 0].focus(); }
  }, true);

  // ------------------------------------------------------------------ the Objects' loops
  function paintItems() {
    root.querySelectorAll('canvas[data-item]').forEach((c) => drawItem(c.getContext('2d'), c.dataset.item, frame));
  }
  function tick(now) {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    if (now - lastTick < 125) return; // 8 frames a second: retro steps
    lastTick = now;
    frame++;
    paintItems();
  }

  render();
  return {
    start() {
      if (running) return;
      running = true;
      root.querySelector('.shop__page')?.scrollTo(0, 0);
      paintItems();
      if (!reduced) raf = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(buyTimer);
      root.querySelector('.shop-got')?.setAttribute('hidden', '');
      if (openId) closeFiche();
    },
    refresh: render,
  };
}

