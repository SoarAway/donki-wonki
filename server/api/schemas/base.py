from typing import Any

from pydantic import BaseModel


class BaseResponse(BaseModel):
    status: str
    message: str

class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Any | None = None


ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    "400": {"model": ErrorResponse, "description": "Bad request"},
    "401": {"model": ErrorResponse, "description": "Unauthorized"},
    "404": {"model": ErrorResponse, "description": "Not found"},
    "409": {"model": ErrorResponse, "description": "Conflict"},
    "422": {"model": ErrorResponse, "description": "Validation error"},
    "501": {"model": ErrorResponse, "description": "Not implemented"},
    "503": {"model": ErrorResponse, "description": "Service unavailable"},
    "500": {"model": ErrorResponse, "description": "Internal server error"},
}
