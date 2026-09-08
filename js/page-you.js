/* =============================================================================
   page-you.js — profile, load map and settings
   -----------------------------------------------------------------------------
   Data ownership is a first-class feature here, not a legal footnote: everything
   is stored on the device, exportable as JSON in one tap, and deletable in one
   tap. There is no account and no server, so there is nothing else to disclose.
   ========================================================================== */

import { initShell, $, node, applyTheme, applyMotion, formatWeight, toast } from './app.js';
import { t, fmt, getLang, applyLang } from './i18n.js';
import { muscleLoad, listSessions, settings, exportAll, clearAll } from './store.js';
import { renderBodyMap, renderLoadSummary } from './bodymap.js';

function stat(labelKey, value, suffix) {
  return node('div', { class: 'stat' },
    node('div', { class: 'stat__label' }, t(labelKey)),
    node('div', { class: 'stat__value num' }, value, suffix ? node('span', {}, ` ${suffix}`) : ''),
  );
}

async function renderMap() {
  const lang = getLang();
  const load = await muscleLoad(7);
  renderBodyMap($('[data-bodymap]'), load, lang, { front: t('you.front'), back: t('you.back') });
  $('[data-load-summary]').textContent = renderLoadSummary(load, lang, t('you.noMuscleData'));
}

async function renderLifetime() {
  const sessions = await listSessions({ limit: 10000 });
  const totals = sessions.reduce((acc, s) => {
    acc.sessions += 1;
    acc.seconds += s.elapsedSec || 0;
    acc.sets += s.sets.length;
    acc.volume += s.sets.reduce((v, x) => v + (x.weight || 0) * (x.reps || 0), 0);
    return acc;
  }, { sessions: 0, seconds: 0, sets: 0, volume: 0 });

  const host = $('[data-lifetime]');
  host.textContent = '';
  host.append(
    stat('home.sessions', fmt.num(totals.sessions)),
    stat('home.volume', formatWeight(totals.volume)),
    stat('home.sets', fmt.num(totals.sets)),
    stat('home.time', fmt.num(Math.round(totals.seconds / 3600)), getLang() === 'ar' ? 'س' : 'h'),
  );
}

async function renderStorage() {
  const sub = document.querySelector('.topbar__title small');
  if (!sub || !navigator.storage?.estimate) return;
  const { usage = 0 } = await navigator.storage.estimate();
  sub.removeAttribute('data-i18n');
  sub.textContent = `${t('you.storage')} · ${fmt.num(Math.max(1, Math.round(usage / 1024)))} KB`;
}

function wireSettings() {
  const lang = $('#lang');
  lang.value = getLang();
  lang.addEventListener('change', () => {
    applyLang(lang.value);
    render();
  });

  const theme = $('#theme');
  theme.checked = settings.get('theme') !== 'light';
  theme.addEventListener('change', () => applyTheme(theme.checked ? 'dark' : 'light'));

  const units = $('#units');
  units.value = settings.get('units');
  units.addEventListener('change', () => {
    settings.set('units', units.value);
    renderLifetime();
  });

  const motion = $('#motion');
  motion.checked = settings.get('reduceMotion') === true;
  motion.addEventListener('change', () => applyMotion(motion.checked));

  /**
   * Export has three paths, tried in order, because a blob download is exactly
   * the thing that silently fails inside a native WebView wrapper (Median,
   * Capacitor, plain WKWebView): the anchor click produces nothing at all.
   *   1. Web Share with a file  — works in most WebViews and mobile browsers
   *   2. Anchor download        — the desktop and mobile-browser path
   *   3. Clipboard              — last resort, but the data is never trapped
   */
  $('[data-action="export"]').addEventListener('click', async () => {
    const json = JSON.stringify(await exportAll(), null, 2);
    const filename = `qawi-export-${new Date().toISOString().slice(0, 10)}.json`;

    try {
      const file = new File([json], filename, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Qawi' });
        return;
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return;   // user cancelled the sheet
    }

    try {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = node('a', { href: url, download: filename });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      // A WebView will accept this call and do nothing, so verify below.
      if (!/median|gonative|wv\)/i.test(navigator.userAgent)) return;
    } catch { /* fall through */ }

    try {
      await navigator.clipboard.writeText(json);
      toast(t('you.exportCopied'));
    } catch {
      toast(t('you.exportFailed'));
    }
  });

  $('[data-action="clear"]').addEventListener('click', async () => {
    if (!confirm(t('you.clearConfirm'))) return;
    await clearAll();
    toast(t('you.cleared'));
    setTimeout(() => location.reload(), 800);
  });
}

async function render() {
  await Promise.all([renderMap(), renderLifetime(), renderStorage()]);
}

initShell({ page: 'you' });
wireSettings();
render();
document.addEventListener('langchange', () => {
  const sel = $('#lang');
  if (sel) sel.value = getLang();
  render();
});
