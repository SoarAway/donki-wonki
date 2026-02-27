import json
import math
from functools import lru_cache
from typing import Any
from urllib.parse import urlencode
from urllib.request import urlopen

from core.config import get_settings

AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance in kilometers between two coordinates."""
    earth_radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return earth_radius_km * c


@lru_cache(maxsize=1)
def _load_stations() -> list[dict[str, Any]]:
    """Load station dataset once per process for fast nearest-station lookups."""
    settings = get_settings()
    with open(settings.STATIONS_DATA_PATH, "r", encoding="utf-8") as station_file:
        stations = json.load(station_file)
    if not isinstance(stations, list):
        raise RuntimeError("Stations dataset must be a list")
    return stations


def _request_google_json(base_url: str, params: dict[str, str]) -> dict[str, Any]:
    """Make a simple GET request to Google Maps APIs and return parsed JSON."""
    query_string = urlencode(params)
    request_url = f"{base_url}?{query_string}"
    with urlopen(request_url, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


def autocomplete_locations(query: str, limit: int = 5) -> list[dict[str, Any]]:
    """Fetch address/place suggestions from Google Places Autocomplete."""
    settings = get_settings()
    if not settings.GOOGLE_MAPS_API_KEY:
        raise RuntimeError("GOOGLE_MAPS_API_KEY is not configured")

    payload = _request_google_json(
        AUTOCOMPLETE_URL,
        {
            "input": query,
            "key": settings.GOOGLE_MAPS_API_KEY,
            "components": "country:my",
            "language": "en",
        },
    )

    status = payload.get("status")
    if status not in {"OK", "ZERO_RESULTS"}:
        raise RuntimeError(f"Autocomplete request failed with status: {status}")

    suggestions: list[dict[str, Any]] = []
    for prediction in payload.get("predictions", [])[:limit]:
        structured = prediction.get("structured_formatting", {})
        suggestions.append(
            {
                "place_id": prediction.get("place_id", ""),
                "main_text": structured.get("main_text") or prediction.get("description", ""),
                "secondary_text": structured.get("secondary_text"),
                "description": prediction.get("description", ""),
            }
        )
    return suggestions


def geocode_place_id(place_id: str) -> tuple[float, float]:
    """Resolve a Google place_id to latitude/longitude."""
    settings = get_settings()
    if not settings.GOOGLE_MAPS_API_KEY:
        raise RuntimeError("GOOGLE_MAPS_API_KEY is not configured")

    payload = _request_google_json(
        GEOCODE_URL,
        {
            "place_id": place_id,
            "key": settings.GOOGLE_MAPS_API_KEY,
        },
    )
    status = payload.get("status")
    if status != "OK":
        raise RuntimeError(f"Geocode request failed with status: {status}")

    result = payload["results"][0]
    location = result["geometry"]["location"]
    return float(location["lat"]), float(location["lng"])


def find_nearest_station(latitude: float, longitude: float) -> dict[str, Any]:
    """Compute nearest station from local stations dataset using haversine distance."""
    stations = _load_stations()
    if not stations:
        raise RuntimeError("Stations dataset is empty")

    best_station: dict[str, Any] | None = None
    best_distance = float("inf")
    for station in stations:
        station_lat = float(station["latitude"])
        station_lng = float(station["longitude"])
        distance = _haversine_km(latitude, longitude, station_lat, station_lng)
        if distance < best_distance:
            best_distance = distance
            best_station = station

    if best_station is None:
        raise RuntimeError("Unable to compute nearest station")

    return {
        "nearest_station": best_station.get("name", "Unknown"),
        "station_line": best_station.get("line"),
        "distance_km": round(best_distance, 3),
        "user_location": {
            "latitude": latitude,
            "longitude": longitude,
        },
    }


def resolve_nearest_station(
    place_id: str | None,
    latitude: float | None,
    longitude: float | None,
) -> dict[str, Any]:
    """Resolve location input (place_id or lat/lng) and return nearest station payload."""
    if place_id:
        latitude, longitude = geocode_place_id(place_id)

    if latitude is None or longitude is None:
        raise ValueError("Missing coordinates for nearest station lookup")

    return find_nearest_station(latitude=latitude, longitude=longitude)


def resolve_nearest_station_by_place_id(place_id: str) -> dict[str, Any]:
    """Resolve nearest station from a required Google place_id."""
    if not place_id:
        raise ValueError("place_id is required for nearest station lookup")
    latitude, longitude = geocode_place_id(place_id)
    return find_nearest_station(latitude=latitude, longitude=longitude)
