import pyautogui
import time
import pygetwindow as gw
import os
import math
import builtins
import easyocr
import json
import re
import shutil
from datetime import datetime
from pathlib import Path
from PIL import Image

# --- DYNAMIC CONFIGURATION ---
WINDOW_KEYWORDS = ["xiaohongshu", "小红书"]

BASE_DIR = Path(__file__).resolve().parent
XHS_BASE_DIR = BASE_DIR / "xhsScrape"
INPUT_DIR = XHS_BASE_DIR / "input"
ASSETS_DIR = INPUT_DIR / "assets"
OUTPUT_DIR = XHS_BASE_DIR / "output"
POSTS_ROOT_DIR = OUTPUT_DIR / "posts"
REPORT_DIR = OUTPUT_DIR / "reports"
JSON_DIR = OUTPUT_DIR / "json"

# SHARED ASSETS & SETTINGS
HEART_IMAGE = ASSETS_DIR / 'heart_icon.png'
ANCHOR_TR = ASSETS_DIR / 'anchor_tr.png'
ANCHOR_BL_VARIANTS = [ASSETS_DIR / 'anchor_bl_1.png', ASSETS_DIR / 'anchor_bl_2.png']
# Navigation Assets
NAV_ASSETS = [ASSETS_DIR / 'p1.png', ASSETS_DIR / 'p2.png', ASSETS_DIR / 'p3.png']

OFFSET_Y = -100
DUPE_THRESHOLD = 20
JSON_FILE = JSON_DIR / 'xhs_scraped_data_clean.json'
HEART_CONFIDENCE_LEVELS = [0.85, 0.8, 0.75, 0.7, 0.65, 0.6]
REPORT_FILE = REPORT_DIR / 'xhs_run_report.md'
LOG_TO_CONSOLE = False


def init_report_file():
    """Start a fresh markdown report for each run."""
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    JSON_DIR.mkdir(parents=True, exist_ok=True)
    POSTS_ROOT_DIR.mkdir(parents=True, exist_ok=True)
    started_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write('# XHS Scrape Run Report\n\n')
        f.write(f'- Started: {started_at}\n')
        f.write(f'- Script: {os.path.basename(__file__)}\n\n')


def print(*args, sep=' ', end='\n', file=None, flush=False):
    """Write runtime output to markdown report (and optionally console)."""
    text = sep.join(str(arg) for arg in args)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    with open(REPORT_FILE, 'a', encoding='utf-8') as f:
        for line in (text + end).splitlines(True):
            content = line.rstrip('\n')
            if content:
                f.write(f'- {content}\n')
            else:
                f.write('\n')

    if LOG_TO_CONSOLE:
        builtins.print(*args, sep=sep, end=end, file=file, flush=flush)

def check_assets():
    """Verifies that all required image assets exist and prints absolute paths for debugging."""
    missing = []
    print("🔍 Checking assets in folder:", str(ASSETS_DIR.resolve()))
    
    # Check core anchors
    for img in [HEART_IMAGE, ANCHOR_TR]:
        abs_path = str(img.resolve())
        if not img.exists():
            missing.append(f"{img} (Checked: {abs_path})")
    
    # Check navigation steps
    for img in NAV_ASSETS:
        abs_path = str(img.resolve())
        if not img.exists():
            missing.append(f"{img} (Checked: {abs_path})")
    
    # Check at least one bottom-left anchor exists
    bl_exists = any(img.exists() for img in ANCHOR_BL_VARIANTS)
    if not bl_exists:
        for img in ANCHOR_BL_VARIANTS:
            missing.append(f"{img} (Checked: {str(img.resolve())})")
        
    if missing:
        print("\n❌ ERROR: Missing required assets:")
        for m in missing:
            print(f"  - {m}")
        print("\n💡 TIP: Ensure your terminal is in the same folder as your script and images.")
        return False
    
    print("✅ All assets verified.")
    return True

def cleanup_environment(targets):
    """Wipes detected target folders and the main JSON file before a fresh run."""
    print("🧹 Cleaning up old data and folders...")
    if POSTS_ROOT_DIR.exists():
        shutil.rmtree(POSTS_ROOT_DIR)
    POSTS_ROOT_DIR.mkdir(parents=True, exist_ok=True)

    for target in targets:
        folder = target["folder"]
        folder.mkdir(parents=True, exist_ok=True)
    
    if JSON_FILE.exists():
        JSON_FILE.unlink()

def safe_locate(image_path, haystack=None, conf=0.8, center=True):
    """Helper to find images without crashing."""
    image_path_str = str(image_path)
    try:
        if center:
            if haystack:
                return pyautogui.locateCenterOnScreen(image_path_str, confidence=conf, haystackImage=haystack)
            return pyautogui.locateCenterOnScreen(image_path_str, confidence=conf)
        else:
            if haystack:
                return pyautogui.locate(image_path_str, haystack, confidence=conf)
            return pyautogui.locateOnScreen(image_path_str, confidence=conf)
    except Exception:
        return None


def safe_locate_all(image_path, confidence_levels=None):
    """Find all image matches without crashing when no match is found."""
    levels = confidence_levels or HEART_CONFIDENCE_LEVELS

    image_path_str = str(image_path)
    for conf in levels:
        for grayscale in (False, True):
            try:
                matches = list(pyautogui.locateAllOnScreen(image_path_str, confidence=conf, grayscale=grayscale))
                if matches:
                    print(
                        f"   Matched '{image_path_str}' at confidence {conf}, grayscale={grayscale} "
                        f"({len(matches)} hits)."
                    )
                    return matches
                print(f"   No matches for '{image_path_str}' at confidence {conf}, grayscale={grayscale}.")
            except Exception as exc:
                print(f"   Scan skipped at confidence {conf}, grayscale={grayscale}: {exc}")

    return []


def get_window_region(win):
    """Build a region tuple from the matched app window."""
    left = max(int(win.left), 0)
    top = max(int(win.top), 0)
    width = max(int(win.width), 0)
    height = max(int(win.height), 0)

    if width == 0 or height == 0:
        return None

    return (left, top, width, height)


def normalize_window_title(title: str) -> str:
    """Normalize a window title for resilient matching."""
    return re.sub(r"\s+", " ", title).strip().lower()


def slugify_title(title: str) -> str:
    """Build a stable ascii-safe slug for output folder names."""
    normalized = normalize_window_title(title)
    slug = re.sub(r"[^a-z0-9]+", "_", normalized).strip("_")
    return slug or "window"


def discover_target_windows():
    """Discover all windows containing xiaohongshu/小红书 keywords."""
    all_windows = [w for w in gw.getAllWindows() if w.title and w.title.strip()]
    normalized_keywords = [normalize_window_title(keyword) for keyword in WINDOW_KEYWORDS]

    matched = []
    used_folders = set()

    for win in all_windows:
        title = win.title.strip()
        normalized_title = normalize_window_title(title)
        if not any(keyword in normalized_title for keyword in normalized_keywords):
            continue

        base_slug = slugify_title(title)
        folder = POSTS_ROOT_DIR / base_slug
        suffix = 2
        while str(folder) in used_folders:
            folder = POSTS_ROOT_DIR / f"{base_slug}_{suffix}"
            suffix += 1

        used_folders.add(str(folder))
        matched.append({
            "key": f"window_{len(matched) + 1}",
            "title": title,
            "folder": folder,
            "window": win,
        })

    return matched, all_windows

def is_too_close(new_box, existing_list, min_dist):
    """Prevents duplicate detection of the same post."""
    for box in existing_list:
        dist = math.hypot(new_box.left - box.left, new_box.top - box.top)
        if dist < min_dist: return True
    return False

def frame_snap_and_crop(save_path, debug_fullshot_path=None):
    """Capture text panel using anchors and return (success, reason)."""
    try:
        full_shot = pyautogui.screenshot()
        tr_box = safe_locate(ANCHOR_TR, haystack=full_shot, center=False)
        bl_box = None
        for img_path in ANCHOR_BL_VARIANTS:
            found = safe_locate(img_path, haystack=full_shot, center=False)
            if found:
                bl_box = found
                break

        if not tr_box:
            if debug_fullshot_path:
                full_shot.save(debug_fullshot_path)
            return False, f"top-right anchor not found: {ANCHOR_TR}"

        if not bl_box:
            if debug_fullshot_path:
                full_shot.save(debug_fullshot_path)
            return False, f"bottom-left anchor not found: {', '.join(str(p) for p in ANCHOR_BL_VARIANTS)}"

        y1, x2 = int(tr_box.top), int(tr_box.left + tr_box.width)
        y2, x1 = int(bl_box.top + bl_box.height), int(bl_box.left)

        if x1 >= x2 or y1 >= y2:
            if debug_fullshot_path:
                full_shot.save(debug_fullshot_path)
            return False, f"invalid crop bounds: ({x1}, {y1}) to ({x2}, {y2})"

        final_crop = full_shot.crop((x1, y1, x2, y2))
        final_crop.save(save_path)
        return True, "ok"
    except Exception as e:
        if debug_fullshot_path:
            try:
                pyautogui.screenshot(debug_fullshot_path)
            except Exception:
                pass
        print(f"   [Snap Error] {e}")
        return False, f"snap exception: {e}"

def clean_ocr_text(text: str) -> str:
    """Removes UI noise, hashtags, and footers."""
    lines = text.split('\n')
    start_idx = 0
    for i, line in enumerate(lines):
        if "Attention" in line or "关注" in line:
            start_idx = i + 1
            break
    
    process_lines = lines[start_idx:]
    cleaned_lines = []
    stop_keywords = ["Say something", "说点什么", "It'sa wasteland", "这是一片荒地"]
    
    for line in process_lines:
        line = line.strip()
        if not line: continue
        if any(keyword in line for keyword in stop_keywords):
            break
        if "#" in line: continue
        cleaned_lines.append(line)
        
    return "\n".join(cleaned_lines).strip()

def run_scrape_window(target, reader):
    """Process one detected XHS window with the P1->P2->P3 setup."""
    category_key = target["key"]
    target_window = target["title"]
    save_folder = target["folder"]
    win = target["window"]
    
    print(f"\n🚀 PHASE: {category_key.upper()} (Window: {target_window})")

    if not win:
        print(f"⚠️ Window not available. Skipping {category_key}.")
        return []

    # Activate safely
    try:
        if win.isMinimized:
            win.restore()
        win.activate()
    except Exception as exc:
        print(f"⚠️ Failed to activate window '{target_window}': {exc}")
        return []
    time.sleep(1)

    
    # Reload
    print("   Reloading...")
    pyautogui.hotkey('ctrl', 'r')
    time.sleep(5)

    # --- P1/P2/P3 Navigation Sequence ---
    print("   Running navigation sequence (p1 -> p2 -> p3)...")
    
    # Step 1: Move to P1
    p1_loc = safe_locate(ASSETS_DIR / 'p1.png')
    if p1_loc:
        pyautogui.moveTo(p1_loc)
        print("      P1 found.")
        time.sleep(0.2)

    # Step 2: Click P2
    p2_loc = safe_locate(ASSETS_DIR / 'p2.png')
    if p2_loc:
        pyautogui.click(p2_loc)
        print("      P2 clicked.")
        time.sleep(0.2)

    # Step 3: Hover P3
    p3_loc = safe_locate(ASSETS_DIR / 'p3.png')
    if p3_loc:
        pyautogui.moveTo(p3_loc)
        print("      P3 hovered.")
        time.sleep(0.2)

    print("   Setup complete. Scanning for hearts...")
    time.sleep(3)

    # Scanning for hearts
    window_region = get_window_region(win)
    if window_region:
        print(f"   Searching in window region: {window_region}")
        try:
            raw_matches = list(pyautogui.locateAllOnScreen(str(HEART_IMAGE), confidence=0.8, region=window_region))
        except Exception:
            raw_matches = []

        if raw_matches:
            print(f"   Region scan found {len(raw_matches)} potential hearts.")
        else:
            print("   Region scan found 0 hearts. Falling back to full-screen adaptive scan.")
            raw_matches = safe_locate_all(HEART_IMAGE)
    else:
        raw_matches = safe_locate_all(HEART_IMAGE)

    unique_hearts = []
    for match in raw_matches:
        if not is_too_close(match, unique_hearts, DUPE_THRESHOLD):
            unique_hearts.append(match)

    print(f"   Found {len(unique_hearts)} posts.")
    if not unique_hearts:
        debug_path = save_folder / 'debug_no_hearts.png'
        pyautogui.screenshot(str(debug_path))
        print(f"   Saved debug screenshot: {debug_path}")

    category_data = []

    capture_failures = 0

    for i, box in enumerate(unique_hearts):
        cx, cy = box.left + (box.width / 2), box.top + (box.height / 2)
        pyautogui.click(cx, cy + OFFSET_Y)
        time.sleep(3) 

        filename = save_folder / f"post_{i+1}.png"
        debug_fullshot = save_folder / f"debug_post_{i+1}_full.png"
        snapped, reason = frame_snap_and_crop(filename, debug_fullshot_path=debug_fullshot)

        if snapped:
            ocr_res = reader.readtext(str(filename), detail=0)
            raw_text = "\n".join(ocr_res)
            category_data.append({
                "filename": f"post_{i+1}.png",
                "raw": raw_text,
                "cleaned": clean_ocr_text(raw_text)
            })
            print(f"   ✅ Saved {filename}")
        else:
            capture_failures += 1
            print(f"   ⚠️ Skipped post_{i+1}: {reason}")
            print(f"      Debug full screenshot: {debug_fullshot}")
        
        pyautogui.press('esc')
        time.sleep(1.5)

    if capture_failures:
        print(f"   Capture failures: {capture_failures}/{len(unique_hearts)}")
    print(f"   Category extracted posts: {len(category_data)}")
    
    return category_data

def main():
    init_report_file()

    if not check_assets():
        return

    targets, all_windows = discover_target_windows()
    if not targets:
        print("⚠️ No target windows found for keywords: xiaohongshu, 小红书")
        visible_titles = [w.title.strip() for w in all_windows if w.title and w.title.strip()]
        if visible_titles:
            print("   Available window titles:")
            for title in visible_titles[:20]:
                print(f"   - {title}")
            if len(visible_titles) > 20:
                print(f"   ... and {len(visible_titles) - 20} more")

        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump({}, f, ensure_ascii=False, indent=4)
        print("\n✅ ALL CATEGORIES COMPLETE.")
        return

    print(f"🔎 Matched {len(targets)} target windows.")
    for target in targets:
        print(f"   - {target['title']}")

    cleanup_environment(targets)
    reader = easyocr.Reader(['ch_sim', 'en'], gpu=False)
    all_results = {}

    for target in targets:
        all_results[target["title"]] = run_scrape_window(target, reader)

    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=4)
    
    print("\n✅ ALL CATEGORIES COMPLETE.")

if __name__ == "__main__":
    main()
