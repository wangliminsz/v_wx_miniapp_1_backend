# python ral_text_wrap.py --ral 2002 --text "绝缘粉末通用工业"


"""Render a RAL swatch with Chinese text wrapped at every 4th character.

Usage:
  python ral_text_wrap.py --ral 2002 --text "绝缘粉末通用工业"
  python ral_text_wrap.py --ral 7040 --text "户外耐候防腐粉末" -o out.jpg
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


def mask_alpha_for(rgb, min_alpha=80, max_alpha=180):
    r, g, b = [c / 255 for c in rgb]
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    alpha = int(min_alpha + (max_alpha - min_alpha) * luminance)
    return max(min_alpha, min(max_alpha, alpha))


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


def draw_centered_text_with_mask(img, draw, text, font,
                                  text_color=(255, 255, 255),
                                  mask_color=(0, 0, 0),
                                  mask_alpha=77,
                                  pad_x_ratio=0.30,
                                  pad_y_ratio=0.45,
                                  corner_radius_ratio=0.18):
    tw, th = text_size(draw, text, font)
    x = (W - tw) // 2
    y = (H - th) // 2

    pad_x = max(40, int(tw * pad_x_ratio))
    pad_y = max(20, int(th * pad_y_ratio))
    plate_w = tw + pad_x * 2
    plate_h = th + pad_y * 2
    plate_x = (W - plate_w) // 2
    plate_y = (H - plate_h) // 2
    radius = max(8, int(plate_h * corner_radius_ratio))

    mask_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    mask_draw = ImageDraw.Draw(mask_layer)
    mask_draw.rounded_rectangle(
        [plate_x, plate_y, plate_x + plate_w, plate_y + plate_h],
        radius=radius,
        fill=(mask_color[0], mask_color[1], mask_color[2], mask_alpha),
    )
    img.alpha_composite(mask_layer)

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
    n = len(lines)
    line_sizes = [text_size(draw, s, font) for s in lines]
    max_w = max(w for w, _ in line_sizes)
    line_h_max = max(h for _, h in line_sizes)
    line_gap = max(min_line_gap_px, int(line_h_max * line_gap_ratio))
    total_h = sum(h for _, h in line_sizes) + max(0, n - 1) * line_gap

    pad_x = max(40, int(max_w * pad_x_ratio))
    pad_y = max(20, int(line_h_max * pad_y_ratio))
    plate_w = max_w + pad_x * 2
    plate_h = total_h + pad_y * 2
    plate_x = (W - plate_w) // 2
    plate_y = (H - plate_h) // 2
    radius = max(8, int(plate_h * corner_radius_ratio))

    mask_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    mask_draw = ImageDraw.Draw(mask_layer)
    mask_draw.rounded_rectangle(
        [plate_x, plate_y, plate_x + plate_w, plate_y + plate_h],
        radius=radius,
        fill=(mask_color[0], mask_color[1], mask_color[2], mask_alpha),
    )
    img.alpha_composite(mask_layer)

    draw = ImageDraw.Draw(img)
    cursor_y = (H - total_h) // 2
    for (s, (lw, lh)) in zip(lines, line_sizes):
        line_x = (W - lw) // 2
        draw.text((line_x, cursor_y), s, font=font, fill=text_color)
        cursor_y += lh + line_gap
    return draw


ATOMIC_UNITS = ["粉末"]


def wrap_text(text, max_chars=4):
    """Split Chinese text into lines of at most `max_chars` characters.

    Tokens listed in `ATOMIC_UNITS` are kept together (never broken across
    lines).  All other characters are treated as single-char tokens.
    """
    tokens = []
    i = 0
    while i < len(text):
        matched = False
        for unit in ATOMIC_UNITS:
            if text[i:i + len(unit)] == unit:
                tokens.append(unit)
                i += len(unit)
                matched = True
                break
        if not matched:
            tokens.append(text[i])
            i += 1

    lines = []
    current = ""
    for tok in tokens:
        if len(current) + len(tok) > max_chars:
            if current:
                lines.append(current)
            current = tok
        else:
            current += tok
    if current:
        lines.append(current)
    return lines


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
    text_color = (255, 255, 255)

    if isinstance(text_label, str):
        text_label = [text_label]

    font_main = load_font(320)
    max_w = max(text_size(draw, s, font_main)[0] for s in text_label)
    while max_w > W - 160 and font_main.size > 180:
        font_main = load_font(font_main.size - 10)
        max_w = max(text_size(draw, s, font_main)[0] for s in text_label)

    img_rgba = img.convert("RGBA")
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
        description="Render RAL swatch with Chinese text wrapped at 4 chars.",
    )
    p.add_argument("--ral", metavar="CODE", required=True,
                   help="RAL color number (e.g. 2002).")
    p.add_argument("--text", metavar="TEXT", required=True,
                   help="Chinese text to render (auto-wrapped every 4 chars).")
    p.add_argument("-o", "--output", metavar="PATH",
                   help="Output .jpg path.")
    args = p.parse_args(argv)

    colors = load_colors()
    match = find_color(colors, args.ral)
    if match is None:
        print(f"RAL {args.ral}: no matching color found.")
        return 1

    lines = wrap_text(args.text, max_chars=4)
    print(f"Wrapped text: {lines}")

    if args.output:
        out_path = Path(args.output)
    else:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        out_path = OUTPUT_DIR / f"WRAP_RAL{args.ral}_{safe_filename_part(args.text)}.jpg"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    render_color(match, lines, out_path)
    print(f"OK  -> {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
