// The Shop (Projects chapter): a retro game's online shop, open in a malOS browser.
// Each Project is an item for sale in cups of coffee. Same contract as the programs:
// create(root, { t }) -> { start, stop, refresh }. See DA.md §17 and .scratch/boutique-projets/.
import { getLang } from '../i18n.js';
import { PROJECTS, byAisle, price, rarity } from './catalog.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export function createShop(root, { t }) {
  // numbering follows the display order (#01 … #05)
  const number = () => {
    const order = byAisle(PROJECTS).flatMap((g) => g.projects);
    return new Map(order.map((p, i) => [p.id, i + 1]));
  };

  function card(p, n, total, lang) {
    const r = rarity(p);
    return `
      <li>
        <article class="shop-card shop-card--${r}" data-project="${p.id}">
          <div class="shop-card__band"><span class="shop-card__price">${price(p)} ☕</span><span class="shop-card__rar">${esc(t('shop.rarity.' + r))}</span></div>
          <div class="shop-card__art" data-item="${p.item}" aria-hidden="true"></div>
          <div class="shop-card__meta"><span>#${String(n).padStart(2, '0')} · ${n}/${total}</span><span>${esc(p.date.slice(0, 4))}</span></div>
          <h3 class="shop-card__title">${esc(p.title[lang])}</h3>
          <p class="shop-card__blurb">${esc(p.blurb[lang])}</p>
        </article>
      </li>`;
  }

  function render() {
    const lang = getLang();
    const nums = number();
    const groups = byAisle(PROJECTS);
    root.innerHTML = `
      <div class="shop">
        <div class="shop__chrome" aria-hidden="true">
          <span class="shop__nav"><i>‹</i><i>›</i><i>↻</i></span>
          <span class="shop__url"><b>https://</b>projets.malo.shop</span>
        </div>
        <div class="shop__page" data-lenis-prevent>
          <header class="shop__hero">
            <p class="shop__kicker">${esc(t('shop.kicker'))}</p>
            <h1 class="shop__title">${esc(t('shop.title'))}</h1>
            <p class="shop__lede">${esc(t('shop.lede'))}</p>
          </header>
          ${groups.map((g) => `
            <section class="shop__aisle" id="shop-aisle-${g.aisle}" aria-labelledby="shop-aisle-${g.aisle}-h">
              <h2 class="shop__aisle-h" id="shop-aisle-${g.aisle}-h">${esc(t('shop.aisle.' + g.aisle))}</h2>
              <ul class="shop__grid" role="list">${g.projects.map((p) => card(p, nums.get(p.id), PROJECTS.length, lang)).join('')}</ul>
            </section>`).join('')}
          <footer class="shop__foot">${esc(t('shop.foot'))}</footer>
        </div>
      </div>`;
  }

  render();
  return {
    start() { root.querySelector('.shop__page')?.scrollTo(0, 0); },
    stop() {},
    refresh: render,
  };
}
