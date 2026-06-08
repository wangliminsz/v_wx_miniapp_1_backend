"""Fetch recipe details for every RAL color and append to ral_colors_detail.txt.

The previous urllib-based version got "访问受限" (access restricted) responses,
while the same request works fine from the VS Code REST Client. The root cause
is almost always how Python's `urllib` differs from a real browser / REST tool:
header order, TLS fingerprint (JA3), default `Connection`/`Accept-Encoding`
values, and lack of a `Cookie` jar.

This rewrite shells out to `curl.exe` (libcurl/Schannel, the same TLS stack
Chrome and the REST client use on Windows), passing the headers in the exact
order from the working REST request, and lets curl handle cookies, redirects,
and gzip decompression. That is what "more like manually" effectively means.

Output format is unchanged: one JSON object per line in `ral_colors_detail.txt`,
idempotent / resumable (already-fetched ids are skipped).

Usage (from the project root or from 0000_python itself):
    python 0000_python/fetch_ral_data.py
"""

from __future__ import annotations

import json
import os
import random
import shutil
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
COLORS_FILE = HERE / "ral_colors.txt"
OUTPUT_FILE = HERE / "ral_colors_detail.txt"
COOKIE_JAR = HERE / ".ral_cookies.txt"

BASE_URL = "https://m.tu-bo.com/api/applet/colorBook/getRecipe"

# IMPORTANT: Tubo-Sign and Authorization are session-bound values. When they
# expire / rotate, copy the fresh values from a working VS Code REST Client
# request into the dict below. The order in which the entries are listed in
# `RAW_HEADER_ORDER` is the exact order curl will send them on the wire.
TUBO_SIGN = "44d02e99c2bd12ffde05486372d5a522"
AUTHORIZATION = "2609a5c1a5e84117be16ad8997b2747d"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 "
    "MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI "
    "MiniProgramEnv/Windows WindowsWechat/WMPF "
    "WindowsWechat(0x63090a13) UnifiedPCWindowsWechat(0xf2541936) XWEB/19823"
)

# Header order as it appears in the working VS Code REST Client request.
# Curl forwards --header arguments in the order given, so this is the exact
# byte-for-byte order on the wire.
RAW_HEADERS = [
    f"Host: m.tu-bo.com",
    "Connection: keep-alive",
    "Language: zh_CN",
    f"Tubo-Sign: {TUBO_SIGN}",
    f"Authorization: {AUTHORIZATION}",
    f"User-Agent: {USER_AGENT}",
    "xweb_xhr: 1",
    "Content-Type: application/json",
    "Accept: */*",
    "Sec-Fetch-Site: cross-site",
    "Sec-Fetch-Mode: cors",
    "Sec-Fetch-Dest: empty",
    "Referer: https://servicewechat.com/wx245884ef5eb4d961/41/page-frame.html",
    "Accept-Encoding: gzip, deflate, br",
    "Accept-Language: zh-CN,zh;q=0.9",
]

# Pause window between requests (seconds), per the task description.
MIN_DELAY = 1.0
MAX_DELAY = 3.0

CURL_TIMEOUT = 30


def find_curl():
    """Return the path to curl.exe. Prefers the system one over PowerShell's
    `curl` alias (which on Windows is Invoke-WebRequest and behaves very
    differently)."""
    path = shutil.which("curl.exe")
    if path:
        return path
    return shutil.which("curl")  # fall back; may be the PS alias


def load_colors():
    """Load the RAL color list, tolerating a hand-trimmed file that still has
    a trailing comma after the last object (a very common shape when a user
    reduces the array for testing)."""
    text = COLORS_FILE.read_text(encoding="utf-8")
    text = _strip_trailing_commas(text)
    return json.loads(text)


def _strip_trailing_commas(text):
    """Remove trailing commas that appear before `]` or `}` so a hand-trimmed
    array like `[{...},]` parses as strict JSON."""
    import re
    # First strip /* */ comments and // line comments (JSONC)
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"(?m)//.*?$", "", text)
    # Then drop commas that are followed (after optional whitespace/newline) by
    # a closing bracket or brace.
    return re.sub(r",(\s*[\]}])", r"\1", text)


def load_existing_ids():
    if not OUTPUT_FILE.exists() or OUTPUT_FILE.stat().st_size == 0:
        return set()
    seen = set()
    with OUTPUT_FILE.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            cid = obj.get("id")
            if cid is not None:
                seen.add(cid)
    return seen


def fetch_recipe(curl_path, color_id):
    """Invoke curl.exe for one id and return the parsed JSON body.
    Raises subprocess.CalledProcessError / json.JSONDecodeError on failure."""
    url = f"{BASE_URL}/{color_id}"
    cmd = [
        curl_path,
        "--silent",          # no progress meter
        "--show-error",      # but still surface transport errors on stderr
        "--location",        # follow redirects
        "--http1.1",         # match the working REST request
        "--max-time", str(CURL_TIMEOUT),
        "--compressed",      # ask for gzip/deflate/br AND auto-decompress
        "--cookie-jar", str(COOKIE_JAR),
        "--cookie", str(COOKIE_JAR),
        "-X", "GET",
        url,
    ]
    for header in RAW_HEADERS:
        # Curl will refuse to send the Host header from the command line (it
        # generates it itself from the URL) and Connection: keep-alive on
        # HTTP/1.1 is the default, so we skip those two but keep their position
        # conceptually by leaving them out of the wire order.
        if header.lower().startswith("host:"):
            continue
        if header.lower().startswith("connection:"):
            continue
        cmd[cmd.index(url):cmd.index(url)] = ["-H", header]
        # ^ insert just before the URL so order is preserved

    # On Windows, the shell can change child env vars; make sure we don't
    # accidentally re-introduce a Charles-style proxy that some PowerShell
    # sessions inject.
    env = {
        k: v for k, v in os.environ.items()
        if k.lower() not in {"http_proxy", "https_proxy", "all_proxy",
                              "no_proxy", "curl_ca_bundle"}
    }
    env.pop("HTTP_PROXY", None)
    env.pop("HTTPS_PROXY", None)

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"curl exited {result.returncode}: {result.stderr.strip()[:300]}"
        )
    return json.loads(result.stdout)


def write_entry(out_handle, color, response=None, error=None):
    entry = {
        "id": color.get("id"),
        "colorNo": color.get("colorNo"),
        "colorName": color.get("colorName"),
        "hex": color.get("hex"),
        "categoryName": color.get("categoryName"),
        "brandName": color.get("brandName"),
    }
    if response is not None:
        entry["response"] = response
    if error is not None:
        entry["error"] = error
    out_handle.write(json.dumps(entry, ensure_ascii=False) + "\n")
    out_handle.flush()


def main():
    curl_path = find_curl()
    if not curl_path:
        print("ERROR: curl.exe was not found on PATH. Install curl or add it to PATH.", file=sys.stderr)
        sys.exit(1)
    print(f"Using curl: {curl_path}")

    colors = load_colors()
    print(f"Loaded {len(colors)} colors from {COLORS_FILE.name}")

    seen = load_existing_ids()
    pending = [c for c in colors if c.get("id") is not None and c.get("id") not in seen]
    print(f"Skipping {len(seen)} already-fetched ids, {len(pending)} remaining")

    if not pending:
        print("Nothing to do.")
        return

    # Touch the cookie jar so curl doesn't complain on the first request.
    COOKIE_JAR.touch(exist_ok=True)

    success = 0
    failed = 0
    with OUTPUT_FILE.open("a", encoding="utf-8") as out:
        for i, color in enumerate(pending, start=1):
            cid = color.get("id")
            label = f"{color.get('colorNo')} ({cid})"
            try:
                response = fetch_recipe(curl_path, cid)
                write_entry(out, color, response=response)
                success += 1
                print(f"[{i}/{len(pending)}] {label} OK")
            except Exception as e:
                write_entry(out, color, error=f"{type(e).__name__}: {e}")
                failed += 1
                print(f"[{i}/{len(pending)}] {label} FAILED: {e}")

            if i < len(pending):
                time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))

    print(f"\nDone. success={success} failed={failed} output={OUTPUT_FILE}")


if __name__ == "__main__":
    main()
