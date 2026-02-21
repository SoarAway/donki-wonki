import pyautogui
import time
import pygetwindow as gw
import os
import math
import random
import builtins
import easyocr
import json
import re
from datetime import datetime
from pathlib import Path

# --- DYNAMIC CONFIGURATION ---
WINDOW_KEYWORDS = ["xiaohongshu", "小红书"]
RETURN_WINDOW_KEYWORD = "antigravity"

BASE_DIR = Path(__file__).resolve().parent
XHS_BASE_DIR = BASE_DIR
ASSETS_DIR = XHS_BASE_DIR / "assets"
POSTS_ROOT_DIR = XHS_BASE_DIR / "temp_data"

# SHARED ASSETS & SETTINGS (to capture the ss)
HEART_IMAGE = ASSETS_DIR / 'heart_icon.png'
ANCHOR_TR_VARIANTS = [
    ASSETS_DIR / 'anchor_tr.png',
    ASSETS_DIR / 'anchor_tr_1.png',
]

ANCHOR_BL_VARIANTS = sorted(ASSETS_DIR.glob('anchor_bl*.png')) or [ASSETS_DIR / 'anchor_bl_1.png']

# Navigation Assets (to identify the window)
NAV_ASSETS = [ASSETS_DIR / 'p1.png', ASSETS_DIR / 'p2.png', ASSETS_DIR / 'p3.png']

OFFSET_Y = -100
DUPE_THRESHOLD = 20
JSON_FILE = BASE_DIR / 'xhs_scraped_data_clean.json'
HEART_CONFIDENCE_LEVELS = [0.85, 0.8, 0.75, 0.7, 0.65, 0.6]
LOG_FILE = BASE_DIR / 'xhs_scrape.log'
LOG_TO_CONSOLE = False
VERBOSE_SCAN_LOGS = False
DETAIL_OPEN_MAX_ATTEMPTS = 3
DETAIL_CLICK_OFFSETS = [-160, -210, -120]
SPEED_FACTOR = max(0.2, min(2.0, float(os.getenv("XHS_SPEED_FACTOR", "0.85"))))
ANCHOR_CONFIDENCE = 0.85
MIN_CROP_WIDTH = 420
MIN_CROP_HEIGHT = 260
LOG_MAX_BYTES = 2_000_000
LOG_BACKUP_FILES = 3


def human_delay(min_seconds=0.6, max_seconds=1.6):
    """Sleep for a short randomized duration to mimic human pacing."""
    min_scaled = max(0.05, min_seconds * SPEED_FACTOR)
    max_scaled = max(min_scaled, max_seconds * SPEED_FACTOR)
    time.sleep(random.uniform(min_scaled, max_scaled))


def load_existing_results() -> dict:
    """Load existing JSON results if present and valid."""
    if not JSON_FILE.exists():
        return {}

    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as handle:
            data = json.load(handle)
        if isinstance(data, dict):
            return data
    except Exception as exc:
        log_message(f"json.load_failed path={JSON_FILE} err={exc}", level="WARNING")

    return {}


def merge_results(existing: dict, new_results: dict) -> dict:
    """Append new window results into existing result map."""
    merged = dict(existing)
    for category, posts in new_results.items():
        current = merged.get(category)
        if not isinstance(current, list):
            current = []

        seen = set()
        for post in current:
            seen.add(build_post_signature(category, post))

        for post in posts:
            signature = build_post_signature(category, post)
            if signature in seen:
                continue
            current.append(post)
            seen.add(signature)

        merged[category] = current
    return merged


def build_post_signature(category: str, post: dict) -> str:
    """Build stable signature for dedupe across append runs."""
    window_key = str(post.get("window_title") or category).strip().casefold()
    raw_text = re.sub(r"\s+", " ", str(post.get("raw") or "")).strip().casefold()
    filename = str(post.get("filename") or "").strip().casefold()
    if raw_text:
        return f"{window_key}|{raw_text[:500]}"
    return f"{window_key}|{filename}"


def infer_log_level(message: str) -> str:
    """Infer log level from message content."""
    lowered = message.lower()
    if "error" in lowered:
        return "ERROR"
    if "warning" in lowered or "skipped" in lowered or "failed" in lowered:
        return "WARNING"
    return "INFO"


def init_log_file():
    """Append a run header to the plain-text log file."""
    POSTS_ROOT_DIR.mkdir(parents=True, exist_ok=True)
    rotate_log_file(LOG_MAX_BYTES, LOG_BACKUP_FILES)
    started_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"{started_at} | INFO | run.start script={os.path.basename(__file__)}\n")


def rotate_log_file(max_bytes: int, backups: int) -> None:
    """Rotate log file when it grows beyond size threshold."""
    if not LOG_FILE.exists() or LOG_FILE.stat().st_size < max_bytes:
        return

    for idx in range(backups, 0, -1):
        src = LOG_FILE.with_suffix(f".log.{idx}")
        dst = LOG_FILE.with_suffix(f".log.{idx + 1}")
        if src.exists():
            if idx == backups:
                src.unlink(missing_ok=True)
            else:
                src.replace(dst)

    first_backup = LOG_FILE.with_suffix(".log.1")
    LOG_FILE.replace(first_backup)


def log_message(*args, sep=' ', end='\n', file=None, flush=False, level=None):
    """Write runtime output to plain log file (and optionally console)."""
    text = sep.join(str(arg) for arg in args)
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        for line in (text + end).splitlines():
            if not line.strip():
                continue
            resolved_level = level or infer_log_level(line)
            f.write(f"{timestamp} | {resolved_level} | {line}\n")

    if LOG_TO_CONSOLE:
        builtins.print(*args, sep=sep, end=end, file=file, flush=flush)

def check_assets():
    """Verifies that all required image assets exist and prints absolute paths for debugging."""
    missing = []
    log_message(f"assets.check path={ASSETS_DIR.resolve()}")
    
    for img in [HEART_IMAGE]:
        abs_path = str(img.resolve())
        if not img.exists():
            missing.append(f"{img} (Checked: {abs_path})")

    tr_exists = any(img.exists() for img in ANCHOR_TR_VARIANTS)
    if not tr_exists:
        for img in ANCHOR_TR_VARIANTS:
            missing.append(f"{img} (Checked: {str(img.resolve())})")
    
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
        log_message("assets.missing", level="ERROR")
        for m in missing:
            log_message(f"assets.missing_item {m}", level="ERROR")
        return False

    log_message("assets.check ok")
    return True

def ensure_output_folders(targets):
    """Ensure output folders exist without deleting prior run artifacts."""
    POSTS_ROOT_DIR.mkdir(parents=True, exist_ok=True)
    for target in targets:
        target["folder"].mkdir(parents=True, exist_ok=True)


def cleanup_old_screenshots():
    """Delete old screenshot artifacts so temp_data does not grow unbounded."""
    if not POSTS_ROOT_DIR.exists():
        return

    removed = 0
    for pattern in ("*.png", "*.jpg", "*.jpeg", "*.webp"):
        for image_path in POSTS_ROOT_DIR.rglob(pattern):
            try:
                image_path.unlink()
                removed += 1
            except Exception:
                continue

    log_message(f"screenshots.cleanup removed={removed} dir={POSTS_ROOT_DIR}")

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
    attempts = 0
    for conf in levels:
        for grayscale in (False, True):
            attempts += 1
            try:
                matches = list(pyautogui.locateAllOnScreen(image_path_str, confidence=conf, grayscale=grayscale))
                if matches:
                    log_message(
                        f"image_match.success image={Path(image_path_str).name} conf={conf} "
                        f"grayscale={grayscale} hits={len(matches)} attempts={attempts}"
                    )
                    return matches
                if VERBOSE_SCAN_LOGS:
                    log_message(
                        f"image_match.miss image={Path(image_path_str).name} conf={conf} grayscale={grayscale}"
                    )
            except Exception as exc:
                log_message(
                    f"image_match.error image={Path(image_path_str).name} conf={conf} grayscale={grayscale} err={exc}",
                    level="WARNING",
                )

    log_message(
        f"image_match.none image={Path(image_path_str).name} attempts={attempts}",
        level="WARNING",
    )

    return []


def safe_locate_all_in_region(image_path, region, confidence_levels=None):
    """Find all image matches within a specific region."""
    levels = confidence_levels or HEART_CONFIDENCE_LEVELS
    image_path_str = str(image_path)

    for conf in levels:
        for grayscale in (False, True):
            try:
                matches = list(
                    pyautogui.locateAllOnScreen(
                        image_path_str,
                        confidence=conf,
                        grayscale=grayscale,
                        region=region,
                    )
                )
                if matches:
                    return matches
            except Exception:
                continue

    return []


def locate_anchor_box(full_shot, variants, conf=ANCHOR_CONFIDENCE):
    """Return first matched anchor box from variant list."""
    for img_path in variants:
        found = safe_locate(img_path, haystack=full_shot, center=False, conf=conf)
        if found:
            return found
    return None


def detail_view_ready() -> bool:
    """Check whether detail page anchors are visible on current screen."""
    full_shot = pyautogui.screenshot()
    tr_box = locate_anchor_box(full_shot, ANCHOR_TR_VARIANTS, conf=ANCHOR_CONFIDENCE)
    bl_box = locate_anchor_box(full_shot, ANCHOR_BL_VARIANTS, conf=ANCHOR_CONFIDENCE)
    return bool(tr_box and bl_box)


def detail_anchor_status() -> tuple[bool, bool]:
    """Return whether top-right and bottom-left anchors are currently detectable."""
    full_shot = pyautogui.screenshot()
    tr_ok = locate_anchor_box(full_shot, ANCHOR_TR_VARIANTS, conf=ANCHOR_CONFIDENCE) is not None
    bl_ok = locate_anchor_box(full_shot, ANCHOR_BL_VARIANTS, conf=ANCHOR_CONFIDENCE) is not None
    return tr_ok, bl_ok


def wait_for_detail_view_ready(timeout_sec: float = 1.6, poll_sec: float = 0.2) -> bool:
    """Poll for detail-view anchors to allow UI animation/render settling."""
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        if detail_view_ready():
            return True
        time.sleep(poll_sec)
    return detail_view_ready()


def close_detail_view(max_presses: int = 2) -> bool:
    """Attempt to close open detail/modal view with ESC."""
    for _ in range(max_presses):
        pyautogui.press('esc')
        human_delay(0.25, 0.6)
    return not detail_view_ready()


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


def focus_return_window():
    """Focus the preferred return window after scrape completes."""
    target_keyword = normalize_window_title(RETURN_WINDOW_KEYWORD)
    all_windows = [w for w in gw.getAllWindows() if w.title and w.title.strip()]

    for window in all_windows:
        title = window.title.strip()
        if target_keyword not in normalize_window_title(title):
            continue

        try:
            if getattr(window, "isActive", False):
                log_message(f"focus.return ok window={title} method=already_active")
                return
        except Exception:
            pass

        try:
            if window.isMinimized:
                window.restore()
            window.activate()
            log_message(f"focus.return ok window={title}")
            return
        except Exception as exc:
            err_text = str(exc).lower()
            if "windows: 183" in err_text or "error code from windows: 183" in err_text:
                try:
                    window.restore()
                except Exception:
                    pass
                human_delay(0.05, 0.15)
                try:
                    window.activate()
                    log_message(f"focus.return ok window={title} method=retry_after_183")
                    return
                except Exception as retry_exc:
                    try:
                        if getattr(window, "isActive", False):
                            log_message(f"focus.return ok window={title} method=active_after_183")
                            return
                    except Exception:
                        pass
                    log_message(
                        f"focus.return retry_failed window={title} err={retry_exc}",
                        level="WARNING",
                    )
                    continue

            log_message(f"focus.return failed window={title} err={exc}", level="WARNING")
            continue

    log_message(f"focus.return missing keyword={RETURN_WINDOW_KEYWORD}", level="WARNING")

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
        tr_box = locate_anchor_box(full_shot, ANCHOR_TR_VARIANTS, conf=ANCHOR_CONFIDENCE)
        bl_box = locate_anchor_box(full_shot, ANCHOR_BL_VARIANTS, conf=ANCHOR_CONFIDENCE)

        if not tr_box:
            if debug_fullshot_path:
                full_shot.save(debug_fullshot_path)
            return False, f"top-right anchor not found: {', '.join(str(p) for p in ANCHOR_TR_VARIANTS)}"

        if not bl_box:
            if debug_fullshot_path:
                full_shot.save(debug_fullshot_path)
            return False, f"bottom-left anchor not found: {', '.join(str(p) for p in ANCHOR_BL_VARIANTS)}"

        y1, x2 = int(tr_box.top), int(tr_box.left + tr_box.width)
        y2, x1 = int(bl_box.top + bl_box.height), int(bl_box.left)

        if x1 >= x2 or y1 >= y2:
            normalized_x1 = min(x1, x2)
            normalized_x2 = max(x1, x2)
            normalized_y1 = min(y1, y2)
            normalized_y2 = max(y1, y2)

            if normalized_x1 < normalized_x2 and normalized_y1 < normalized_y2:
                x1, x2 = normalized_x1, normalized_x2
                y1, y2 = normalized_y1, normalized_y2

        if x1 >= x2 or y1 >= y2:
            if debug_fullshot_path:
                full_shot.save(debug_fullshot_path)
            return False, f"invalid crop bounds: ({x1}, {y1}) to ({x2}, {y2})"

        crop_width = x2 - x1
        crop_height = y2 - y1
        if crop_width < MIN_CROP_WIDTH or crop_height < MIN_CROP_HEIGHT:
            if debug_fullshot_path:
                full_shot.save(debug_fullshot_path)
            return False, (
                f"crop_too_small: {crop_width}x{crop_height} "
                f"(min {MIN_CROP_WIDTH}x{MIN_CROP_HEIGHT})"
            )

        final_crop = full_shot.crop((x1, y1, x2, y2))
        final_crop.save(save_path)
        return True, "ok"
    except Exception as e:
        if debug_fullshot_path:
            try:
                pyautogui.screenshot(debug_fullshot_path)
            except Exception:
                pass
        log_message(f"capture.snap_error err={e}", level="WARNING")
        return False, f"snap exception: {e}"

def run_scrape_window(target, reader):
    """Process one detected XHS window with the P1->P2->P3 setup."""
    category_key = target["key"]
    target_window = target["title"]
    save_folder = target["folder"]
    win = target["window"]
    
    log_message(f"window.start key={category_key} title={target_window}")

    if not win:
        log_message(f"window.skip key={category_key} reason=window_unavailable", level="WARNING")
        return []

    # Activate safely
    try:
        if win.isMinimized:
            win.restore()
        win.activate()
    except Exception as exc:
        log_message(f"window.activate_failed key={category_key} err={exc}", level="WARNING")
        return []
    human_delay(0.9, 1.8)

    
    # --- P1/P2/P3 Navigation Sequence ---
    log_message(f"window.navigation key={category_key} step=p1_p2_p3")
    
    # Step 1: Move to P1
    p1_loc = safe_locate(ASSETS_DIR / 'p1.png')
    if p1_loc:
        pyautogui.moveTo(p1_loc)
        log_message(f"window.navigation key={category_key} step=p1_found")
        human_delay(0.15, 0.45)

    # Step 2: Click P2
    p2_loc = safe_locate(ASSETS_DIR / 'p2.png')
    if p2_loc:
        pyautogui.click(p2_loc)
        log_message(f"window.navigation key={category_key} step=p2_clicked")
        human_delay(0.2, 0.6)

    # Step 3: Hover P3
    p3_loc = safe_locate(ASSETS_DIR / 'p3.png')
    if p3_loc:
        pyautogui.moveTo(p3_loc)
        log_message(f"window.navigation key={category_key} step=p3_hovered")
        human_delay(0.15, 0.45)

    log_message(f"window.scan key={category_key} stage=start")
    human_delay(2.5, 4.2)

    # Scanning for hearts
    window_region = get_window_region(win)
    if window_region:
        log_message(f"window.scan key={category_key} region={window_region}")
        try:
            raw_matches = list(pyautogui.locateAllOnScreen(str(HEART_IMAGE), confidence=0.8, region=window_region))
        except Exception as exc:
            log_message(f"window.scan key={category_key} region_scan_error={exc}", level="WARNING")
            raw_matches = []

        if raw_matches:
            log_message(f"window.scan key={category_key} region_hits={len(raw_matches)}")
        else:
            log_message(f"window.scan key={category_key} region_hits=0 fallback=region_adaptive", level="WARNING")
            raw_matches = safe_locate_all_in_region(HEART_IMAGE, window_region)
    else:
        log_message(f"window.scan key={category_key} region_unavailable fallback=full_screen", level="WARNING")
        raw_matches = safe_locate_all(HEART_IMAGE)

    unique_hearts = []
    for match in raw_matches:
        if not is_too_close(match, unique_hearts, DUPE_THRESHOLD):
            unique_hearts.append(match)

    log_message(f"window.scan key={category_key} unique_posts={len(unique_hearts)}")
    if not unique_hearts:
        debug_path = save_folder / 'debug_no_hearts.png'
        pyautogui.screenshot(str(debug_path))
        log_message(f"window.scan key={category_key} debug_screenshot={debug_path}")

    category_data = []

    capture_failures = 0

    for i, box in enumerate(unique_hearts):
        close_detail_view()
        cx, cy = box.left + (box.width / 2), box.top + (box.height / 2)
        captured = False
        final_reason = "detail_not_opened"
        final_debug = save_folder / f"debug_post_{i+1}_not_opened.png"

        try:
            for attempt in range(1, DETAIL_OPEN_MAX_ATTEMPTS + 1):
                offset_index = min(attempt - 1, len(DETAIL_CLICK_OFFSETS) - 1)
                y_offset = DETAIL_CLICK_OFFSETS[offset_index]

                pyautogui.click(cx, cy + y_offset)
                human_delay(1.1, 2.0)

                if not wait_for_detail_view_ready(timeout_sec=1.6, poll_sec=0.2):
                    tr_ok, bl_ok = detail_anchor_status()
                    missing_parts = []
                    if not tr_ok:
                        missing_parts.append(
                            f"top_right[{','.join(path.name for path in ANCHOR_TR_VARIANTS)}]"
                        )
                    if not bl_ok:
                        missing_parts.append(
                            f"bottom_left[{','.join(path.name for path in ANCHOR_BL_VARIANTS)}]"
                        )
                    final_reason = f"detail_anchor_not_ready missing={';'.join(missing_parts) or 'unknown'}"
                    final_debug = save_folder / f"debug_post_{i+1}_not_opened.png"
                    pyautogui.screenshot(str(final_debug))
                    log_message(
                        f"capture.open_retry key={category_key} post_index={i+1} attempt={attempt} y_offset={y_offset} reason={final_reason}",
                        level="WARNING",
                    )
                    close_detail_view()
                    human_delay(0.2, 0.6)
                    continue

                filename = save_folder / f"post_{i+1}.png"
                debug_fullshot = save_folder / f"debug_post_{i+1}_full.png"
                snapped, reason = frame_snap_and_crop(filename, debug_fullshot_path=debug_fullshot)

                if snapped:
                    ocr_res = reader.readtext(str(filename), detail=0)
                    raw_text = "\n".join(ocr_res)
                    category_data.append({
                        "filename": f"post_{i+1}.png",
                        "window_title": target_window,
                        "scraped_at": datetime.now().isoformat(timespec="seconds"),
                        "raw": raw_text,
                    })
                    log_message(
                        f"capture.ok key={category_key} post_index={i+1} attempt={attempt} y_offset={y_offset} file={filename}"
                    )
                    captured = True
                    break

                final_reason = reason
                final_debug = debug_fullshot
                log_message(
                    f"capture.open_retry key={category_key} post_index={i+1} attempt={attempt} y_offset={y_offset} reason={reason}",
                    level="WARNING",
                )

                close_detail_view()
                human_delay(0.2, 0.6)

            if not captured:
                capture_failures += 1
                log_message(
                    f"capture.fail key={category_key} post_index={i+1} reason={final_reason} debug={final_debug}",
                    level="WARNING",
                )
        finally:
            closed = close_detail_view()
            if not closed:
                log_message(
                    f"capture.close_warn key={category_key} post_index={i+1} status=detail_may_still_open",
                    level="WARNING",
                )

    if capture_failures:
        log_message(
            f"window.result key={category_key} extracted={len(category_data)} failures={capture_failures} total={len(unique_hearts)}",
            level="WARNING",
        )
    else:
        log_message(
            f"window.result key={category_key} extracted={len(category_data)} failures=0 total={len(unique_hearts)}"
        )
    
    return category_data
 
# Main Function
def main():
    init_log_file()
    try:
        if not check_assets():
            return

        targets, all_windows = discover_target_windows()
        if not targets:
            log_message("window.discovery none_found", level="WARNING")
            visible_titles = [w.title.strip() for w in all_windows if w.title and w.title.strip()]
            if visible_titles:
                log_message(f"window.discovery visible_titles count={len(visible_titles)}")
                for title in visible_titles[:20]:
                    log_message(f"window.discovery title={title}")
                if len(visible_titles) > 20:
                    log_message(f"window.discovery more={len(visible_titles) - 20}")

            log_message("run.complete windows=0 extracted=0 no_write=true")
            return

        log_message(f"window.discovery matched={len(targets)}")
        for target in targets:
            log_message(f"window.discovery matched_title={target['title']}")

        cleanup_old_screenshots()
        ensure_output_folders(targets)
        reader = easyocr.Reader(['ch_sim', 'en'], gpu=False)
        all_results = {}

        for target in targets:
            all_results[target["title"]] = run_scrape_window(target, reader)

        existing_results = load_existing_results()
        merged_results = merge_results(existing_results, all_results)

        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(merged_results, f, ensure_ascii=False, indent=4)

        total_extracted = sum(len(posts) for posts in all_results.values())
        cumulative_total = sum(len(posts) for posts in merged_results.values())
        log_message(
            f"run.complete windows={len(targets)} extracted={total_extracted} cumulative={cumulative_total} json={JSON_FILE}"
        )
    finally:
        focus_return_window()

if __name__ == "__main__":
    main()
