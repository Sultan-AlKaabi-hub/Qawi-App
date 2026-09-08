/* =============================================================================
   page-routes.js — route discovery
   -----------------------------------------------------------------------------
   No tile server and no map SDK. Routes are drawn from normalised path data in
   a 0–100 viewBox over a generated contour backdrop. That choice costs some
   geographic fidelity and buys three things that matter more for this release:
   the page works with no connection, it adds zero third-party JavaScript to the
   critical path, and no user location leaves the device.
   Swapping in real tiles later is a change to one render function.
   ========================================================================== */

import { initShell, $, node, toast } from './app.js';
import { t, fmt, getLang } from './i18n.js';
import { ROUTES, SURFACES, loc } from './data.js';
import { listSavedRoutes, toggleSavedRoute } from './store.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const state = {
  type: 'all', sort: 'length', surface: 'all', query: '',
  selected: ROUTES[0].id, saved: new Set(),
};

const TYPES = [
  { id: 'all', key: 'routes.filterRoutes' },
  { id: 'ride', key: 'routes.ride' },
  { id: 'run', key: 'routes.run' },
];
const SORTS = [
  { id: 'length', key: 'routes.length' },
  { id: 'elevation', key: 'routes.elevation' },
];

function visibleRoutes() {
  const q = state.query.trim().toLowerCase();
  const lang = getLang();
  return ROUTES
    .filter((r) => state.type === 'all' || r.type === state.type)
    .filter((r) => state.surface === 'all' || r.surface === state.surface)
    .filter((r) => !q
      || loc(r.name, lang).toLowerCase().includes(q)
      || loc(r.area, lang).toLowerCase().includes(q))
    .sort((a, b) => (state.sort === 'elevation' ? b.elevM - a.elevM : b.km - a.km));
}

/* ---------- Map ----------------------------------------------------------- */
function renderMap() {
  const host = $('[data-map]');
  const route = ROUTES.find((r) => r.id === state.selected) || visibleRoutes()[0];
  host.textContent = '';
  if (!route) return;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${loc(route.name, getLang())} — ${fmt.num(route.km)} ${t('common.km')}`);
  svg.style.aspectRatio = '1 / 0.72';

  // Contour backdrop: cheap, decorative, and never competes with the route line.
  const bg = document.createElementNS(SVG_NS, 'g');
  bg.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 7; i += 1) {
    const p = document.createElementNS(SVG_NS, 'path');
    const y = 12 + i * 12;
    p.setAttribute('d', `M0,${y} C22,${y - 7} 38,${y + 7} 58,${y - 3} S86,${y + 6} 100,${y - 2}`);
    p.style.fill = 'none';
    p.style.stroke = 'var(--line-soft)';
    p.style.strokeWidth = '0.6';
    bg.appendChild(p);
  }
  svg.appendChild(bg);

  const line = document.createElementNS(SVG_NS, 'path');
  line.setAttribute('d', route.path);
  line.style.fill = 'none';
  line.style.stroke = 'var(--ember)';
  line.style.strokeWidth = '2.4';
  line.style.strokeLinecap = 'round';
  line.style.strokeLinejoin = 'round';
  svg.appendChild(line);

  const startPoint = route.path.match(/-?\d+(\.\d+)?/g) || ['10', '80'];
  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', startPoint[0]);
  dot.setAttribute('cy', startPoint[1]);
  dot.setAttribute('r', '2.6');
  dot.style.fill = 'var(--ink)';
  dot.style.stroke = 'var(--ember)';
  dot.style.strokeWidth = '1.4';
  svg.appendChild(dot);

  host.appendChild(svg);

  const caption = node('div', { class: 'card', style: 'border-radius:var(--r-md);padding:var(--s3) var(--s4)' },
    node('strong', {}, loc(route.name, getLang())),
    node('div', { class: 'route__meta num' },
      `${fmt.num(route.km)} ${t('common.km')}`,
      `${fmt.num(route.elevM)} ${t('common.m')}`,
      fmt.duration(route.minutes)),
    route.forYou ? node('div', { class: 'route__tag' }, t('routes.madeForYou')) : '',
  );
  host.appendChild(node('div', { class: 'mapcanvas__overlay' }, caption));
}

/* ---------- Chips --------------------------------------------------------- */
function renderChips() {
  const host = $('[data-route-filters]');
  host.textContent = '';
  TYPES.forEach((f) => host.append(node('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(state.type === f.id),
    onclick: () => { state.type = f.id; render(); },
  }, t(f.key))));

  SORTS.forEach((s) => host.append(node('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(state.sort === s.id),
    onclick: () => { state.sort = s.id; render(); },
  }, t(s.key))));

  // Surface chips come from the content model, so adding a surface to data.js
  // adds a filter with no code change here.
  const surfaces = $('[data-surface-filters]');
  surfaces.textContent = '';
  [['all', t('common.all')], ...Object.entries(SURFACES).map(([k, v]) => [k, loc(v, getLang())])]
    .forEach(([id, label]) => surfaces.append(node('button', {
      class: 'chip', type: 'button', 'aria-pressed': String(state.surface === id),
      onclick: () => { state.surface = id; render(); },
    }, label)));
}

/* ---------- List ---------------------------------------------------------- */
function renderList() {
  const lang = getLang();
  const host = $('[data-routes]');
  const rows = visibleRoutes();
  host.textContent = '';
  $('[data-route-count]').textContent = t('routes.count', fmt.num(rows.length));

  if (!rows.length) {
    host.append(node('div', { class: 'empty' }, node('h3', {}, t('routes.count', fmt.num(0)))));
    return;
  }

  rows.forEach((r) => {
    const isSaved = state.saved.has(r.id);
    const save = node('button', {
      class: 'iconbtn',
      type: 'button',
      'aria-pressed': String(isSaved),
      'aria-label': isSaved ? t('routes.unsave') : t('routes.save'),
      onclick: async (e) => {
        e.preventDefault(); e.stopPropagation();
        const nowSaved = await toggleSavedRoute({
          id: r.id, km: r.km, elevM: r.elevM, minutes: r.minutes,
          path: r.path, name: r.name, area: r.area, type: r.type,
        });
        nowSaved ? state.saved.add(r.id) : state.saved.delete(r.id);
        toast(nowSaved ? t('routes.saved') : t('routes.unsave'));
        renderList();
      },
    });
    const icon = document.createElementNS(SVG_NS, 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('class', 'no-flip');
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '#i-bookmark');
    icon.appendChild(use);
    if (isSaved) icon.style.color = 'var(--ember)';
    save.appendChild(icon);

    const thumb = node('div', { class: 'route__thumb' });
    const mini = document.createElementNS(SVG_NS, 'svg');
    mini.setAttribute('viewBox', '0 0 100 100');
    mini.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', r.path);
    p.style.fill = 'none';
    p.style.stroke = 'var(--ember)';
    p.style.strokeWidth = '4';
    p.style.strokeLinecap = 'round';
    mini.appendChild(p);
    thumb.appendChild(mini);

    const row = node('div', { class: 'route' },
      thumb,
      node('div', { style: 'flex:1;min-width:0' },
        node('strong', {}, loc(r.name, lang)),
        node('div', { class: 'route__meta num' },
          `${fmt.num(r.km)} ${t('common.km')}`,
          `${fmt.num(r.elevM)} ${t('common.m')}`,
          loc(SURFACES[r.surface], lang)),
        node('div', { class: 'muted', style: 'font-size:.82rem' }, loc(r.area, lang)),
        r.forYou ? node('div', { class: 'route__tag' }, t('routes.madeForYou')) : '',
      ),
      save,
    );
    row.addEventListener('click', () => {
      state.selected = r.id;
      renderMap();
      $('[data-map]').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    host.append(row);
  });
}

function render() { renderChips(); renderMap(); renderList(); }

initShell({ page: 'routes' });
listSavedRoutes().then((saved) => {
  state.saved = new Set(saved.map((r) => r.id));
  render();
});
$('#q').addEventListener('input', (e) => { state.query = e.target.value; renderList(); });
document.addEventListener('langchange', render);
