import asyncio
from playwright.async_api import async_playwright
import pygetwindow as gw
import json
import sys
import os
import shutil
import tempfile

# --- CONFIGURATION ---
TARGET_ACCOUNT = "https://x.com/AskRapidKL"  # Replace with the account URL
TARGET_WINDOW_TITLE = "x_askrapidkl"         # The specific window title to look for
POST_COUNT = 10                              # Number of posts to retrieve
HEADLESS = False                             # Must be False to see the process
TIMEOUT = 60000                              # 60 seconds
JSON_FILE = "x_latest_posts.json"
# ---------------------

async def scrape_x_posts():
    # --- STEP 0: EMPTY/DELETE PREVIOUS RESULTS ---
    print(f"🧹 Clearing previous results in {JSON_FILE}...")
    if os.path.exists(JSON_FILE):
        try:
            os.remove(JSON_FILE)
            print(f"✅ {JSON_FILE} cleared.")
        except Exception as e:
            print(f"⚠️ Could not clear {JSON_FILE}: {e}")

    # 1. Focus the window (Visual aid)
    print(f"🔍 Searching for window: '{TARGET_WINDOW_TITLE}'...")
    windows = gw.getWindowsWithTitle(TARGET_WINDOW_TITLE)
    if windows:
        win = windows[0]
        try:
            if win.isMinimized: win.restore()
            win.activate()
            await asyncio.sleep(1)
        except Exception: pass

    # 2. Create a TEMPORARY copy of the profile to bypass the "Locked" error
    temp_dir = os.path.join(tempfile.gettempdir(), 'playwright_edge_profile')
    
    print(f"📂 Creating a temporary profile bypass at: {temp_dir}")
    if os.path.exists(temp_dir):
        try:
            shutil.rmtree(temp_dir)
        except Exception:
            temp_dir = os.path.join(temp_dir, str(int(asyncio.get_event_loop().time())))

    async with async_playwright() as p:
        try:
            context = await p.chromium.launch_persistent_context(
                user_data_dir=temp_dir,
                headless=HEADLESS,
                args=[
                    "--no-sandbox",
                    f"--profile-directory={PROFILE_NAME}" if 'PROFILE_NAME' in globals() else "--profile-directory=Default"
                ],
                viewport={'width': 1280, 'height': 800},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
            )
        except Exception as e:
            print(f"❌ Failed to launch browser: {e}")
            return
        
        page = context.pages[0] if context.pages else await context.new_page()
        page.set_default_timeout(TIMEOUT)
        
        print(f"🔗 Navigating to {TARGET_ACCOUNT}...")
        
        try:
            # Navigate to the timeline
            await page.goto(TARGET_ACCOUNT, wait_until="domcontentloaded")
            
            print("⏳ Waiting for content to load...")
            try:
                await page.wait_for_selector('article[data-testid="tweet"]', timeout=15000)
            except:
                print("⚠️ Could not find tweets immediately. Please ensure you are logged in.")
                await page.wait_for_selector('article[data-testid="tweet"]', timeout=TIMEOUT)
            
            # Allow time for threads and dynamic content to fully render
            await page.wait_for_timeout(5000)
            
            posts = []
            print(f"🔍 Searching for the latest posts and updates...")
            
            # Select all visible tweet articles
            tweets = await page.query_selector_all('article[data-testid="tweet"]')
            
            count = 0
            for tweet in tweets:
                if count >= POST_COUNT: break
                    
                # Extract text content
                text_element = await tweet.query_selector('div[data-testid="tweetText"]')
                if not text_element: continue
                    
                text = await text_element.inner_text()
                if not text.strip(): continue

                # Check if this is part of a thread
                social_context = await tweet.query_selector('div[data-testid="socialContext"]')
                context_text = await social_context.inner_text() if social_context else ""

                time_element = await tweet.query_selector('time')
                timestamp = await time_element.get_attribute('datetime') if time_element else "Unknown"
                
                stats_group = await tweet.query_selector('div[role="group"]')
                stats_text = await stats_group.get_attribute('aria-label') if stats_group else "No stats"

                # Check for images/media
                has_media = await tweet.query_selector('div[data-testid="tweetPhoto"]') is not None

                posts.append({
                    "id": count + 1,
                    "timestamp": timestamp,
                    "is_reply": "Replying" in context_text or "回复" in context_text,
                    "text": text.strip(),
                    "has_media": has_media,
                    "engagement": stats_text
                })
                count += 1
                print(f"✅ Scraped {'update/reply' if posts[-1]['is_reply'] else 'post'} {count}")

            with open(JSON_FILE, "w", encoding="utf-8") as f:
                json.dump(posts, f, indent=4, ensure_ascii=False)
            
            print(f"\n✨ Done! Saved {len(posts)} items to {JSON_FILE}")

        except Exception as e:
            print(f"❌ Error during scraping: {e}")
            await page.screenshot(path="error_debug.png")
        
        finally:
            await context.close()
            try: shutil.rmtree(temp_dir)
            except: pass

if __name__ == "__main__":
    asyncio.run(scrape_x_posts())