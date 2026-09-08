/* =============================================================================
   sw.js — Qawi service worker
   -----------------------------------------------------------------------------
   Caching policy, per resource class:

   | Class                    | Strategy                  | Why                 |
   |--------------------------|---------------------------|---------------------|
   | Documents (navigations)  | Network-first + preload,  | Content can change; |
   |                          | cache fallback, then      | never leave the     |
   |                          | offline.html              | user with a dino    |
   | CSS / JS / icons         | Stale-while-revalidate    | Instant paint, then |
   |                          |                           | quiet freshening    |
   | manifest                 | Stale-while-revalidate    | Same as above       |
   | Everything else, GET     | Cache, then network       | Safe default        |

   Refs: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
         https://web.dev/articles/offline-cookbook
   Bump CACHE_VERSION on every deploy: the activate handler evicts anything that
   does not match, which is the whole cache-invalidation story for this app.
   ========================================================================== */

const CACHE_VERSION = 'qawi-v1.0.0';
const OFFLINE_URL = './offline.html';

/* The app shell. Everything here is required for a cold, offline launch. */
const PRECACHE = [
  './',
  './index.html',
  './train.html',
  './workout.html',
  './plan.html',
  './routes.html',
  './you.html',
  './offline.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/boot.js',
  './js/app.js',
  './js/i18n.js',
  './js/store.js',
  './js/data.js',
  './js/bodymap.js',
  './js/page-home.js',
  './js/page-train.js',
  './js/page-workout.js',
  './js/page-plan.js',
  './js/page-routes.js',
  './js/page-you.js',
  './js/page-offline.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

/* ---------- Install: precache the shell ---------------------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // addAll is atomic: one 404 fails the whole install, which is the correct
    // behaviour — a half-cached shell is worse than no shell.
    await cache.addAll(PRECACHE);
  })());
});

/* ---------- Activate: evict old versions, claim clients ------------------ */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      // Lets the network request for a navigation start in parallel with SW
      // boot, removing the worker start-up cost from the critical path.
      await self.registration.navigationPreload.enable();
    }
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

/* ---------- Fetch routing ------------------------------------------------- */
const isStatic = (url) => /\.(css|js|svg|png|webp|woff2?)$/.test(url.pathname)
  || url.pathname.endsWith('manifest.webmanifest');

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never touch non-GET or cross-origin traffic: this app has none, and a
  // pass-through keeps the worker out of the way if that ever changes.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }
  if (isStatic(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  event.respondWith(cacheThenNetwork(request));
});

async function handleNavigation(event) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const preloaded = await event.preloadResponse;
    const response = preloaded || await fetch(event.request);
    // Keep the newest copy of each document for the next offline launch.
    cache.put(event.request, response.clone()).catch(() => {});
    return response;
  } catch {
    const cached = await cache.match(event.request, { ignoreSearch: true });
    return cached || await cache.match(OFFLINE_URL) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  }).catch(() => null);
  return cached || (await network) || Response.error();
}

async function cacheThenNetwork(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch {
    return Response.error();
  }
}

/* ---------- Update handshake --------------------------------------------- */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/* ---------- Background Sync (scaffold) ----------------------------------- */
/**
 * The first release has no server, so there is nothing to upload and this
 * handler resolves immediately. It is wired now because the client already
 * marks records `synced: false` and registers the tag; when an endpoint exists,
 * only flushSessions() changes. Throwing from here makes the browser retry with
 * its own backoff — that is the behaviour to keep.
 * Ref: https://developer.mozilla.org/en-US/docs/Web/API/SyncManager
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'qawi-sync-sessions') event.waitUntil(flushSessions());
});

async function flushSessions() {
  const ENDPOINT = null; // set to '/api/sessions' when the backend lands
  if (!ENDPOINT) return;
  // Implementation sketch, deliberately left unwired:
  //   1. open IndexedDB 'qawi', read sessions where synced === false
  //   2. POST them in one batch
  //   3. on 2xx, write them back with synced === true
  //   4. on failure, throw so the browser retries this sync event later
}

/* ---------- Push (scaffold for training-day reminders) ------------------- */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try { payload = event.data.json(); } catch { payload = { body: event.data.text() }; }
  event.waitUntil(self.registration.showNotification(payload.title || 'Qawi', {
    body: payload.body || '',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    lang: payload.lang || 'en',
    dir: payload.lang === 'ar' ? 'rtl' : 'ltr',
    data: { url: payload.url || './index.html' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = all.find((c) => 'focus' in c);
    if (existing) { await existing.focus(); existing.navigate(target); return; }
    await self.clients.openWindow(target);
  })());
});
