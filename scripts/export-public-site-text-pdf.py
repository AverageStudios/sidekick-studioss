#!/usr/bin/env python3

from __future__ import annotations

import argparse
import os
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]
ACADEMY_DATA = ROOT / "data" / "academy.ts"
PRODUCT_DATA = ROOT / "data" / "public-product-pages.ts"
OUTPUT_PATH = ROOT / "exports" / "sidekick-public-website-text.pdf"


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._skip_depth = 0
        self._skip_tags = {"script", "style", "svg", "noscript"}
        self._title_parts: list[str] = []
        self._h1_parts: list[str] = []
        self._in_title = False
        self._in_h1 = False
        self._lines: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in self._skip_tags:
            self._skip_depth += 1
        if tag == "title":
            self._in_title = True
        if tag == "h1":
            self._in_h1 = True

    def handle_endtag(self, tag: str) -> None:
        if tag in self._skip_tags and self._skip_depth > 0:
            self._skip_depth -= 1
        if tag == "title":
            self._in_title = False
        if tag == "h1":
            self._in_h1 = False

    def handle_data(self, data: str) -> None:
        if self._skip_depth:
            return

        cleaned = " ".join(data.split())
        if not cleaned:
            return

        if self._in_title:
            self._title_parts.append(cleaned)
        if self._in_h1:
            self._h1_parts.append(cleaned)

        self._lines.append(cleaned)

    @property
    def title(self) -> str:
        return " ".join(self._title_parts).strip()

    @property
    def h1(self) -> str:
        return " ".join(self._h1_parts).strip()

    @property
    def text(self) -> str:
        deduped: list[str] = []
        previous = None
        for line in self._lines:
            if line != previous:
                deduped.append(line)
            previous = line
        return "\n".join(deduped).strip()


def read_slugs(ts_path: Path) -> list[str]:
    content = ts_path.read_text(encoding="utf-8")
    return re.findall(r'slug:\s*"([^"]+)"', content)


def build_routes() -> list[tuple[str, str]]:
    academy_slugs = read_slugs(ACADEMY_DATA)
    product_slugs = read_slugs(PRODUCT_DATA)

    routes: list[tuple[str, str]] = [
        ("Homepage", "/"),
        ("Pricing", "/pricing"),
        ("FAQ", "/faq"),
        ("Privacy Policy", "/privacy"),
        ("Terms of Service", "/terms"),
        ("Academy", "/academy"),
        ("Product Overview", "/product"),
        ("Product: Templates", "/product/templates"),
    ]

    routes.extend((f"Academy: {slug}", f"/academy/{slug}") for slug in academy_slugs)
    routes.extend((f"Product: {slug}", f"/product/{slug}") for slug in product_slugs)
    return routes


def fetch_html(base_url: str, route: str) -> tuple[str, str]:
    url = urljoin(base_url.rstrip("/") + "/", route.lstrip("/"))
    request = Request(
        url,
        headers={
            "User-Agent": "SideKickPublicTextExport/1.0",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    with urlopen(request, timeout=30) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        html = response.read().decode(charset, errors="replace")
        return html, response.geturl()


def parse_page(html: str) -> TextExtractor:
    parser = TextExtractor()
    parser.feed(html)
    return parser


def smart_label(fallback_label: str, parser: TextExtractor) -> str:
    if fallback_label == "Homepage":
        return "Homepage"
    if fallback_label.startswith("Academy:") and parser.h1:
        return f"Academy: {parser.h1}"
    if fallback_label.startswith("Product:") and parser.h1:
        return f"Product: {parser.h1}"
    if parser.h1:
        return parser.h1
    if parser.title:
        return parser.title.split("|")[0].strip()
    return fallback_label


def page_intro() -> Iterable[Paragraph | Spacer | PageBreak]:
    styles = build_styles()
    yield Paragraph("SideKick Public Website Text Export", styles["doc_title"])
    yield Spacer(1, 0.16 * inch)
    yield Paragraph(
        "This PDF includes rendered text from the public website routes only. App pages such as Dashboard, Campaigns, Performance, Workspace Settings, Login, and Signup are intentionally excluded. Redirect-only public routes like /docs and /help are also excluded because they forward to Academy.",
        styles["body"],
    )
    yield PageBreak()


def build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "doc_title": ParagraphStyle(
            "doc_title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=28,
            textColor=HexColor("#171717"),
            spaceAfter=12,
        ),
        "page_title": ParagraphStyle(
            "page_title",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=24,
            textColor=HexColor("#111827"),
            spaceAfter=8,
        ),
        "meta": ParagraphStyle(
            "meta",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=HexColor("#6B7280"),
            spaceAfter=10,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=HexColor("#1F2937"),
            spaceAfter=6,
        ),
    }


def paragraphize(text: str) -> list[str]:
    lines = [line.strip() for line in text.splitlines()]
    return [line for line in lines if line]


def escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def build_pdf(base_url: str, output_path: Path) -> None:
    styles = build_styles()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    story: list[Paragraph | Spacer | PageBreak] = list(page_intro())
    failures: list[str] = []

    for fallback_label, route in build_routes():
        try:
            html, final_url = fetch_html(base_url, route)
            parsed = parse_page(html)
            label = smart_label(fallback_label, parsed)
            story.append(Paragraph(escape(label), styles["page_title"]))
            story.append(Paragraph(escape(f"Route: {route}"), styles["meta"]))
            if final_url.rstrip("/") != urljoin(base_url.rstrip("/") + "/", route.lstrip("/")).rstrip("/"):
                story.append(Paragraph(escape(f"Resolved URL: {final_url}"), styles["meta"]))

            page_text = paragraphize(parsed.text)
            if not page_text:
                story.append(Paragraph("No visible text was detected on this page.", styles["body"]))
            else:
                for line in page_text:
                    story.append(Paragraph(escape(line), styles["body"]))
            story.append(PageBreak())
        except (HTTPError, URLError, TimeoutError) as error:
            failures.append(f"{route}: {error}")

    if failures:
        story.append(Paragraph("Routes that could not be exported", styles["page_title"]))
        for failure in failures:
            story.append(Paragraph(escape(failure), styles["body"]))

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=LETTER,
        leftMargin=0.7 * inch,
        rightMargin=0.7 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
        title="SideKick Public Website Text Export",
        author="OpenAI Codex",
    )
    doc.build(story)


def main() -> int:
    parser = argparse.ArgumentParser(description="Export SideKick public website text into a PDF.")
    parser.add_argument("--base-url", default=os.environ.get("PUBLIC_SITE_EXPORT_BASE_URL", "http://127.0.0.1:3000"))
    parser.add_argument("--output", default=str(OUTPUT_PATH))
    args = parser.parse_args()

    output_path = Path(args.output).resolve()
    build_pdf(args.base_url, output_path)
    print(output_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
