from fastapi import APIRouter, HTTPException, Query

from api.schemas.base import ERROR_RESPONSES
from api.schemas.location import (
    AutocompleteSuggestion,
    AutocompleteResponse,
    NearestStationRequest,
    NearestStationResponse,
)
from services.google_maps_service import autocomplete_locations, resolve_nearest_station

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
    """Return nearest rail station from either place_id or direct coordinates."""
    try:
        result = resolve_nearest_station(
            place_id=payload.place_id,
            latitude=payload.latitude,
            longitude=payload.longitude,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return NearestStationResponse(
        status="success",
        message="Nearest station calculated",
        nearest_station=result["nearest_station"],
        station_line=result.get("station_line"),
        distance_km=result["distance_km"],
        user_location=result["user_location"],
    )
