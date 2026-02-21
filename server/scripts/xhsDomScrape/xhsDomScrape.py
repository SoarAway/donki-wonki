"""Xiaohongshu scraper using DOM extraction with network JSON fallback.

This script keeps all runtime artifacts inside `server/scripts/xhsDomScrape`:
- `xhs_dom_scrape.log`
- `xhs_dom_scraped_data.json`
- `playwright_profile/` (persistent login session)
"""

import asyncio
import importlib
import json
import logging
import os
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Set
from urllib.parse import parse_qsl, quote_plus, urlencode, urlparse, urlsplit, urlunsplit

# Runtime and extraction configuration.
WINDOW_KEYWORDS = ("xiaohongshu", "小红书")
BASE_DIR = Path(__file__).resolve().parent
OUTPUT_JSON_FILE = BASE_DIR / "xhs_dom_scraped_data.json"
LOG_FILE = BASE_DIR / "xhs_dom_scrape.log"
PROFILE_DIR = BASE_DIR / "playwright_profile"

HEADLESS = False
NAVIGATION_TIMEOUT_MS = 60000
MAX_NETWORK_ITEMS = 200
DEFAULT_QUERY = os.getenv("XHS_QUERY", "lrt")
RESET_PROFILE = os.getenv("XHS_RESET_PROFILE", "0") == "1"
TARGET_URLS = [
    "https://www.xiaohongshu.com/explore",
    f"https://www.xiaohongshu.com/search_result?keyword={quote_plus(DEFAULT_QUERY)}",
]
RESPONSE_HINTS = ("api", "feed", "search", "note", "sns")
LOGIN_HINTS = ("login", "sign in", "登录", "扫码登录", "请登录")
LOGIN_URL_HINTS = ("/login", "qrcode", "redcaptcha")
LOGIN_POLL_SECONDS = 3
LOGIN_WAIT_TIMEOUT_SECONDS = int(os.getenv("XHS_LOGIN_WAIT_TIMEOUT_SEC", "120"))
LOGIN_CONFIRM_POLLS = int(os.getenv("XHS_LOGIN_CONFIRM_POLLS", "2"))
NOTE_ID_PATTERN = re.compile(r"^[0-9a-f]{24}$", re.IGNORECASE)
MAX_DETAIL_NOTES = int(os.getenv("XHS_DETAIL_MAX", "15"))
CLICK_FIRST_MAX_ROUNDS = int(os.getenv("XHS_CLICK_FIRST_MAX_ROUNDS", "1"))


def get_logger() -> logging.Logger:
    """Create a file logger once and reuse it across calls."""
    logger = logging.getLogger("xhs_dom_scrape")
    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")

    file_handler = logging.FileHandler(str(LOG_FILE), encoding="utf-8")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger


def normalize_text(value: str) -> str:
    """Normalize text for stable keyword and dedupe checks."""
    return re.sub(r"\s+", " ", value).strip().lower()


def contains_xhs_keyword(value: str) -> bool:
    """Return True when a string looks related to Xiaohongshu."""
    normalized = normalize_text(value)
    return any(keyword in normalized for keyword in WINDOW_KEYWORDS)


QUERY_TERMS = tuple(term for term in re.split(r"\s+", normalize_text(DEFAULT_QUERY)) if term)


def discover_target_windows(logger: logging.Logger) -> List[Dict[str, Any]]:
    """Collect desktop window metadata matching XHS keywords.

    This metadata is informative for operators and debugging; scraping is still
    performed through Playwright pages.
    """
    try:
        gw = importlib.import_module("pygetwindow")
    except ModuleNotFoundError as exc:
        logger.error("Missing dependency 'pygetwindow'. Install from server/scripts/requirements.txt")
        raise RuntimeError("pygetwindow is required") from exc

    windows = [w for w in gw.getAllWindows() if getattr(w, "title", "")]
    matches: List[Dict[str, Any]] = []

    for window in windows:
        title = window.title.strip()
        if not title:
            continue
        if not contains_xhs_keyword(title):
            continue

        matches.append(
            {
                "title": title,
                "left": int(getattr(window, "left", 0)),
                "top": int(getattr(window, "top", 0)),
                "width": int(getattr(window, "width", 0)),
                "height": int(getattr(window, "height", 0)),
                "is_minimized": bool(getattr(window, "isMinimized", False)),
            }
        )

    if matches:
        logger.info("Matched %s desktop windows with XHS keywords.", len(matches))
        for match in matches:
            logger.info("Window match: %s", match["title"])
    else:
        logger.warning("No desktop windows matched keywords: %s", ", ".join(WINDOW_KEYWORDS))

    return matches


def as_text(value: Any) -> str:
    """Coerce loose values from DOM/network payloads into clean strings."""
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (int, float, bool)):
        return str(value)
    return ""


def compute_query_signal(*chunks: str) -> Dict[str, Any]:
    """Summarize how strongly extracted text matches the target query."""
    combined = normalize_text(" ".join(as_text(chunk) for chunk in chunks if chunk))
    if not combined:
        return {
            "query": DEFAULT_QUERY,
            "matched_terms": [],
            "matched_term_count": 0,
            "combined_text_length": 0,
        }

    matched_terms = [term for term in QUERY_TERMS if term in combined]
    return {
        "query": DEFAULT_QUERY,
        "matched_terms": matched_terms,
        "matched_term_count": len(matched_terms),
        "combined_text_length": len(combined),
    }


def parse_network_payload(payload: Any, source_url: str, logger: logging.Logger) -> List[Dict[str, Any]]:
    """Recursively parse possible note records from a JSON response."""
    found: List[Dict[str, Any]] = []
    visited_ids: Set[int] = set()

    def walk(node: Any) -> None:
        if len(found) >= MAX_NETWORK_ITEMS:
            return
        node_id = id(node)
        if node_id in visited_ids:
            return
        visited_ids.add(node_id)

        if isinstance(node, dict):
            note_id = as_text(node.get("note_id") or node.get("noteId") or node.get("id"))
            title = as_text(node.get("title") or node.get("note_title"))
            desc = as_text(node.get("desc") or node.get("content") or node.get("note_desc"))
            xsec_token = as_text(node.get("xsec_token") or node.get("xsecToken"))
            xsec_source = as_text(node.get("xsec_source") or node.get("xsecSource"))

            if not xsec_source and "/search/" in source_url:
                xsec_source = "pc_search"
            elif not xsec_source and "/feed" in source_url:
                xsec_source = "pc_feed"

            if isinstance(node.get("user"), dict):
                user = as_text(node["user"].get("nickname") or node["user"].get("name") or node["user"].get("user_name"))
            else:
                user = as_text(node.get("nickname") or node.get("author") or node.get("user_name"))

            interaction = as_text(node.get("liked_count") or node.get("like_count") or node.get("likes") or node.get("interact_info"))
            publish_time = as_text(node.get("time") or node.get("publish_time") or node.get("create_time"))

            looks_like_note = bool(note_id and NOTE_ID_PATTERN.match(note_id))

            if looks_like_note or title or desc:
                found.append(
                    {
                        "note_id": note_id,
                        "title": title,
                        "text": desc,
                        "author": user,
                        "likes": interaction,
                        "publish_time": publish_time,
                        "xsec_token": xsec_token,
                        "xsec_source": xsec_source,
                        "source": "network",
                        "source_url": source_url,
                    }
                )

            for value in node.values():
                walk(value)
            return

        if isinstance(node, list):
            for item in node:
                walk(item)

    try:
        walk(payload)
    except Exception as exc:
        logger.warning("Network payload parsing failed for %s: %s", source_url, exc)

    deduped: List[Dict[str, Any]] = []
    signatures: Set[str] = set()
    for item in found:
        signature = "|".join(
            [
                item.get("note_id", ""),
                item.get("title", ""),
                item.get("text", "")[:120],
                item.get("author", ""),
            ]
        )
        if signature in signatures:
            continue
        signatures.add(signature)
        deduped.append(item)

    return deduped


class NetworkCollector:
    """Asynchronous response collector attached to Playwright pages."""

    def __init__(self, logger: logging.Logger) -> None:
        self.logger = logger
        self.items: List[Dict[str, Any]] = []
        self.pending_tasks: Set[asyncio.Task] = set()
        self.seen_responses: Set[str] = set()

    def _track_task(self, task: asyncio.Task) -> None:
        """Track background response-processing tasks and surface errors."""
        self.pending_tasks.add(task)

        def _cleanup(done_task: asyncio.Task) -> None:
            self.pending_tasks.discard(done_task)
            if done_task.cancelled():
                return
            if done_task.exception() is not None:
                self.logger.warning("Response task failed: %s", done_task.exception())

        task.add_done_callback(_cleanup)

    def attach(self, page: Any) -> None:
        """Subscribe to the page `response` event and process JSON payloads."""
        async def on_response(response: Any) -> None:
            try:
                await self.capture_response(response)
            except Exception as exc:
                self.logger.warning("Failed processing response %s: %s", response.url, exc)

        page.on("response", lambda response: self._track_task(asyncio.create_task(on_response(response))))

    async def capture_response(self, response: Any) -> None:
        """Process one network response if it appears relevant to XHS data."""
        url = response.url
        if "xiaohongshu" not in url and "xhs" not in url:
            return

        lowered = url.lower()
        if not any(key in lowered for key in RESPONSE_HINTS):
            return

        if url in self.seen_responses:
            return
        self.seen_responses.add(url)

        content_type = response.headers.get("content-type", "")
        if "json" not in content_type.lower():
            return

        try:
            payload = await response.json()
        except Exception as exc:
            self.logger.warning("Could not decode JSON from %s: %s", url, exc)
            return

        parsed = parse_network_payload(payload, url, self.logger)
        if parsed:
            self.items.extend(parsed)
            self.logger.info("Captured %s records from network response: %s", len(parsed), url)

    async def flush(self) -> None:
        """Wait for all response tasks to complete before finalizing output."""
        if not self.pending_tasks:
            return
        await asyncio.gather(*self.pending_tasks, return_exceptions=True)


def write_output_json(result: Dict[str, Any]) -> None:
    """Persist scrape output as formatted JSON (atomic write)."""
    temp_file = OUTPUT_JSON_FILE.with_suffix(".tmp")
    with open(temp_file, "w", encoding="utf-8") as output_file:
        json.dump(result, output_file, ensure_ascii=False, indent=2)
    temp_file.replace(OUTPUT_JSON_FILE)


def checkpoint_output(logger: logging.Logger, output: Dict[str, Any], stage: str) -> None:
    """Write partial progress so interrupted runs still leave useful output."""
    diagnostics = output.setdefault("diagnostics", {})
    diagnostics["stage"] = stage
    diagnostics["checkpoint_written_at"] = datetime.now(timezone.utc).isoformat()
    write_output_json(output)
    logger.info("Checkpoint saved at stage: %s", stage)


async def extract_dom_posts(page: Any, logger: logging.Logger) -> List[Dict[str, Any]]:
    """Extract note-like cards from the page DOM using resilient selectors."""
    try:
        await page.wait_for_load_state("domcontentloaded", timeout=NAVIGATION_TIMEOUT_MS)
    except Exception:
        logger.warning("Timed out waiting for DOM content on %s", page.url)

    await page.wait_for_timeout(2500)

    try:
        dom_result = await page.evaluate(
            """
            () => {
              const pickText = (root, selectors) => {
                for (const selector of selectors) {
                  const node = root.querySelector(selector);
                  if (node && node.textContent && node.textContent.trim()) {
                    return node.textContent.trim();
                  }
                }
                return "";
              };

              const cardSelectors = [
                'section.note-item',
                'div.note-item',
                '[class*="note-item"]',
                '[class*="feed-item"]',
                'article',
                'section'
              ];

              const cards = [];
              const seen = new Set();
              for (const selector of cardSelectors) {
                const nodes = document.querySelectorAll(selector);
                for (const node of nodes) {
                  if (!(node instanceof HTMLElement)) {
                    continue;
                  }
                  const key = node.innerText ? node.innerText.trim().slice(0, 160) : "";
                  if (!key || seen.has(key)) {
                    continue;
                  }
                  seen.add(key);

                  const title = pickText(node, ['h1', 'h2', 'h3', '[class*="title"]']);
                  const text = pickText(node, ['[class*="desc"]', '[class*="content"]', 'p', 'span']);
                  const author = pickText(node, ['[class*="author"]', '[class*="user"]', '[class*="name"]']);
                  const likes = pickText(node, ['[class*="like"]', '[class*="interact"]']);
                  const linkNode = node.closest('a') || node.querySelector('a');
                  const href = linkNode && linkNode.href ? linkNode.href : "";

                  if (title || text || author) {
                    cards.push({
                      note_id: node.getAttribute('data-note-id') || node.getAttribute('data-id') || "",
                      title,
                      text,
                      author,
                      likes,
                      url: href,
                      source: 'dom'
                    });
                  }
                }
              }

              return {
                page_title: document.title || "",
                page_url: location.href,
                cards
              };
            }
            """
        )
    except Exception as exc:
        logger.warning("DOM extraction failed on %s: %s", page.url, exc)
        return []

    posts: List[Dict[str, Any]] = []
    for card in dom_result.get("cards", []):
        card_url = as_text(card.get("url"))
        extracted_note_id = extract_note_id_from_url(card_url)
        parsed_card_url = urlparse(card_url) if card_url else None
        card_qs = dict(parse_qsl(parsed_card_url.query)) if parsed_card_url else {}

        post = {
            "note_id": as_text(card.get("note_id")) or extracted_note_id,
            "title": as_text(card.get("title")),
            "text": as_text(card.get("text")),
            "author": as_text(card.get("author")),
            "likes": as_text(card.get("likes")),
            "url": card_url,
            "xsec_token": as_text(card_qs.get("xsec_token", "")),
            "xsec_source": as_text(card_qs.get("xsec_source", "")),
            "source": "dom",
            "source_page": as_text(dom_result.get("page_url") or page.url),
        }
        if post["note_id"] or post["title"] or post["text"]:
            posts.append(post)

    logger.info("DOM extraction from %s returned %s candidate posts.", page.url, len(posts))
    return posts


def merge_posts(dom_posts: List[Dict[str, Any]], network_posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Merge and deduplicate records from DOM and network extraction paths."""
    merged: List[Dict[str, Any]] = []
    signatures: Set[str] = set()

    for post in dom_posts + network_posts:
        signature = "|".join(
            [
                as_text(post.get("note_id")),
                as_text(post.get("title")),
                as_text(post.get("text"))[:160],
                as_text(post.get("author")),
            ]
        )
        if signature in signatures:
            continue
        signatures.add(signature)
        merged.append(post)

    return merged


def normalize_detail_url(raw_url: str) -> str:
    """Normalize a candidate note URL and reject non-note/API endpoints."""
    if not raw_url:
        return ""

    url = raw_url.strip()
    if not url:
        return ""

    if url.startswith("//"):
        url = f"https:{url}"
    elif url.startswith("/"):
        url = f"https://www.xiaohongshu.com{url}"

    parsed = urlparse(url)
    host = parsed.netloc.lower()
    path = parsed.path or ""

    if not host.endswith("xiaohongshu.com"):
        return ""

    if host.startswith("edith.") or "/api/" in path:
        return ""

    # Keep only user-facing note detail paths.
    if not (path.startswith("/explore/") or path.startswith("/discovery/item/")):
        return ""

    return url


def extract_note_id_from_url(raw_url: str) -> str:
    """Extract canonical 24-char note id from supported detail URL paths."""
    if not raw_url:
        return ""

    match = re.search(r"/(?:explore|discovery/item)/([0-9a-f]{24})(?:/|$|\?)", raw_url, re.IGNORECASE)
    if not match:
        return ""
    return match.group(1)


def add_xsec_params_to_url(detail_url: str, xsec_token: str, xsec_source: str) -> str:
    """Attach xsec params to a note URL when token context exists."""
    if not detail_url or not xsec_token:
        return detail_url

    split_url = urlsplit(detail_url)
    query_pairs = dict(parse_qsl(split_url.query))
    query_pairs["xsec_token"] = xsec_token
    query_pairs["xsec_source"] = xsec_source or "pc_search"
    return urlunsplit(
        (
            split_url.scheme,
            split_url.netloc,
            split_url.path,
            urlencode(query_pairs),
            split_url.fragment,
        )
    )


def score_detail_target(post: Dict[str, Any], xsec_token: str, source_page: str, source_url: str) -> int:
    """Score a candidate target so highest-fidelity navigation wins."""
    score = 0
    if xsec_token:
        score += 100
    if "search_result" in source_page:
        score += 35
    if "search/notes" in source_url:
        score += 25
    if as_text(post.get("source")) == "network":
        score += 20
    if as_text(post.get("xsec_source")):
        score += 8
    if normalize_detail_url(as_text(post.get("url"))):
        score += 5
    return score


def build_detail_targets(merged_posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Build highest-fidelity note targets, preferring tokenized search context."""
    best_by_note_id: Dict[str, Dict[str, Any]] = {}

    for post in merged_posts:
        raw_url = as_text(post.get("url") or post.get("source_url"))
        note_id = as_text(post.get("note_id"))
        xsec_token = as_text(post.get("xsec_token"))
        xsec_source = as_text(post.get("xsec_source"))
        source_page = as_text(post.get("source_page")) or TARGET_URLS[-1]
        source_url = as_text(post.get("source_url"))

        detail_url = normalize_detail_url(raw_url)
        if not detail_url and note_id and NOTE_ID_PATTERN.match(note_id):
            detail_url = f"https://www.xiaohongshu.com/explore/{note_id}"

        if not detail_url:
            continue

        url_note_id = extract_note_id_from_url(detail_url)
        if not url_note_id:
            continue

        effective_note_id = note_id if NOTE_ID_PATTERN.match(note_id) else url_note_id
        if not effective_note_id:
            continue

        canonical_url = f"https://www.xiaohongshu.com/explore/{effective_note_id}"
        attempted_url = add_xsec_params_to_url(canonical_url, xsec_token, xsec_source)
        priority = score_detail_target(post, xsec_token=xsec_token, source_page=source_page, source_url=source_url)

        candidate = {
            "note_id": effective_note_id,
            "url": attempted_url.rstrip("/"),
            "canonical_url": canonical_url,
            "source_page": source_page,
            "source_url": source_url,
            "xsec_token": xsec_token,
            "xsec_source": xsec_source,
            "priority": priority,
            "preferred_strategy": "direct" if xsec_token else "click_then_direct",
        }

        previous = best_by_note_id.get(effective_note_id)
        if previous is None or candidate["priority"] > previous["priority"]:
            best_by_note_id[effective_note_id] = candidate

    ranked = sorted(best_by_note_id.values(), key=lambda item: item.get("priority", 0), reverse=True)
    return ranked[:MAX_DETAIL_NOTES]


async def open_detail_via_click(context: Any, target: Dict[str, Any], logger: logging.Logger) -> Any:
    """Try to open note detail by clicking from feed/search page first."""
    note_id = as_text(target.get("note_id"))
    source_page_url = as_text(target.get("source_page")) or TARGET_URLS[-1]

    if not note_id or not NOTE_ID_PATTERN.match(note_id):
        return None

    page = await context.new_page()

    try:
        await page.goto(source_page_url, wait_until="domcontentloaded", timeout=NAVIGATION_TIMEOUT_MS)
    except Exception as exc:
        logger.warning("Could not open source page for click-first flow (%s): %s", source_page_url, exc)
        await page.close()
        return None

    selectors = [
        f'a[href*="/explore/{note_id}"]',
        f'a[href*="/discovery/item/{note_id}"]',
    ]

    clicked = False
    before_pages = list(context.pages)

    for _ in range(max(CLICK_FIRST_MAX_ROUNDS, 1)):
        for selector in selectors:
            locator = page.locator(selector)
            count = await locator.count()
            if count <= 0:
                continue

            try:
                await locator.first.scroll_into_view_if_needed(timeout=4000)
            except Exception:
                pass

            try:
                await locator.first.click(timeout=6000)
                clicked = True
                break
            except Exception:
                continue

        if clicked:
            break

        # Keep click-first fast. If the target is not immediately discoverable,
        # fall back to direct navigation with preserved URL context.
        await page.wait_for_timeout(500)

    if not clicked:
        await page.close()
        return None

    await page.wait_for_timeout(1500)
    after_pages = list(context.pages)
    new_pages = [p for p in after_pages if p not in before_pages]

    if new_pages:
        try:
            await page.close()
        except Exception:
            pass
        return new_pages[-1]

    return page


async def extract_detail_context(page: Any, logger: logging.Logger) -> Dict[str, Any]:
    """Extract richer post context from an opened detail page."""
    try:
        await page.wait_for_load_state("domcontentloaded", timeout=NAVIGATION_TIMEOUT_MS)
        await page.wait_for_timeout(2000)
    except Exception:
        logger.warning("Detail page load wait timed out on %s", page.url)

    try:
        detail = await page.evaluate(
            """
            () => {
              const pickText = (selectors) => {
                for (const selector of selectors) {
                  const node = document.querySelector(selector);
                  if (node && node.textContent && node.textContent.trim()) {
                    return node.textContent.trim();
                  }
                }
                return "";
              };

              const pickMany = (selectors, limit = 20) => {
                for (const selector of selectors) {
                  const nodes = Array.from(document.querySelectorAll(selector));
                  const values = nodes
                    .map((node) => (node && node.textContent ? node.textContent.trim() : ""))
                    .filter(Boolean);
                  if (values.length) {
                    return values.slice(0, limit);
                  }
                }
                return [];
              };

              const articleText = pickText([
                'article',
                '[class*="note-content"]',
                '[class*="content"]',
                '[class*="desc"]',
              ]);

              const title = pickText([
                'h1',
                '[class*="title"]',
                '[data-testid="note-title"]'
              ]);

              const author = pickText([
                '[class*="author"]',
                '[class*="user"] [class*="name"]',
                '[class*="nickname"]'
              ]);

              const publishTime = pickText([
                'time',
                '[class*="time"]',
                '[class*="publish"]'
              ]);

              const tags = pickMany([
                'a[href*="/search_result"]',
                '[class*="tag"]',
                '[class*="topic"]'
              ], 30);

              const comments = pickMany([
                '[class*="comment"] [class*="content"]',
                '[class*="comment-item"]',
                '[class*="reply"] [class*="content"]'
              ], 20);

              const likeCount = pickText([
                '[class*="like"] [class*="count"]',
                '[class*="interact"] [class*="count"]',
                '[class*="like"]'
              ]);

              const collectCount = pickText([
                '[class*="collect"] [class*="count"]',
                '[class*="favorite"] [class*="count"]',
                '[class*="collect"]'
              ]);

              const commentCount = pickText([
                '[class*="comment"] [class*="count"]',
                '[class*="reply"] [class*="count"]'
              ]);

              const canonicalNode = document.querySelector('link[rel="canonical"]');
              const canonicalUrl = canonicalNode && canonicalNode.href ? canonicalNode.href : "";
              const metaDescNode = document.querySelector('meta[name="description"]');
              const metaDescription = metaDescNode && metaDescNode.content ? metaDescNode.content.trim() : "";

              return {
                page_title: document.title || "",
                page_url: location.href,
                canonical_url: canonicalUrl,
                meta_description: metaDescription,
                note_title: title,
                note_text: articleText,
                author,
                publish_time: publishTime,
                like_count: likeCount,
                collect_count: collectCount,
                comment_count: commentCount,
                tags,
                top_comments: comments,
              };
            }
            """
        )
    except Exception as exc:
        logger.warning("Detail extraction failed on %s: %s", page.url, exc)
        return {
            "page_url": page.url,
            "canonical_url": "",
            "meta_description": "",
            "note_title": "",
            "note_text": "",
            "author": "",
            "publish_time": "",
            "like_count": "",
            "collect_count": "",
            "comment_count": "",
            "tags": [],
            "top_comments": [],
            "error": str(exc),
        }

    return {
        "page_url": as_text(detail.get("page_url") or page.url),
        "page_title": as_text(detail.get("page_title")),
        "canonical_url": as_text(detail.get("canonical_url")),
        "meta_description": as_text(detail.get("meta_description")),
        "note_title": as_text(detail.get("note_title")),
        "note_text": as_text(detail.get("note_text")),
        "author": as_text(detail.get("author")),
        "publish_time": as_text(detail.get("publish_time")),
        "like_count": as_text(detail.get("like_count")),
        "collect_count": as_text(detail.get("collect_count")),
        "comment_count": as_text(detail.get("comment_count")),
        "tags": detail.get("tags", []),
        "top_comments": detail.get("top_comments", []),
    }


async def scrape_detail_pages(
    context: Any,
    logger: logging.Logger,
    collector: NetworkCollector,
    merged_posts: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Visit note pages and extract deeper context for each candidate post."""
    targets = build_detail_targets(merged_posts)
    detail_records: List[Dict[str, Any]] = []

    if not targets:
        logger.info("No detail targets found from merged posts.")
        return detail_records

    logger.info("Collecting detail context for up to %s notes.", len(targets))

    for index, target in enumerate(targets, start=1):
        page: Any = None
        navigation_method = ""
        attempted_url = as_text(target.get("url"))
        canonical_url = as_text(target.get("canonical_url"))
        expected_note_id = as_text(target.get("note_id"))

        try:
            logger.info(
                "Detail attempt %s/%s: navigating to %s (note_id=%s, xsec=%s, priority=%s)",
                index,
                len(targets),
                attempted_url,
                expected_note_id,
                "yes" if as_text(target.get("xsec_token")) else "no",
                target.get("priority", 0),
            )

            if as_text(target.get("preferred_strategy")) == "click_then_direct":
                page = await open_detail_via_click(context, target, logger)
                if page is not None:
                    collector.attach(page)
                    navigation_method = "click"
                    logger.info("Detail attempt %s opened via click-first flow: %s", index, attempted_url)
                else:
                    page = await context.new_page()
                    collector.attach(page)
                    navigation_method = "direct_fallback"
                    logger.info("Detail attempt %s fallback direct goto: %s", index, attempted_url)
                    await page.goto(attempted_url, wait_until="domcontentloaded", timeout=NAVIGATION_TIMEOUT_MS)
            else:
                page = await context.new_page()
                collector.attach(page)
                navigation_method = "direct"
                logger.info("Detail attempt %s direct goto: %s", index, attempted_url)
                await page.goto(attempted_url, wait_until="domcontentloaded", timeout=NAVIGATION_TIMEOUT_MS)

            resolved_url = page.url
            resolved_note_id = extract_note_id_from_url(resolved_url)
            trace = {
                "attempted_url": attempted_url,
                "resolved_url": resolved_url,
                "canonical_url": canonical_url,
                "source_page": as_text(target.get("source_page")),
                "source_url": as_text(target.get("source_url")),
                "expected_note_id": expected_note_id,
                "resolved_note_id": resolved_note_id,
                "xsec_token_present": bool(as_text(target.get("xsec_token"))),
                "xsec_source": as_text(target.get("xsec_source")),
                "navigation_method": navigation_method,
                "target_priority": int(target.get("priority", 0) or 0),
            }

            if expected_note_id and resolved_note_id != expected_note_id:
                logger.warning(
                    "Detail URL lost note context: expected %s, got %s (%s)",
                    expected_note_id,
                    resolved_note_id or "<none>",
                    resolved_url,
                )
                detail_records.append(
                    {
                        "note_id": expected_note_id,
                        "url": attempted_url,
                        **trace,
                        "error": "detail_redirect_no_context",
                    }
                )
                await page.close()
                continue

            if await is_404_page(page):
                detail_records.append(
                    {
                        "note_id": target.get("note_id", ""),
                        "url": attempted_url,
                        **trace,
                        "error": "detail_404",
                    }
                )
                await page.close()
                continue

            if await page_requires_login(page):
                logger.warning("Login prompt detected on detail page %s. Waiting for login.", attempted_url)
                login_ok = await wait_until_login_resolved(page, logger)
                if not login_ok:
                    detail_records.append(
                        {
                            "note_id": target.get("note_id", ""),
                            "url": attempted_url,
                            **trace,
                            "error": "login_not_completed",
                        }
                    )
                    await page.close()
                    continue

            resolved_url = page.url
            resolved_note_id = extract_note_id_from_url(resolved_url)
            trace["resolved_url"] = resolved_url
            trace["resolved_note_id"] = resolved_note_id

            if expected_note_id and resolved_note_id != expected_note_id:
                detail_records.append(
                    {
                        "note_id": expected_note_id,
                        "url": attempted_url,
                        **trace,
                        "error": "detail_context_lost_after_login",
                    }
                )
                await page.close()
                continue

            detail = await extract_detail_context(page, logger)
            detail["note_id"] = target.get("note_id", "")
            detail["url"] = attempted_url
            detail.update(trace)

            note_title = as_text(detail.get("note_title"))
            note_text = as_text(detail.get("note_text"))
            tags = detail.get("tags", []) if isinstance(detail.get("tags"), list) else []
            comments = detail.get("top_comments", []) if isinstance(detail.get("top_comments"), list) else []

            detail["quality_signals"] = {
                "has_note_title": bool(note_title),
                "has_note_text": bool(note_text),
                "note_text_length": len(note_text),
                "tag_count": len(tags),
                "top_comment_count": len(comments),
            }
            detail["labeling_signals"] = compute_query_signal(
                note_title,
                note_text,
                as_text(detail.get("meta_description")),
                " ".join(as_text(tag) for tag in tags[:10]),
                " ".join(as_text(comment) for comment in comments[:5]),
            )

            detail_records.append(detail)
        except Exception as exc:
            logger.warning("Detail page navigation failed for %s: %s", attempted_url, exc)
            detail_records.append(
                {
                    "note_id": target.get("note_id", ""),
                    "url": attempted_url,
                    "attempted_url": attempted_url,
                    "canonical_url": canonical_url,
                    "source_page": as_text(target.get("source_page")),
                    "source_url": as_text(target.get("source_url")),
                    "expected_note_id": expected_note_id,
                    "xsec_token_present": bool(as_text(target.get("xsec_token"))),
                    "xsec_source": as_text(target.get("xsec_source")),
                    "navigation_method": navigation_method,
                    "target_priority": int(target.get("priority", 0) or 0),
                    "error": str(exc),
                }
            )
        finally:
            if page is not None and hasattr(page, "close"):
                try:
                    await page.close()
                except Exception:
                    pass

    return detail_records


def enrich_merged_posts_with_detail(
    merged_posts: List[Dict[str, Any]], detail_posts: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Attach deep context to merged preview records by note_id/url."""
    detail_by_note_id: Dict[str, Dict[str, Any]] = {}
    detail_by_url: Dict[str, Dict[str, Any]] = {}

    for detail in detail_posts:
        note_id = as_text(detail.get("note_id"))
        url = as_text(detail.get("url") or detail.get("page_url")).rstrip("/")
        if note_id:
            detail_by_note_id[note_id] = detail
        if url:
            detail_by_url[url] = detail

    enriched: List[Dict[str, Any]] = []
    for post in merged_posts:
        record = dict(post)
        note_id = as_text(record.get("note_id"))
        url = as_text(record.get("url") or record.get("source_url")).rstrip("/")

        detail = None
        if note_id and note_id in detail_by_note_id:
            detail = detail_by_note_id[note_id]
        elif url and url in detail_by_url:
            detail = detail_by_url[url]

        if detail:
            record["full_context"] = {
                "page_title": as_text(detail.get("page_title")),
                "page_url": as_text(detail.get("page_url")),
                "canonical_url": as_text(detail.get("canonical_url")),
                "meta_description": as_text(detail.get("meta_description")),
                "note_title": as_text(detail.get("note_title")),
                "note_text": as_text(detail.get("note_text")),
                "author": as_text(detail.get("author")),
                "publish_time": as_text(detail.get("publish_time")),
                "like_count": as_text(detail.get("like_count")),
                "collect_count": as_text(detail.get("collect_count")),
                "comment_count": as_text(detail.get("comment_count")),
                "tags": detail.get("tags", []),
                "top_comments": detail.get("top_comments", []),
                "attempted_url": as_text(detail.get("attempted_url")),
                "resolved_url": as_text(detail.get("resolved_url")),
                "expected_note_id": as_text(detail.get("expected_note_id")),
                "resolved_note_id": as_text(detail.get("resolved_note_id")),
                "source_page": as_text(detail.get("source_page")),
                "xsec_token_present": bool(detail.get("xsec_token_present")),
                "xsec_source": as_text(detail.get("xsec_source")),
                "quality_signals": detail.get("quality_signals", {}),
                "labeling_signals": detail.get("labeling_signals", {}),
            }

        enriched.append(record)

    return enriched


async def open_target_pages(context: Any, logger: logging.Logger, collector: NetworkCollector) -> List[Any]:
    """Reuse existing XHS pages, otherwise open default seed URLs."""
    target_pages: List[Any] = []

    for existing in context.pages:
        collector.attach(existing)
        descriptor = f"{existing.url} {await existing.title()}"
        if contains_xhs_keyword(descriptor):
            target_pages.append(existing)

    if target_pages:
        logger.info("Using %s already-open XHS-related page(s).", len(target_pages))
        return target_pages

    for url in TARGET_URLS:
        page = await context.new_page()
        collector.attach(page)
        try:
            logger.info("Navigating to %s", url)
            await page.goto(url, wait_until="domcontentloaded", timeout=NAVIGATION_TIMEOUT_MS)
        except Exception:
            logger.warning("Navigation timeout on %s", url)

        if await page_requires_login(page):
            logger.warning("Login prompt detected at %s. Holding on this page.", page.url)
            return [page]

        target_pages.append(page)

    return target_pages


async def page_requires_login(page: Any) -> bool:
    """Detect whether current page appears to be a login/QR gate."""
    try:
        title = normalize_text(await page.title())
    except Exception:
        title = ""

    current_url = normalize_text(page.url)

    if any(hint in current_url for hint in LOGIN_URL_HINTS):
        return True

    body_text = ""
    try:
        body_text = normalize_text(
            await page.evaluate(
                "() => (document.body && document.body.innerText ? document.body.innerText.slice(0, 1200) : '')"
            )
        )
    except Exception:
        body_text = ""

    probe = " ".join([current_url, title, body_text])
    if not any(hint in probe for hint in LOGIN_HINTS):
        return False

    return await page_has_login_ui(page)


async def page_has_login_ui(page: Any) -> bool:
    """Check for concrete login widgets to avoid false positives."""
    try:
        return bool(
            await page.evaluate(
                """
                () => {
                  const selectors = [
                    'input[type="password"]',
                    '[class*="login"]',
                    '[class*="qrcode"]',
                    '[class*="captcha"]',
                    'img[src*="qrcode"]'
                  ];
                  if (selectors.some((selector) => document.querySelector(selector))) {
                    return true;
                  }
                  const txt = (document.body && document.body.innerText ? document.body.innerText : '').toLowerCase();
                  return txt.includes('扫码登录') || txt.includes('请登录') || txt.includes('sign in') || txt.includes('login');
                }
                """
            )
        )
    except Exception:
        return False


async def is_404_page(page: Any) -> bool:
    """Detect hard 404 pages quickly so detail loop can continue."""
    try:
        title = normalize_text(await page.title())
    except Exception:
        title = ""

    if "404" in title:
        return True

    try:
        body = normalize_text(
            await page.evaluate(
                "() => (document.body && document.body.innerText ? document.body.innerText.slice(0, 1500) : '')"
            )
        )
    except Exception:
        body = ""

    return "404" in body and ("not found" in body or "不存在" in body)


async def wait_until_login_resolved(page: Any, logger: logging.Logger) -> bool:
    """Pause workflow on login page until user completes authentication."""
    start_time = datetime.now(timezone.utc)
    logger.warning(
        "Login is required. Waiting on current page. Complete QR/login in browser to continue."
    )

    non_login_polls = 0

    while True:
        if not await page_requires_login(page):
            non_login_polls += 1
        else:
            non_login_polls = 0

        if non_login_polls >= LOGIN_CONFIRM_POLLS:
            logger.info("Login no longer detected. Continuing scrape.")
            return True

        if LOGIN_WAIT_TIMEOUT_SECONDS > 0:
            elapsed = (datetime.now(timezone.utc) - start_time).total_seconds()
            if elapsed >= LOGIN_WAIT_TIMEOUT_SECONDS:
                logger.warning(
                    "Login wait timed out after %s seconds.", LOGIN_WAIT_TIMEOUT_SECONDS
                )
                return False

        await asyncio.sleep(LOGIN_POLL_SECONDS)


async def scrape_xhs_dom_and_network() -> Dict[str, Any]:
    """Run full scrape flow and return structured output payload."""
    logger = get_logger()
    run_started = datetime.now(timezone.utc).isoformat()
    desktop_matches = discover_target_windows(logger)

    if RESET_PROFILE and PROFILE_DIR.exists():
        shutil.rmtree(PROFILE_DIR)
        logger.info("Reset existing Playwright profile directory.")

    PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("Using persistent Playwright profile: %s", str(PROFILE_DIR))

    output: Dict[str, Any] = {
        "run_started_at": run_started,
        "desktop_window_matches": desktop_matches,
        "target_pages": [],
        "dom_posts": [],
        "network_posts": [],
        "detail_posts": [],
        "merged_posts": [],
        "errors": [],
        "diagnostics": {
            "stage": "initialized",
            "dom_pages_processed": 0,
            "network_response_urls_seen": 0,
            "detail_pages_processed": 0,
            "detail_attempted_count": 0,
            "detail_success_count": 0,
            "detail_context_loss_count": 0,
            "dom_post_count": 0,
            "network_post_count": 0,
            "detail_post_count": 0,
            "merged_post_count": 0,
        },
    }
    checkpoint_output(logger, output, "initialized")

    try:
        playwright_module = importlib.import_module("playwright.async_api")
        async_playwright = getattr(playwright_module, "async_playwright")

        async with async_playwright() as playwright:
            context = await playwright.chromium.launch_persistent_context(
                user_data_dir=str(PROFILE_DIR),
                headless=HEADLESS,
                viewport={"width": 1400, "height": 900},
                args=["--disable-blink-features=AutomationControlled"],
            )

            collector = NetworkCollector(logger)
            pages = await open_target_pages(context, logger, collector)
            output["target_pages"] = [page.url for page in pages]
            output["diagnostics"]["target_page_count"] = len(pages)
            checkpoint_output(logger, output, "pages_opened")

            login_page = None
            for page in pages:
                if await page_requires_login(page):
                    login_page = page
                    break

            if login_page is not None:
                output["diagnostics"]["login_required"] = True
                checkpoint_output(logger, output, "login_required_waiting")
                login_ok = await wait_until_login_resolved(login_page, logger)
                if not login_ok:
                    output["errors"].append("Login not completed before timeout.")
                    checkpoint_output(logger, output, "login_wait_timeout")
                    await context.close()
                    return output
                output["target_pages"] = [page.url for page in pages]
                output["diagnostics"]["login_required"] = False
                checkpoint_output(logger, output, "login_resolved")

            dom_posts: List[Dict[str, Any]] = []
            for page in pages:
                try:
                    page_posts = await extract_dom_posts(page, logger)
                    dom_posts.extend(page_posts)
                    output["diagnostics"]["dom_pages_processed"] += 1
                    output["diagnostics"]["dom_post_count"] = len(dom_posts)
                    checkpoint_output(logger, output, "dom_progress")
                except Exception as exc:
                    message = f"DOM extraction failure on {page.url}: {exc}"
                    logger.warning(message)
                    output["errors"].append(message)

            await asyncio.sleep(1.5)
            await collector.flush()
            network_posts = collector.items
            output["diagnostics"]["network_response_urls_seen"] = len(collector.seen_responses)
            output["diagnostics"]["network_post_count"] = len(network_posts)
            output["dom_posts"] = dom_posts
            output["network_posts"] = network_posts
            checkpoint_output(logger, output, "network_collected")

            merged_posts = merge_posts(dom_posts=dom_posts, network_posts=network_posts)
            detail_posts = await scrape_detail_pages(
                context=context,
                logger=logger,
                collector=collector,
                merged_posts=merged_posts,
            )
            merged_posts = enrich_merged_posts_with_detail(merged_posts, detail_posts)

            output["dom_posts"] = dom_posts
            output["network_posts"] = network_posts
            output["detail_posts"] = detail_posts
            output["merged_posts"] = merged_posts
            output["diagnostics"]["dom_post_count"] = len(dom_posts)
            output["diagnostics"]["network_post_count"] = len(network_posts)
            output["diagnostics"]["detail_pages_processed"] = len(detail_posts)
            output["diagnostics"]["detail_post_count"] = len(
                [d for d in detail_posts if as_text(d.get("note_text")) or as_text(d.get("note_title"))]
            )
            output["diagnostics"]["detail_attempted_count"] = len(detail_posts)
            output["diagnostics"]["detail_success_count"] = len(
                [d for d in detail_posts if not as_text(d.get("error")) and as_text(d.get("resolved_note_id"))]
            )
            output["diagnostics"]["detail_context_loss_count"] = len(
                [d for d in detail_posts if as_text(d.get("error")).startswith("detail_context") or as_text(d.get("error")) == "detail_redirect_no_context"]
            )
            output["diagnostics"]["merged_post_count"] = len(merged_posts)
            checkpoint_output(logger, output, "merged")

            logger.info(
                "Extraction complete. DOM=%s, Network=%s, Merged=%s",
                len(dom_posts),
                len(network_posts),
                len(merged_posts),
            )

            await context.close()
    except Exception as exc:
        message = f"Fatal scrape failure: {exc}"
        logger.exception(message)
        output["errors"].append(message)
        checkpoint_output(logger, output, "fatal_error")
    finally:
        logger.info("Persistent Playwright profile preserved for next run.")

    output["run_finished_at"] = datetime.now(timezone.utc).isoformat()
    checkpoint_output(logger, output, "finished")
    return output


def main() -> None:
    """Script entrypoint."""
    logger = get_logger()
    logger.info("Starting Xiaohongshu DOM/network scraper.")
    try:
        result = asyncio.run(scrape_xhs_dom_and_network())
    except KeyboardInterrupt:
        logger.warning("Run interrupted by user. Last checkpoint (if any) remains at %s", str(OUTPUT_JSON_FILE))
        return

    write_output_json(result)
    logger.info("Wrote scrape output to %s", str(OUTPUT_JSON_FILE))

    if not result.get("merged_posts"):
        logger.warning("Run completed with zero merged posts. Check %s for details.", str(LOG_FILE))


if __name__ == "__main__":
    main()
