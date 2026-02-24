from pydantic import BaseModel, Field, model_validator

from api.schemas.base import BaseResponse


class AutocompleteSuggestion(BaseModel):
    place_id: str
    main_text: str
    secondary_text: str | None = None
    description: str


class AutocompleteResponse(BaseResponse):
    suggestions: list[AutocompleteSuggestion]


class NearestStationRequest(BaseModel):
    place_id: str | None = None
    latitude: float | None = None
    longitude: float | None = None

    @model_validator(mode="after")
    def validate_location_input(self) -> "NearestStationRequest":
        # Require one of: Google place_id or explicit latitude/longitude.
        has_place_id = bool(self.place_id)
        has_coordinates = self.latitude is not None and self.longitude is not None
        if not has_place_id and not has_coordinates:
            raise ValueError("Provide either place_id or latitude and longitude")
        return self


class UserLocation(BaseModel):
    latitude: float
    longitude: float


class NearestStationResponse(BaseResponse):
    nearest_station: str
    station_line: str | None = None
    distance_km: float = Field(..., ge=0)
    user_location: UserLocation
