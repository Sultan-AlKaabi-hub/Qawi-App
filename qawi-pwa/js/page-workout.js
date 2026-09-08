/* =============================================================================
   page-workout.js — the guided session player
   -----------------------------------------------------------------------------
   Behaviour notes:
   • The in-progress session is mirrored to localStorage on every change, so a
     tab crash, a phone call or an OS memory purge mid-workout loses nothing.
   • A Screen Wake Lock is requested while a session is running and re-acquired
     on visibilitychange, because the screen going dark between sets is the
     single most common complaint in gym apps.
     Ref: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
   • Live-region announcements accompany every ring change: the rings are
     decorative for assistive technology (aria-hidden) and the text is the
     source of truth.
   ========================================================================== */

import { initShell, $, setRing, toast, formatWeight, prefersReducedMotion } from './app.js';
import { t, fmt, getLang } from './i18n.js';
import { saveSession } from './store.js';
import { ROUTINES, EXERCISES, MUSCLES, loc } from './data.js';
import { renderBodyMap } from './bodymap.js';

const DRAFT_KEY = 'qawi.activeSession';

const params = new URLSearchParams(location.search);
const routine = ROUTINES.find((r) => r.id === params.get('routine')) || ROUTINES[0];

const state = {
  routineId: routine.id,
  index: 0,
  setsDone: routine.exercises.map(() => 0),
  sets: [],
  startedAt: Date.now(),
  restRemaining: 0,
};

/* ---------- Draft persistence -------------------------------------------- */
function saveDraft() {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); } catch { /* quota */ }
}
function loadDraft() {
  try {
    const raw = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (raw && raw.routineId === routine.id && Date.now() - raw.startedAt < 6 * 3600e3) {
      Object.assign(state, raw, { restRemaining: 0 });
    }
  } catch { /* corrupt draft: start clean */ }
}
function clearDraft() { localStorage.removeItem(DRAFT_KEY); }

/* ---------- Wake lock ----------------------------------------------------- */
let wakeLock = null;
async function acquireWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try { wakeLock = await navigator.wakeLock.request('screen'); } catch { /* denied */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !wakeLock) acquireWakeLock();
});

/* ---------- Rendering ----------------------------------------------------- */
const currentExercise = () => EXERCISES[routine.exercises[state.index]];

function renderExercise() {
  const lang = getLang();
  const ex = currentExercise();
  const done = state.setsDone[state.index];

  $('[data-progress]').textContent =
    t('workout.exerciseOf', fmt.num(state.index + 1), fmt.num(routine.exercises.length));
  $('[data-ex-name]').textContent = loc(ex.name, lang);
  $('[data-ex-weight]').textContent = ex.weightKg
    ? `${t('workout.recommended')}: ${formatWeight(ex.weightKg)}`
    : loc(MUSCLES[ex.muscles[0]], lang);
  $('[data-ex-cue]').textContent = loc(ex.cue, lang);

  // Ring 1 — the rep target for this set. Drawn as a full dial: it is a target,
  // not a progress value, and the number is the information.
  $('[data-val-reps]').textContent = fmt.num(ex.reps);
  setRing($('[data-ring-reps]'), 1);

  // Ring 3 — sets completed.
  $('[data-val-sets]').textContent = `${fmt.num(done)}/${fmt.num(ex.sets)}`;
  setRing($('[data-ring-sets]'), done / ex.sets);

  // Target muscles on the body map: prime mover hot, synergists warm.
  const load = {};
  ex.muscles.forEach((m, i) => { load[m] = i === 0 ? 1 : 0.45; });
  renderBodyMap($('[data-target-map]'), load, lang, { front: t('you.front'), back: t('you.back') });

  $('[data-action="prev-ex"]').disabled = state.index === 0;
  $('[data-action="next-ex"]').disabled = state.index === routine.exercises.length - 1;

  // The top bar names the routine, not the exercise, so the user always knows
  // which session they are inside. Detach it from the i18n sweep first.
  const heading = document.querySelector('.topbar__title > span');
  if (heading) { heading.removeAttribute('data-i18n'); heading.textContent = loc(routine.name, lang); }

  document.title = `${loc(ex.name, lang)} — ${t('app.name')}`;
}

function renderRest() {
  const ex = currentExercise();
  $('[data-val-rest]').textContent = fmt.clock(state.restRemaining);
  setRing($('[data-ring-rest]'), state.restRemaining / ex.restSec);
  // The skip control only exists while it can do something — no dead buttons.
  $('[data-action="skip-rest"]').hidden = state.restRemaining <= 0;
}

function skipRest() {
  restEndsAt = 0;
  state.restRemaining = 0;
  renderRest();
  announce(t('workout.skipRest'));
}

function announce(message) {
  const live = $('[data-live]');
  live.textContent = '';                      // force a re-announcement
  requestAnimationFrame(() => { live.textContent = message; });
}

/* ---------- Timers -------------------------------------------------------- */
// One interval drives both the elapsed clock and the rest countdown. Wall-clock
// arithmetic (not tick counting) keeps them accurate when the tab is throttled.
let restEndsAt = 0;

setInterval(() => {
  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  const subtitle = $('.topbar__title small');
  if (subtitle) subtitle.textContent = `${t('workout.elapsed')} ${fmt.clock(elapsed)}`;

  if (restEndsAt) {
    const left = Math.max(0, Math.round((restEndsAt - Date.now()) / 1000));
    if (left !== state.restRemaining) {
      state.restRemaining = left;
      renderRest();
      if (left === 0) {
        restEndsAt = 0;
        announce(t('common.rest') + ' — ' + t('common.done'));
        if (navigator.vibrate && !prefersReducedMotion()) navigator.vibrate([120, 60, 120]);
      }
    }
  }
}, 250);

function startRest(seconds) {
  restEndsAt = Date.now() + seconds * 1000;
  state.restRemaining = seconds;
  renderRest();
}

/* ---------- Actions ------------------------------------------------------- */
function logSet() {
  const ex = currentExercise();
  const key = routine.exercises[state.index];
  if (state.setsDone[state.index] >= ex.sets) return;

  state.setsDone[state.index] += 1;
  state.sets.push({
    exerciseId: key, reps: ex.reps, weight: ex.weightKg, muscles: ex.muscles, at: Date.now(),
  });
  saveDraft();
  renderExercise();
  startRest(ex.restSec);
  announce(`${t('workout.setLogged')}. ${fmt.num(state.setsDone[state.index])}/${fmt.num(ex.sets)}`);

  // When the last set of an exercise lands, move on automatically — the user's
  // hands are usually busy at that moment.
  if (state.setsDone[state.index] === ex.sets && state.index < routine.exercises.length - 1) {
    setTimeout(() => move(1), 700);
  }
}

function move(delta) {
  const next = state.index + delta;
  if (next < 0 || next >= routine.exercises.length) return;
  state.index = next;
  restEndsAt = 0;
  state.restRemaining = 0;
  saveDraft();
  renderExercise();
  renderRest();
  $('#main').focus();
}

async function finish() {
  if (!state.sets.length) { history.back(); return; }
  if (!confirm(t('workout.confirmFinish'))) return;
  await saveSession({
    routineId: routine.id,
    title: loc(routine.name, getLang()),
    startedAt: state.startedAt,
    endedAt: Date.now(),
    elapsedSec: Math.round((Date.now() - state.startedAt) / 1000),
    sets: state.sets,
  });
  clearDraft();
  window.__qawiFinished = true;   // release the unsaved-work guard below
  if (wakeLock) { wakeLock.release(); wakeLock = null; }
  toast(t('workout.sessionSaved'));
  setTimeout(() => { location.href = './index.html'; }, 600);
}

/* ---------- Boot ---------------------------------------------------------- */
initShell({ page: 'record' });
loadDraft();
renderExercise();
renderRest();
acquireWakeLock();

$('[data-action="log-set"]').addEventListener('click', logSet);
$('[data-action="skip-rest"]').addEventListener('click', skipRest);
$('[data-action="next-ex"]').addEventListener('click', () => move(1));
$('[data-action="prev-ex"]').addEventListener('click', () => move(-1));
$('[data-action="finish"]').addEventListener('click', finish);
document.addEventListener('langchange', () => { renderExercise(); renderRest(); });

// Warn before an accidental navigation away from an unfinished session.
window.addEventListener('beforeunload', (e) => {
  if (state.sets.length && !window.__qawiFinished) { e.preventDefault(); e.returnValue = ''; }
});
