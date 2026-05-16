#!/usr/bin/env python3
"""
Generate a full PDF of the relocation dashboard.

Captures the complete screen-rendered dashboard:
  - Hero + navigation
  - Command Centre (lens controls, shortlist cards, relocation matrix)
  - Score Charts
  - City Explorer — one full-content page per city (all 24 cities)
  - Verification methodology and coverage tables

Usage (from project root, with venv active):
    python scripts/print_dashboard_pdf.py

Output:
    relocation-dashboard-full.pdf  (project root)
"""

import io
import http.server
import os
import threading
import time
from pathlib import Path

from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent
DIST_DIR = ROOT / "dist" / "relocation-dashboard"
OUTPUT_PDF = ROOT / "relocation-dashboard-full.pdf"
PORT = 19_273  # unlikely-to-conflict port


# ── Local HTTP server ────────────────────────────────────────────────────────
class quietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass  # silence request logs


def start_server() -> http.server.HTTPServer:
    """Serve dist/relocation-dashboard/ on localhost."""
    os.chdir(DIST_DIR)
    httpd = http.server.HTTPServer(("127.0.0.1", PORT), quietHandler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


# ── CSS injections ────────────────────────────────────────────────────────────
_HIDE_CSS_ID = "pdf-hide-injection"
_OPTIMISE_CSS_ID = "pdf-optimise-injection"

# Injected globally before every PDF call — removes effects that cause rasterisation
# and dramatically inflate file size (backdrop-filter is the main culprit).
_OPTIMISE_CSS = """
    * {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        box-shadow: none !important;
        transition: none !important;
        animation: none !important;
    }
    .panel, .hero, .score-card, .city-card, .threshold-card,
    .lens-mini-card, .summary-card, .summary-pill {
        background: rgba(255, 250, 240, 0.96) !important;
        border: 1px solid #cdd2d4 !important;
    }
    body, .app-shell {
        background: #f4f0e8 !important;
    }
"""

_HIDE_NON_EXPLORER_CSS = """
    .app-shell > header,
    #sec-board,
    #sec-charts,
    details#sec-verification,
    .print-only {
        display: none !important;
    }
    #sec-explorer {
        display: block !important;
    }
    body, .app-shell, main, .dashboard, .brief-stack {
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
    }
"""

_EXPLORER_PRINT_CSS = f"<style id='{_HIDE_CSS_ID}'>{_HIDE_NON_EXPLORER_CSS}</style>"


def wait_for_ready(page) -> None:
    page.wait_for_load_state("networkidle")
    page.wait_for_selector(".detail-explorer-controls select", timeout=20_000)
    time.sleep(0.4)


def inject_optimise_css(page) -> None:
    """Remove backdrop-filter and heavy effects. Must be called once after page load."""
    page.evaluate(
        f"""
        if (!document.getElementById({_OPTIMISE_CSS_ID!r})) {{
            const style = document.createElement('style');
            style.id = {_OPTIMISE_CSS_ID!r};
            style.textContent = {_OPTIMISE_CSS!r};
            document.head.appendChild(style);
        }}
        """
    )


def open_all_details(page) -> None:
    page.evaluate("document.querySelectorAll('details').forEach(el => el.setAttribute('open', ''))")
    time.sleep(0.25)


def pdf_bytes(page, **kwargs) -> bytes:
    defaults = dict(
        format="A3",
        landscape=True,
        print_background=True,
        scale=0.82,
        margin={"top": "10mm", "bottom": "10mm", "left": "10mm", "right": "10mm"},
    )
    return page.pdf(**{**defaults, **kwargs})


def append_pdf(writer: PdfWriter, pdf_bytes: bytes) -> int:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    for page in reader.pages:
        writer.add_page(page)
    return len(reader.pages)


def get_city_options(page) -> list[dict]:
    return page.evaluate(
        """
        Array.from(
            document.querySelector('.detail-explorer-controls select').options
        ).map(opt => ({ value: opt.value, text: opt.text }))
        """
    )


def select_city(page, key: str) -> None:
    """Change the explorer's city select and trigger the React onChange."""
    page.evaluate(
        f"""
        const sel = document.querySelector('.detail-explorer-controls select');
        sel.value = {key!r};
        sel.dispatchEvent(new Event('change', {{ bubbles: true }}));
        """
    )
    # Give React time to re-render the explorer panel
    time.sleep(0.6)


def inject_hide_css(page) -> None:
    page.evaluate(
        f"""
        if (!document.getElementById({_HIDE_CSS_ID!r})) {{
            document.head.insertAdjacentHTML('beforeend', {_EXPLORER_PRINT_CSS!r});
        }}
        """
    )


def remove_hide_css(page) -> None:
    page.evaluate(
        f"""
        const el = document.getElementById({_HIDE_CSS_ID!r});
        if (el) el.remove();
        """
    )


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    if not DIST_DIR.exists():
        raise FileNotFoundError(
            f"Built dashboard not found at {DIST_DIR}.\n"
            "Run  npm run dashboard:build  first."
        )

    print(f"Starting local server on port {PORT} …")
    httpd = start_server()
    url = f"http://127.0.0.1:{PORT}/"

    writer = PdfWriter()
    total_pages = 0

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        # Wide viewport — ensures all columns render at full width
        page = browser.new_page(viewport={"width": 1600, "height": 1000})
        # Screen media = full interactive layout (not the CSS print brief)
        page.emulate_media(media="screen")

        print(f"Loading {url} …")
        page.goto(url, wait_until="networkidle")
        wait_for_ready(page)

        # Inject performance CSS (removes backdrop-filter → much smaller PDF)
        inject_optimise_css(page)

        # Open verification details panel
        open_all_details(page)

        # ── Pass 1: full page with first city in explorer ────────────────────
        cities = get_city_options(page)
        print(f"Found {len(cities)} cities in explorer")

        print("Capturing full dashboard (pass 1 — all main sections + first city) …")
        n = append_pdf(writer, pdf_bytes(page))
        total_pages += n
        print(f"  {n} pages added  (running total: {total_pages})")

        # ── Pass 2: City Explorer for each remaining city ────────────────────
        for city in cities[1:]:
            key, label = city["value"], city["text"]
            print(f"Capturing City Explorer → {label} …")

            select_city(page, key)
            inject_hide_css(page)

            n = append_pdf(writer, pdf_bytes(page))
            total_pages += n

            remove_hide_css(page)
            print(f"  {n} pages  (running total: {total_pages})")

        browser.close()

    httpd.shutdown()

    print(f"\nWriting {OUTPUT_PDF.name} …")
    with open(OUTPUT_PDF, "wb") as fh:
        writer.write(fh)

    size_mb = OUTPUT_PDF.stat().st_size / 1_048_576
    print(f"Done — {total_pages} pages, {size_mb:.1f} MB → {OUTPUT_PDF}")


if __name__ == "__main__":
    main()
