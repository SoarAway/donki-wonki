# server/scripts/test_google_maps_service_all_functions.py
import os
import sys
import traceback

# Make script runnable from either repo root or server root.
SERVER_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SERVER_ROOT not in sys.path:
    sys.path.insert(0, SERVER_ROOT)
os.chdir(SERVER_ROOT)

from core.config import get_settings
from services import google_maps_service as gms

results = []


def check(name, fn):
    try:
        out = fn()
        results.append((name, True, out))
    except Exception as e:
        results.append((name, False, f"{type(e).__name__}: {e}\n{traceback.format_exc(limit=1).strip()}"))


settings = get_settings()
api_key_set = bool(settings.GOOGLE_MAPS_API_KEY)

# 1) _haversine_km
check("_haversine_km", lambda: round(gms._haversine_km(3.139, 101.687, 3.139, 101.687), 9))

# 2) _load_stations
check("_load_stations", lambda: f"count={len(gms._load_stations())}")

# 3) _request_google_json (live)
def test_request_google_json():
    if not api_key_set:
        raise RuntimeError("GOOGLE_MAPS_API_KEY missing")
    payload = gms._request_google_json(
        gms.GEOCODE_URL,
        {"address": "KL Sentral, Kuala Lumpur", "key": settings.GOOGLE_MAPS_API_KEY},
    )
    return f"status={payload.get('status')} results={len(payload.get('results', []))}"


check("_request_google_json", test_request_google_json)

# 4) autocomplete_locations (live)
def test_autocomplete():
    suggestions = gms.autocomplete_locations("KL Sentral", limit=5)
    if not isinstance(suggestions, list):
        raise AssertionError("suggestions not list")
    first = suggestions[0].get("place_id") if suggestions else None
    return f"count={len(suggestions)} first_place_id={first}"


check("autocomplete_locations", test_autocomplete)

# Use first place_id for downstream live tests
place_id = None
try:
    s = gms.autocomplete_locations("KL Sentral", limit=1)
    if s:
        place_id = s[0].get("place_id")
except Exception:
    pass

# 5) geocode_place_id (live)
def test_geocode_place_id():
    if not place_id:
        raise RuntimeError("No place_id available from autocomplete")
    lat, lng = gms.geocode_place_id(place_id)
    return f"lat={lat:.6f} lng={lng:.6f}"


check("geocode_place_id", test_geocode_place_id)

# 6) find_nearest_station
def test_find_nearest_station():
    lat, lng = (3.1341631, 101.6860377)
    nearest = gms.find_nearest_station(lat, lng)
    return f"station={nearest.get('nearest_station')} distance_km={nearest.get('distance_km')}"


check("find_nearest_station", test_find_nearest_station)

# 7) resolve_nearest_station (coords path)
def test_resolve_coords():
    nearest = gms.resolve_nearest_station(place_id=None, latitude=3.1390, longitude=101.6869)
    return f"station={nearest.get('nearest_station')} distance_km={nearest.get('distance_km')}"


check("resolve_nearest_station(coords)", test_resolve_coords)

# 8) resolve_nearest_station (place_id path)
def test_resolve_place_id():
    if not place_id:
        raise RuntimeError("No place_id available from autocomplete")
    nearest = gms.resolve_nearest_station(place_id=place_id, latitude=None, longitude=None)
    return f"station={nearest.get('nearest_station')} distance_km={nearest.get('distance_km')}"


check("resolve_nearest_station(place_id)", test_resolve_place_id)

print("=== google_maps_service function test results ===")
passed = 0
for name, ok, detail in results:
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {name} -> {detail}")
    if ok:
        passed += 1

print(f"\nSummary: {passed}/{len(results)} passed")
