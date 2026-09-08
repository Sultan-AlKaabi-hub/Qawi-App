/* =============================================================================
   app.js — shared shell runtime for every page
   -----------------------------------------------------------------------------
   This is a *multi-page* PWA. Navigation uses ordinary <a href> links, so the
   app works with JavaScript disabled or still parsing, and each document is a
   separate, independently cacheable entry point. The service worker makes the
   transitions instant from cache; a client-side router would have added a
   routing bug class for no measured benefit at this size.
   Ref: https://web.dev/articles/mpa-vs-spa
   ========================================================================== */

import { applyLang, detectLang, toggleLang, getLang, t } from './i18n.js';
import { settings, requestSync } from './store.js';

/* ---------- Service worker ------------------------------------------------ */
export function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  // Registration is deferred to 'load' so it never competes with the critical
  // rendering path on a slow 3G first visit.
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).then((reg) => {
      // Surface an update as soon as a new worker is waiting.
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateToast(reg);
          }
        });
      });
    }).catch((err) => console.warn('[qawi] SW registration failed:', err));
  });
}

function showUpdateToast(reg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.innerHTML = '';
  const span = document.createElement('span');
  span.textContent = getLang() === 'ar' ? 'يتوفر تحديث للتطبيق.' : 'A new version is ready.';
  const btn = document.createElement('button');
  btn.className = 'btn btn--primary';
  btn.style.marginInlineStart = '12px';
  btn.style.minHeight = '36px';
  btn.textContent = getLang() === 'ar' ? 'تحديث' : 'Reload';
  btn.addEventListener('click', () => {
    reg.waiting && reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  });
  el.append(span, btn);
  el.dataset.open = 'true';
}

/* ---------- Toast --------------------------------------------------------- */
let toastTimer;
export function toast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.dataset.open = 'true';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.dataset.open = 'false'; }, 3200);
}

/* ---------- Install prompt ------------------------------------------------ */
let deferredPrompt = null;
export function initInstall() {
  const buttons = document.querySelectorAll('[data-action="install"]');
  buttons.forEach((b) => { b.hidden = true; });

  window.addEventListener('beforeinstallprompt', (e) => {
    // Chromium fires this when the installability criteria are met. We keep the
    // event and show our own affordance instead of the mini-infobar.
    e.preventDefault();
    deferredPrompt = e;
    buttons.forEach((b) => { b.hidden = false; });
  });

  buttons.forEach((b) => b.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    b.hidden = true;
  }));

  window.addEventListener('appinstalled', () => {
    buttons.forEach((btn) => { btn.hidden = true; });
    toast(t('common.installed'));
  });
}

/* ---------- Connectivity -------------------------------------------------- */
function paintConnectivity() {
  document.body.classList.toggle('is-offline', !navigator.onLine);
}
export function initConnectivity() {
  paintConnectivity();
  window.addEventListener('online', () => { paintConnectivity(); requestSync(); });
  window.addEventListener('offline', paintConnectivity);
}

/* ---------- Theme, motion, language -------------------------------------- */
export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  settings.set('theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#ffffff' : '#101012');
}

export function applyMotion(reduce) {
  document.documentElement.dataset.reduceMotion = reduce ? 'true' : 'false';
  settings.set('reduceMotion', reduce);
}

export function prefersReducedMotion() {
  return settings.get('reduceMotion') === true
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ---------- Shell bootstrap ---------------------------------------------- */
/**
 * Call once per page, after the DOM is parsed.
 * @param {{page?: string}} options page id matching a [data-tab] in the tab bar
 */
export function initShell({ page } = {}) {
  applyLang(detectLang());
  applyTheme(settings.get('theme'));

  // Mark the active tab for both styling and assistive technology.
  if (page) {
    const tab = document.querySelector(`.tab[data-tab="${page}"]`);
    if (tab) tab.setAttribute('aria-current', 'page');
  }

  document.querySelectorAll('[data-action="toggle-lang"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      toggleLang();
      document.dispatchEvent(new CustomEvent('shell:rerender'));
    });
  });

  document.querySelectorAll('[data-action="back"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (history.length > 1) history.back(); else location.href = './index.html';
    });
  });

  initConnectivity();
  initInstall();
  registerSW();
}

/* ---------- Small DOM helpers -------------------------------------------- */
export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function node(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) el.setAttribute(k, v);
  });
  children.flat().forEach((c) => el.append(c instanceof Node ? c : document.createTextNode(c)));
  return el;
}

/**
 * Weight is always *stored* in kilograms; only the display converts. That keeps
 * a training history comparable if the user switches units mid-programme.
 */
export function formatWeight(kg, { withUnit = true } = {}) {
  const lb = settings.get('units') === 'lb';
  const value = lb ? kg * 2.2046226 : kg;
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  const num = new Intl.NumberFormat(getLang() === 'ar' ? 'ar-AE-u-nu-latn' : 'en-AE').format(rounded);
  return withUnit ? `${num} ${t(lb ? 'common.lb' : 'common.kg')}` : num;
}

/** Set a progress ring's dash offset. r must match the SVG circle radius. */
export function setRing(circle, fraction, r = 44) {
  const c = 2 * Math.PI * r;
  circle.style.strokeDasharray = String(c);
  circle.style.strokeDashoffset = String(c * (1 - Math.min(1, Math.max(0, fraction))));
}
