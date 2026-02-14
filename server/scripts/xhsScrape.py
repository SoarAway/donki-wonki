import pyautogui
import time
import pygetwindow as gw
import os
import math
import easyocr
import json
import numpy as np
from PIL import Image
import re

# --- CONFIGURATION ---
TARGET_APP = "Microsoft Edge"
SAVE_FOLDER = 'scraped_posts'
JSON_FILE = 'scraped_data_clean.json'

# IMAGES TO FIND
HEART_IMAGE = 'heart_icon.png'        # The heart on the feed
ANCHOR_TR = 'anchor_tr.png'           # Top-Right Anchor (Red Follow Button)
# Bottom-Left Anchor variants (Green/Comment Icon etc.)
ANCHOR_BL_VARIANTS = ['anchor_bl_1.png', 'anchor_bl_2.png']

OFFSET_Y = -50      # Click 50px UP from the heart
DUPE_THRESHOLD = 20 # Duplicate check distance
# ---------------------

def safe_locate(image_path, haystack=None, conf=0.8, center=True):
    """
    Helper to find images without crashing if they aren't found.
    """
    try:
        if center:
            if haystack:
                return pyautogui.locateCenterOnScreen(image_path, confidence=conf, haystackImage=haystack)
            return pyautogui.locateCenterOnScreen(image_path, confidence=conf)
        else:
            if haystack:
                return pyautogui.locate(image_path, haystack, confidence=conf)
            return pyautogui.locateOnScreen(image_path, confidence=conf)
    except (pyautogui.ImageNotFoundException, Exception):
        return None

def is_too_close(new_box, existing_list, min_dist):
    for box in existing_list:
        dist = math.hypot(new_box.left - box.left, new_box.top - box.top)
        if dist < min_dist: return True
    return False

def frame_snap_and_crop(save_path):
    """
    Captures the text panel using TR anchor and multiple BL anchor possibilities.
    """
    try:
        full_shot = pyautogui.screenshot()
        
        # 1. Find Top-Right Anchor
        tr_box = safe_locate(ANCHOR_TR, haystack=full_shot, center=False)
        
        # 2. Find Bottom-Left Anchor (Check variants)
        bl_box = None
        for img_path in ANCHOR_BL_VARIANTS:
            found = safe_locate(img_path, haystack=full_shot, center=False)
            if found:
                bl_box = found
                print(f"   [Snap] Using anchor: {img_path}")
                break

        if not tr_box:
            print("   [Snap] Top-Right anchor not found.")
            return False
        if not bl_box:
            print("   [Snap] No Bottom-Left anchor variants found.")
            return False

        y1 = int(tr_box.top)
        x2 = int(tr_box.left + tr_box.width)
        y2 = int(bl_box.top + bl_box.height)
        x1 = int(bl_box.left)

        if x1 >= x2 or y1 >= y2:
            print(f"   [Snap] Invalid crop dims: L{x1} R{x2} T{y1} B{y2}")
            return False

        final_crop = full_shot.crop((x1, y1, x2, y2))
        final_crop.save(save_path)
        return True

    except Exception as e:
        print(f"   [Snap Error] {e}")
        return False

# ==========================================
# PHASE 1: NAVIGATE & CAPTURE
# ==========================================

if not os.path.exists(SAVE_FOLDER):
    os.makedirs(SAVE_FOLDER)

print(f"--- PHASE 1: CAPTURE ---")
try:
    windows = gw.getWindowsWithTitle(TARGET_APP)
    if windows:
        win = windows[0]
        if win.isMinimized: win.restore()
        win.activate()
        time.sleep(1)
        
        print("Reloading...")
        pyautogui.hotkey('ctrl', 'r')
        time.sleep(5)
    else:
        print("Window not found, assuming you are ready.")
except Exception:
    pass 

# --- P1/P2/P3 Logic (Setup Feed) ---
print("Checking navigation sequence (p1 -> p2 -> p3)...")

# Step 1: Move to P1
p1_loc = safe_locate('p1.png')
if p1_loc:
    pyautogui.moveTo(p1_loc)
    print("   P1 found.")
    time.sleep(0.2) # Gap

# Step 2: Click P2
p2_loc = safe_locate('p2.png')
if p2_loc:
    pyautogui.click(p2_loc)
    print("   P2 clicked.")
    time.sleep(0.2) # Gap

# Step 3: Hover P3
p3_loc = safe_locate('p3.png')
if p3_loc:
    pyautogui.moveTo(p3_loc)
    print("   P3 hovered.")
    time.sleep(0.2) # Gap

print("Setup complete. Waiting for feed to stabilize...")
time.sleep(3)

# --- Heart Scanning ---
print("Scanning for hearts...")
raw_matches = list(pyautogui.locateAllOnScreen(HEART_IMAGE, confidence=0.8))
unique_hearts = []

for match in raw_matches:
    if not is_too_close(match, unique_hearts, DUPE_THRESHOLD):
        unique_hearts.append(match)

print(f"Found {len(unique_hearts)} posts.")

for i, box in enumerate(unique_hearts):
    print(f"Processing {i+1}/{len(unique_hearts)}...")
    
    # 1. Open Post
    cx = box.left + (box.width / 2)
    cy = box.top + (box.height / 2)
    pyautogui.click(cx, cy + OFFSET_Y)
    
    time.sleep(3) 

    # 2. SNAPSHOT (Two-Point Frame)
    filename = os.path.join(SAVE_FOLDER, f"post_{i+1}.png")
    
    success = frame_snap_and_crop(filename)
    
    if success:
        print(f"   Saved {filename}")
    else:
        print(f"   Skipped post {i+1}")

    # 3. Close Modal
    pyautogui.press('esc')
    time.sleep(1.5)

# ==========================================
# PHASE 2: OCR + CLEAN + SAVE JSON
# ==========================================

print(f"\n--- PHASE 2: OCR + CLEAN ---")
reader = easyocr.Reader(['ch_sim', 'en'], gpu=False) 
all_data = []

def clean_ocr_text(text: str) -> str:
    """
    Advanced cleaning logic:
    1. Removes 'Attention' and everything before it.
    2. Stops and removes everything after 'Say something' or 'Wasteland'.
    3. Removes any blocks containing '#'.
    4. Filters specific UI noise.
    """
    lines = text.split('\n')
    
    # 1. Find the starting point (after 'Attention' or '关注')
    start_idx = 0
    for i, line in enumerate(lines):
        if "Attention" in line or "关注" in line:
            start_idx = i + 1
            break
    
    process_lines = lines[start_idx:]
    cleaned_lines = []
    
    # Stop keywords
    stop_keywords = [
        "Say something", "说点什么", 
        "It'sa wasteland", "这是一片荒地", 
        "Click comment", "点击评论"
    ]
    
    # Noise patterns (timestamps, locations, counts)
    timestamp_pattern = r"(\d{2}:\d{2}|\d{4}-\d{2}-\d{2})"
    location_pattern = r"(马来|福建|IP属地)"
    ui_noise_patterns = [
        r"共\s?\d+\s?条评论",
        r"展开\s?\d+\s?条回复",
        r"\d+\s?赞",
        r"[Oo]\s?赞",
        r"\d+\s?回复",
        r"置顶评论",
        r"编辑于.*"
    ]

    for line in process_lines:
        line = line.strip()
        if not line: continue
        
        # 2. STOP at footer markers
        if any(keyword in line for keyword in stop_keywords):
            break
            
        # 3. Remove blocks with '#'
        if "#" in line:
            continue
            
        # 4. Remove UI noise patterns
        is_noise = False
        for pattern in ui_noise_patterns:
            if re.search(pattern, line):
                is_noise = True
                break
        if is_noise: continue

        # 5. Remove standalone numbers (likes/counts) or timestamps/locations
        if line.isdigit() and len(line) < 4: continue
        if re.search(timestamp_pattern, line) or (re.search(location_pattern, line) and len(line) < 10):
            continue
            
        # 6. Specific word filter
        if line in ["收藏", "分享", "作者", "THE END", "评论"]:
            continue

        cleaned_lines.append(line)

    return "\n".join(cleaned_lines).strip()

if os.path.exists(SAVE_FOLDER):
    for f in sorted(os.listdir(SAVE_FOLDER)):
        if f.endswith(".png"):
            path = os.path.join(SAVE_FOLDER, f)
            try:
                result = reader.readtext(path, detail=0)
                raw_text = "\n".join(result)
                cleaned_text = clean_ocr_text(raw_text)
                
                all_data.append({
                    "filename": f,
                    "raw": raw_text,
                    "cleaned": cleaned_text
                })
                print(f"   Read + cleaned {f}")
            except Exception as e:
                print(f"   Error reading {f}: {e}")

    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=4)

print("✅ Done.")