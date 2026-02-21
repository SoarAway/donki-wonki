import asyncio
import importlib
import json
import logging
import os
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from urllib.parse import urljoin

BASE_DIR = Path(__file__).resolve().parent
PROFILE_DIR = BASE_DIR / "playwright_profile"
LOG_FILE = BASE_DIR / "x_scrape.log"
OUTPUT_FILE = BASE_DIR / "x_latest_posts.json"
ERROR_SCREENSHOT_FILE = BASE_DIR / "error_debug.png"

TARGET_ACCOUNT = os.getenv("XSCRAPE_TARGET_ACCOUNT", "askrapidkl")
MAX_POSTS = int(os.getenv("XSCRAPE_MAX_POSTS", "40"))
MIN_POSTS = int(os.getenv("XSCRAPE_MIN_POSTS", "30"))
MAX_SCROLL_ROUNDS = int(os.getenv("XSCRAPE_MAX_SCROLL_ROUNDS", "45"))
MAX_STAGNANT_ROUNDS = int(os.getenv("XSCRAPE_MAX_STAGNANT_ROUNDS", "5"))
SCROLL_PIXELS = int(os.getenv("XSCRAPE_SCROLL_PIXELS", "2600"))
SCROLL_WAIT_MS = int(os.getenv("XSCRAPE_SCROLL_WAIT_MS", "1800"))
TIMEOUT_MS = int(os.getenv("XSCRAPE_TIMEOUT_MS", "60000"))
RAW_HEADLESS = os.getenv("XSCRAPE_HEADLESS", "0")
RAW_RESET_PROFILE = os.getenv("XSCRAPE_RESET_PROFILE", "0")
PROFILE_NAME = os.getenv("XSCRAPE_PROFILE_NAME", "Default")
RAW_SIGN_IN_ONLY = os.getenv("XSCRAPE_SIGN_IN_ONLY", "0")
LOGIN_URL = os.getenv("XSCRAPE_LOGIN_URL", "https://x.com/i/flow/login")
SIGN_IN_WAIT_SECONDS = int(os.getenv("XSCRAPE_SIGN_IN_WAIT_SECONDS", "600"))
SIGN_IN_POLL_MS = int(os.getenv("XSCRAPE_SIGN_IN_POLL_MS", "1500"))

ENGAGEMENT_PATTERNS = {
    "replies": re.compile(r"(\d[\d,.KMB]*|\d+)\s+repl(?:y|ies)", re.IGNORECASE),
    "reposts": re.compile(r"(\d[\d,.KMB]*|\d+)\s+reposts?", re.IGNORECASE),
    "likes": re.compile(r"(\d[\d,.KMB]*|\d+)\s+likes?", re.IGNORECASE),
    "bookmarks": re.compile(r"(\d[\d,.KMB]*|\d+)\s+bookmarks?", re.IGNORECASE),
    "views": re.compile(r"(\d[\d,.KMB]*|\d+)\s+views?", re.IGNORECASE),
}


def get_logger() -> logging.Logger:
    logger = logging.getLogger("x_scrape")
    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")
    handler = logging.FileHandler(str(LOG_FILE), encoding="utf-8")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger


def env_flag(raw_value: str) -> bool:
    return raw_value.strip().lower() in {"1", "true", "yes", "y", "on"}


HEADLESS = env_flag(RAW_HEADLESS)
RESET_PROFILE = env_flag(RAW_RESET_PROFILE)
SIGN_IN_ONLY = env_flag(RAW_SIGN_IN_ONLY)


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


async def text_or_empty(node: Optional[Any]) -> str:
    if node is None:
        return ""
    try:
        return (await node.inner_text()).strip()
    except Exception:
        return ""


def signature_for_post(url: str, timestamp: str, text: str) -> str:
    if url:
        return url
    normalized = re.sub(r"\s+", " ", text).strip().casefold()
    return f"{timestamp}|{normalized[:200]}"


async def extract_post(tweet: Any, source_url: str) -> Optional[Dict[str, Any]]:
    text_element = await tweet.query_selector('div[data-testid="tweetText"]')
    text = await text_or_empty(text_element)
    if not text:
        return None

    time_element = await tweet.query_selector("time")
    timestamp = ""
    post_url = ""

    if time_element is not None:
        timestamp = await time_element.get_attribute("datetime") or ""
        anchor = await time_element.evaluate_handle(
            "el => el.closest('a') ? el.closest('a').getAttribute('href') : ''"
        )
        anchor_href = await anchor.json_value()
        if anchor_href:
            post_url = urljoin("https://x.com", anchor_href)

    author_handle = ""
    post_id = ""
    if post_url:
        match = re.search(r"/([^/]+)/status/(\d+)", post_url)
        if match:
            author_handle = match.group(1)
            post_id = match.group(2)

    user_name_block = await tweet.query_selector('div[data-testid="User-Name"]')
    author_name = await text_or_empty(user_name_block)
    stats_group = await tweet.query_selector('div[role="group"]')
    engagement_raw = await stats_group.get_attribute("aria-label") if stats_group else ""
    has_media = await tweet.query_selector('div[data-testid="tweetPhoto"]') is not None

    return {
        "url": post_url,
        "post_id": post_id,
        "timestamp": timestamp,
        "author_handle": author_handle,
        "author_name": author_name,
        "text": text,
        "engagement": {
            "raw": engagement_raw,
            **parse_engagement(engagement_raw),
        },
        "has_media": has_media,
        "source_account": TARGET_ACCOUNT,
        "source_url": source_url,
    }


async def wait_for_manual_sign_in(page: Any, logger: logging.Logger) -> None:
    logger.info("Opening login flow for manual sign-in at %s", LOGIN_URL)
    await page.goto(LOGIN_URL, wait_until="domcontentloaded")
    await page.bring_to_front()
    await page.wait_for_timeout(1500)

    if HEADLESS:
        logger.warning(
            "XSCRAPE_HEADLESS is enabled. Manual browser sign-in needs headless mode off."
        )

    can_prompt_terminal = sys.stdin is not None and sys.stdin.isatty()
    if can_prompt_terminal:
        prompt = (
            "Complete sign-in in the opened browser window. "
            "After the home feed loads, return here and press Enter to continue... "
        )
        try:
            await asyncio.to_thread(input, prompt)
            logger.info("Manual sign-in acknowledged from terminal input.")
            return
        except EOFError:
            logger.warning(
                "Terminal input unavailable (EOF). Switching to automatic login detection."
            )
    else:
        logger.warning(
            "No interactive terminal detected. Waiting for login to complete in browser."
        )

    max_wait_ms = max(1, SIGN_IN_WAIT_SECONDS) * 1000
    elapsed_ms = 0
    poll_ms = max(250, SIGN_IN_POLL_MS)

    while elapsed_ms < max_wait_ms:
        current_url = page.url or ""
        if "/i/flow/login" not in current_url and "login" not in current_url.lower():
            logger.info("Detected navigation away from login flow. Profile should be signed in.")
            return

        await page.wait_for_timeout(poll_ms)
        elapsed_ms += poll_ms

    logger.warning(
        "Timed out waiting for sign-in after %s seconds. Profile may still be unsigned in.",
        SIGN_IN_WAIT_SECONDS,
    )


async def scrape_account_posts() -> None:
    logger = get_logger()
    logger.info("Starting X account scraper for @%s", TARGET_ACCOUNT)
    logger.info(
        "Runtime flags: sign_in_only=%s (raw=%r), headless=%s (raw=%r)",
        SIGN_IN_ONLY,
        RAW_SIGN_IN_ONLY,
        HEADLESS,
        RAW_HEADLESS,
    )

    if RESET_PROFILE and PROFILE_DIR.exists():
        shutil.rmtree(PROFILE_DIR)
        logger.info("Reset previous Playwright profile.")

    PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    if OUTPUT_FILE.exists():
        OUTPUT_FILE.unlink()

    source_url = f"https://x.com/{TARGET_ACCOUNT}"

    playwright_async = importlib.import_module("playwright.async_api")
    async_playwright = playwright_async.async_playwright

    merged_posts: Dict[str, Dict[str, Any]] = {}
    stale_rounds = 0
    previous_count = 0

    async with async_playwright() as playwright:
        context = await playwright.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=HEADLESS,
            args=[
                "--no-sandbox",
                f"--profile-directory={PROFILE_NAME}",
            ],
            viewport={"width": 1280, "height": 800},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
        )

        page = context.pages[0] if context.pages else await context.new_page()
        page.set_default_timeout(TIMEOUT_MS)

        try:
            if SIGN_IN_ONLY:
                await wait_for_manual_sign_in(page=page, logger=logger)
                logger.info("Sign-in only mode completed. Exiting without scraping.")
                return

            logger.info("Navigating to %s", source_url)
            await page.goto(source_url, wait_until="domcontentloaded")
            await page.wait_for_timeout(2500)

            for round_idx in range(1, MAX_SCROLL_ROUNDS + 1):
                tweets = await page.query_selector_all('article[data-testid="tweet"]')
                for tweet in tweets:
                    post = await extract_post(tweet=tweet, source_url=source_url)
                    if post is None:
                        continue

                    signature = signature_for_post(post["url"], post["timestamp"], post["text"])
                    if signature in merged_posts:
                        continue
                    merged_posts[signature] = post

                    if len(merged_posts) >= MAX_POSTS:
                        break

                if len(merged_posts) >= max(MAX_POSTS, MIN_POSTS):
                    break

                if len(merged_posts) == previous_count:
                    stale_rounds += 1
                else:
                    stale_rounds = 0
                    previous_count = len(merged_posts)

                if stale_rounds >= MAX_STAGNANT_ROUNDS and len(merged_posts) >= MIN_POSTS:
                    break

                logger.info(
                    "Scroll round %s: collected %s unique posts",
                    round_idx,
                    len(merged_posts),
                )
                await page.mouse.wheel(0, SCROLL_PIXELS)
                await page.wait_for_timeout(SCROLL_WAIT_MS)

            posts: List[Dict[str, Any]] = list(merged_posts.values())
            posts.sort(key=lambda item: item.get("timestamp", ""), reverse=True)

            for idx, post in enumerate(posts, start=1):
                post["id"] = idx

            payload = {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "dataset_type": "x_account_posts",
                "source_account": TARGET_ACCOUNT,
                "source_url": source_url,
                "unique_post_count": len(posts),
                "posts": posts,
            }

            with OUTPUT_FILE.open("w", encoding="utf-8") as handle:
                json.dump(payload, handle, ensure_ascii=False, indent=2)

            logger.info("Done. Saved %s posts to %s", len(posts), OUTPUT_FILE)
        except Exception as exc:
            logger.exception("Error during scraping: %s", exc)
            await page.screenshot(path=str(ERROR_SCREENSHOT_FILE))
            logger.info("Debug screenshot saved to %s", ERROR_SCREENSHOT_FILE)
        finally:
            await context.close()
            logger.info("Closed Playwright context.")


if __name__ == "__main__":
    asyncio.run(scrape_account_posts())
