/* =============================================================================
   page-train.js — routine library
   Filters are a single-select chip group implemented as a real tablist so
   keyboard and screen-reader users get arrow-key semantics for free.
   ========================================================================== */

import { initShell, $, node } from './app.js';
import { t, fmt, getLang } from './i18n.js';
import { ROUTINES, EXERCISES, MUSCLES, loc } from './data.js';

const GROUPS = [
  { id: 'all', key: 'common.all' },
  { id: 'push', key: 'train.push' },
  { id: 'pull', key: 'train.pull' },
  { id: 'legs', key: 'train.legs' },
  { id: 'full', key: 'train.full' },
  { id: 'core', key: 'train.core' },
];

let active = 'all';

function renderFilters() {
  const host = $('[data-filters]');
  host.textContent = '';
  GROUPS.forEach((g) => {
    const chip = node('button', {
      class: 'chip',
      type: 'button',
      // Toggle buttons, not tabs: there are no tab panels, and aria-pressed is
      // the correct pattern for a filter that reshapes a list in place.
      'aria-pressed': String(g.id === active),
      onclick: () => { active = g.id; renderFilters(); renderList(); },
    }, t(g.key));
    host.append(chip);
  });
}

function targetSummary(routine, lang) {
  const seen = new Set();
  routine.exercises.forEach((id) => {
    const ex = EXERCISES[id];
    if (ex) seen.add(ex.muscles[0]);
  });
  return Array.from(seen).slice(0, 4).map((m) => loc(MUSCLES[m], lang)).join(' · ');
}

function renderList() {
  const lang = getLang();
  const host = $('[data-routines]');
  host.textContent = '';
  const rows = ROUTINES.filter((r) => active === 'all' || r.group === active);

  rows.forEach((r) => {
    host.append(node('article', { class: 'card', style: 'margin-block-end:var(--s3)' },
      node('h2', {}, loc(r.name, lang)),
      node('p', { class: 'muted num', style: 'margin-block:var(--s2) var(--s4)' },
        `${fmt.num(r.exercises.length)} ${t('common.exercises')} · ${t('train.estimated')} ${fmt.duration(r.minutes)}`),
      node('p', { class: 'eyebrow' }, t('train.targets')),
      node('p', { style: 'margin-block-end:var(--s4)' }, targetSummary(r, lang)),
      node('a', { class: 'btn btn--primary btn--block', href: `./workout.html?routine=${r.id}` },
        t('common.start')),
    ));
  });
}

function render() { renderFilters(); renderList(); }

initShell({ page: 'train' });
render();
document.addEventListener('langchange', render);
