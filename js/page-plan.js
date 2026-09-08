/* =============================================================================
   page-plan.js — 12-week plan scheduler
   -----------------------------------------------------------------------------
   Localisation detail worth calling out: the week does not start on the same
   day everywhere. English renders Sunday-first (matching the reference design);
   Arabic renders Saturday-first, which is the calendar convention across the
   Gulf. Day *values* stay 0=Sunday internally, so stored plans are portable.

   Validation is inline and specific (WCAG 2.2 SC 3.3.1 / 3.3.3: identify the
   error and suggest the correction) rather than a generic "invalid input".
   ========================================================================== */

import { initShell, $, $$, node, toast } from './app.js';
import { t, fmt, getLang } from './i18n.js';
import { getPlan, savePlan } from './store.js';

const MIN_WEEKS = 12;
const WEEK_ORDER = { en: [0, 1, 2, 3, 4, 5, 6], ar: [6, 0, 1, 2, 3, 4, 5] };

const state = { days: [0, 2, 4, 6], longDay: 0, reminder: true, time: '08:00' };

const iso = (d) => new Date(d).toISOString().slice(0, 10);

function order() { return WEEK_ORDER[getLang()] || WEEK_ORDER.en; }

function renderDayHeads() {
  const host = $('[data-day-heads]');
  host.textContent = '';
  order().forEach((i) => host.append(node('div', { class: 'daypicker__head' }, fmt.weekday(i, 'narrow'))));
}

function renderDays() {
  const host = $('[data-days]');
  host.textContent = '';
  order().forEach((i) => {
    const on = state.days.includes(i);
    const btn = node('button', {
      class: 'day',
      type: 'button',
      'aria-pressed': String(on),
      'data-long': String(state.longDay === i),
      'aria-label': fmt.weekday(i, 'long'),
      onclick: () => {
        state.days = on ? state.days.filter((d) => d !== i) : [...state.days, i].sort((a, b) => a - b);
        if (!state.days.includes(state.longDay)) state.longDay = state.days[0] ?? 0;
        renderDays(); renderLongSelect(); validate();
      },
    }, fmt.weekday(i, 'narrow'));
    host.append(btn);
  });
}

function renderLongSelect() {
  const sel = $('[data-long-day]');
  sel.textContent = '';
  state.days.forEach((i) => {
    const opt = node('option', { value: String(i) }, fmt.weekday(i, 'long'));
    if (i === state.longDay) opt.selected = true;
    sel.append(opt);
  });
}

function weeksBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / (7 * 864e5));
}

function renderSpan() {
  const w = weeksBetween($('#start').value, $('#end').value);
  $('[data-span]').textContent = Number.isFinite(w) && w > 0 ? t('plan.weeks', fmt.num(w)) : '';
}

function validate() {
  const err = $('[data-plan-error]');
  let message = '';
  if (state.days.length < 3) message = t('plan.tooFewDays');
  else if (state.days.length > 4) message = t('plan.tooManyDays');
  else if (weeksBetween($('#start').value, $('#end').value) < MIN_WEEKS) message = t('plan.tooShort');
  else if (!state.days.includes(state.longDay)) message = t('plan.longMustTrain');
  err.textContent = message;
  err.style.color = message ? 'var(--danger)' : '';
  $('[data-action="save-plan"]').disabled = Boolean(message);
  return !message;
}

async function hydrate() {
  const saved = await getPlan();
  const today = new Date();
  const end = new Date(today.getTime() + MIN_WEEKS * 7 * 864e5);

  $('#start').value = saved?.start || iso(today);
  $('#end').value = saved?.end || iso(end);
  $('#start').min = iso(today);
  if (saved) {
    state.days = saved.days;
    state.longDay = saved.longDay;
    state.reminder = saved.reminder;
    state.time = saved.time;
  }
  $('#reminder').checked = state.reminder;
  $('#remtime').value = state.time;
  render();
}

function render() { renderDayHeads(); renderDays(); renderLongSelect(); renderSpan(); validate(); }

async function onSave() {
  if (!validate()) return;
  state.reminder = $('#reminder').checked;
  state.time = $('#remtime').value;

  // Notifications are progressive: the plan saves either way, and permission is
  // only requested from this explicit user gesture — never on page load.
  if (state.reminder && 'Notification' in window && Notification.permission === 'default') {
    try { await Notification.requestPermission(); } catch { /* dismissed */ }
  }

  await savePlan({ start: $('#start').value, end: $('#end').value, ...state });

  const today = new Date().getDay();
  let offset = 0;
  while (offset < 8 && !state.days.includes((today + offset) % 7)) offset += 1;
  toast(t('plan.savedMsg', offset === 0 ? t('common.today') : fmt.weekday((today + offset) % 7, 'long')));
}

initShell({ page: 'train' });
hydrate();

$('[data-long-day]').addEventListener('change', (e) => {
  state.longDay = Number(e.target.value);
  renderDays(); validate();
});
$$('#start, #end').forEach((el) => el.addEventListener('change', () => { renderSpan(); validate(); }));
$('[data-action="save-plan"]').addEventListener('click', onSave);
document.addEventListener('langchange', render);
