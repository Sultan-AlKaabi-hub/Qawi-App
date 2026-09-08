/* =============================================================================
   store.js — offline-first persistence
   -----------------------------------------------------------------------------
   Two tiers, chosen deliberately:
   • localStorage  → small, synchronous, read before first paint (language,
     theme, units). Synchronous access is exactly what a pre-paint bootstrap
     needs and the payload is a few hundred bytes.
   • IndexedDB     → sessions, plan and saved routes. Structured, indexable,
     no 5 MB ceiling, and the only storage the spec allows a service worker to
     read during a Background Sync event.
     Ref: https://web.dev/articles/storage-for-the-web
   Every write marks records `synced: false` so a future Background Sync can
   drain the queue without a schema change.
   ========================================================================== */

const DB_NAME = 'qawi';
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains('sessions')) {
        const s = db.createObjectStore('sessions', { keyPath: 'id' });
        s.createIndex('byDate', 'startedAt');
        s.createIndex('bySynced', 'synced');
      }
      if (!db.objectStoreNames.contains('routes')) {
        db.createObjectStore('routes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('plan')) {
        db.createObjectStore('plan', { keyPath: 'id' });
      }
      void e;
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store, mode, fn) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const os = t.objectStore(store);
    let out;
    try { out = fn(os); } catch (err) { reject(err); return; }
    t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

/* ---------- Settings (localStorage) -------------------------------------- */
const DEFAULTS = { lang: 'en', theme: 'dark', units: 'kg', reduceMotion: false };

export const settings = {
  get(key) {
    const raw = localStorage.getItem(`qawi.${key}`);
    if (raw === null) return DEFAULTS[key];
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return raw;
  },
  set(key, value) { localStorage.setItem(`qawi.${key}`, String(value)); },
  all() { return Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, this.get(k)])); },
};

/* ---------- Sessions ------------------------------------------------------ */
/**
 * @typedef {Object} LoggedSet
 * @property {string} exerciseId
 * @property {number} reps
 * @property {number} weight   kilograms, always stored in kg regardless of the
 *                             display unit so history stays comparable
 * @property {string[]} muscles primary muscle ids carrying the load
 */

export async function saveSession(session) {
  const record = {
    id: session.id || `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    startedAt: session.startedAt || Date.now(),
    endedAt: session.endedAt || Date.now(),
    routineId: session.routineId || null,
    title: session.title || '',
    sets: session.sets || [],
    elapsedSec: session.elapsedSec || 0,
    avgHeartRate: session.avgHeartRate ?? null,
    synced: false,
  };
  await tx('sessions', 'readwrite', (os) => os.put(record));
  requestSync();
  return record;
}

export async function listSessions({ limit = 50 } = {}) {
  const all = await tx('sessions', 'readonly', (os) => os.getAll());
  return (all || []).sort((a, b) => b.startedAt - a.startedAt).slice(0, limit);
}

export async function clearAll() {
  await tx('sessions', 'readwrite', (os) => os.clear());
  await tx('routes', 'readwrite', (os) => os.clear());
  await tx('plan', 'readwrite', (os) => os.clear());
  Object.keys(localStorage)
    .filter((k) => k.startsWith('qawi.'))
    .forEach((k) => localStorage.removeItem(k));
}

export async function exportAll() {
  return {
    exportedAt: new Date().toISOString(),
    app: 'qawi',
    version: DB_VERSION,
    settings: settings.all(),
    sessions: await listSessions({ limit: 10000 }),
    plan: await getPlan(),
    routes: await tx('routes', 'readonly', (os) => os.getAll()),
  };
}

/* ---------- Plan ---------------------------------------------------------- */
export async function getPlan() {
  const rows = await tx('plan', 'readonly', (os) => os.getAll());
  return (rows || [])[0] || null;
}

export async function savePlan(plan) {
  const record = { id: 'current', ...plan, updatedAt: Date.now(), synced: false };
  await tx('plan', 'readwrite', (os) => os.put(record));
  return record;
}

/* ---------- Saved routes -------------------------------------------------- */
export async function listSavedRoutes() {
  return (await tx('routes', 'readonly', (os) => os.getAll())) || [];
}
export async function toggleSavedRoute(route) {
  const existing = await tx('routes', 'readonly', (os) => os.get(route.id));
  if (existing) { await tx('routes', 'readwrite', (os) => os.delete(route.id)); return false; }
  await tx('routes', 'readwrite', (os) => os.put({ ...route, savedAt: Date.now() }));
  return true;
}

/* ---------- Derived views ------------------------------------------------- */

/** Weekly totals used by the Home dashboard. */
export async function weeklyTotals(days = 7) {
  const since = Date.now() - days * 864e5;
  const sessions = (await listSessions({ limit: 500 })).filter((s) => s.startedAt >= since);
  return sessions.reduce((acc, s) => {
    acc.sessions += 1;
    acc.seconds += s.elapsedSec || 0;
    acc.sets += s.sets.length;
    acc.volume += s.sets.reduce((v, set) => v + (set.weight || 0) * (set.reps || 0), 0);
    return acc;
  }, { sessions: 0, seconds: 0, sets: 0, volume: 0 });
}

/**
 * Muscle load: volume per muscle group over a window, normalised 0..1 against
 * the hardest-hit group. Normalising against the individual's own maximum —
 * rather than an absolute scale — keeps the map readable for both a beginner
 * and an advanced lifter.
 */
export async function muscleLoad(days = 7) {
  const since = Date.now() - days * 864e5;
  const sessions = (await listSessions({ limit: 500 })).filter((s) => s.startedAt >= since);
  const load = {};
  sessions.forEach((s) => s.sets.forEach((set) => {
    const work = (set.weight || 1) * (set.reps || 1);
    (set.muscles || []).forEach((m, i) => {
      // The first listed muscle is the prime mover; synergists get half credit.
      load[m] = (load[m] || 0) + work * (i === 0 ? 1 : 0.5);
    });
  }));
  const peak = Math.max(1, ...Object.values(load));
  return Object.fromEntries(Object.entries(load).map(([m, v]) => [m, v / peak]));
}

/* ---------- Background Sync hook ----------------------------------------- */
/**
 * Ask the service worker to flush unsynced records when connectivity returns.
 * Background Sync is Chromium-only today, so the app also flushes on the
 * window 'online' event — progressive enhancement, never a dependency.
 * Ref: https://developer.mozilla.org/en-US/docs/Web/API/SyncManager
 */
export function requestSync() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready
    .then((reg) => reg.sync && reg.sync.register('qawi-sync-sessions'))
    .catch(() => { /* no Background Sync on this browser; harmless */ });
}
