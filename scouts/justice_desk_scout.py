#!/usr/bin/env python3
"""
Justice Desk Scout — Supreme Court public-data scout
Version: 1.0.0

Purpose
-------
A safe, polite, resumable scout for locating and downloading Supreme Court
judgments from public search pages. This scout does NOT use private,
authenticated, or undocumented endpoints. It writes JSONL records that can be
reviewed before ingestion into PostgreSQL/Firestore.

Usage examples
--------------
python scouts/justice_desk_scout.py --query "fromdate:01-01-2026 todate:31-12-2026" --max-pages 2 --max-docs 20
python scouts/justice_desk_scout.py --query "section 438 CrPC anticipatory bail" --out data/scout/sc_438.jsonl
"""

from __future__ import annotations

import argparse
import html
import json
import os
import random
import re
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable, List, Optional, Set
from urllib.parse import quote_plus, urljoin

import requests

BASE_URL = "https://indiankanoon.org"
SEARCH_URL = f"{BASE_URL}/search/?formInput={{query}}+doctypes:supremecourt&pagenum={{page}}"
DEFAULT_USER_AGENT = "JusticeDeskScout/1.0 (+https://github.com/AjayOberoi1117/Justicedesk-AI)"


@dataclass
class JudgmentRecord:
    source: str
    source_url: str
    ik_doc_id: str
    title: str
    court_level: str
    court_name: str
    fetched_at: str
    content_length: int
    content: str


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: List[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag.lower() != "a":
            return
        attrs_dict = dict(attrs)
        href = attrs_dict.get("href", "")
        if "/doc/" in href:
            self.links.append(href)


class TitleParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_title = False
        self.parts: List[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag.lower() == "title":
            self.in_title = True

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.parts.append(data)

    @property
    def title(self) -> str:
        return " ".join(self.parts).replace(" - Indian Kanoon", "").strip()


class JudgmentTextParser(HTMLParser):
    """Extracts text from divs whose class contains 'judgments'."""

    def __init__(self) -> None:
        super().__init__()
        self.capture_depth = 0
        self.parts: List[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        attrs_dict = dict(attrs)
        classes = attrs_dict.get("class", "") or ""
        if tag.lower() == "div" and "judgments" in classes:
            self.capture_depth += 1
        elif self.capture_depth:
            self.capture_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if self.capture_depth:
            self.capture_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.capture_depth:
            text = data.strip()
            if text:
                self.parts.append(text)

    @property
    def text(self) -> str:
        raw = "\n".join(self.parts)
        raw = html.unescape(raw)
        raw = re.sub(r"\n{3,}", "\n\n", raw)
        return raw.strip()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def request_get(session: requests.Session, url: str, timeout: int = 45) -> str:
    response = session.get(url, timeout=timeout)
    response.raise_for_status()
    return response.text


def extract_doc_id(url: str) -> str:
    match = re.search(r"/doc/(\d+)/?", url)
    if not match:
        raise ValueError(f"Could not extract IK doc id from URL: {url}")
    return match.group(1)


def search_links(session: requests.Session, query: str, page: int) -> List[str]:
    url = SEARCH_URL.format(query=quote_plus(query), page=page)
    html_text = request_get(session, url)
    parser = LinkParser()
    parser.feed(html_text)
    normalized = []
    seen = set()
    for href in parser.links:
        full = urljoin(BASE_URL, href)
        if "/doc/" not in full:
            continue
        doc_id = extract_doc_id(full)
        if doc_id not in seen:
            normalized.append(full)
            seen.add(doc_id)
    return normalized


def parse_title(html_text: str, fallback: str) -> str:
    parser = TitleParser()
    parser.feed(html_text)
    return parser.title or fallback


def parse_judgment_text(html_text: str) -> str:
    parser = JudgmentTextParser()
    parser.feed(html_text)
    text = parser.text
    if text:
        return text

    # Conservative fallback: strip HTML tags only when judgment container is absent.
    body = re.sub(r"<script[\s\S]*?</script>", " ", html_text, flags=re.I)
    body = re.sub(r"<style[\s\S]*?</style>", " ", body, flags=re.I)
    body = re.sub(r"<[^>]+>", " ", body)
    body = html.unescape(body)
    body = re.sub(r"\s+", " ", body).strip()
    return body


def classify_basic(content: str) -> tuple[str, str]:
    head = content[:3000]
    if re.search(r"Supreme Court of India|IN THE SUPREME COURT OF INDIA|Supreme Court - Daily Orders", head, re.I):
        return "supreme_court", "Supreme Court of India"
    if re.search(r"High Court", head, re.I):
        return "high_court", "High Court"
    return "unknown", "Unknown"


def load_done_ids(out_path: Path) -> Set[str]:
    if not out_path.exists():
        return set()
    done: Set[str] = set()
    with out_path.open("r", encoding="utf-8") as f:
        for line in f:
            try:
                obj = json.loads(line)
                if obj.get("ik_doc_id"):
                    done.add(str(obj["ik_doc_id"]))
            except Exception:
                continue
    return done


def append_jsonl(out_path: Path, record: JudgmentRecord) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(asdict(record), ensure_ascii=False) + "\n")


def run(args: argparse.Namespace) -> int:
    out_path = Path(args.out)
    done_ids = load_done_ids(out_path)

    session = requests.Session()
    session.headers.update({"User-Agent": args.user_agent})

    print("=" * 72)
    print("Justice Desk Scout — Supreme Court")
    print("=" * 72)
    print(f"Query       : {args.query}")
    print(f"Max pages   : {args.max_pages}")
    print(f"Max docs    : {args.max_docs}")
    print(f"Output      : {out_path}")
    print(f"Already done: {len(done_ids)}")
    print("=" * 72)

    saved = skipped = failed = 0
    discovered: List[str] = []
    seen_this_run: Set[str] = set()

    for page in range(args.max_pages):
        try:
            links = search_links(session, args.query, page)
            print(f"Page {page}: {len(links)} links")
            for link in links:
                doc_id = extract_doc_id(link)
                if doc_id not in seen_this_run:
                    discovered.append(link)
                    seen_this_run.add(doc_id)
        except Exception as exc:
            failed += 1
            print(f"[search failed] page={page}: {exc}")
        time.sleep(args.delay + random.uniform(0, args.jitter))

    print(f"Discovered unique docs: {len(discovered)}")

    for url in discovered:
        if args.max_docs and saved >= args.max_docs:
            break
        try:
            doc_id = extract_doc_id(url)
            if doc_id in done_ids:
                skipped += 1
                print(f"skip existing ik:{doc_id}")
                continue

            html_text = request_get(session, url)
            title = parse_title(html_text, fallback=url)
            content = parse_judgment_text(html_text)
            court_level, court_name = classify_basic(content)

            if len(content) < args.min_chars:
                failed += 1
                print(f"[too short] ik:{doc_id} chars={len(content)} title={title[:70]}")
                continue

            record = JudgmentRecord(
                source="indiankanoon",
                source_url=url,
                ik_doc_id=doc_id,
                title=title,
                court_level=court_level,
                court_name=court_name,
                fetched_at=now_iso(),
                content_length=len(content),
                content=content,
            )
            append_jsonl(out_path, record)
            done_ids.add(doc_id)
            saved += 1
            print(f"saved ik:{doc_id} | {court_name} | {title[:80]}")
        except Exception as exc:
            failed += 1
            print(f"[doc failed] {url}: {exc}")
        time.sleep(args.delay + random.uniform(0, args.jitter))

    print("=" * 72)
    print(f"Saved   : {saved}")
    print(f"Skipped : {skipped}")
    print(f"Failed  : {failed}")
    print("=" * 72)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Justice Desk Supreme Court scout")
    parser.add_argument("--query", default="fromdate:01-01-2026 todate:31-12-2026", help="Indian Kanoon query without doctypes; scout adds supremecourt filter")
    parser.add_argument("--max-pages", type=int, default=1)
    parser.add_argument("--max-docs", type=int, default=10)
    parser.add_argument("--out", default="data/scout/supreme_court_scout.jsonl")
    parser.add_argument("--delay", type=float, default=2.0)
    parser.add_argument("--jitter", type=float, default=1.0)
    parser.add_argument("--min-chars", type=int, default=500)
    parser.add_argument("--user-agent", default=DEFAULT_USER_AGENT)
    return parser


if __name__ == "__main__":
    raise SystemExit(run(build_parser().parse_args()))
