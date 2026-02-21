import csv
import io
import json
import statistics
import urllib.request
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple


OUTPUT_PATH = Path(__file__).resolve().parent / "malaysia_rail_lines_stations.json"

SOURCES = [
    {
        "agency": "ktmb",
        "operator": "Keretapi Tanah Melayu (KTMB)",
        "url": "https://api.data.gov.my/gtfs-static/ktmb",
    },
    {
        "agency": "prasarana_rapid_rail_kl",
        "operator": "Prasarana Rapid Rail KL",
        "url": "https://api.data.gov.my/gtfs-static/prasarana?category=rapid-rail-kl",
    },
]


def read_csv_from_zip(zf: zipfile.ZipFile, filename: str) -> List[dict]:
    with zf.open(filename) as f:
        text = io.TextIOWrapper(f, encoding="utf-8-sig")
        return list(csv.DictReader(text))


def slug(value: str) -> str:
    safe = "".join(ch.lower() if ch.isalnum() else "_" for ch in value)
    while "__" in safe:
        safe = safe.replace("__", "_")
    return safe.strip("_") or "unknown"


def parse_float(value: str):
    try:
        return float(value)
    except Exception:
        return None


def build_line_stations(routes: List[dict], trips: List[dict], stop_times: List[dict], stops: List[dict]) -> Dict[str, dict]:
    stop_info_by_id = {
        row.get("stop_id", ""): {
            "stop_name": row.get("stop_name", "").strip(),
            "stop_lat": parse_float(row.get("stop_lat", "")),
            "stop_lon": parse_float(row.get("stop_lon", "")),
        }
        for row in stops
    }

    trips_by_route: Dict[str, List[str]] = defaultdict(list)
    for trip in trips:
        route_id = trip.get("route_id", "")
        trip_id = trip.get("trip_id", "")
        if route_id and trip_id:
            trips_by_route[route_id].append(trip_id)

    route_stop_positions: Dict[str, Dict[str, List[int]]] = defaultdict(lambda: defaultdict(list))
    trip_to_route = {}
    for route_id, trip_ids in trips_by_route.items():
        for trip_id in trip_ids:
            trip_to_route[trip_id] = route_id

    for row in stop_times:
        trip_id = row.get("trip_id", "")
        stop_id = row.get("stop_id", "")
        seq_raw = row.get("stop_sequence", "")
        if not trip_id or not stop_id or not seq_raw:
            continue
        route_id = trip_to_route.get(trip_id)
        if not route_id:
            continue
        try:
            seq = int(seq_raw)
        except ValueError:
            continue
        route_stop_positions[route_id][stop_id].append(seq)

    route_rows = {route.get("route_id", ""): route for route in routes}
    result = {}

    for route_id, stop_seq_map in route_stop_positions.items():
        route_row = route_rows.get(route_id, {})
        route_short_name = (route_row.get("route_short_name") or "").strip()
        route_long_name = (route_row.get("route_long_name") or "").strip()
        route_desc = (route_row.get("route_desc") or "").strip()

        line_name = route_long_name or route_short_name or route_desc or f"Route {route_id}"

        sortable: List[Tuple[float, str, str, float, float]] = []
        for stop_id, seq_list in stop_seq_map.items():
            if not seq_list:
                continue
            median_seq = statistics.median(seq_list)
            info = stop_info_by_id.get(stop_id, {})
            stop_name = (info.get("stop_name") or "").strip() or stop_id
            stop_lat = info.get("stop_lat")
            stop_lon = info.get("stop_lon")
            sortable.append((median_seq, stop_name, stop_id, stop_lat, stop_lon))

        sortable.sort(key=lambda x: (x[0], x[1]))

        stations: List[str] = []
        stations_detail: List[dict] = []
        seen = set()
        for median_seq, stop_name, stop_id, stop_lat, stop_lon in sortable:
            key = stop_name.casefold()
            if key in seen:
                continue
            seen.add(key)
            stations.append(stop_name)
            stations_detail.append(
                {
                    "station_name": stop_name,
                    "stop_id": stop_id,
                    "stop_lat": stop_lat,
                    "stop_lon": stop_lon,
                    "median_sequence": median_seq,
                }
            )

        result[route_id] = {
            "route_id": route_id,
            "route_short_name": route_short_name,
            "route_long_name": route_long_name,
            "route_desc": route_desc,
            "line_name": line_name,
            "stations": stations,
            "stations_detail": stations_detail,
            "station_count": len(stations),
        }

    return result


def main() -> None:
    lines = {}
    stations_index: Dict[str, List[str]] = defaultdict(list)
    stations_geo: Dict[str, dict] = {}

    for source in SOURCES:
        print(f"Downloading GTFS: {source['agency']}")
        with urllib.request.urlopen(source["url"], timeout=60) as response:
            payload = response.read()

        with zipfile.ZipFile(io.BytesIO(payload)) as zf:
            routes = read_csv_from_zip(zf, "routes.txt")
            trips = read_csv_from_zip(zf, "trips.txt")
            stop_times = read_csv_from_zip(zf, "stop_times.txt")
            stops = read_csv_from_zip(zf, "stops.txt")

        route_map = build_line_stations(routes, trips, stop_times, stops)

        for route_id, item in route_map.items():
            line_key = slug(f"{source['agency']}_{route_id}_{item['line_name']}")
            record = {
                "line_key": line_key,
                "agency": source["agency"],
                "operator": source["operator"],
                **item,
            }
            lines[line_key] = record

            for station_detail in item.get("stations_detail", []):
                station = station_detail["station_name"]
                if line_key not in stations_index[station]:
                    stations_index[station].append(line_key)

                existing = stations_geo.get(station)
                if not existing:
                    stations_geo[station] = {
                        "station_name": station,
                        "stop_lat": station_detail.get("stop_lat"),
                        "stop_lon": station_detail.get("stop_lon"),
                        "stop_ids": [station_detail.get("stop_id")],
                    }
                else:
                    stop_id = station_detail.get("stop_id")
                    if stop_id and stop_id not in existing["stop_ids"]:
                        existing["stop_ids"].append(stop_id)
                    if existing.get("stop_lat") is None and station_detail.get("stop_lat") is not None:
                        existing["stop_lat"] = station_detail.get("stop_lat")
                    if existing.get("stop_lon") is None and station_detail.get("stop_lon") is not None:
                        existing["stop_lon"] = station_detail.get("stop_lon")

    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_notes": [
            "Built from Malaysia official GTFS Static API (api.data.gov.my)",
            "Feeds used: ktmb + prasarana rapid-rail-kl",
        ],
        "sources": SOURCES,
        "summary": {
            "line_count": len(lines),
            "station_unique_count": len(stations_index),
            "station_with_coords_count": sum(
                1 for _, s in stations_geo.items() if s.get("stop_lat") is not None and s.get("stop_lon") is not None
            ),
        },
        "lines": lines,
        "stations_index": dict(sorted(stations_index.items(), key=lambda kv: kv[0].casefold())),
        "stations_geo": dict(sorted(stations_geo.items(), key=lambda kv: kv[0].casefold())),
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Saved dictionary: {OUTPUT_PATH}")
    print(output["summary"])


if __name__ == "__main__":
    main()
