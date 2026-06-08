"""Generate background-only RAL JPGs (no text) from a CSV.

Reads the `RAL` column of `2026-xyk-import/product-with-img-RAL.csv`,
deduplicates the codes, and writes one JPG per unique RAL to
`0000_python/ral_only/ral-<CODE>.jpg` (e.g. `ral-5010.jpg`).

The image is just the gradient + powder-grain + top-right highlight +
thin border layers from `generate_ral_swatches.py` — **no text, no
mask plate, no shadow**.  Use these for product-page backgrounds or
as clean color references.

Usage:
    python generate_ral_only.py
    python generate_ral_only.py --csv path/to/other.csv
    python generate_ral_only.py --out ./my_swatches
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

# Reuse the existing rendering pipeline.
from generate_ral_swatches import (
    load_colors,
    find_color,
    hex_to_rgb,
    adjust_lightness,
    make_gradient,
    add_grain,
    add_highlight,
    add_border,
)
from PIL import Image, ImageDraw  # noqa: F401  (ImageDraw is re-exported)


# ---------- background-only render ------------------------------------------

def render_color_no_text(color, out_path):
    """Render the gradient/grain/highlight/border layers with NO text."""
    rgb = hex_to_rgb(color["hex"])
    top = adjust_lightness(rgb, +0.07)
    bottom = adjust_lightness(rgb, -0.06)

    img = make_gradient(top, bottom)
    img = add_grain(img)
    img = add_highlight(img)
    img = add_border(img)
    img.save(out_path, format="JPEG", quality=90, optimize=True)


# ---------- CLI --------------------------------------------------------------

def parse_args(argv=None):
    p = argparse.ArgumentParser(
        description="Generate text-free RAL background JPGs from a CSV.",
    )
    p.add_argument(
        "--csv",
        default=str(Path(__file__).parent / "2026-xyk-import" / "product-with-img-RAL.csv"),
        help="Path to the input .csv file (default: ./2026-xyk-import/product-with-img-RAL.csv)",
    )
    p.add_argument(
        "--out",
        default=str(Path(__file__).parent / "ral_only"),
        help="Output directory for the JPGs (default: ./ral_only)",
    )
    return p.parse_args(argv)


# ---------- main -------------------------------------------------------------

def main(argv=None):
    args = parse_args(argv)
    csv_path = Path(args.csv)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not csv_path.exists():
        print(f"CSV not found: {csv_path}", file=sys.stderr)
        return 2

    colors = load_colors()
    if not colors:
        print("No RAL colors loaded — is 0000_python/ral_colors.txt present?",
              file=sys.stderr)
        return 2

    # Collect unique, non-empty RAL codes, preserving the order they appear
    # in the CSV. Using a dict for O(1) dedup while keeping insertion order.
    seen = {}
    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            ral = (row.get("RAL") or "").strip()
            if not ral or ral in seen:
                continue
            seen[ral] = (row.get("productName") or "").strip()

    if not seen:
        print(f"No RAL values found in {csv_path.name}.", file=sys.stderr)
        return 2

    print(f"Found {len(seen)} unique RAL code(s) in {csv_path.name}")
    print(f"Output dir: {out_dir}\n")

    ok = 0
    skipped_unknown = 0
    failures = []
    for ral, sample_name in seen.items():
        match = find_color(colors, ral)
        if match is None:
            skipped_unknown += 1
            print(f"  RAL {ral} (e.g. '{sample_name}'): not in "
                  f"0000_python/ral_colors.txt, skipped")
            continue
        out_path = out_dir / f"ral-{ral}.jpg"
        try:
            render_color_no_text(match, out_path)
            ok += 1
            print(f"  RAL {ral}  {match['colorName']:<6}  {match['hex']}  "
                  f"->  {out_path.name}")
        except Exception as e:
            failures.append((ral, str(e)))
            print(f"  RAL {ral} FAILED: {e}")

    print()
    print("=" * 50)
    print(f"  unique RALs  : {len(seen)}")
    print(f"  written      : {ok}")
    print(f"  skipped      : {skipped_unknown}")
    print(f"  failed       : {len(failures)}")
    print(f"  output dir   : {out_dir}")
    print("=" * 50)
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
