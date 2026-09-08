# Qawi — architecture and decisions

Written in the style of an internal design/engineering review: what was decided,
what it cost, and what would change the decision.

---

## 1. Problem and success criteria

**Problem statement.** How might we let a lifter record every set and see which
muscles carried the load, on a phone, in a gym basement with no usable signal,
in English or Arabic, using only the web platform — while staying installable,
launching in under two seconds on a mid-range Android, and meeting WCAG 2.2 AA?

**Success criteria (measurable):**

| Metric | Target | How it is checked |
|---|---|---|
| Lighthouse PWA / installable | Pass | Lighthouse, mobile, HTTPS origin |
| Largest Contentful Paint | ≤ 2.0 s on Slow 4G | Lighthouse, throttled |
| Interaction to Next Paint | ≤ 200 ms | Lighthouse / field |
| Cumulative Layout Shift | ≤ 0.05 | Lighthouse |
| Total transfer, cold load | ≤ 120 KB uncompressed | DevTools Network |

**Measured on this build:** cold Home load is 77 KB uncompressed / **24 KB gzipped**
(document + stylesheet + the six modules it imports). The full precached shell —
all seven documents, the stylesheet, every module and the manifest — is 164 KB
uncompressed, plus 67 KB of icons, all of it fetched once at install.
| Offline task completion | Log and save a full session with the network off | Manual, airplane mode |
| Accessibility | 0 axe violations, full keyboard path, AA contrast | axe DevTools + manual |
| Translation coverage | 100 % of keys in both languages | `docs/validate.py` |

**Explicitly out of scope for release one:** accounts, server sync, wearables and
heart-rate capture, social feed, real map tiles, push delivery infrastructure,
video demonstrations.

---

## 2. Architecture decision records

### ADR-1 — Multi-page app, not a single-page router
Each screen is a real document reached by a real `<a href>`.

*Why:* navigation works before and without JavaScript; each document is
independently cacheable and independently recoverable if one is corrupt; there
is no router state to desynchronise from the URL; and the service worker already
makes the transitions instant from cache.
*Cost:* a full document parse per navigation, and shell markup duplicated across
pages (mitigated by `docs/build_pages.py`, which regenerates all pages from one
template).
*Would revisit if:* a screen needed to preserve live state across navigation —
the running session player is the candidate, currently solved with a
localStorage draft instead.

### ADR-2 — Direction handled by CSS logical properties, not an RTL stylesheet
`margin-inline`, `inset-inline`, `padding-inline` throughout; `<html dir>` is the
only switch.

*Why:* one stylesheet cannot drift out of sync with itself. A mirrored
`app-rtl.css` is a second artefact that always eventually diverges.
*Cost:* directional icons need an explicit opt-out (`.no-flip`), and any future
contributor must resist writing `margin-left`.
*Evidence:* [MDN, CSS logical properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties).

### ADR-3 — Bundled dictionary, not fetched translation files
`js/i18n.js` ships both languages inline.

*Why:* language switching must work offline, and a fetch on switch is a failure
mode in a gym basement. Both dictionaries together are roughly 8 KB.
*Cost:* every user downloads the language they do not use.
*Would revisit at:* four or more languages, where per-language chunks split by
`import()` start to pay for themselves.

### ADR-4 — Platform fonts, no webfont
Latin: platform grotesque stack. Arabic: SF Arabic → Geeza Pro → Noto Sans
Arabic → Dubai → Tahoma.

*Why:* an Arabic webfont is 80–200 KB and would either block first paint or
cause a visible reflow, and it is a network dependency in an offline-first app.
Every target OS ships a good Arabic UI face.
*Cost:* typography varies slightly across platforms.
*Mitigation:* Arabic gets its own line-height (1.75) and zero letter-spacing,
because the negative tracking used for Latin display type breaks Arabic joining.

### ADR-5 — Latin digits in Arabic (`ar-AE-u-nu-latn`)
*Why:* metrics are read alongside gym equipment, wearables and plates, which are
all Latin-numeral. Consistency beat orthographic purity here.
*Reversible in one constant:* `NUMERIC_LOCALE` in `js/i18n.js`.

### ADR-6 — Generated SVG route maps, no tile provider
*Why:* zero third-party JavaScript on the critical path, full offline operation,
and no user location leaving the device.
*Cost:* no real geography — routes are normalised path data in a 0–100 viewBox.
*Migration path:* one function, `renderMap()` in `js/page-routes.js`.

### ADR-7 — IndexedDB for records, localStorage for settings
*Why:* settings must be readable synchronously before first paint (language,
direction, theme) and are a few hundred bytes; records need indexes, no size
ceiling, and must be readable from a service worker during a Background Sync
event, which localStorage is not.
*Evidence:* [web.dev, storage for the web](https://web.dev/articles/storage-for-the-web).

### ADR-8 — No inline script anywhere
The pre-paint bootstrap is `js/boot.js`, loaded synchronously in `<head>`.

*Why:* it keeps the policy at `script-src 'self'` with no `unsafe-inline` and no
hash to maintain across edits. A blocking 600-byte first-party file is cheaper
than the class of bug that `unsafe-inline` permits.
*Cost:* one render-blocking request, same-origin and cached after first load.

---

## 3. Caching policy

| Resource class | Strategy | Rationale |
|---|---|---|
| Navigations | Network-first with navigation preload → cache → `offline.html` | Documents can change; never show a browser error page |
| CSS, JS, icons, manifest | Stale-while-revalidate | Instant paint, quiet freshening |
| Other same-origin GET | Cache, then network | Safe default |
| Non-GET, cross-origin | Not intercepted | The worker stays out of the way |

Navigation preload is enabled on activate, which removes service-worker start-up
cost from the navigation critical path.

`install` uses `cache.addAll`, which is atomic: a single 404 fails the install.
That is intended — a half-cached shell is worse than none.

**Invalidation:** `CACHE_VERSION` in `sw.js`. `activate` deletes every cache
whose key does not match. Bump it on every deploy.

---

## 4. Accessibility plan

Built in, not audited on afterwards:

- Skip link to `#main` on every page.
- Every interactive target ≥ 44 × 44 CSS px (WCAG 2.2 SC 2.5.8 requires 24; 44
  is the Apple HIG and Material recommendation, and correct for sweaty hands).
- Visible 3 px focus ring on `:focus-visible`, never removed.
- Toggles are real `<input type="checkbox">` with a styled track — keyboard and
  screen reader behaviour comes free.
- The body heat map is `role="img"` with per-muscle `<title>` elements plus a
  visually hidden text summary, satisfying SC 1.1.1 for a chart.
- The session player announces every set, rest completion and exercise change
  through a polite live region; the rings themselves are `aria-hidden`.
- Filter chips use `aria-pressed` toggle-button semantics, not a tablist, since
  there are no tab panels.
- Plan validation names the specific problem and the correction (SC 3.3.1,
  3.3.3) instead of a generic "invalid".
- `prefers-reduced-motion` is respected globally, plus a manual override in
  Settings that also suppresses haptics.
- `forced-colors` media query keeps card and control boundaries visible.

**Still to test on real hardware:** VoiceOver on iOS in Arabic, TalkBack on
Android in both languages, and the heat map with a 200 % browser zoom.

---

## 5. Security

- CSP: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'
  data:; base-uri 'none'; object-src 'none'; form-action 'self'`. Send it as an
  HTTP header too in production — a `<meta>` CSP cannot carry `frame-ancestors`
  or `report-to`.
- No third-party origin of any kind, so there is no supply chain to audit and no
  dependency to keep patched.
- No user input is ever inserted as HTML: all DOM text goes through
  `textContent` or `document.createTextNode`. The only `innerHTML` path in
  `node()` is used with author-controlled strings.
- No secrets exist client-side because there is no backend.
- Storage is origin-scoped; the export is user-initiated and local.

---

## 6. Testing pyramid

| Layer | Tool | Status |
|---|---|---|
| Syntax | `node --check` on every module | Passing |
| Cross-file contracts | `docs/validate.py` — i18n coverage both languages, selector existence per page, precache paths, manifest members | Passing, negative-controlled |
| Formatting logic | Node smoke test of `t()` / `fmt` in both languages | Passing |
| Markup | Tag-balance parse of all seven documents | Passing |
| Unit | Not yet — `muscleLoad()`, `weeksBetween()`, `heatStep()` are the first candidates | Gap |
| End-to-end | Not yet — Playwright: log a session offline, reload, confirm it persisted | Gap |
| Lighthouse | Requires an HTTPS origin; run against the Pages deployment | Pending deploy |
| Manual offline | Airplane mode: cold launch, log a session, save, reopen | Pending device |

The gaps are named deliberately rather than papered over.

---

## 7. Acceptance criteria and audit checklist

**Release one is done when:**

- [ ] Lighthouse mobile: PWA installable, Performance ≥ 90, Accessibility 100,
      Best Practices ≥ 95 against the HTTPS deployment
- [ ] Cold launch in airplane mode reaches Home from the installed icon
- [ ] A complete session can be logged and saved offline and survives a reload
- [ ] Switching to Arabic mirrors every screen with no clipped or overlapping
      text, and no LTR flash on reload
- [ ] Every screen is fully operable by keyboard alone
- [ ] Export produces valid JSON; delete removes every trace
- [ ] `docs/validate.py` and `node --check` both pass

**Known gaps, stated plainly:**

1. No `screenshots` in the manifest — Android's richer install dialogue wants
   them, and they must be real captures, not mockups. Add
   `screenshots: [{src, sizes, type, form_factor: "narrow"}]` once you have them.
2. Background Sync and push handlers are scaffolds; there is no endpoint. The
   client already marks records `synced: false`, so only `flushSessions()`
   changes when a backend exists.
3. Training-day reminders request notification permission but nothing schedules
   them — that needs either Periodic Background Sync (Chromium only) or a push
   server.
4. Heart rate appears in the data model as `avgHeartRate` but is always null;
   nothing is faked in the UI.
5. Routes are illustrative geometry, not surveyed GPS traces.

---

## 8. Roadmap

**Next:** manifest screenshots and `share_target` so a watch export can be
shared into the app; unit tests for the aggregation functions; Playwright
offline end-to-end.

**Then:** a minimal sync endpoint (the client is already shaped for it);
exercise demonstration media, cached on demand rather than precached; per-set
weight and rep editing during a session; plate-math helper.

**Later:** Periodic Background Sync for reminders; a third language, at which
point ADR-3 should be revisited and dictionaries split per language.
