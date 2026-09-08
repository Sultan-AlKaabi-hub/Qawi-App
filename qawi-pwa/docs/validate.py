"""validate.py — pre-flight checks that do not need a browser.
 1. every data-i18n / data-i18n-attr key exists in BOTH languages
 2. every t('key') used in JS exists in BOTH languages
 3. every path in the service-worker precache list exists on disk
 4. manifest.webmanifest is valid JSON with the required members
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors, warnings = [], []

# --- dictionaries ----------------------------------------------------------
i18n = (ROOT / "js/i18n.js").read_text(encoding="utf-8")
def keys_of(lang):
    block = re.search(rf"\n  {lang}: {{(.*?)\n  }},", i18n, re.S)
    return set(re.findall(r"'([\w.]+)':", block.group(1))) if block else set()

en, ar = keys_of("en"), keys_of("ar")
for missing, where in ((en - ar, "ar"), (ar - en, "en")):
    for k in sorted(missing):
        errors.append(f"key '{k}' missing from the {where} dictionary")

# --- keys referenced in markup and code ------------------------------------
used = set()
for html in ROOT.glob("*.html"):
    text = html.read_text(encoding="utf-8")
    used |= set(re.findall(r'data-i18n="([\w.]+)"', text))
    for attr in re.findall(r'data-i18n-attr="([^"]+)"', text):
        used |= {p.split(":")[1].strip() for p in attr.split(",") if ":" in p}
for js in (ROOT / "js").glob("*.js"):
    if js.name == "i18n.js":
        continue   # the dictionary defines keys, it does not consume them
    src = js.read_text(encoding="utf-8")
    # Keys reach t() through constants too (chip tables, stat() label arguments),
    # so treat any quoted dotted identifier as a reference.
    used |= {k for k in re.findall(r"'([a-z][\w]*\.[\w.]+)'", src)
             if not k.startswith("qawi.")}   # storage keys share the dotted shape

for k in sorted(used - en):
    errors.append(f"key '{k}' is used but not defined")
for k in sorted(en - used):
    warnings.append(f"key '{k}' is defined but never used")

# --- service worker precache ----------------------------------------------
sw = (ROOT / "sw.js").read_text(encoding="utf-8")
precache = re.search(r"const PRECACHE = \[(.*?)\];", sw, re.S).group(1)
for rel in re.findall(r"'\./([^']*)'", precache):
    if rel and not (ROOT / rel).exists():
        errors.append(f"precached file missing on disk: {rel}")

# --- every module a page loads exists --------------------------------------
for html in ROOT.glob("*.html"):
    for src in re.findall(r'src="\./([^"]+)"', html.read_text(encoding="utf-8")):
        if not (ROOT / src).exists():
            errors.append(f"{html.name} references missing script {src}")

# --- every selector a page script queries exists in that page's markup ------
PAIRS = {
    "index.html": "page-home.js", "train.html": "page-train.js",
    "workout.html": "page-workout.js", "plan.html": "page-plan.js",
    "routes.html": "page-routes.js", "you.html": "page-you.js",
}
for page, script in PAIRS.items():
    markup = (ROOT / page).read_text(encoding="utf-8")
    code = (ROOT / "js" / script).read_text(encoding="utf-8")
    for sel in re.findall(r"\$\$?\('([^']+)'\)", code):
        for one in sel.split(","):
            one = one.strip()
            if one.startswith("[data-") or one.startswith("#"):
                needle = one[1:-1] if one.startswith("[") else f'id="{one[1:]}"'
                if needle not in markup and one[1:] not in markup:
                    errors.append(f"{script} queries {one}, absent from {page}")

# --- manifest ---------------------------------------------------------------
m = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
for member in ("name", "short_name", "start_url", "display", "icons", "theme_color", "background_color"):
    if member not in m:
        errors.append(f"manifest is missing required member '{member}'")
sizes = {i["sizes"] for i in m["icons"]}
for need in ("192x192", "512x512"):
    if need not in sizes:
        errors.append(f"manifest has no {need} icon")
if not any(i.get("purpose") == "maskable" for i in m["icons"]):
    errors.append("manifest has no maskable icon")
for icon in m["icons"]:
    if not (ROOT / icon["src"].lstrip("./")).exists():
        errors.append(f"icon missing on disk: {icon['src']}")

print(f"{len(used)} translation keys in use, {len(en)} defined per language")
for w in warnings: print("  warn:", w)
for e in errors: print("  ERROR:", e)
print("PASS" if not errors else f"FAIL ({len(errors)} errors)")
sys.exit(1 if errors else 0)
