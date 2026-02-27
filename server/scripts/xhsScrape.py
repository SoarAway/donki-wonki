import pyautogui
import time
import pygetwindow as gw
import os
import math
import easyocr
import json
import re
import shutil
from PIL import Image

# --- DYNAMIC CONFIGURATION ---
CATEGORIES = {
    "lrt": {"window": "xhs_lrt", "folder": "xhs_scraped_posts_lrt"},
    "lrt_huai":  {"window": "xhs_lrt_huai", "folder": "xhs_scraped_posts_lrt_huai"},
    "lrt_shi": {"window": "xhs_lrt_shi", "folder": "xhs_scraped_posts_lrt_shi"},
    "lrt_guzhang":  {"window": "xhs_lrt_guzhang", "folder": "xhs_scraped_posts_lrt_guzhang"}
}

# SHARED ASSETS & SETTINGS
HEART_IMAGE = 'heart_icon.png'
ANCHOR_TR = 'anchor_tr.png'
ANCHOR_BL_VARIANTS = ['anchor_bl_1.png', 'anchor_bl_2.png']
# Navigation Assets
NAV_ASSETS = ['p1.png', 'p2.png', 'p3.png']

OFFSET_Y = -100
DUPE_THRESHOLD = 20
JSON_FILE = 'xhs_scraped_data_clean.json'

def check_assets():
    """Verifies that all required image assets exist and prints absolute paths for debugging."""
    missing = []
    print("🔍 Checking assets in folder:", os.path.abspath(os.getcwd()))
    
    # Check core anchors
    for img in [HEART_IMAGE, ANCHOR_TR]:
        abs_path = os.path.abspath(img)
        if not os.path.exists(img):
            missing.append(f"{img} (Checked: {abs_path})")
    
    # Check navigation steps
    for img in NAV_ASSETS:
        abs_path = os.path.abspath(img)
        if not os.path.exists(img):
            missing.append(f"{img} (Checked: {abs_path})")
    
    # Check at least one bottom-left anchor exists
    bl_exists = any(os.path.exists(img) for img in ANCHOR_BL_VARIANTS)
    if not bl_exists:
        for img in ANCHOR_BL_VARIANTS:
            missing.append(f"{img} (Checked: {os.path.abspath(img)})")
        
    if missing:
        print("\n❌ ERROR: Missing required assets:")
        for m in missing:
            print(f"  - {m}")
        print("\n💡 TIP: Ensure your terminal is in the same folder as your script and images.")
        return False
    
    print("✅ All assets verified.")
    return True

def cleanup_environment():
    """Wipes all category folders and the main JSON file before a fresh run."""
    print("🧹 Cleaning up old data and folders...")
    for cat in CATEGORIES.values():
        folder = cat["folder"]
        if os.path.exists(folder):
            shutil.rmtree(folder)
        os.makedirs(folder)
    
    if os.path.exists(JSON_FILE):
        os.remove(JSON_FILE)

def safe_locate(image_path, haystack=None, conf=0.8, center=True):
    """Helper to find images without crashing."""
    try:
        if center:
            if haystack:
                return pyautogui.locateCenterOnScreen(image_path, confidence=conf, haystackImage=haystack)
            return pyautogui.locateCenterOnScreen(image_path, confidence=conf)
        else:
            if haystack:
                return pyautogui.locate(image_path, haystack, confidence=conf)
            return pyautogui.locateOnScreen(image_path, confidence=conf)
    except:
        return None

def is_too_close(new_box, existing_list, min_dist):
    """Prevents duplicate detection of the same post."""
    for box in existing_list:
        dist = math.hypot(new_box.left - box.left, new_box.top - box.top)
        if dist < min_dist: return True
    return False

def frame_snap_and_crop(save_path):
    """Captures the text panel using TR and BL anchors."""
    try:
        full_shot = pyautogui.screenshot()
        tr_box = safe_locate(ANCHOR_TR, haystack=full_shot, center=False)
        bl_box = None
        for img_path in ANCHOR_BL_VARIANTS:
            found = safe_locate(img_path, haystack=full_shot, center=False)
            if found:
                bl_box = found
                break

        if not tr_box or not bl_box:
            return False

        y1, x2 = int(tr_box.top), int(tr_box.left + tr_box.width)
        y2, x1 = int(bl_box.top + bl_box.height), int(bl_box.left)

        if x1 >= x2 or y1 >= y2: return False

        final_crop = full_shot.crop((x1, y1, x2, y2))
        final_crop.save(save_path)
        return True
    except Exception as e:
        print(f"   [Snap Error] {e}")
        return False

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

def run_scrape_category(category_key, reader):
    """Processes a single window/category with the P1->P2->P3 setup."""
    config = CATEGORIES[category_key]
    target_window = config["window"]
    save_folder = config["folder"]
    
    print(f"\n🚀 PHASE: {category_key.upper()} (Window: {target_window})")

    # Get ALL windows
    windows = gw.getAllWindows()

    # Find exact match
    win = None
    for w in windows:
        if w.title.strip() == target_window:
            win = w
            break

    if not win:
        print(f"⚠️ Exact window not found. Skipping {category_key}.")
        return []

    # Activate safely
    if win.isMinimized:
        win.restore()
    win.activate()
    time.sleep(1)

    
    # Reload
    print("   Reloading...")
    pyautogui.hotkey('ctrl', 'r')
    time.sleep(5)

    # --- P1/P2/P3 Navigation Sequence ---
    print("   Running navigation sequence (p1 -> p2 -> p3)...")
    
    # Step 1: Move to P1
    p1_loc = safe_locate('p1.png')
    if p1_loc:
        pyautogui.moveTo(p1_loc)
        print("      P1 found.")
        time.sleep(0.2)

    # Step 2: Click P2
    p2_loc = safe_locate('p2.png')
    if p2_loc:
        pyautogui.click(p2_loc)
        print("      P2 clicked.")
        time.sleep(0.2)

    # Step 3: Hover P3
    p3_loc = safe_locate('p3.png')
    if p3_loc:
        pyautogui.moveTo(p3_loc)
        print("      P3 hovered.")
        time.sleep(0.2)

    print("   Setup complete. Scanning for hearts...")
    time.sleep(3)

    # Scanning for hearts
    raw_matches = list(pyautogui.locateAllOnScreen(HEART_IMAGE, confidence=0.8))
    unique_hearts = []
    for match in raw_matches:
        if not is_too_close(match, unique_hearts, DUPE_THRESHOLD):
            unique_hearts.append(match)

    print(f"   Found {len(unique_hearts)} posts.")
    category_data = []

    for i, box in enumerate(unique_hearts):
        cx, cy = box.left + (box.width / 2), box.top + (box.height / 2)
        pyautogui.click(cx, cy + OFFSET_Y)
        time.sleep(3) 

        filename = os.path.join(save_folder, f"post_{i+1}.png")
        if frame_snap_and_crop(filename):
            ocr_res = reader.readtext(filename, detail=0)
            raw_text = "\n".join(ocr_res)
            category_data.append({
                "filename": f"post_{i+1}.png",
                "raw": raw_text,
                "cleaned": clean_ocr_text(raw_text)
            })
            print(f"   ✅ Saved {filename}")
        
        pyautogui.press('esc')
        time.sleep(1.5)
    
    return category_data

def main():
    if not check_assets():
        return

    cleanup_environment()
    reader = easyocr.Reader(['ch_sim', 'en'], gpu=False)
    all_results = {}

    for cat_key in CATEGORIES.keys():
        all_results[cat_key] = run_scrape_category(cat_key, reader)

    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=4)
    
    print("\n✅ ALL CATEGORIES COMPLETE.")

if __name__ == "__main__":
    main()