#!/usr/bin/env python3
"""
build_pages.py — assembles the HTML documents from one shared shell.

This is a *development convenience*, not a runtime dependency: it writes plain
static HTML with no build artefacts, so the shipped app is pure HTML/CSS/JS and
can be deployed by copying the folder. Re-run it after editing the shell to keep
the <head>, icon sprite and tab bar identical across every page.

    python3 docs/build_pages.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SPRITE = """  <!-- Icon sprite. Inlined per document rather than referenced as an external
       file because WebKit's support for cross-document <use href> has been
       unreliable; inlining costs ~1 KB gzipped and always renders. -->
  <svg style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <symbol id="i-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10.6 12 3.6l8.5 7"/><path d="M5.8 9.6V20h12.4V9.6"/><path d="M10 20v-5h4v5"/></symbol>
    <symbol id="i-train" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9v6"/><path d="M6 6.5v11"/><path d="M18 6.5v11"/><path d="M21 9v6"/><path d="M6 12h12"/></symbol>
    <symbol id="i-record" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none"/></symbol>
    <symbol id="i-routes" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19.5 9 4l6 15.5"/><path d="M13.5 19.5 18 8l3 11.5"/></symbol>
    <symbol id="i-you" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c.9-3.7 3.7-5.6 7.2-5.6s6.3 1.9 7.2 5.6"/></symbol>
    <symbol id="i-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 8 12l7 7"/></symbol>
    <symbol id="i-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3.2 9.5h17.6M3.2 14.5h17.6"/><path d="M12 3c2.6 3 2.6 15 0 18M12 3c-2.6 3-2.6 15 0 18"/></symbol>
    <symbol id="i-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.6 12H2.2M21.8 12h-2.4M6.4 6.4 4.7 4.7M19.3 19.3l-1.7-1.7M17.6 6.4l1.7-1.7M4.7 19.3l1.7-1.7"/></symbol>
    <symbol id="i-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></symbol>
    <symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5 9.5 17.5 19.5 7"/></symbol>
    <symbol id="i-bookmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M6.5 4h11v16l-5.5-4-5.5 4z"/></symbol>
    <symbol id="i-install" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v11"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M4.5 18.5h15"/></symbol>
    <symbol id="i-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3c3 3.4 5.5 6 5.5 9.5A5.5 5.5 0 0 1 12 18a5.5 5.5 0 0 1-5.5-5.5C6.5 9 9 6.4 12 3z"/></symbol>
    <symbol id="i-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8.6"/><path d="M12 7v5.2l3.4 2"/></symbol>
  </svg>"""

TABS = [
    ("home", "index.html", "i-home", "nav.home"),
    ("train", "train.html", "i-train", "nav.train"),
    ("record", "workout.html", "i-record", "nav.record"),
    ("routes", "routes.html", "i-routes", "nav.routes"),
    ("you", "you.html", "i-you", "nav.you"),
]


def tabbar() -> str:
    items = "\n".join(
        f'      <a class="tab" href="./{href}" data-tab="{tab}">\n'
        f'        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#{icon}"/></svg>\n'
        f'        <span class="tab__label" data-i18n="{key}">{key}</span>\n'
        f'      </a>'
        for tab, href, icon, key in TABS
    )
    return (
        '    <nav class="tabbar" aria-label="Primary" data-i18n-attr="aria-label:a11y.primary">\n'
        f"{items}\n"
        "    </nav>"
    )


SHELL = """<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <!-- viewport-fit=cover lets the layout extend under the notch / home
       indicator; CSS then pads with env(safe-area-inset-*). -->
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <meta name="theme-color" content="#101012" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
  <meta name="color-scheme" content="dark light">

  <!-- Content Security Policy. No inline script, no third-party origin: the app
       is entirely first-party, which is what makes this policy this tight.
       In production, send these as HTTP headers as well (a meta CSP cannot
       carry frame-ancestors or report-to). -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'">
  <meta name="referrer" content="strict-origin-when-cross-origin">

  <link rel="manifest" href="./manifest.webmanifest">
  <link rel="icon" href="./icons/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="Qawi">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

  <link rel="stylesheet" href="./css/app.css">
  <script src="./js/boot.js"></script>
</head>
<body>
{sprite}

  <a class="skip-link" href="#main" data-i18n="a11y.skip">Skip to main content</a>

  <div class="app">
    <header class="topbar">
{topbar}
    </header>

    <main class="main" id="main" tabindex="-1">
      <div class="banner banner--offline" role="status">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><use href="#i-clock"/></svg>
        <span data-i18n="common.offline">You are offline.</span>
      </div>

{body}
    </main>

{tabbar}
  </div>

  <div class="toast" id="toast" role="status" aria-live="polite" data-open="false"></div>

  <script type="module" src="./js/{script}"></script>
</body>
</html>
"""

TOPBAR_MAIN = """      <div class="topbar__title">
        <span data-i18n="{title_key}">{title_fallback}</span>
        <small data-i18n="{sub_key}">{sub_fallback}</small>
      </div>
      <button class="iconbtn" type="button" data-action="toggle-lang" data-i18n-attr="aria-label:a11y.lang">
        <svg viewBox="0 0 24 24" class="no-flip" aria-hidden="true"><use href="#i-globe"/></svg>
      </button>
      <a class="iconbtn" href="./you.html" data-i18n-attr="aria-label:a11y.settings">
        <svg viewBox="0 0 24 24" class="no-flip" aria-hidden="true"><use href="#i-gear"/></svg>
      </a>"""

TOPBAR_SUB = """      <button class="iconbtn" type="button" data-action="back" data-i18n-attr="aria-label:a11y.back">
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-chevron"/></svg>
      </button>
      <div class="topbar__title">
        <span data-i18n="{title_key}">{title_fallback}</span>
        <small data-i18n="{sub_key}">{sub_fallback}</small>
      </div>
      <button class="iconbtn" type="button" data-action="toggle-lang" data-i18n-attr="aria-label:a11y.lang">
        <svg viewBox="0 0 24 24" class="no-flip" aria-hidden="true"><use href="#i-globe"/></svg>
      </button>"""


def build(page):
    topbar = (TOPBAR_SUB if page.get("sub") else TOPBAR_MAIN).format(
        title_key=page["title_key"], title_fallback=page["title_fallback"],
        sub_key=page["sub_key"], sub_fallback=page["sub_fallback"],
    )
    html = SHELL.format(
        title=page["doc_title"], description=page["description"], sprite=SPRITE,
        topbar=topbar, body=page["body"], tabbar=tabbar(), script=page["script"],
    )
    (ROOT / page["file"]).write_text(html, encoding="utf-8")
    print("wrote", page["file"])


PAGES = [
    dict(
        file="index.html", doc_title="Qawi — Home", script="page-home.js",
        description="Track every set, see which muscles carried the load, and follow a 12-week plan. Works offline.",
        title_key="app.name", title_fallback="Qawi",
        sub_key="app.tagline", sub_fallback="Train. Log it. See the load.",
        sub=False,
        body="""      <section aria-labelledby="greet">
        <h1 id="greet" data-greeting>Good evening</h1>
        <p class="muted" data-today></p>
      </section>

      <section class="card" aria-labelledby="week-h">
        <div class="section-head">
          <h2 id="week-h" data-i18n="home.thisWeek">This week</h2>
          <a href="./you.html" data-i18n="common.seeAll">See all</a>
        </div>
        <div class="stat-grid" data-week-stats></div>
        <div style="margin-block-start:var(--s5)">
          <div class="section-head" style="margin-block-end:var(--s2)">
            <span class="eyebrow" data-i18n="home.weeklyGoal">Weekly goal</span>
            <span class="num muted" data-goal-label></span>
          </div>
          <div class="meter"><div class="meter__fill" data-goal-bar style="inline-size:0%"></div></div>
        </div>
      </section>

      <section class="card" aria-labelledby="next-h">
        <p class="eyebrow" data-i18n="home.next">Next session</p>
        <h2 id="next-h" data-next-title>Push A</h2>
        <p class="hint muted" data-i18n="home.nextHint">From your 12-week plan</p>
        <p class="muted num" data-next-meta></p>
        <a class="btn btn--primary btn--block" data-next-link href="./workout.html">
          <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-play"/></svg>
          <span data-i18n="home.startNow">Start session</span>
        </a>
      </section>

      <section aria-labelledby="recent-h">
        <div class="section-head">
          <h2 id="recent-h" data-i18n="home.recent">Recent activity</h2>
        </div>
        <div data-recent></div>
      </section>

      <button class="btn btn--ghost btn--block" data-action="install" hidden>
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-install"/></svg>
        <span data-i18n="common.install">Install Qawi</span>
      </button>""",
    ),
    dict(
        file="train.html", doc_title="Qawi — Routines", script="page-train.js",
        description="Choose a training session: push, pull, legs, full body or core.",
        title_key="train.title", title_fallback="Routines",
        sub_key="train.subtitle", sub_fallback="Pick a session and start lifting",
        sub=False,
        body="""      <div class="chips" role="group" data-i18n-attr="aria-label:train.title" data-filters></div>
      <section aria-live="polite" data-routines></section>

      <a class="btn btn--ghost btn--block" href="./plan.html">
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-clock"/></svg>
        <span data-i18n="plan.title">Schedule plan</span>
      </a>""",
    ),
    dict(
        file="workout.html", doc_title="Qawi — Session", script="page-workout.js",
        description="Guided sets, rest timer and set logging. Works with no connection.",
        title_key="workout.resting", title_fallback="Session",
        sub_key="workout.elapsed", sub_fallback="Elapsed",
        sub=True,
        body="""      <section class="card" aria-labelledby="ex-h">
        <p class="eyebrow num" data-progress>Exercise 1 of 4</p>
        <div class="bodymap" data-target-map style="grid-template-columns:1fr 1fr;max-inline-size:280px;margin-inline:auto"></div>
        <h1 id="ex-h" data-ex-name style="margin-block-start:var(--s4)">Exercise</h1>
        <p class="muted num" data-ex-weight></p>

        <div class="rings" style="margin-block-start:var(--s5)">
          <div>
            <div class="ring">
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle class="ring__track" cx="50" cy="50" r="44"/>
                <circle class="ring__bar" cx="50" cy="50" r="44" data-ring-reps/>
              </svg>
              <span class="ring__value num" data-val-reps>0</span>
            </div>
            <p class="ring__caption" data-i18n="workout.repsCaption">Reps to do</p>
          </div>
          <div>
            <div class="ring">
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle class="ring__track" cx="50" cy="50" r="44"/>
                <circle class="ring__bar" cx="50" cy="50" r="44" data-ring-rest style="stroke:var(--heat-4)"/>
              </svg>
              <span class="ring__value num" data-val-rest>0:00</span>
            </div>
            <p class="ring__caption" data-i18n="workout.restCaption">Rest</p>
          </div>
          <div>
            <div class="ring">
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle class="ring__track" cx="50" cy="50" r="44"/>
                <circle class="ring__bar" cx="50" cy="50" r="44" data-ring-sets style="stroke:var(--ok)"/>
              </svg>
              <span class="ring__value num" data-val-sets>0/3</span>
            </div>
            <p class="ring__caption" data-i18n="workout.setsCaption">Sets done</p>
          </div>
        </div>

        <p aria-live="polite" class="sr-only" data-live></p>

        <div style="display:grid;gap:var(--s3);margin-block-start:var(--s5)">
          <button class="btn btn--primary btn--block" data-action="log-set">
            <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check"/></svg>
            <span data-i18n="workout.logSet">Log set</span>
          </button>
          <button class="btn btn--ghost btn--block" data-action="skip-rest" data-i18n="workout.skipRest" hidden>Skip rest</button>
          <div style="display:flex;gap:var(--s3)">
            <button class="btn btn--ghost" style="flex:1" data-action="prev-ex" data-i18n="workout.prev">Previous</button>
            <button class="btn btn--ghost" style="flex:1" data-action="next-ex" data-i18n="workout.next">Next</button>
          </div>
        </div>
      </section>

      <section class="card card--quiet">
        <h2 data-i18n="workout.howTo">How to do it</h2>
        <p data-ex-cue></p>
      </section>

      <button class="btn btn--danger btn--block" data-action="finish" data-i18n="common.finish">Finish session</button>""",
    ),
    dict(
        file="plan.html", doc_title="Qawi — Schedule plan", script="page-plan.js",
        description="Build a 12-week training plan and pick your training days.",
        title_key="plan.title", title_fallback="Schedule plan",
        sub_key="plan.datesHint", sub_fallback="At least 12 weeks",
        sub=True,
        body="""      <section class="card">
        <h2 data-i18n="plan.dates">Choose your start and end date</h2>
        <p class="hint muted" data-i18n="plan.datesHint">A plan runs for at least 12 weeks.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--s4);margin-block-start:var(--s4)">
          <div class="field">
            <label for="start" data-i18n="plan.start">Start</label>
            <input class="input" type="date" id="start" name="start">
          </div>
          <div class="field">
            <label for="end" data-i18n="plan.end">End</label>
            <input class="input" type="date" id="end" name="end">
          </div>
        </div>
        <p class="hint num" data-span></p>
      </section>

      <section class="card">
        <h2 data-i18n="plan.daysQ">Which days will you train?</h2>
        <p class="hint muted" data-i18n="plan.daysHint">Four days a week works best.</p>
        <div class="daypicker" data-day-heads style="margin-block:var(--s4) var(--s2)"></div>
        <div class="daypicker" data-days role="group" aria-labelledby="days-label"></div>
        <span id="days-label" class="sr-only" data-i18n="plan.daysQ">Which days will you train?</span>

        <p class="hint muted" style="margin-block-start:var(--s5)" data-i18n="plan.longQ">Your long session needs a day with time around it.</p>
        <div class="row">
          <span class="row__text" data-i18n="plan.long">Long session</span>
          <select class="input" style="inline-size:auto" data-long-day aria-labelledby="days-label"></select>
        </div>
      </section>

      <section class="card">
        <h2 data-i18n="plan.reminders">Training day reminders</h2>
        <div class="row">
          <span class="row__text" id="rem-label" data-i18n="plan.enableReminder">Remind me</span>
          <span class="switch">
            <input type="checkbox" id="reminder" aria-labelledby="rem-label">
            <span class="switch__track" aria-hidden="true"></span>
          </span>
        </div>
        <div class="row">
          <label class="row__text" for="remtime" data-i18n="plan.reminderTime">Reminder time</label>
          <input class="input" style="inline-size:auto" type="time" id="remtime" value="08:00">
        </div>
      </section>

      <p role="alert" class="muted" data-plan-error></p>
      <button class="btn btn--primary btn--block" data-action="save-plan" data-i18n="common.done">Done</button>""",
    ),
    dict(
        file="routes.html", doc_title="Qawi — Routes", script="page-routes.js",
        description="Discover running and riding routes near you. Saved routes work offline.",
        title_key="routes.title", title_fallback="Routes",
        sub_key="routes.fromLocation", sub_fallback="From your location",
        sub=False,
        body="""      <div class="field">
        <label class="sr-only" for="q" data-i18n="routes.search">Search routes</label>
        <input class="input" type="search" id="q" data-i18n-attr="placeholder:routes.search" placeholder="Search routes">
      </div>

      <div class="chips" role="group" data-i18n-attr="aria-label:routes.filterRoutes" data-route-filters></div>
      <div class="chips" role="group" data-i18n-attr="aria-label:routes.surface" data-surface-filters></div>

      <div class="mapcanvas" data-map></div>

      <section aria-live="polite">
        <div class="section-head">
          <h2 class="num" data-route-count></h2>
        </div>
        <div data-routes></div>
      </section>

      <p class="muted" style="font-size:.84rem" data-i18n="routes.offlineNote">Saved routes work offline.</p>""",
    ),
    dict(
        file="you.html", doc_title="Qawi — You", script="page-you.js",
        description="Your muscle load map, lifetime totals and app settings.",
        title_key="you.title", title_fallback="You",
        sub_key="you.storage", sub_fallback="Stored on this device",
        sub=False,
        body="""      <section class="card" aria-labelledby="load-h">
        <div class="section-head">
          <h2 id="load-h" data-i18n="you.load">Muscle load</h2>
        </div>
        <p class="hint muted" data-i18n="you.loadHint">Last 7 days of logged sets, by muscle group.</p>
        <div class="bodymap" data-bodymap style="margin-block-start:var(--s4)"></div>
        <div class="bodymap__caption">
          <span data-i18n="you.less">Less</span>
          <span class="heatkey" aria-hidden="true">
            <i style="background:var(--heat-0)"></i><i style="background:var(--heat-1)"></i><i style="background:var(--heat-2)"></i><i style="background:var(--heat-3)"></i><i style="background:var(--heat-4)"></i>
          </span>
          <span data-i18n="you.more">More</span>
        </div>
        <p class="sr-only" data-load-summary></p>
      </section>

      <section class="card">
        <div class="section-head"><h2 data-i18n="you.lifetime">Lifetime</h2></div>
        <div class="stat-grid" data-lifetime></div>
      </section>

      <section class="card">
        <div class="section-head"><h2 data-i18n="you.settings">Settings</h2></div>

        <div class="row">
          <label class="row__text" for="lang" data-i18n="you.language">Language</label>
          <select class="input" style="inline-size:auto" id="lang">
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        <div class="row">
          <span class="row__text" id="theme-label" data-i18n="you.theme">Dark theme</span>
          <span class="switch">
            <input type="checkbox" id="theme" aria-labelledby="theme-label">
            <span class="switch__track" aria-hidden="true"></span>
          </span>
        </div>

        <div class="row">
          <label class="row__text" for="units" data-i18n="you.units">Weight units</label>
          <select class="input" style="inline-size:auto" id="units">
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>

        <div class="row">
          <span class="row__text" id="motion-label">
            <span data-i18n="you.reduceMotion">Reduce motion</span>
            <small data-i18n="you.reduceMotionHint">Turns off timers and progress animation.</small>
          </span>
          <span class="switch">
            <input type="checkbox" id="motion" aria-labelledby="motion-label">
            <span class="switch__track" aria-hidden="true"></span>
          </span>
        </div>
      </section>

      <section class="card">
        <div class="section-head"><h2 data-i18n="you.data">Your data</h2></div>
        <div style="display:grid;gap:var(--s3)">
          <button class="btn btn--ghost btn--block" data-action="export" data-i18n="you.export">Export my data</button>
          <button class="btn btn--ghost btn--block" data-action="install" hidden>
            <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-install"/></svg>
            <span data-i18n="common.install">Install Qawi</span>
          </button>
          <button class="btn btn--danger btn--block" data-action="clear" data-i18n="you.clear">Delete all data</button>
        </div>
      </section>""",
    ),
]

OFFLINE = """<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Qawi — No connection</title>
  <meta name="theme-color" content="#101012">
  <link rel="manifest" href="./manifest.webmanifest">
  <link rel="icon" href="./icons/icon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="./css/app.css">
  <script src="./js/boot.js"></script>
</head>
<body>
  <main class="main" id="main">
    <div class="empty" style="margin-block-start:20vh">
      <h1 data-i18n="offline.title">No connection</h1>
      <p style="margin-inline:auto" data-i18n="offline.body">This page has not been saved for offline use yet.</p>
      <div style="display:grid;gap:var(--s3);max-inline-size:280px;margin-inline:auto;margin-block-start:var(--s6)">
        <button class="btn btn--primary btn--block" data-action="retry" data-i18n="offline.retry">Try again</button>
        <a class="btn btn--ghost btn--block" href="./index.html" data-i18n="offline.goHome">Go to Home</a>
      </div>
    </div>
  </main>
  <script type="module" src="./js/page-offline.js"></script>
</body>
</html>
"""

if __name__ == "__main__":
    for p in PAGES:
        build(p)
    (ROOT / "offline.html").write_text(OFFLINE, encoding="utf-8")
    print("wrote offline.html")
