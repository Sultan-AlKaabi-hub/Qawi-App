/* =============================================================================
   page-home.js — the dashboard
   Answers three questions in order of urgency: what did I do this week, what am
   I doing next, and what did I do last. Everything reads from IndexedDB, so the
   page is identical online and offline.
   ========================================================================== */

import { initShell, $, node, formatWeight, toast } from './app.js';
import { t, fmt, getLang } from './i18n.js';
import { weeklyTotals, listSessions, getPlan } from './store.js';
import { ROUTINES, loc } from './data.js';

const WEEKLY_SESSION_GOAL = 4;

function greetingKey(hour) {
  if (hour < 12) return 'home.greetMorning';
  if (hour < 18) return 'home.greetAfternoon';
  return 'home.greetEvening';
}

function stat(labelKey, value, suffix) {
  return node('div', { class: 'stat' },
    node('div', { class: 'stat__label' }, t(labelKey)),
    node('div', { class: 'stat__value num' }, value, suffix ? node('span', {}, ` ${suffix}`) : ''),
  );
}

async function renderWeek() {
  const totals = await weeklyTotals(7);
  const host = $('[data-week-stats]');
  host.textContent = '';
  host.append(
    stat('home.volume', formatWeight(totals.volume, { withUnit: false }),
      t(localStorage.getItem('qawi.units') === 'lb' ? 'common.lb' : 'common.kg')),
    stat('home.sessions', fmt.num(totals.sessions)),
    stat('home.time', fmt.num(Math.round(totals.seconds / 60)), t('common.min')),
    stat('home.sets', fmt.num(totals.sets)),
  );

  const pct = Math.min(1, totals.sessions / WEEKLY_SESSION_GOAL);
  $('[data-goal-bar]').style.inlineSize = `${pct * 100}%`;
  $('[data-goal-label]').textContent =
    `${fmt.num(totals.sessions)} ${t('home.goalOf')} ${fmt.num(WEEKLY_SESSION_GOAL)}`;
}

/** Next session: the plan's next training day if a plan exists, else Push A. */
async function renderNext() {
  const plan = await getPlan();
  const lang = getLang();
  let routine = ROUTINES[0];
  let when = t('common.today');

  if (plan && Array.isArray(plan.days) && plan.days.length) {
    const today = new Date().getDay(); // 0 = Sunday
    let offset = 0;
    while (offset < 8 && !plan.days.includes((today + offset) % 7)) offset += 1;
    const dayIndex = (today + offset) % 7;
    when = offset === 0 ? t('common.today') : fmt.weekday(dayIndex, 'long');
    // Rotate routines across the week so the plan does not repeat one session.
    routine = ROUTINES[plan.days.indexOf(dayIndex) % ROUTINES.length];
  }

  $('[data-next-title]').textContent = loc(routine.name, lang);
  $('[data-next-meta]').textContent =
    `${when} · ${fmt.num(routine.exercises.length)} ${t('common.exercises')} · ${t('train.estimated')} ${fmt.duration(routine.minutes)}`;
  $('[data-next-link]').href = `./workout.html?routine=${routine.id}`;
}

async function renderRecent() {
  const host = $('[data-recent]');
  const sessions = await listSessions({ limit: 5 });
  host.textContent = '';

  if (!sessions.length) {
    host.append(node('div', { class: 'card empty' },
      node('h3', {}, t('home.noActivity')),
      node('p', { style: 'margin-inline:auto' }, t('home.noActivityHint')),
    ));
    return;
  }

  sessions.forEach((s) => {
    const volume = s.sets.reduce((v, set) => v + (set.weight || 0) * (set.reps || 0), 0);
    const card = node('article', { class: 'card', style: 'margin-block-end:var(--s3)' },
      node('div', { class: 'activity__head' },
        node('span', { class: 'avatar', 'aria-hidden': 'true' }, (s.title || 'Q').slice(0, 1)),
        node('div', {},
          node('strong', {}, s.title || t('nav.record')),
          node('div', { class: 'muted num', style: 'font-size:.82rem' },
            fmt.date(s.startedAt, { weekday: 'short', day: 'numeric', month: 'short' })
            + ' · ' + fmt.date(s.startedAt, { hour: 'numeric', minute: '2-digit' })),
        ),
      ),
      node('div', { class: 'stat-grid' },
        stat('workout.elapsed', fmt.clock(s.elapsedSec)),
        stat('home.volume', formatWeight(volume)),
        stat('home.sets', fmt.num(s.sets.length)),
        stat('home.time', fmt.num(Math.round(s.elapsedSec / 60)), t('common.min')),
      ),
    );
    host.append(card);
  });
}

async function render() {
  const now = new Date();
  $('[data-greeting]').textContent = t(greetingKey(now.getHours()));
  $('[data-today]').textContent =
    fmt.date(now, { weekday: 'long', day: 'numeric', month: 'long' });
  await Promise.all([renderWeek(), renderNext(), renderRecent()]);
}

initShell({ page: 'home' });
render().catch((err) => { console.error(err); toast('Could not read local data'); });
document.addEventListener('langchange', () => { render(); });
