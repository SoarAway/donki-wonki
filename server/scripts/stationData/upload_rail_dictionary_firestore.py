import json
import sys
from pathlib import Path


SERVER_ROOT = Path(__file__).resolve().parents[2]
if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))

from core.firebase import get_firestore_client, initialize_firebase  # noqa: E402


INPUT_PATH = Path(__file__).resolve().parent / "malaysia_rail_lines_stations.json"


def main() -> None:
    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"Dictionary JSON not found: {INPUT_PATH}")

    with INPUT_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)

    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        raise RuntimeError("Firestore client not available. Check Firebase credentials.")

    # Meta summary
    db.collection("rail_reference").document("meta").set(
        {
            "generated_at": data.get("generated_at"),
            "summary": data.get("summary", {}),
            "sources": data.get("sources", []),
            "source_notes": data.get("source_notes", []),
        }
    )

    # One doc per line
    lines = data.get("lines", {})
    for line_key, line_data in lines.items():
        db.collection("rail_lines").document(line_key).set(line_data)

    # One doc per station (reverse index)
    stations_index = data.get("stations_index", {})
    stations_geo = data.get("stations_geo", {})
    for station_name, line_keys in stations_index.items():
        station_doc_id = "".join(ch.lower() if ch.isalnum() else "_" for ch in station_name).strip("_")
        if not station_doc_id:
            continue
        geo = stations_geo.get(station_name, {})
        db.collection("rail_stations").document(station_doc_id).set(
            {
                "station_name": station_name,
                "line_keys": line_keys,
                "line_count": len(line_keys),
                "stop_lat": geo.get("stop_lat"),
                "stop_lon": geo.get("stop_lon"),
                "stop_ids": geo.get("stop_ids", []),
            }
        )

    print(f"Uploaded lines: {len(lines)}")
    print(f"Uploaded stations: {len(stations_index)}")


if __name__ == "__main__":
    main()
