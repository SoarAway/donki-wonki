import argparse
import csv
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Set


DEFAULT_INPUT = "xhs_scraped_data_clean.json"
DEFAULT_OUTPUT = "xhs_scraped_data_cleaned.json"
DEFAULT_CSV = "xhs_scraped_data_clean.csv"


UI_PATTERNS = [
    re.compile(r"^focus\s+on$", re.IGNORECASE),
    re.compile(r"^关注$"),
    re.compile(r"^edited\s+on\s+\d{4}-\d{2}-\d{2}$", re.IGNORECASE),
    re.compile(r"^\d+\s+comments?\s+in\s+total$", re.IGNORECASE),
    re.compile(r"^there\s+are\s+\d+\s+comments?\s+in\s+total$", re.IGNORECASE),
    re.compile(r"^show(?:\s+\d+)?\s+replies?$", re.IGNORECASE),
    re.compile(r"^reply$", re.IGNORECASE),
    re.compile(r"^author$", re.IGNORECASE),
    re.compile(r"^comment$", re.IGNORECASE),
    re.compile(r"^praise$", re.IGNORECASE),
    re.compile(r"^(?:say\s+something.*|说点什么.*|it'?s\s*a\s*wasteland.*|这是一片荒地.*)$", re.IGNORECASE),
]

DATE_LINE = re.compile(r"^\d{4}-\d{2}-\d{2}(?:\s+[A-Za-z]+)?$", re.IGNORECASE)
SHORT_DATE_LINE = re.compile(r"^\d{2}-\d{2}(?:\s+[A-Za-z]+)?$", re.IGNORECASE)
HASHTAG = re.compile(r"#\w+")
NOISE_CODE = re.compile(r"^[A-Za-z0-9]{6,}$")
NON_CONTENT = re.compile(r"^[\d\s@QOIl|/\\._()><-]+$")
WORD_OR_HAN = re.compile(r"[A-Za-z]+|[\u4e00-\u9fff]+")
SPECIAL_CHARS = re.compile(r"[^\w\s\u4e00-\u9fff]")
COMMENT_MARKERS = [
    re.compile(r"comments?\s+in\s+total", re.IGNORECASE),
    re.compile(r"show(?:\s+\d+)?\s+replies?", re.IGNORECASE),
    re.compile(r"\bauthor\b", re.IGNORECASE),
    re.compile(r"\breply\b", re.IGNORECASE),
]


def normalize_line(line: str) -> str:
    line = unicodedata.normalize("NFKC", line)
    line = line.replace("/n", " ")
    line = line.replace("\u00a0", " ")
    line = SPECIAL_CHARS.sub(" ", line)
    line = re.sub(r"\s+", " ", line).strip()
    return line


def line_is_ui_noise(line: str, learned_noise: Set[str]) -> bool:
    if not line:
        return True
    lowered = line.casefold()
    if lowered in learned_noise:
        return True
    if HASHTAG.search(line):
        return True
    if NOISE_CODE.fullmatch(line) and not WORD_OR_HAN.search(line.lower()):
        return True
    if NON_CONTENT.fullmatch(line):
        return True
    if any(pattern.match(line) for pattern in UI_PATTERNS):
        return True
    return False


def looks_like_comment_tail_start(line: str) -> bool:
    if any(pattern.search(line) for pattern in COMMENT_MARKERS):
        return True
    if DATE_LINE.match(line) or SHORT_DATE_LINE.match(line):
        return True
    return False


def learn_noise_patterns(data: Dict[str, Any]) -> Set[str]:
    counter: Counter[str] = Counter()
    post_count = 0

    for posts in data.values():
        for post in posts:
            post_count += 1
            source = str(post.get("cleaned") or post.get("raw") or "")
            seen_local = set()
            for raw_line in source.splitlines():
                line = normalize_line(raw_line)
                if not line:
                    continue
                key = line.casefold()
                if key in seen_local:
                    continue
                seen_local.add(key)
                counter[key] += 1

    learned = set()
    if post_count == 0:
        return learned

    threshold = max(2, int(post_count * 0.4))
    for line_key, freq in counter.items():
        if freq < threshold:
            continue

        tokens = WORD_OR_HAN.findall(line_key)
        if len(tokens) <= 3 and len(line_key) <= 40:
            if any(marker.search(line_key) for marker in COMMENT_MARKERS) or NON_CONTENT.fullmatch(line_key):
                learned.add(line_key)

    return learned


def clean_text_block(text: str, learned_noise: Set[str]) -> Dict[str, Any]:
    text = text.replace("/n", "\n")
    source_lines = text.splitlines()
    normalized_source = [normalize_line(line) for line in source_lines]
    focus_index = next((idx for idx, line in enumerate(normalized_source) if "focus on" in line.casefold()), None)
    if focus_index is not None:
        source_lines = source_lines[focus_index + 1 :]

    lines = [normalize_line(line) for line in source_lines]
    lines = [line for line in lines if line]

    cleaned: List[str] = []
    removed: List[str] = []
    seen = set()

    comment_tail_started = False
    for line in lines:
        if line_is_ui_noise(line, learned_noise):
            removed.append(line)
            continue

        if looks_like_comment_tail_start(line):
            comment_tail_started = True

        if comment_tail_started:
            removed.append(line)
            continue

        key = line.casefold()
        if key in seen:
            removed.append(line)
            continue

        if len(WORD_OR_HAN.findall(line)) <= 1 and len(line) < 6:
            removed.append(line)
            continue

        seen.add(key)
        cleaned.append(line)

    return {
        "enhanced_cleaned": re.sub(r"\s+", " ", " ".join(cleaned)).strip(),
        "removed_line_count": len(removed),
        "removed_lines_sample": removed[:12],
    }


def flatten_posts_for_csv(data: Dict[str, Any]) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    for category, posts in data.items():
        for idx, post in enumerate(posts, start=1):
            if not isinstance(post, dict):
                continue
            rows.append(
                {
                    "category": str(category),
                    "post_index": str(idx),
                    "filename": str(post.get("filename") or ""),
                    "window_title": str(post.get("window_title") or ""),
                    "scraped_at": str(post.get("scraped_at") or ""),
                    "raw": str(post.get("raw") or ""),
                    "cleaned": str(post.get("cleaned") or ""),
                }
            )
    return rows


def write_csv(rows: List[Dict[str, str]], csv_path: Path) -> Path:
    fields = ["category", "post_index", "filename", "window_title", "scraped_at", "raw", "cleaned"]
    with csv_path.open("w", encoding="utf-8", newline="") as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    return csv_path


def transform_dataset(data: Dict[str, Any], input_path: Path, output_path: Path, csv_path: Path) -> Dict[str, Any]:
    learned_noise = learn_noise_patterns(data)

    categories: Dict[str, List[Dict[str, Any]]] = {}
    post_count = 0
    removed_total = 0

    for category, posts in data.items():
        transformed_posts: List[Dict[str, Any]] = []
        for post in posts:
            source_text = str(post.get("cleaned") or post.get("raw") or "")
            result = clean_text_block(source_text, learned_noise=learned_noise)

            transformed_posts.append(
                {
                    "filename": post.get("filename"),
                    "window_title": post.get("window_title"),
                    "scraped_at": post.get("scraped_at"),
                    "enhanced_cleaned": result["enhanced_cleaned"],
                }
            )

            post_count += 1
            removed_total += result["removed_line_count"]

        categories[category] = transformed_posts

    return {
        "cleaner": "xhs_data_cleaner_v2_pattern_script",
        "input_path": str(input_path),
        "output_path": str(output_path),
        "csv_path": str(csv_path),
        "stats": {
            "categories": len(categories),
            "posts": post_count,
            "removed_lines_total": removed_total,
            "learned_noise_count": len(learned_noise),
            "learned_noise_sample": sorted(list(learned_noise))[:12],
            "csv_rows": post_count,
        },
        "categories": categories,
    }


def run(input_path: Path, output_path: Path, csv_path: Path) -> Dict[str, Any]:
    with input_path.open("r", encoding="utf-8") as infile:
        data = json.load(infile)

    csv_rows = flatten_posts_for_csv(data)
    write_csv(csv_rows, csv_path=csv_path)

    transformed = transform_dataset(data, input_path=input_path, output_path=output_path, csv_path=csv_path)
    with output_path.open("w", encoding="utf-8") as outfile:
        json.dump(transformed, outfile, ensure_ascii=False, indent=2)

    return transformed


def main() -> None:
    script_dir = Path(__file__).resolve().parent

    parser = argparse.ArgumentParser(description="Pattern-driven cleaner for XHS OCR output.")
    parser.add_argument("--input", default=DEFAULT_INPUT, help="Input JSON path.")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help="Output cleaned JSON path.")
    parser.add_argument("--csv-output", default=DEFAULT_CSV, help="Output flattened CSV path.")
    args = parser.parse_args()

    input_arg = Path(args.input)
    output_arg = Path(args.output)
    csv_arg = Path(args.csv_output)

    input_path = input_arg if input_arg.is_absolute() else (script_dir / input_arg).resolve()
    output_path = output_arg if output_arg.is_absolute() else (script_dir / output_arg).resolve()
    csv_path = csv_arg if csv_arg.is_absolute() else (script_dir / csv_arg).resolve()

    result = run(input_path=input_path, output_path=output_path, csv_path=csv_path)
    print(f"CSV output saved to: {csv_path}")
    print(f"Cleaned output saved to: {output_path}")
    print(result["stats"])


if __name__ == "__main__":
    main()
