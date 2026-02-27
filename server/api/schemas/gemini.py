from pydantic import BaseModel, Field
from typing import Literal


class IncidentExtractionRequest(BaseModel):
    """Request to extract incident information from social media text."""
    
    text: str = Field(
        ...,
        description="Raw social media text to analyze",
        examples=["KJ Line stuck at Bangsar station again"]
    )
    source: Literal["reddit", "twitter", "user_report"] = Field(
        default="reddit",
        description="Source platform of the text"
    )


class IncidentDetails(BaseModel):
    """Extracted incident details from Gemini."""
    
    line: str | None = Field(
        None,
        description="Rail line code (e.g., 'KJ', 'AG', 'SBK')"
    )
    station: str | None = Field(
        None,
        description="Station name where incident occurred"
    )
    incident_type: Literal[
        "delay",
        "breakdown", 
        "overcrowding",
        "signal_fault",
        "maintenance",
        "other",
        "none"
    ] = Field(
        default="none",
        description="Type of incident detected"
    )
    severity: Literal["low", "medium", "high", "critical"] = Field(
        default="low",
        description="Severity level of the incident"
    )
    description: str | None = Field(
        None,
        description="Brief description of what happened"
    )
    estimated_duration_minutes: int | None = Field(
        None,
        description="Estimated incident duration if mentioned"
    )
    confidence_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence score from 0.0 to 1.0"
    )


class IncidentExtractionResponse(BaseModel):
    """Response containing extracted incident information."""
    
    is_incident: bool = Field(
        ...,
        description="Whether the text contains a real incident"
    )
    incident: IncidentDetails | None = Field(
        None,
        description="Incident details if is_incident is True"
    )
    raw_explanation: str | None = Field(
        None,
        description="Explanation from Gemini for debugging"
    )


class BatchIncidentExtractionRequest(BaseModel):
    """Request to extract incidents from multiple texts."""
    
    texts: list[IncidentExtractionRequest] = Field(
        ...,
        min_length=1,
        max_length=10,
        description="List of texts to analyze (max 10 for rate limiting)"
    )


class BatchIncidentExtractionResponse(BaseModel):
    """Response containing extractions for multiple texts."""
    
    results: list[IncidentExtractionResponse] = Field(
        ...,
        description="Extraction results in same order as input"
    )
    processed_count: int = Field(
        ...,
        description="Number of texts successfully processed"
    )
    failed_count: int = Field(
        ...,
        description="Number of texts that failed processing"
    )
