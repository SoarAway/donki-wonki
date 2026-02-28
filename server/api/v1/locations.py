from fastapi import APIRouter, HTTPException, Query

from api.schemas.base import ERROR_RESPONSES
from api.schemas.location import (
    AutocompleteSuggestion,
    AutocompleteResponse,
    NearestStationRequest,
    NearestStationResponse,
)
from services.google_maps_service import autocomplete_locations, resolve_nearest_station_by_place_id

router = APIRouter()


@router.get(
    "/autocomplete",
    response_model=AutocompleteResponse,
    responses=ERROR_RESPONSES,
)
def autocomplete(query: str = Query(..., min_length=2, description="Address input")) -> AutocompleteResponse:
    """Return Google autocomplete suggestions for user-typed address text."""
    try:
        suggestions = autocomplete_locations(query=query, limit=5)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return AutocompleteResponse(
        status="success",
        message="Autocomplete suggestions fetched",
        suggestions=[AutocompleteSuggestion(**item) for item in suggestions],
    )


@router.post(
    "/nearest-station",
    response_model=NearestStationResponse,
    responses=ERROR_RESPONSES,
)
def nearest_station(payload: NearestStationRequest) -> NearestStationResponse:
    """Return nearest rail stations for departure and destination place IDs."""
    try:
        departure_result = resolve_nearest_station_by_place_id(place_id=payload.departure_place_id)
        destination_result = resolve_nearest_station_by_place_id(place_id=payload.destination_place_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return NearestStationResponse(
        status="success",
        message="Nearest stations calculated",
        departure_nearest_station=departure_result["nearest_station"],
        destination_nearest_station=destination_result["nearest_station"],
        departure_station_line=departure_result.get("station_line"),
        destination_station_line=destination_result.get("station_line"),
        departure_distance_km=departure_result["distance_km"],
        destination_distance_km=destination_result["distance_km"],
        departure_user_location=departure_result["user_location"],
        destination_user_location=destination_result["user_location"],
    )
