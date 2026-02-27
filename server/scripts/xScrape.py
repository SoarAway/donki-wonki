import asyncio
import json
import os

from playwright.async_api import async_playwright

# --- CONFIGURATION ---
TARGET_ACCOUNT = "https://x.com/AskRapidKL"
POST_COUNT = 2000
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE = os.path.join(SCRIPT_DIR, "x_latest_posts.json")
CDP_URL = "http://localhost:9222"  # Must match the port in Step 1
# ---------------------


async def scrape_x_posts() -> None:
    print(f"Connecting to existing browser at {CDP_URL}...")
    print(f"Output file: {JSON_FILE}")

    try:
        async with async_playwright() as p:
            try:
                browser = await p.chromium.connect_over_cdp(CDP_URL)
            except Exception as e:
                print(f"Could not connect to browser: {e}")
                print("Ensure Chrome is running with '--remote-debugging-port=9222'.")
                return

            if not browser.contexts:
                print("No browser context found in remote session.")
                await browser.disconnect()
                return

            context = browser.contexts[0]
            if context.pages:
                page = context.pages[0]
                print("Attached to active tab.")
            else:
                page = await context.new_page()
                print("Created new tab in existing session.")

            print(f"Navigating to {TARGET_ACCOUNT}...")
            await page.goto(TARGET_ACCOUNT, wait_until="domcontentloaded")

            try:
                await page.wait_for_selector('article[data-testid="tweet"]', timeout=15000)
            except Exception:
                print("Timeout waiting for tweets. Log in or scroll manually in the attached browser.")

            await page.mouse.wheel(0, 1000)
            await asyncio.sleep(2)

            posts = []
            print(f"Scraping up to {POST_COUNT} posts...")

            attempts = 0
            while len(posts) < POST_COUNT:
                tweets = await page.query_selector_all('article[data-testid="tweet"]')

                for tweet in tweets:
                    if len(posts) >= POST_COUNT:
                        break

                    text_el = await tweet.query_selector('div[data-testid="tweetText"]')
                    if not text_el:
                        continue
                    text = (await text_el.inner_text()).strip()
                    if not text:
                        continue

                    if any(p["text"] == text for p in posts):
                        continue

                    time_el = await tweet.query_selector("time")
                    timestamp = await time_el.get_attribute("datetime") if time_el else "Unknown"

                    social_context = await tweet.query_selector('div[data-testid="socialContext"]')
                    context_text = (await social_context.inner_text()) if social_context else ""

                    stats_group = await tweet.query_selector('div[role="group"]')
                    stats_text = await stats_group.get_attribute("aria-label") if stats_group else "No stats"

                    has_media = await tweet.query_selector('div[data-testid="tweetPhoto"]') is not None

                    posts.append(
                        {
                            "id": len(posts) + 1,
                            "timestamp": timestamp,
                            "is_reply": "Replying" in context_text,
                            "is_pinned": "Pinned" in context_text,
                            "text": text.replace("\n", " "),
                            "has_media": has_media,
                            "stats": stats_text,
                        }
                    )
                    print(f"Collected post {len(posts)}: {timestamp}")

                await page.mouse.wheel(0, 2000)
                await asyncio.sleep(2)
                attempts += 1

            os.makedirs(os.path.dirname(JSON_FILE), exist_ok=True)
            with open(JSON_FILE, "w", encoding="utf-8") as f:
                json.dump(posts, f, indent=4, ensure_ascii=False)

            print(f"Done. Saved {len(posts)} posts to {JSON_FILE}")

    except Exception as e:
        print(f"Script error: {e}")


if __name__ == "__main__":
    asyncio.run(scrape_x_posts())
