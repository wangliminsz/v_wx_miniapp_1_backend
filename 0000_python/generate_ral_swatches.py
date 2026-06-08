#  python generate_ral_swatches.py --ral 2002 --text "绝缘"


"""Generate a JPG swatch image for every RAL color in ral_colors.txt.

Each swatch is a 1200x1200 card with the color as the background, decorated
with a vertical gradient, subtle powder-grain noise, a soft top-right
highlight bloom, and a thin border. The center carries a single big Chinese
text label — one of:

    通用
    绝缘
    重防腐

The text is always **white**, sitting on a small **black mask plate**
(20–40% opacity, drawn directly under the text with a small padding)
so it stays clearly readable across the whole catalog — no more black
type on light RAL backgrounds.

Requires: Pillow (`pip install Pillow`).

Usage:
  # Batch mode: render one JPG per RAL entry in ral_colors.txt
  python generate_ral_swatches.py

  # Single mode: render one JPG for a user-specified RAL color + text
  python generate_ral_swatches.py --ral 2002 --text "通用工业粉末"
  python generate_ral_swatches.py --ral 7040 --text "Custom Title" -o out.jpg

  # List every RAL colorNo available in the .txt file
  python generate_ral_swatches.py --list
"""

from __future__ import annotations

import argparse
import colorsys
import json
import os
import random
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

POWDER_TYPES = [
    "通用工业",
    "绝缘粉末",
    "重防腐",
]

# User-supplied Chinese fonts live in ./cn_font/. We auto-discover any
# .ttf / .otf / .ttc file there and prefer the weight **closest to
# PREFERRED_WEIGHT** (HY QiHei filenames include the weight, e.g.
# `HYQiHeiX1-85W-20.otf` -> 85W ≈ Bold). Set PREFERRED_WEIGHT to 75 for
# SemiBold, 65 for Medium, 45 for Light, etc. Drop in any number of font
# files; they'll all be tried in order, nearest-weight first.
#
# If none of these are present on your machine and you'd like a different
# look, drop a .ttf / .otf / .ttc file anywhere and add its full path to
# the front of this list. Good free Chinese fonts that ship multiple weights:
#   * 思源黑体  (Source Han Sans / Noto Sans CJK SC) — Light, Regular, Bold
#   * 思源宋体  (Source Han Serif / Noto Serif CJK SC) — Light, Regular, Bold
#   * 阿里巴巴普惠体  (Alibaba PuHuiTi) — Light, Regular, Bold
# All three are free for commercial use; Google "noto sans cjk download".
PREFERRED_WEIGHT = 85  # 85 ≈ Bold, 75 ≈ SemiBold, 65 ≈ Medium, 55 ≈ Regular


def _discover_local_fonts():
    """Scan ./cn_font/ and return font paths sorted by closeness to
    PREFERRED_WEIGHT (most-closest first), with alphabetical tie-break.

    Filenames that contain `<number>W` (e.g. `HYQiHeiX1-45W-16.otf`) are
    treated as a font of that weight. Anything else falls through in
    alphabetical order at the bottom.
    """
    font_dir = HERE / "cn_font"
    if not font_dir.is_dir():
        return []
    found = []
    for p in font_dir.iterdir():
        if p.suffix.lower() in (".ttf", ".otf", ".ttc"):
            m = re.search(r"(\d+)\s*W", p.stem, re.IGNORECASE)
            weight = int(m.group(1)) if m else 999
            found.append((weight, p))
    # Closest to PREFERRED_WEIGHT first, then alphabetical
    found.sort(key=lambda x: (abs(x[0] - PREFERRED_WEIGHT), x[1].name))
    return [str(p) for _, p in found]


LOCAL_FONTS = _discover_local_fonts()
# System font fallback list — **boldest first**, so a Bold variant is
# used whenever the local directory is empty or unrecognised.
FONT_CANDIDATES = LOCAL_FONTS + [
    r"C:\Windows\Fonts\msyhbd.ttc",  # Microsoft YaHei Bold
    r"C:\Windows\Fonts\simhei.ttf",  # SimHei (heavy)
    r"C:\Windows\Fonts\simsun.ttc",  # SimSun (classic Regular)
    r"C:\Windows\Fonts\msyh.ttc",   # Microsoft YaHei Regular
    r"C:\Windows\Fonts\STXINGKA.TTF",  # 华文行楷 (STXingkai), calligraphic
    r"C:\Windows\Fonts\STKAITI.TTF",   # 华文楷体 (STKaiti)
    r"C:\Windows\Fonts\simfang.ttf",   # 仿宋 (FangSong)
    r"C:\Windows\Fonts\simkai.ttf",    # 楷体 (KaiTi)
    r"C:\Windows\Fonts\Deng.ttf",     # DengXian (Deng 等等)
    r"C:\Windows\Fonts\msyhl.ttc",    # Microsoft YaHei Light (last resort)
    "/System/Library/Fonts/PingFang.ttc",
    "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
]

W, H = 1200, 1200  # 1:1 square — matches the collection-card / product
                 # thumbnail aspect ratio used in the storefront UI.


# ---------- file / json helpers ---------------------------------------------

def _strip_trailing_commas(text):
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"(?m)//.*?$", "", text)
    return re.sub(r",(\s*[\]}])", r"\1", text)


def load_colors():
    text = COLORS_FILE.read_text(encoding="utf-8")
    return json.loads(_strip_trailing_commas(text))


# ---------- color helpers ----------------------------------------------------

def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def adjust_lightness(rgb, delta_l):
    r, g, b = [c / 255 for c in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    l = max(0.0, min(1.0, l + delta_l))
    nr, ng, nb = colorsys.hls_to_rgb(h, l, s)
    return tuple(int(c * 255) for c in (nr, ng, nb))


def reverse_text_color(rgb):
    """Pick the reverse (contrasting) color of the background."""
    r, g, b = [c / 255 for c in rgb]
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    return (255, 255, 255) if luminance < 0.55 else (15, 15, 15)


def mask_alpha_for(rgb, min_alpha=80, max_alpha=180):
    """Pick the mask-plate alpha based on the background's luminance.

    Light backgrounds (yellows, beiges, light greys) get a **darker**
    plate — close to 55 % opacity — so the white text always has a
    high-contrast area to sit on.  Dark backgrounds (blacks, deep
    browns) get a much lighter plate — around 24 % opacity — so the
    plate stays subtle and doesn't add a visible "black box" on top
    of an already-dark surface.  Middle tones are linear-interpolated.

    `min_alpha` / `max_alpha` are 0-255 alpha values; the default band
    of 60..140 corresponds to roughly 24 %..55 % opacity.
    """
    r, g, b = [c / 255 for c in rgb]
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    alpha = int(min_alpha + (max_alpha - min_alpha) * luminance)
    return max(min_alpha, min(max_alpha, alpha))


# ---------- font helpers -----------------------------------------------------

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


# ---------- background layers -----------------------------------------------

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


# ---------- typography helpers ----------------------------------------------

def draw_centered_text_with_shadow(draw, text, font, fill, shadow,
                                    shadow_offset=(4, 4)):
    tw, th = text_size(draw, text, font)
    x = (W - tw) // 2
    y = (H - th) // 2
    ox, oy = shadow_offset
    draw.text((x + ox, y + oy), text, font=font, fill=shadow)
    draw.text((x, y), text, font=font, fill=fill)


def draw_centered_text_with_mask(img, draw, text, font,
                                  text_color=(255, 255, 255),
                                  mask_color=(0, 0, 0),
                                  mask_alpha=77,           # ~30 % opacity
                                  pad_x_ratio=0.30,         # 30 % of text width
                                  pad_y_ratio=0.45,         # 45 % of text height
                                  corner_radius_ratio=0.18):
    """Draw `text` centered on `img`, sitting on a soft black mask plate.

    A separate RGBA layer is composited **only under the text glyphs**
    (not across the whole image), filled with `mask_color` at the given
    alpha. The plate is slightly rounded for a "designer pill" look, and
    its size scales with the text bounds so the padding always feels
    proportional — no matter the label length or font size.
    """
    tw, th = text_size(draw, text, font)
    x = (W - tw) // 2
    y = (H - th) // 2

    # Pad around the text. Clamp the minimum padding so very small text
    # (e.g. a tiny font) still gets a visible plate.
    pad_x = max(40, int(tw * pad_x_ratio))
    pad_y = max(20, int(th * pad_y_ratio))
    plate_w = tw + pad_x * 2
    plate_h = th + pad_y * 2
    plate_x = (W - plate_w) // 2
    plate_y = (H - plate_h) // 2
    radius = max(8, int(plate_h * corner_radius_ratio))

    # Build the mask on a dedicated RGBA layer so we can alpha-blend it
    # back over the gradient / grain / highlight.  This keeps the mask
    # strictly *under* the text and never tints the rest of the image.
    mask_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    mask_draw = ImageDraw.Draw(mask_layer)
    mask_draw.rounded_rectangle(
        [plate_x, plate_y, plate_x + plate_w, plate_y + plate_h],
        radius=radius,
        fill=(mask_color[0], mask_color[1], mask_color[2], mask_alpha),
    )
    img.alpha_composite(mask_layer)

    # Re-attach a draw handle over the composited image so the text
    # call writes white pixels at full opacity, on top of the plate.
    draw = ImageDraw.Draw(img)
    draw.text((x, y), text, font=font, fill=text_color)
    return draw


def draw_centered_text_block_with_mask(img, draw, lines, font,
                                        text_color=(255, 255, 255),
                                        mask_color=(0, 0, 0),
                                        mask_alpha=120,
                                        pad_x_ratio=0.30,
                                        pad_y_ratio=0.45,
                                        corner_radius_ratio=0.18,
                                        line_gap_ratio=0.55,
                                        min_line_gap_px=80):
    """Multi-line version of `draw_centered_text_with_mask`.

    All lines share one font and one mask plate. The plate is sized to
    the widest line and the total stacked height, then the whole block
    is centered on the canvas.

    `line_gap_ratio` controls the vertical space *between* lines, as a
    fraction of the tallest line's height.  `min_line_gap_px` is the
    floor — at our typical ~200 pt text it produces a target gap of
    ~80 px so the "model / variant" pairing reads as two clear lines
    rather than a glued-together block.
    """
    n = len(lines)
    line_sizes = [text_size(draw, s, font) for s in lines]
    max_w = max(w for w, _ in line_sizes)
    line_h_max = max(h for _, h in line_sizes)
    line_gap = max(min_line_gap_px, int(line_h_max * line_gap_ratio))
    total_h = sum(h for _, h in line_sizes) + max(0, n - 1) * line_gap

    pad_x = max(40, int(max_w * pad_x_ratio))
    pad_y = max(20, int(total_h * pad_y_ratio))
    plate_w = max_w + pad_x * 2
    plate_h = total_h + pad_y * 2
    plate_x = (W - plate_w) // 2
    plate_y = (H - plate_h) // 2
    radius = max(8, int(plate_h * corner_radius_ratio))

    # Build and composite the mask plate (same trick as single-line).
    mask_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    mask_draw = ImageDraw.Draw(mask_layer)
    mask_draw.rounded_rectangle(
        [plate_x, plate_y, plate_x + plate_w, plate_y + plate_h],
        radius=radius,
        fill=(mask_color[0], mask_color[1], mask_color[2], mask_alpha),
    )
    img.alpha_composite(mask_layer)

    # Stack the lines vertically, centered, on top of the plate.
    draw = ImageDraw.Draw(img)
    cursor_y = (H - total_h) // 2
    for (s, (lw, lh)) in zip(lines, line_sizes):
        line_x = (W - lw) // 2
        draw.text((line_x, cursor_y), s, font=font, fill=text_color)
        cursor_y += lh + line_gap
    return draw


# ---------- main per-color render -------------------------------------------

def render_color(color, text_label, out_path,
                 min_alpha=60, max_alpha=140):
    rgb = hex_to_rgb(color["hex"])
    top = adjust_lightness(rgb, +0.07)
    bottom = adjust_lightness(rgb, -0.06)

    img = make_gradient(top, bottom)
    img = add_grain(img)
    img = add_highlight(img)
    img = add_border(img)

    draw = ImageDraw.Draw(img)
    # We always render white text on a soft black plate — the plate
    # gives a controlled contrast area on top of any RAL background
    # (light or dark), so the type is uniformly readable across the
    # whole catalog without per-color "reverse" logic.
    text_color = (255, 255, 255)

    # `text_label` can be a single string (one-line swatch) or a list
    # of strings (multi-line product card).  Both share the same font
    # auto-fit logic — we scale against the widest line.
    if isinstance(text_label, str):
        text_label = [text_label]

    # Pick a font size that makes the text feel big without overflowing.
    # 1:1 square gives plenty of vertical room, so we can start much larger
    # than the old 180 pt and only scale down for the longest label.
    font_main = load_font(320)
    max_w = max(text_size(draw, s, font_main)[0] for s in text_label)
    # Tighter horizontal padding (80 px) so the text fills more of the
    # canvas, with a 180 pt floor to keep the type "big" even for the
    # longest label (`通用工业粉末`, 6 chars).
    while max_w > W - 160 and font_main.size > 180:
        font_main = load_font(font_main.size - 10)
        max_w = max(text_size(draw, s, font_main)[0] for s in text_label)

    # alpha_composite() needs an RGBA image — convert before compositing
    # the mask plate, then the JPEG save will flatten back to RGB.
    img_rgba = img.convert("RGBA")
    # Adapt the plate opacity to the background: light RALs get a much
    # darker plate, dark RALs stay subtle.
    plate_alpha = mask_alpha_for(rgb, min_alpha=min_alpha, max_alpha=max_alpha)
    if len(text_label) == 1:
        draw_centered_text_with_mask(
            img_rgba, draw, text_label[0], font_main,
            text_color=text_color,
            mask_color=(0, 0, 0),
            mask_alpha=plate_alpha,
        )
    else:
        draw_centered_text_block_with_mask(
            img_rgba, draw, text_label, font_main,
            text_color=text_color,
            mask_color=(0, 0, 0),
            mask_alpha=plate_alpha,
        )
    img = img_rgba

    img.convert("RGB").save(out_path, format="JPEG", quality=90, optimize=True)


# ---------- single-mode helpers --------------------------------------------

def find_color(colors, color_no):
    """Find a color entry by its `colorNo` field. Accepts `2002`, `"2002"`,
    or `"RAL 2002"` and matches the leading numeric part."""
    target = str(color_no).strip()
    # Strip an optional "RAL " prefix the user might add
    target = re.sub(r"(?i)^ral[\s_-]*", "", target)
    for c in colors:
        if str(c.get("colorNo", "")).strip() == target:
            return c
    return None


def safe_filename_part(s, fallback="image"):
    """Make a string safe to use in a filename (Windows + *nix)."""
    s = str(s).strip()
    if not s:
        return fallback
    # Strip filesystem-unsafe characters
    s = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", s)
    # Collapse whitespace runs to a single underscore
    s = re.sub(r"\s+", "_", s)
    return s[:60] or fallback


# ---------- entry point ------------------------------------------------------

def run_batch(colors):
    OUTPUT_DIR.mkdir(exist_ok=True)
    print(f"Loaded {len(colors)} colors. Output: {OUTPUT_DIR}")

    for i, c in enumerate(colors, start=1):
        color_no = str(c.get("colorNo", "x"))
        cid = c.get("id", i)
        label = random.choice(POWDER_TYPES)
        out_path = OUTPUT_DIR / f"RAL_{color_no}_{cid}.jpg"
        try:
            render_color(c, label, out_path)
            print(f"[{i}/{len(colors)}] {out_path.name}  ({label})")
        except Exception as e:
            print(f"[{i}/{len(colors)}] {c.get('colorNo')} FAILED: {e}")

    print(f"\nDone. {len(colors)} images in {OUTPUT_DIR}")


def run_single(colors, color_no, text, output):
    match = find_color(colors, color_no)
    if match is None:
        print(f"RAL {color_no}: no matching color found in {COLORS_FILE.name}.")
        print("Run `python generate_ral_swatches.py --list` to see available codes.")
        return 1

    if output:
        out_path = Path(output)
    else:
        cn = match.get("colorNo", "x")
        cid = match.get("id", "x")
        out_path = OUTPUT_DIR / f"CUSTOM_RAL{cn}_{safe_filename_part(text)}.jpg"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    render_color(match, text, out_path)
    print(f"OK  RAL {match.get('colorNo')} ({match.get('colorName', '')})  "
          f"->  {out_path}  (text: {text!r})")
    return 0


def run_list(colors):
    print(f"Available RAL codes in {COLORS_FILE.name} ({len(colors)} total):")
    for c in colors:
        cn = c.get("colorNo", "?")
        name = c.get("colorName", "")
        hex_ = c.get("hex", "")
        print(f"  RAL {str(cn).rjust(5)}  {hex_}  {name}")


def parse_args(argv=None):
    p = argparse.ArgumentParser(
        description="Generate RAL swatch JPGs.",
    )
    g = p.add_mutually_exclusive_group()
    g.add_argument("--ral", metavar="CODE", help="Render a single image for "
                   "this RAL color number (e.g. 2002).")
    g.add_argument("--list", action="store_true",
                   help="List every RAL code in the .txt file and exit.")
    p.add_argument("--text", metavar="TEXT", help="Text to render on the "
                   "image (used with --ral).")
    p.add_argument("-o", "--output", metavar="PATH",
                   help="Output .jpg path (used with --ral). Defaults to "
                        "ral_swatches/CUSTOM_RAL<CODE>_<TEXT>.jpg")
    return p.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    colors = load_colors()

    if args.list:
        run_list(colors)
        return 0

    if args.ral is not None:
        if not args.text:
            print("--text is required when --ral is supplied.", file=sys.stderr)
            return 2
        return run_single(colors, args.ral, args.text, args.output)

    # No flags -> batch mode
    run_batch(colors)
    return 0


if __name__ == "__main__":
    sys.exit(main())
