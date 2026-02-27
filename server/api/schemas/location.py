from pydantic import BaseModel, Field

from api.schemas.base import BaseResponse


class AutocompleteSuggestion(BaseModel):
    place_id: str
    main_text: str
    secondary_text: str | None = None
    description: str


class AutocompleteResponse(BaseResponse):
    suggestions: list[AutocompleteSuggestion]


class NearestStationRequest(BaseModel):
    departure_place_id: str
    destination_place_id: str


class UserLocation(BaseModel):
    latitude: float
    longitude: float


class NearestStationResponse(BaseResponse):
    departure_nearest_station: str
    destination_nearest_station: str
    departure_station_line: str | None = None
    destination_station_line: str | None = None
    departure_distance_km: float = Field(..., ge=0)
    destination_distance_km: float = Field(..., ge=0)
    departure_user_location: UserLocation
    destination_user_location: UserLocation
