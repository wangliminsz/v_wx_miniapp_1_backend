# python ral_full_mask.py --ral 2002 --text "绝缘"


"""Render a RAL swatch with a full-image dark mask overlay.

Unlike the per-glyph mask plate in the other scripts, this applies a
semi-transparent black layer across the **entire** image before drawing
white text — uniformly readable on any RAL background.

Usage:
  python ral_full_mask.py --ral 2002 --text "绝缘"
  python ral_full_mask.py --ral 7040 --text "户外耐候" -o out.jpg
"""

from __future__ import annotations

import argparse
import colorsys
import json
import os
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow is required. Install with:  pip install Pillow", file=sys.stderr)
    sys.exit(1)


HERE = Path(__file__).resolve().parent
COLORS_FILE = HERE / "ral_colors.txt"
OUTPUT_DIR = HERE / "ral_swatches"

PREFERRED_WEIGHT = 85


def _discover_local_fonts():
    font_dir = HERE / "cn_font"
    if not font_dir.is_dir():
        return []
    found = []
    for p in font_dir.iterdir():
        if p.suffix.lower() in (".ttf", ".otf", ".ttc"):
            m = re.search(r"(\d+)\s*W", p.stem, re.IGNORECASE)
            weight = int(m.group(1)) if m else 999
            found.append((weight, p))
    found.sort(key=lambda x: (abs(x[0] - PREFERRED_WEIGHT), x[1].name))
    return [str(p) for _, p in found]


LOCAL_FONTS = _discover_local_fonts()
FONT_CANDIDATES = LOCAL_FONTS + [
    r"C:\Windows\Fonts\msyhbd.ttc",
    r"C:\Windows\Fonts\simhei.ttf",
    r"C:\Windows\Fonts\simsun.ttc",
    r"C:\Windows\Fonts\msyh.ttc",
    r"C:\Windows\Fonts\STXINGKA.TTF",
    r"C:\Windows\Fonts\STKAITI.TTF",
    r"C:\Windows\Fonts\simfang.ttf",
    r"C:\Windows\Fonts\simkai.ttf",
    r"C:\Windows\Fonts\Deng.ttf",
    r"C:\Windows\Fonts\msyhl.ttc",
    "/System/Library/Fonts/PingFang.ttc",
    "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
]

W, H = 1200, 1200

# Opacity of the full-image dark overlay (0-255).  ~25 % keeps the RAL
# colour visible while guaranteeing white text readability.
FULL_MASK_ALPHA = 64


def _strip_trailing_commas(text):
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"(?m)//.*?$", "", text)
    return re.sub(r",(\s*[\]}])", r"\1", text)


def load_colors():
    text = COLORS_FILE.read_text(encoding="utf-8")
    return json.loads(_strip_trailing_commas(text))


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def adjust_lightness(rgb, delta_l):
    r, g, b = [c / 255 for c in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    l = max(0.0, min(1.0, l + delta_l))
    nr, ng, nb = colorsys.hls_to_rgb(h, l, s)
    return tuple(int(c * 255) for c in (nr, ng, nb))


_FONT_CACHE: dict[tuple[str, int], ImageFont.FreeTypeFont] = {}


def load_font(size: int) -> ImageFont.ImageFont:
    key = ("any", size)
    if key in _FONT_CACHE:
        return _FONT_CACHE[key]
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                f = ImageFont.truetype(path, size)
                _FONT_CACHE[key] = f
                return f
            except Exception:
                continue
    f = ImageFont.load_default()
    _FONT_CACHE[key] = f
    return f


def text_size(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def make_gradient(top, bottom):
    img = Image.new("RGB", (W, H), top)
    px = img.load()
    for y in range(H):
        t = y / max(1, H - 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        for x in range(W):
            px[x, y] = (r, g, b)
    return img


def add_grain(img, amount=14, opacity=0.08):
    noise = Image.effect_noise(img.size, amount).convert("RGB")
    return Image.blend(img, noise, opacity)


def add_highlight(img):
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    cx, cy = int(W * 0.78), int(H * 0.18)
    for i in range(60, 0, -1):
        radius = int(min(W, H) * 0.55 * i / 60)
        alpha = int(2 + (60 - i) * 0.35)
        draw.ellipse(
            [cx - radius, cy - radius, cx + radius, cy + radius],
            fill=(255, 255, 255, alpha),
        )
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def add_border(img):
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rectangle([0, 0, W - 1, H - 1], outline=(0, 0, 0, 40), width=2)
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def add_full_mask(img, alpha=FULL_MASK_ALPHA):
    """Composite a solid dark overlay across the entire image."""
    overlay = Image.new("RGBA", img.size, (0, 0, 0, alpha))
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def render_color(color, text, out_path, mask_alpha=FULL_MASK_ALPHA):
    rgb = hex_to_rgb(color["hex"])
    top = adjust_lightness(rgb, +0.07)
    bottom = adjust_lightness(rgb, -0.06)

    img = make_gradient(top, bottom)
    img = add_grain(img)
    img = add_highlight(img)
    img = add_border(img)
    img = add_full_mask(img, alpha=mask_alpha)

    draw = ImageDraw.Draw(img)

    font_main = load_font(320)
    tw = text_size(draw, text, font_main)[0]
    while tw > W - 160 and font_main.size > 180:
        font_main = load_font(font_main.size - 10)
        tw = text_size(draw, text, font_main)[0]

    tw, th = text_size(draw, text, font_main)
    x = (W - tw) // 2
    y = (H - th) // 2
    draw.text((x, y), text, font=font_main, fill=(255, 255, 255))

    img.save(out_path, format="JPEG", quality=90, optimize=True)


def find_color(colors, color_no):
    target = str(color_no).strip()
    target = re.sub(r"(?i)^ral[\s_-]*", "", target)
    for c in colors:
        if str(c.get("colorNo", "")).strip() == target:
            return c
    return None


def safe_filename_part(s, fallback="image"):
    s = str(s).strip()
    if not s:
        return fallback
    s = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", s)
    s = re.sub(r"\s+", "_", s)
    return s[:60] or fallback


def main(argv=None):
    p = argparse.ArgumentParser(
        description="Render RAL swatch with full-image dark overlay.",
    )
    p.add_argument("--ral", metavar="CODE", required=True,
                   help="RAL color number (e.g. 2002).")
    p.add_argument("--text", metavar="TEXT", required=True,
                   help="Chinese text to render.")
    p.add_argument("-o", "--output", metavar="PATH",
                   help="Output .jpg path.")
    p.add_argument("--mask-alpha", metavar="0-255", type=int, default=FULL_MASK_ALPHA,
                   help=f"Dark overlay opacity (default: {FULL_MASK_ALPHA}, ~25 %%).")
    args = p.parse_args(argv)

    colors = load_colors()
    match = find_color(colors, args.ral)
    if match is None:
        print(f"RAL {args.ral}: no matching color found.")
        return 1

    if args.output:
        out_path = Path(args.output)
    else:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        out_path = OUTPUT_DIR / f"FULLMASK_RAL{args.ral}_{safe_filename_part(args.text)}.jpg"

    out_path.parent.mkdir(parents=True, exist_ok=True)

    render_color(match, args.text, out_path, mask_alpha=args.mask_alpha)
    print(f"OK  -> {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
