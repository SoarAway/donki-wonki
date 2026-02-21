import argparse
import json
import re
import unicodedata
from pathlib import Path
from typing import Any, Dict, List


DEFAULT_INPUT = "xhsScrape/output/json/xhs_scraped_data_clean.json"
DEFAULT_OUTPUT = "xhsScrape/output/json/xhs_scraped_data_cleaned.json"


UI_LINE_PATTERNS = [
    re.compile(r"^focus\s+on$", re.IGNORECASE),
    re.compile(r"^关注$"),
    re.compile(r"^edited\s+on\s+\d{4}-\d{2}-\d{2}$", re.IGNORECASE),
    re.compile(r"^there\s+are\s+\d+\s+comments?\s+in\s+total$", re.IGNORECASE),
    re.compile(r"^\d+\s+comments?\s+in\s+total$", re.IGNORECASE),
    re.compile(r"^show(?:\s+\d+)?\s+replies?$", re.IGNORECASE),
    re.compile(r"^praise$", re.IGNORECASE),
    re.compile(r"^reply$", re.IGNORECASE),
    re.compile(r"^author$", re.IGNORECASE),
    re.compile(r"^comment$", re.IGNORECASE),
    re.compile(r"^the\s+end$", re.IGNORECASE),
    re.compile(r"^emoji[\]\)]?$", re.IGNORECASE),
    re.compile(r"^(?:say\s+something.*|说点什么.*|it'?s\s*a\s*wasteland.*|这是一片荒地.*)$", re.IGNORECASE),
]

DATE_LINE = re.compile(r"^\d{4}-\d{2}-\d{2}(?:\s+[A-Za-z]+)?$", re.IGNORECASE)
SHORT_DATE_LINE = re.compile(r"^\d{2}-\d{2}(?:\s+[A-Za-z]+)?$", re.IGNORECASE)
HASHTAG_LINE = re.compile(r"#\w+")
LETTER_OR_HAN = re.compile(r"[A-Za-z\u4e00-\u9fff]")
WORD_OR_HAN = re.compile(r"[A-Za-z]+|[\u4e00-\u9fff]+")
PUNCTUATION_MARK = re.compile(r"[.!?;:。！？]")


def normalize_line(line: str) -> str:
    line = unicodedata.normalize("NFKC", line)
    line = line.replace("\u00a0", " ")
    line = re.sub(r"\s+", " ", line).strip()
    line = re.sub(r"\s+([,.;:!?])", r"\1", line)
    line = re.sub(r"([。！？.!?])\1{2,}", r"\1\1", line)
    return line


def is_ui_noise(line: str) -> bool:
    if not line:
        return True
    if HASHTAG_LINE.search(line):
        return True
    for pattern in UI_LINE_PATTERNS:
        if pattern.match(line):
            return True
    return False


def is_counter_or_symbol_noise(line: str) -> bool:
    if DATE_LINE.match(line) or SHORT_DATE_LINE.match(line):
        return False
    if LETTER_OR_HAN.search(line):
        return False
    compact = line.replace(" ", "")
    if not compact:
        return True
    if len(compact) <= 8 and re.fullmatch(r"[\d@QOIl|/\\._-]+", compact):
        return True
    if re.fullmatch(r"[\d\W_]+", compact):
        return True
    return False


def is_low_information_tail(line: str) -> bool:
    if DATE_LINE.match(line) or SHORT_DATE_LINE.match(line):
        return False
    if is_ui_noise(line) or is_counter_or_symbol_noise(line):
        return True

    tokens = WORD_OR_HAN.findall(line)
    if not tokens:
        return True
    if PUNCTUATION_MARK.search(line):
        return False

    # OCR tails in this dataset are often single-word drifts appended in runs.
    return len(tokens) <= 2 and len(line) <= 20


def prune_tail_fragments(lines: List[str]) -> List[str]:
    idx = len(lines)
    run = 0

    while idx > 0:
        if is_low_information_tail(lines[idx - 1]):
            run += 1
            idx -= 1
            continue
        break

    if run >= 3:
        return lines[:idx]
    return lines


def clean_text_block(text: str) -> Dict[str, Any]:
    cleaned_lines: List[str] = []
    removed_lines: List[str] = []
    seen = set()

    for raw_line in text.splitlines():
        line = normalize_line(raw_line)
        if not line:
            continue
        if is_ui_noise(line) or is_counter_or_symbol_noise(line):
            removed_lines.append(line)
            continue

        key = line.casefold()
        if key in seen:
            removed_lines.append(line)
            continue

        seen.add(key)
        cleaned_lines.append(line)

    pruned = prune_tail_fragments(cleaned_lines)
    if len(pruned) < len(cleaned_lines):
        removed_lines.extend(cleaned_lines[len(pruned):])

    return {
        "enhanced_cleaned": "\n".join(pruned).strip(),
        "removed_line_count": len(removed_lines),
        "removed_lines_sample": removed_lines[:8],
    }


def transform_dataset(data: Dict[str, Any]) -> Dict[str, Any]:
    categories: Dict[str, List[Dict[str, Any]]] = {}
    post_count = 0
    removed_line_total = 0

    for category, posts in data.items():
        transformed_posts: List[Dict[str, Any]] = []
        for post in posts:
            source_cleaned = str(post.get("cleaned", ""))
            result = clean_text_block(source_cleaned)
            transformed_posts.append(
                {
                    "filename": post.get("filename"),
                    "source_cleaned": source_cleaned,
                    "enhanced_cleaned": result["enhanced_cleaned"],
                    "removed_line_count": result["removed_line_count"],
                    "removed_lines_sample": result["removed_lines_sample"],
                }
            )
            post_count += 1
            removed_line_total += result["removed_line_count"]

        categories[category] = transformed_posts

    return {
        "cleaner": "xhs_data_cleaner_v1",
        "input_schema": "{category: [{filename, cleaned, ...}]}",
        "output_schema": "{category: [{filename, source_cleaned, enhanced_cleaned, ...}]}",
        "stats": {
            "categories": len(categories),
            "posts": post_count,
            "removed_lines_total": removed_line_total,
        },
        "categories": categories,
    }


def run(input_path: Path, output_path: Path) -> None:
    with input_path.open("r", encoding="utf-8") as infile:
        data = json.load(infile)

    transformed = transform_dataset(data)

    with output_path.open("w", encoding="utf-8") as outfile:
        json.dump(transformed, outfile, ensure_ascii=False, indent=2)


def main() -> None:
    script_dir = Path(__file__).resolve().parent

    parser = argparse.ArgumentParser(description="Deterministic post-cleaner for XHS OCR output.")
    parser.add_argument("--input", default=DEFAULT_INPUT, help="Input JSON path.")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help="Output JSON path.")
    args = parser.parse_args()

    input_arg = Path(args.input)
    output_arg = Path(args.output)
    input_path = input_arg if input_arg.is_absolute() else (script_dir / input_arg).resolve()
    output_path = output_arg if output_arg.is_absolute() else (script_dir / output_arg).resolve()

    run(input_path=input_path, output_path=output_path)


if __name__ == "__main__":
    main()
