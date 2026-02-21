# Scripts Folder Guide

This folder contains **manual scraping utilities** and their local assets/outputs.
These scripts are **not wired into the FastAPI server runtime** by default.

## What this folder is for

- One-off data collection from social platforms for experimentation.
- UI-driven scraping workflows that rely on desktop windows and image anchors.
- Producing JSON outputs that can be inspected manually.

## Files in this folder

- `xScrape.py` - Scrapes recent posts from RapidKL's X account using Playwright.
- `xhsScrape.py` - Uses GUI automation + OCR to collect text from XHS-like windows.
- `x_latest_posts.json` - Output from `xScrape.py`.
- `xhsScrape/input/assets/` - XHS GUI template inputs (`heart_icon.png`, anchors, `p1/p2/p3`).
- `xhsScrape/output/json/xhs_scraped_data_clean.json` - Output from `xhsScrape.py`.
- `xhsScrape/output/reports/xhs_run_report.md` - Human-readable run log from `xhsScrape.py`.
- `xhsScrape/output/posts/<window-slug>/` - Consolidated post screenshots (subfolders per detected window).
- `xhsDomScrape/xhs_dom_scraped_data.json` - Output from DOM/network scraper.
- `xhsDomScrape/xhs_dom_scrape.log` - Log file for DOM/network scraper.

## Important behavior to know

### `xScrape.py`

- Targets `https://x.com/AskRapidKL`.
- Collects up to `POST_COUNT = 10` tweets.
- Writes structured JSON to `x_latest_posts.json`.
- Clears previous `x_latest_posts.json` on start.
- Creates and removes a temporary Playwright profile directory each run.
- Uses non-headless browser mode (`HEADLESS = False`).

### `xhsScrape.py`

- Auto-discovers and scans all open windows whose title contains either `xiaohongshu` or `小红书`.
- Uses image anchors (`p1/p2/p3`, hearts, corner anchors) to navigate and detect posts.
- Takes screenshots of post panels, then runs OCR (Chinese + English) via EasyOCR.
- Cleans extracted text and writes grouped results to `xhsScrape/output/json/xhs_scraped_data_clean.json` (keyed by detected window title).
- Writes progress and runtime messages to `xhsScrape/output/reports/xhs_run_report.md` (instead of console by default).
- Deletes old category folders and old JSON output at the beginning of a run.
- For failed post captures, writes debug full-screen images as `debug_post_<n>_full.png`.

## Prerequisites

These dependencies are **not** listed in `server/requirements.txt`, so install them separately in your environment:

```bash
pip install playwright pyautogui pygetwindow easyocr pillow
python -m playwright install chromium
```

Notes:
- EasyOCR may pull larger ML dependencies (for example Torch).
- GUI automation requires an active desktop session (not suitable for headless CI by default).

## How to run

Run from this directory so relative file paths resolve correctly:

```bash
cd server/scripts
python xScrape.py
python xhsScrape.py
```

## Outputs and side effects

- `xScrape.py` overwrites/removes old `x_latest_posts.json`.
- `xhsScrape.py` removes and recreates consolidated post folders under `xhsScrape/output/posts/<detected-window-title-slug>`.
- `xhsScrape.py` overwrites/removes old `xhsScrape/output/json/xhs_scraped_data_clean.json`.
- `xhsScrape.py` recreates `xhsScrape/output/reports/xhs_run_report.md` on each run.

## Safety and reliability notes

- These scripts are fragile to UI/layout/theme/resolution changes.
- They depend on exact window titles and visible image anchors.
- OCR quality depends on screenshot quality and language mix.
- The scripts currently use `print` for logging and are intended for local/manual operation.
- `xhsScrape.py` stores log output in `xhsScrape/output/reports/xhs_run_report.md`; set `LOG_TO_CONSOLE = True` in `xhsScrape.py` if you also want terminal output.

## Troubleshooting

- If assets are reported missing, verify files exist under `server/scripts/xhsScrape/input/assets/`.
- If no windows are found, verify exact window title matches.
- If detection misses elements, adjust display scaling, zoom level, or confidence thresholds.
- If you hit `ImageNotFoundException` for hearts, the script now auto-retries across multiple confidence levels (`HEART_CONFIDENCE_LEVELS` in `xhsScrape.py`), but you should still re-capture `heart_icon.png` at your current display scaling/zoom for best results.
- If no hearts are found, the script saves `debug_no_hearts.png` under `server/scripts/xhsScrape/output/posts/<window-slug>/`.
- If Playwright fails first run, ensure Chromium is installed via `python -m playwright install chromium`.

## Integration status

- Current backend code does not directly import or schedule these scripts.
- Treat this folder as a standalone toolkit unless integration is explicitly added.
