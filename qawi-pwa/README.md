# Qawi — قوي

A bilingual (English / العربية) strength-and-endurance training app, built as an
installable Progressive Web App with nothing but HTML, CSS and vanilla
JavaScript modules. No framework, no build step, no third-party runtime code.

Log every set, watch a muscle heat map fill in, schedule a 12-week plan, and
browse routes — all of it working with no connection.

---

## Run it locally

A service worker needs a **secure context**: `https://` or `localhost`. Opening
`index.html` from the file system with `file://` will render the UI but the
worker will not register, so offline and install will not work.

```bash
cd qawi-pwa
python3 -m http.server 8080
# open http://localhost:8080
```

`localhost` counts as secure, so everything works there, including install.

---

## Deploying to GitHub Pages and AwardSpace

You said you will use both. They are not equivalent, and it is worth being
explicit about why:

| | GitHub Pages | AwardSpace (free tier) |
|---|---|---|
| HTTPS | Yes, automatic | No |
| Service worker registers | Yes | **No** |
| Offline mode | Yes | No |
| Install to home screen | Yes | No |
| Lighthouse PWA checks | Pass | Fail (installability) |
| The app still works | Yes | Yes — as an ordinary website |

Service workers are restricted to secure contexts by specification
([W3C Service Workers, §Secure context](https://www.w3.org/TR/service-workers/)),
so this is not a configuration you can fix on the free AwardSpace plan — it is
the platform. The app is written to degrade cleanly: `registerSW()` catches the
failure, every page is a real document reachable by a real link, and all data
still persists in IndexedDB on the device. What you lose is offline and install.

**Recommendation:** treat GitHub Pages as the canonical, installable
deployment, and AwardSpace as the mirror you hand to classmates alongside your
other hosted work.

### GitHub Pages (the installable one)

1. Create a repository and push the contents of this folder to the root of the
   default branch.
2. Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/`.
3. Your app lands at `https://<user>.github.io/<repo>/`.

Every path in this project is relative (`./css/app.css`, `./sw.js`), and the
manifest uses `"id": "./"` with `"scope": "./"`, so the subdirectory URL that
Pages gives you works without editing anything.

Add a `.nojekyll` file at the root if Pages ever starts ignoring a file — Jekyll
skips paths beginning with an underscore. Nothing here does today.

### AwardSpace

1. Zip the folder contents (not the folder itself) or upload the provided zip.
2. File Manager → your domain's root → upload → extract.
3. Confirm `manifest.webmanifest` is served — some free hosts return 404 or the
   wrong MIME type for unknown extensions. If it 404s, add the `.htaccess`
   below.

```apache
# .htaccess — only needed if the host mis-serves these types
AddType application/manifest+json .webmanifest
AddType image/svg+xml .svg
AddType text/javascript .js
```

Because there is no HTTPS, do not be surprised when Chrome's install button
never appears there. That is expected, not a bug in the app.

---

## Project layout

```
qawi-pwa/
├── index.html            Home — weekly totals, next session, recent activity
├── train.html            Routine library with filters
├── workout.html          Session player — rings, rest timer, set logging
├── plan.html             12-week plan scheduler
├── routes.html           Route discovery, saved routes work offline
├── you.html              Muscle heat map, lifetime totals, settings
├── offline.html          Navigation fallback
├── manifest.webmanifest  Install metadata, icons, shortcuts
├── sw.js                 Service worker: precache, routing, sync scaffold
├── css/app.css           Tokens, app shell, components (logical properties)
├── js/
│   ├── boot.js           Pre-paint lang/dir/theme (external, so CSP stays tight)
│   ├── app.js            Shell runtime: SW, install, connectivity, toasts
│   ├── i18n.js           EN/AR dictionary + Intl formatting + RTL switching
│   ├── store.js          IndexedDB + settings + derived views
│   ├── data.js           Content model: muscles, exercises, routines, routes
│   ├── bodymap.js        SVG anatomical heat map
│   └── page-*.js         One controller per page
├── icons/                SVG source + 192 / 512 / maskable / apple-touch PNGs
└── docs/
    ├── ARCHITECTURE.md   Decisions, budgets, acceptance criteria, audit list
    ├── build_pages.py    Regenerates the pages from one shared shell
    ├── make_icons.py     Regenerates the icon set
    └── validate.py       Pre-flight checks (run before every deploy)
```

## Before every deploy

```bash
python3 docs/validate.py      # i18n coverage, selectors, precache, manifest
for f in js/*.js sw.js; do node --check "$f"; done
```

`validate.py` fails the build if a translation key is missing from either
language, if a page script queries an element that does not exist in its markup,
if a precached file is missing, or if the manifest loses a required member.

**Bump `CACHE_VERSION` in `sw.js` on every deploy.** The activate handler
deletes every cache that does not match, which is the entire cache-invalidation
strategy. Forget it and returning users keep the old shell.

## Language

The app picks Arabic automatically for an Arabic browser locale, and the globe
button in the top bar switches at any time. The choice is remembered and applied
before first paint, so there is no flash of the wrong direction.

## Data and privacy

Everything lives on the device: IndexedDB for sessions, plan and saved routes;
localStorage for settings. There is no account, no analytics and no network call
to anywhere. **You → Your data** exports everything as JSON and deletes
everything in one action.
