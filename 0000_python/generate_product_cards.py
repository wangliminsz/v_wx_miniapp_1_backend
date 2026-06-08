"""Generate one product-card JPG per row in 2026-xyk-import/产品列表.csv.

The CSV format is:
    productName, productSlug, productDescription, ..., RAL

For each row we render a 1200x1200 JPG using the same look as the
generate_ral_swatches.py RAL swatches — vertical gradient, powder-grain
noise, top-right highlight bloom, border, plus a soft black mask plate
under the text.  The plate alpha is luminance-adaptive, but with a
narrower, more contrasty band (min_alpha=80, max_alpha=200) so the
product names pop more on a thumbnail / product-list view.

Text layout follows the pattern from your reference:
    "HE1086A-G20-002"  ->  line 1: "HE1086A"
                           line 2: "-G20-002"
i.e. the FIRST dash is the break point, and the dash itself stays on
line 2 so the type line 1 / variant line 2 grouping is clear.

Output filename: <productName>.jpg, sanitized for Windows + *nix.

Usage:
    python generate_product_cards.py
    python generate_product_cards.py --csv path/to/other.csv
    python generate_product_cards.py --out ./out_cards
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

# Reuse the existing rendering pipeline (Ral Colors page, RAL swatches)
from generate_ral_swatches import (
    load_colors,
    find_color,
    render_color,
    safe_filename_part,
)


# ---------- CLI --------------------------------------------------------------

def parse_args(argv=None):
    p = argparse.ArgumentParser(
        description="Generate product-card JPGs from 产品列表.csv",
    )
    p.add_argument(
        "--csv",
        default=str(Path(__file__).parent / "2026-xyk-import" / "产品列表.csv"),
        help="Path to the input .csv file (default: ./2026-xyk-import/产品列表.csv)",
    )
    p.add_argument(
        "--out",
        default=str(Path(__file__).parent / "product_cards"),
        help="Output directory for the JPGs (default: ./product_cards)",
    )
    return p.parse_args(argv)


# ---------- text splitter ----------------------------------------------------

def split_product_name(name):
    """Split a product name into [head, tail] for two-line rendering.

    Rule (from the product list):
        "HE1086A-G20-002"  ->  ["HE1086A", "-G20-002"]
        "HE1086G-G20-003B" ->  ["HE1086G", "-G20-003B"]

    If the name has no dash at all, the whole name goes on line 1 and
    line 2 is empty (which the renderer will skip / use a tiny placeholder
    so the mask stays roughly the same size as the 2-line case).
    """
    n = (name or "").strip()
    if "-" not in n:
        return [n, ""]
    head, tail = n.split("-", 1)
    return [head.strip(), "-" + tail.strip()]


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

    total = ok = 0
    skipped_no_name = skipped_no_ral = skipped_unknown_ral = 0
    failures = []

    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            name = (row.get("productName") or "").strip()
            ral = (row.get("RAL") or "").strip()

            if not name:
                skipped_no_name += 1
                continue
            if not ral:
                skipped_no_ral += 1
                print(f"  [row {total}] '{name}': no RAL value, skipped")
                continue

            match = find_color(colors, ral)
            if match is None:
                skipped_unknown_ral += 1
                print(f"  [row {total}] '{name}' (RAL {ral}): "
                      f"color not in 0000_python/ral_colors.txt, skipped")
                continue

            lines = split_product_name(name)
            out_path = out_dir / f"{safe_filename_part(name)}.jpg"
            try:
                # min_alpha=80, max_alpha=200 — narrower, more contrasty
                # band than the RAL swatches' default (60..140), so the
                # product names stand out a bit more on a thumbnail.
                render_color(match, lines, out_path,
                             min_alpha=80, max_alpha=200)
                ok += 1
            except Exception as e:
                failures.append((name, ral, str(e)))
                print(f"  [row {total}] '{name}' FAILED: {e}")

    # Summary
    print()
    print("=" * 60)
    print(f"  rows read         : {total}")
    print(f"  cards written     : {ok}")
    print(f"  skipped (no name) : {skipped_no_name}")
    print(f"  skipped (no RAL)  : {skipped_no_ral}")
    print(f"  skipped (unknown) : {skipped_unknown_ral}")
    print(f"  failed            : {len(failures)}")
    print(f"  output dir        : {out_dir}")
    print("=" * 60)

    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
