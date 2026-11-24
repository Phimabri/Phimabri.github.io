// The Profile: Malo's session in malOS. Opens full screen over the site from anywhere (the
// avatar in the top bar, the name in welcome.txt, "On request" in the Shop). Decor = the ASCII
// scene; the contact block is real, fixed HTML on top. See .scratch/profil/spec.md.
import { createAsciiScene } from './ascii.js';

// assembled at run time, so the address is not sitting in the HTML for scrapers
const MAIL = ['malo.evain.eu', 'gmail.com'].join('@');

export function createProfile({ t, reduced }) {
  const el = document.getElementById('profile');
  const btn = document.getElementById('profileBtn');
  const card = document.getElementById('profileCard');
  const credit = el.querySelector('.profile__credit');
  const closeBtn = document.getElementById('profileClose');
  const mail = document.getElementById('profileMail');
  const copied = document.getElementById('profileCopied');
  mail.href = 'mailto:' + MAIL;
  mail.textContent = MAIL;

  const canvas = el.querySelector('canvas');
  const toCanvas = (r) => { const c = canvas.getBoundingClientRect(); return { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top }; };
  const scene = createAsciiScene(canvas, {
    reduced,
    avoid: () => [card, credit, closeBtn, document.querySelector('.topbar')].map((n) => toCanvas(n.getBoundingClientRect())),
    // on narrow screens the card fills the bottom: the Silhouette walks on top of it
    ground: () => (innerWidth < 700 ? toCanvas(card.getBoundingClientRect()).top : Infinity),
  });

  let isOpen = false, lastFocus = null, hideTimer = 0, copyTimer = 0;

  function open() {
    if (isOpen) return;
    isOpen = true;
    clearTimeout(hideTimer);
    lastFocus = document.activeElement;
    el.hidden = false;
    el.getBoundingClientRect(); // layout before the fade, so the scene can measure the card
    el.classList.add('is-open');
    document.body.classList.add('mode-profile');
    btn.setAttribute('aria-expanded', 'true');
    scene.start();
    closeBtn.focus({ preventScroll: true });
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    el.classList.remove('is-open');
    document.body.classList.remove('mode-profile');
    btn.setAttribute('aria-expanded', 'false');
    scene.stop();
    hideTimer = setTimeout(() => { el.hidden = true; }, reduced ? 0 : 300);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  btn.addEventListener('click', () => (isOpen ? close() : open()));
  closeBtn.addEventListener('click', close);
  // Escape closes the Profile first (before any program underneath)
  window.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    // keep the keyboard inside the dialog (plus the avatar, which closes it)
    const f = [btn, ...el.querySelectorAll('a[href], button')];
    const i = f.indexOf(document.activeElement);
    const next = f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length];
    e.preventDefault();
    next.focus();
  }, true);

  document.getElementById('profileCopy').addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(MAIL); ok = true; } catch {
      const r = document.createRange(); r.selectNodeContents(mail);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      ok = document.execCommand?.('copy') ?? false;
    }
    copied.textContent = t(ok ? 'profile.copied' : 'profile.copyFail');
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copied.textContent = ''; }, 2400);
  });

  return {
    open, close,
    get isOpen() { return isOpen; },
    // the card may change size with the language: lay the page out again
    refresh() { if (isOpen) scene.relayout(); },
  };
}
