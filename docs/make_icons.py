"""make_icons.py — generates the PNG icon set from one vector definition.

Mark: an open ember ring (the 'Q') crossed by a loaded bar. Legible at 48px,
which is the size that actually decides whether an icon works on a home screen.
Run:  python3 docs/make_icons.py
"""
from PIL import Image, ImageDraw
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / "icons"
ICONS.mkdir(exist_ok=True)

BG = (16, 16, 18, 255)
EMBER = (255, 78, 17, 255)
INK = (246, 244, 241, 255)


def draw_mark(size, pad_ratio, rounded=True, bg=BG):
    S = size * 4  # supersample for clean edges
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=bg)
    else:
        d.rectangle([0, 0, S, S], fill=bg)

    pad = int(S * pad_ratio)
    box = [pad, pad, S - pad, S - pad]
    width = int(S * 0.085)

    # Ring, opened at the lower right so it reads as a Q rather than an O.
    d.arc(box, start=305, end=250, fill=EMBER, width=width)

    # Bar through the tail: two plates and a shaft.
    cx, cy = S / 2, S / 2
    r = (box[2] - box[0]) / 2
    x0, y0 = cx + r * 0.14, cy + r * 0.30
    x1, y1 = cx + r * 1.02, cy + r * 1.04
    d.line([x0, y0, x1, y1], fill=INK, width=int(width * 0.9))
    for t, plate in ((0.30, 0.16), (0.78, 0.11)):
        px, py = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        rr = r * plate
        d.ellipse([px - rr, py - rr, px + rr, py + rr], fill=INK)
    return img.resize((size, size), Image.LANCZOS)


for size, name in ((192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png"),
                   (1024, "icon-1024-store.png")):   # 1024 is required by App Store / Play listings
    draw_mark(size, 0.20).save(ICONS / name)

# Maskable: full bleed, mark inside the 80% safe zone the spec requires.
draw_mark(512, 0.30, rounded=False).save(ICONS / "icon-maskable-512.png")

SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Qawi">
  <rect width="512" height="512" rx="112" fill="#101012"/>
  <path d="M256 92a164 164 0 1 1-96 297" fill="none" stroke="#ff4e11" stroke-width="44" stroke-linecap="round"/>
  <line x1="278" y1="300" x2="410" y2="432" stroke="#f6f4f1" stroke-width="38" stroke-linecap="round"/>
  <circle cx="318" cy="340" r="27" fill="#f6f4f1"/>
  <circle cx="381" cy="403" r="19" fill="#f6f4f1"/>
</svg>
"""
(ICONS / "icon.svg").write_text(SVG, encoding="utf-8")
print("icons written:", sorted(p.name for p in ICONS.iterdir()))
