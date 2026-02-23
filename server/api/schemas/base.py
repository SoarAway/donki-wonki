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
    "409": {"model": ErrorResponse, "description": "Conflict"},
    "422": {"model": ErrorResponse, "description": "Validation error"},
    "500": {"model": ErrorResponse, "description": "Internal server error"},
}
