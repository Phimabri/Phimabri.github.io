// The Shop (Projects chapter): a retro game's online shop, open in a malOS browser.
// Each Project is an item (Objet) for sale in cups of coffee. Same contract as the programs:
// create(root, { t, ask }) -> { start, stop, refresh }; ask() opens the Profile ("On request").
// See DA.md §17 and .scratch/boutique-projets/.
import { getLang } from '../i18n.js';
import { PROJECTS, byAisle, price, rarity, action, displayNumbers } from './catalog.js';
import { drawItem, GRID_W, GRID_H, STILL_FRAME } from './items.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => innerWidth < 700;
const BUY_MS = 800; // the "item obtained" box, then the link (within the browser's user-activation window)

export function createShop(root, { t, ask }) {
  let running = false, raf = 0, frame = 0, lastTick = 0;
  let openId = null, buyTimer = 0, io = null;
  const visible = new Set(); // item canvases on screen: only those are animated
  const byId = new Map(PROJECTS.map((p) => [p.id, p]));
  const numbers = displayNumbers(PROJECTS);

  // shared formatting (card and Fiche)
  const num = (p) => String(numbers.get(p.id)).padStart(2, '0');
  const cost = (p) => `${price(p)} ☕`;
  const rar = (p) => t('shop.rarity.' + rarity(p));
  const year = (p) => p.date.slice(0, 4);
  const itemCanvas = (p, cls) => `<canvas class="${cls}" width="${GRID_W}" height="${GRID_H}" data-item="${p.item}" aria-hidden="true"></canvas>`;
  const list = (items, cls) => `<ul class="${cls}">${items.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`;

  function card(p, lang) {
    return `
      <li>
        <button class="shop-card shop-card--${rarity(p)}" data-project="${p.id}" aria-haspopup="dialog"
          aria-label="${esc(`${p.title[lang]}, ${cost(p)}, ${rar(p)}`)}">
          <span class="shop-card__band"><span class="shop-card__price">${cost(p)}</span><span class="shop-card__rar">${esc(rar(p))}</span></span>
          <span class="shop-card__art">${itemCanvas(p, 'shop-item')}</span>
          <span class="shop-card__meta"><span>#${num(p)} · ${numbers.get(p.id)}/${PROJECTS.length}</span><span>${year(p)}</span></span>
          <span class="shop-card__title">${esc(p.title[lang])}</span>
          <span class="shop-card__tags">${p.methods[lang].map((m) => `<i>${esc(m)}</i>`).join('')}</span>
        </button>
      </li>`;
  }

  function render() {
    const lang = getLang();
    const keep = root.querySelector('.shop__page')?.scrollTop || 0; // a language change keeps the place
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
              <ul class="shop__grid" role="list">${g.projects.map((p) => card(p, lang)).join('')}</ul>
            </section>`).join('')}
          <footer class="shop__foot">${esc(t('shop.foot'))}</footer>
        </div>
        <div class="shop-fiche" hidden>
          <div class="shop-fiche__box" role="dialog" aria-modal="true" aria-labelledby="shop-fiche-title"></div>
        </div>
        <div class="shop-got" role="status" aria-live="polite"></div>
      </div>`;
    root.querySelector('.shop__page').scrollTop = keep;
    wire();
    if (openId) showFiche(openId, false);
    paintAll();
  }

  // ------------------------------------------------------------------ the Fiche
  function preview(p, lang) {
    if (!p.preview) return '';
    const label = `${t('shop.preview')} · ${p.title[lang]}`;
    let view;
    if (!narrow()) {
      // no allow-same-origin: the preview may share our origin on GitHub Pages, it must stay boxed
      view = `<iframe src="${esc(p.preview)}" title="${esc(label)}" loading="lazy" tabindex="-1" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe>`;
    } else if (p.previewImage) {
      view = `<img src="${esc(p.previewImage)}" alt="${esc(label)}" loading="lazy">`;
    } else return ''; // nothing to show on a phone without a capture
    return `
        <figure class="shop-fiche__preview">
          <figcaption><span>${esc(t(narrow() ? 'shop.previewStill' : 'shop.preview'))}</span>
            <a href="${esc(p.preview)}" target="_blank" rel="noopener">${esc(t('shop.previewOpen'))} ↗</a></figcaption>
          <div class="shop-fiche__view">${view}</div>
        </figure>`;
  }

  function ficheHTML(p, lang) {
    const act = action(p);
    const results = p.results?.[lang] || [];
    return `
      <header class="shop-fiche__bar">
        <span>${esc(t('shop.ficheBar'))} #${num(p)}</span>
        <button class="shop-fiche__x" data-fiche-close aria-label="${esc(t('shop.close'))}">×</button>
      </header>
      <div class="shop-fiche__body">
        <div class="shop-fiche__art shop-fiche__art--${rarity(p)}">${itemCanvas(p, 'shop-item shop-item--big')}</div>
        <div class="shop-fiche__txt">
          <p class="shop-fiche__meta">${esc(t('shop.aisle.' + p.aisle))} · ${year(p)} · <b>${cost(p)}</b> · ${esc(rar(p))}</p>
          <h2 class="shop-fiche__title" id="shop-fiche-title">${esc(p.title[lang])}</h2>
          <p class="shop-fiche__blurb">${esc(p.blurb[lang])}</p>
          <h3>${esc(t('shop.methods'))}</h3>
          ${list(p.methods[lang], 'shop-fiche__tags')}
          ${results.length ? `<h3>${esc(t('shop.results'))}</h3>${list(results, 'shop-fiche__results')}` : ''}
        </div>
        ${preview(p, lang)}
      </div>
      <footer class="shop-fiche__foot">
        ${act.kind === 'buy'
          ? `<button class="shop-buy" data-buy="${esc(act.href)}">${esc(t('shop.buy'))} · ${cost(p)}</button>`
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
    paintAll();
    if (focus) box.querySelector('[data-fiche-close]').focus({ preventScroll: true });
  }
  function closeFiche({ refocus = true } = {}) {
    if (!openId) return;
    const wrap = root.querySelector('.shop-fiche');
    wrap.hidden = true;
    wrap.querySelector('.shop-fiche__box').innerHTML = ''; // drops the live preview
    const id = openId;
    openId = null;
    // back to the card it came from (looked up now: a re-render may have replaced it)
    if (refocus) root.querySelector(`.shop-card[data-project="${id}"]`)?.focus({ preventScroll: true });
  }

  function buy(href) {
    clearTimeout(buyTimer);
    if (reduced) { window.open(href, '_blank', 'noopener'); return; }
    const got = root.querySelector('.shop-got');
    got.classList.add('is-on');
    // the live region is already in the page: filling it now gets it announced
    got.innerHTML = `<div class="shop-got__box"><p class="shop-got__h">${esc(t('shop.downloading'))}</p><div class="shop-got__bar"><i></i></div><p class="shop-got__ok">${esc(t('shop.obtained'))}</p></div>`;
    buyTimer = setTimeout(() => {
      got.classList.remove('is-on');
      got.innerHTML = '';
      window.open(href, '_blank', 'noopener');
    }, BUY_MS);
  }

  // ------------------------------------------------------------------ events
  function wire() {
    const page = root.querySelector('.shop__page');
    root.querySelectorAll('.shop-card').forEach((b) => b.addEventListener('click', () => showFiche(b.dataset.project)));
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
      if (page.scrollTop + page.clientHeight >= page.scrollHeight - 4) cur = secs.at(-1)?.dataset.aisle; // at the bottom: the last aisle
      root.querySelectorAll('.shop__tab').forEach((b) => b.classList.toggle('is-on', b.dataset.aisle === cur));
    };
    page.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    // only the cards on screen are animated
    io?.disconnect();
    visible.clear();
    io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))), { root: page });
    page.querySelectorAll('canvas[data-item]').forEach((c) => io.observe(c));
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
    const f = [...root.querySelectorAll('.shop-fiche__box button, .shop-fiche__box a[href]')];
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (i === -1 || (e.shiftKey && i === 0) || (!e.shiftKey && i === f.length - 1)) { e.preventDefault(); f[e.shiftKey ? f.length - 1 : 0].focus(); }
  }, true);

  // ------------------------------------------------------------------ the items' loops
  const paint = (c, f) => drawItem(c.getContext('2d'), c.dataset.item, f);
  function paintAll() {
    root.querySelectorAll('canvas[data-item]').forEach((c) => paint(c, reduced ? STILL_FRAME : frame));
  }
  function tick(now) {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    if (now - lastTick < 125) return; // 8 frames a second: retro steps
    lastTick = now;
    if (document.body.classList.contains('mode-profile')) return; // covered by the Profile
    frame++;
    if (openId) root.querySelectorAll('.shop-fiche canvas[data-item]').forEach((c) => paint(c, frame)); // the grid is hidden under the Fiche
    else visible.forEach((c) => paint(c, frame));
  }

  render();
  return {
    start() {
      if (running) return;
      running = true;
      root.querySelector('.shop__page')?.scrollTo(0, 0);
      paintAll();
      if (!reduced) raf = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(buyTimer);
      const got = root.querySelector('.shop-got');
      if (got) { got.classList.remove('is-on'); got.innerHTML = ''; }
      closeFiche({ refocus: false }); // the panel is closing: no focus into it
    },
    refresh: render,
  };
}
