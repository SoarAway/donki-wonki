from pydantic import BaseModel, model_validator

from api.schemas.base import BaseResponse


class AutocompleteSuggestion(BaseModel):
    place_id: str
    main_text: str
    secondary_text: str | None = None
    description: str


class AutocompleteResponse(BaseResponse):
    suggestions: list[AutocompleteSuggestion]


class NearestStationRequest(BaseModel):
    destination_place_id: str | None = None
    departure_place_id: str | None = None

    # Validate that both destination_place_id and departure_place_id are provided, else raise ValueError
    @model_validator(mode="after")
    def validate_location_input(self) -> "NearestStationRequest":
        has_destination = bool(self.destination_place_id)
        has_departure = bool(self.departure_place_id)
        if not has_destination or not has_departure:
            raise ValueError("Provide both destination_place_id and departure_place_id")
        return self


class NearestStationResponse(BaseResponse):
    destination_nearest_station: str 
    departure_nearest_station: str
    station_line: str | None = None
