from typing import Any

from pydantic import BaseModel


class AlertRequest(BaseModel):
    token: str
    title: str
    body: str
    data: dict[str, str] = {}


class AlertResponse(BaseModel):
    status: str
    message: str
    fcm_response: dict[str, Any] | None = None


class PredictRequest(BaseModel):
    social_text: str
    source: str = "reddit"


class PredictResponse(BaseModel):
    is_incident: bool
    confidence: float
    details: dict[str, Any] | None = None
