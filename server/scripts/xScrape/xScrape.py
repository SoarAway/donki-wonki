import argparse
import asyncio
import importlib
import json
import os
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from urllib.parse import quote_plus, urljoin

gw = None
try:
    gw = importlib.import_module("pygetwindow")
except Exception:
    gw = None

BASE_DIR = Path(__file__).resolve().parent
PROFILE_DIR = BASE_DIR / "playwright_profile"
ERROR_SCREENSHOT_FILE = BASE_DIR / "error_debug.png"
DEFAULT_OUTPUT_FILE = "x_latest_posts.json"
DEFAULT_TIMEOUT_MS = 60000

DEFAULT_BASE_KEYWORDS = [
    "lrt",
    "kelana jaya",
    "rapidkl",
    "down",
    "delay",
    "fault",
]

MULTILINGUAL_KEYWORDS = {
    "ms": ["gangguan", "tergendala", "terlewat", "terkandas", "laluan kelana jaya"],
    "zh": ["轻快铁", "故障", "延误", "中断", "格拉那再也线"],
    "ta": ["லைட் ரெயில்", "தாமதம்", "சேவை தடை", "கோளாறு"],
}

ENGAGEMENT_PATTERNS = {
    "replies": re.compile(r"(\d[\d,.KMB]*|\d+)\s+repl(?:y|ies)", re.IGNORECASE),
    "reposts": re.compile(r"(\d[\d,.KMB]*|\d+)\s+reposts?", re.IGNORECASE),
    "likes": re.compile(r"(\d[\d,.KMB]*|\d+)\s+likes?", re.IGNORECASE),
    "bookmarks": re.compile(r"(\d[\d,.KMB]*|\d+)\s+bookmarks?", re.IGNORECASE),
    "views": re.compile(r"(\d[\d,.KMB]*|\d+)\s+views?", re.IGNORECASE),
}

REPLY_MARKERS = ["replying to", "replying", "membalas", "回复", "replaying"]


def build_parser() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Query-driven X scraper for LRT disruption training datasets."
    )
    parser.add_argument(
        "--query",
        action="append",
        default=[],
        help="Query term. Repeat flag or pass comma-separated terms.",
    )
    parser.add_argument(
        "--query-file",
        default="",
        help="Optional path to .txt or .json file containing additional queries.",
    )
    parser.add_argument(
        "--use-default-keywords",
        action="store_true",
        help="Include built-in base keywords when building query list.",
    )
    parser.add_argument(
        "--include-multilingual",
        action="store_true",
        help="Include multilingual keyword packs.",
    )
    parser.add_argument(
        "--languages",
        default="ms,zh",
        help="Language codes for multilingual packs, comma-separated (ms,zh,ta).",
    )
    parser.add_argument("--post-count", type=int, default=25, help="Target posts per query.")
    parser.add_argument(
        "--min-post-count",
        type=int,
        default=35,
        help="Attempt to collect at least this many posts per query.",
    )
    parser.add_argument("--max-scroll-rounds", type=int, default=40)
    parser.add_argument("--max-stagnant-rounds", type=int, default=5)
    parser.add_argument("--scroll-wait-ms", type=int, default=1800)
    parser.add_argument("--scroll-pixels", type=int, default=2800)
    parser.add_argument("--timeout-ms", type=int, default=DEFAULT_TIMEOUT_MS)
    parser.add_argument(
        "--output-file",
        default=DEFAULT_OUTPUT_FILE,
        help="Output file name/path. Will always be saved inside xScrape folder.",
    )
    parser.add_argument(
        "--search-mode",
        choices=["live", "top"],
        default="live",
        help="X search mode. live is recommended for incident signals.",
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Run browser headless; disable for manual login support.",
    )
    parser.add_argument(
        "--profile-name",
        default=os.getenv("XSCRAPE_PROFILE_NAME", "Default"),
        help="Chromium profile directory name.",
    )
    parser.add_argument(
        "--reset-profile",
        action="store_true",
        default=os.getenv("XSCRAPE_RESET_PROFILE", "0") == "1",
        help="Reset playwright profile before run.",
    )
    parser.add_argument(
        "--window-title",
        default=os.getenv("XSCRAPE_WINDOW_TITLE", ""),
        help="Optional desktop window title to focus before scraping.",
    )
    return parser.parse_args()


def split_terms(values: List[str]) -> List[str]:
    terms: List[str] = []
    for value in values:
        for token in value.split(","):
            candidate = token.strip()
            if candidate:
                terms.append(candidate)
    return terms


def read_query_file(file_path: str) -> List[str]:
    if not file_path:
        return []

    query_path = Path(file_path)
    if not query_path.is_absolute():
        query_path = (BASE_DIR / query_path).resolve()

    if not query_path.exists():
        print(f"⚠️ Query file not found: {query_path}")
        return []

    try:
        if query_path.suffix.lower() == ".json":
            with query_path.open("r", encoding="utf-8") as handle:
                payload = json.load(handle)
            if isinstance(payload, list):
                return [str(item).strip() for item in payload if str(item).strip()]
            if isinstance(payload, dict):
                raw = payload.get("queries", [])
                if isinstance(raw, list):
                    return [str(item).strip() for item in raw if str(item).strip()]
            return []

        with query_path.open("r", encoding="utf-8") as handle:
            return [line.strip() for line in handle if line.strip() and not line.startswith("#")]
    except Exception as exc:
        print(f"⚠️ Failed to read query file ({query_path}): {exc}")
        return []


def unique_terms(values: List[str]) -> List[str]:
    seen: Set[str] = set()
    deduped: List[str] = []
    for value in values:
        key = value.casefold().strip()
        if not key or key in seen:
            continue
        seen.add(key)
        deduped.append(value.strip())
    return deduped


def resolve_queries(args: argparse.Namespace) -> List[str]:
    collected: List[str] = []

    collected.extend(split_terms(args.query))
    collected.extend(read_query_file(args.query_file))

    if args.use_default_keywords or not collected:
        collected.extend(DEFAULT_BASE_KEYWORDS)

    if args.include_multilingual:
        selected_langs = [item.strip().lower() for item in args.languages.split(",") if item.strip()]
        for language in selected_langs:
            collected.extend(MULTILINGUAL_KEYWORDS.get(language, []))

    return unique_terms(collected)


def resolve_output_path(raw_output: str) -> Path:
    path = Path(raw_output)
    if path.is_absolute():
        print("⚠️ Absolute output path blocked. Saving inside xScrape folder instead.")
        return BASE_DIR / path.name

    output_path = (BASE_DIR / path).resolve()
    if BASE_DIR not in output_path.parents and output_path != BASE_DIR:
        print("⚠️ Output outside xScrape is not allowed. Saving to default file.")
        return BASE_DIR / DEFAULT_OUTPUT_FILE
    return output_path


def focus_window(window_title: str) -> None:
    if not window_title or gw is None:
        return

    try:
        windows = gw.getWindowsWithTitle(window_title)
        if not windows:
            return
        window = windows[0]
        if window.isMinimized:
            window.restore()
        window.activate()
    except Exception:
        return


def parse_count(raw_value: str) -> Optional[float]:
    token = raw_value.strip().replace(",", "")
    multiplier = 1.0
    if token.lower().endswith("k"):
        multiplier = 1_000.0
        token = token[:-1]
    elif token.lower().endswith("m"):
        multiplier = 1_000_000.0
        token = token[:-1]
    elif token.lower().endswith("b"):
        multiplier = 1_000_000_000.0
        token = token[:-1]

    try:
        return float(token) * multiplier
    except ValueError:
        return None


def parse_engagement(raw_text: str) -> Dict[str, Optional[float]]:
    details: Dict[str, Optional[float]] = {
        "replies": None,
        "reposts": None,
        "likes": None,
        "bookmarks": None,
        "views": None,
    }
    for key, pattern in ENGAGEMENT_PATTERNS.items():
        match = pattern.search(raw_text)
        if match:
            details[key] = parse_count(match.group(1))
    return details


def infer_is_reply(context_text: str, tweet_text: str) -> bool:
    haystack = f"{context_text} {tweet_text}".casefold()
    return any(marker in haystack for marker in REPLY_MARKERS)


def extract_keywords(query: str, text: str) -> List[str]:
    query_tokens = [token for token in re.split(r"\s+", query.strip()) if token]
    all_keywords = unique_terms(query_tokens + DEFAULT_BASE_KEYWORDS)
    found: List[str] = []
    lowered_text = text.casefold()
    for keyword in all_keywords:
        if keyword.casefold() in lowered_text:
            found.append(keyword)
    return found


def signature_for_post(url: str, timestamp: str, text: str) -> str:
    if url:
        return url
    normalized = re.sub(r"\s+", " ", text).strip().casefold()
    return f"{timestamp}|{normalized[:200]}"


async def text_or_empty(node: Optional[Any]) -> str:
    if node is None:
        return ""
    try:
        return (await node.inner_text()).strip()
    except Exception:
        return ""


async def extract_post(tweet: Any, query: str, search_url: str) -> Optional[Dict[str, Any]]:
    text_element = await tweet.query_selector('div[data-testid="tweetText"]')
    text = await text_or_empty(text_element)
    if not text:
        return None

    social_context = await tweet.query_selector('div[data-testid="socialContext"]')
    context_text = await text_or_empty(social_context)

    time_element = await tweet.query_selector("time")
    timestamp = ""
    tweet_url = ""

    if time_element is not None:
        timestamp = await time_element.get_attribute("datetime") or ""
        anchor = await time_element.evaluate_handle(
            "el => el.closest('a') ? el.closest('a').getAttribute('href') : ''"
        )
        anchor_href = await anchor.json_value()
        if anchor_href:
            tweet_url = urljoin("https://x.com", anchor_href)

    stats_group = await tweet.query_selector('div[role="group"]')
    engagement_raw = await stats_group.get_attribute("aria-label") if stats_group else ""
    has_media = await tweet.query_selector('div[data-testid="tweetPhoto"]') is not None

    tweet_id = ""
    author_handle = ""
    if tweet_url:
        match = re.search(r"/([^/]+)/status/(\d+)", tweet_url)
        if match:
            author_handle = match.group(1)
            tweet_id = match.group(2)

    user_name_block = await tweet.query_selector('div[data-testid="User-Name"]')
    author_name = await text_or_empty(user_name_block)

    matched_keywords = extract_keywords(query=query, text=text)
    is_reply = infer_is_reply(context_text=context_text, tweet_text=text)

    post = {
        "query": query,
        "queries": [query],
        "source_search_url": search_url,
        "url": tweet_url,
        "post_id": tweet_id,
        "timestamp": timestamp,
        "author_handle": author_handle,
        "author_name": author_name,
        "text": text,
        "context": context_text,
        "engagement": {
            "raw": engagement_raw,
            **parse_engagement(engagement_raw),
        },
        "is_reply": is_reply,
        "has_media": has_media,
        "matched_keywords": matched_keywords,
        "labeling_hints": {
            "possible_disruption": bool(matched_keywords),
            "keyword_hit_count": len(matched_keywords),
            "is_recent_incident_style": any(
                key in text.casefold() for key in ["delay", "fault", "gangguan", "延误", "故障", "down"]
            ),
        },
    }
    return post


async def collect_for_query(
    page: Any,
    query: str,
    args: argparse.Namespace,
    merged_posts: Dict[str, Dict[str, Any]],
    query_stats: Dict[str, Dict[str, Any]],
) -> None:
    search_url = f"https://x.com/search?q={quote_plus(query)}&src=typed_query&f={args.search_mode}"
    print(f"🔎 Query: {query}")
    print(f"🔗 {search_url}")

    await page.goto(search_url, wait_until="domcontentloaded")
    try:
        await page.wait_for_selector('article[data-testid="tweet"]', timeout=min(20000, args.timeout_ms))
    except Exception:
        print(f"⚠️ No tweets loaded quickly for query '{query}'. Skipping if still empty.")

    await page.wait_for_timeout(2000)

    target_count = max(args.post_count, args.min_post_count)
    query_seen_signatures: Set[str] = set()
    query_hits = 0
    stale_rounds = 0
    last_hits = 0

    for round_idx in range(1, args.max_scroll_rounds + 1):
        tweets = await page.query_selector_all('article[data-testid="tweet"]')

        for tweet in tweets:
            post = await extract_post(tweet=tweet, query=query, search_url=search_url)
            if post is None:
                continue

            signature = signature_for_post(post["url"], post["timestamp"], post["text"])
            if signature in query_seen_signatures:
                continue

            query_seen_signatures.add(signature)
            query_hits += 1

            if signature in merged_posts:
                existing = merged_posts[signature]
                if query not in existing["queries"]:
                    existing["queries"].append(query)
                existing_keywords = set(existing.get("matched_keywords", []))
                existing_keywords.update(post.get("matched_keywords", []))
                existing["matched_keywords"] = sorted(existing_keywords)
                existing["labeling_hints"]["keyword_hit_count"] = len(existing["matched_keywords"])
                existing["labeling_hints"]["possible_disruption"] = len(existing["matched_keywords"]) > 0
            else:
                merged_posts[signature] = post

            if query_hits >= target_count:
                break

        if query_hits >= target_count:
            break

        if query_hits == last_hits:
            stale_rounds += 1
        else:
            stale_rounds = 0
            last_hits = query_hits

        if stale_rounds >= args.max_stagnant_rounds:
            break

        print(f"↕️ Query '{query}' scroll {round_idx}: collected {query_hits} candidates")
        await page.mouse.wheel(0, args.scroll_pixels)
        await page.wait_for_timeout(args.scroll_wait_ms)

    query_stats[query] = {
        "query": query,
        "search_url": search_url,
        "candidates_seen": query_hits,
        "target_count": target_count,
        "fulfilled_target": query_hits >= target_count,
    }
    print(f"✅ Query done: {query} (candidates={query_hits})")


async def scrape_x_posts() -> None:
    args = build_parser()
    queries = resolve_queries(args)
    if not queries:
        print("❌ No queries resolved. Provide --query or enable defaults.")
        return

    playwright_async = importlib.import_module("playwright.async_api")
    async_playwright = playwright_async.async_playwright

    output_file = resolve_output_path(args.output_file)
    if output_file.exists():
        output_file.unlink()

    print(f"📦 Resolved {len(queries)} queries")
    print(f"💾 Output file: {output_file}")

    if args.reset_profile and PROFILE_DIR.exists():
        shutil.rmtree(PROFILE_DIR)
        print("🧹 Reset previous Playwright profile.")

    PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    focus_window(args.window_title)

    merged_posts: Dict[str, Dict[str, Any]] = {}
    query_stats: Dict[str, Dict[str, Any]] = {}

    async with async_playwright() as playwright:
        context = await playwright.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=args.headless,
            args=[
                "--no-sandbox",
                f"--profile-directory={args.profile_name}",
            ],
            viewport={"width": 1280, "height": 800},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
        )

        page = context.pages[0] if context.pages else await context.new_page()
        page.set_default_timeout(args.timeout_ms)

        try:
            for query in queries:
                await collect_for_query(
                    page=page,
                    query=query,
                    args=args,
                    merged_posts=merged_posts,
                    query_stats=query_stats,
                )

            posts = list(merged_posts.values())
            posts.sort(key=lambda item: item.get("timestamp", ""), reverse=True)

            for idx, post in enumerate(posts, start=1):
                post["id"] = idx

            dataset = {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "dataset_type": "x_search_training_candidates",
                "query_count": len(queries),
                "unique_post_count": len(posts),
                "queries": queries,
                "query_stats": list(query_stats.values()),
                "posts": posts,
            }

            with output_file.open("w", encoding="utf-8") as handle:
                json.dump(dataset, handle, ensure_ascii=False, indent=2)

            print(f"\n✨ Done. Saved {len(posts)} unique posts to {output_file}")
        except Exception as exc:
            print(f"❌ Error during scraping: {exc}")
            await page.screenshot(path=str(ERROR_SCREENSHOT_FILE))
            print(f"🧭 Debug screenshot saved to {ERROR_SCREENSHOT_FILE}")
        finally:
            await context.close()


if __name__ == "__main__":
    asyncio.run(scrape_x_posts())
