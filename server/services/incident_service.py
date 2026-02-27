"""Incident service - Orchestrates incident detection and processing.

This service coordinates between:
- GeminiService (LLM extraction)
- Firestore (persistence)
- AlertService (notifications)

NO FastAPI imports here - HTTP-agnostic business logic.
"""

from typing import Any

from services.gemini_service import get_gemini_service, GeminiService
from services.alert_service import send_alert_to_device
from api.schemas.gemini import (
    IncidentExtractionRequest,
    IncidentExtractionResponse,
    IncidentDetails,
)


class IncidentService:
    """Service for incident processing workflow.
    
    Responsibilities:
    - Process social media text → Extract incident
    - Validate extracted incidents
    - Persist to Firestore (if real incident)
    - Trigger alerts to affected users
    - Track processing metrics
    """
    
    def __init__(self, gemini_service: GeminiService | None = None) -> None:
        """Initialize with dependencies.
        
        Args:
            gemini_service: GeminiService for extraction. Uses singleton if None.
        """
        self.gemini_service = gemini_service or get_gemini_service()
    
    async def process_social_media_post(
        self,
        text: str,
        source: str,
        metadata: dict[str, Any] | None = None
    ) -> IncidentExtractionResponse:
        """Process a social media post for incidents.
        
        Full workflow:
        1. Extract incident using Gemini
        2. Validate confidence threshold
        3. Check for duplicates (same line/station/time window)
        4. Save to Firestore (if valid)
        5. Notify affected users (if high severity)
        
        Args:
            text: Raw post text
            source: Platform (reddit, twitter, etc.)
            metadata: Optional metadata (author, timestamp, url)
            
        Returns:
            Extraction result
        """
        # TODO: Implement full processing workflow
        # 1. Create IncidentExtractionRequest
        # 2. Call gemini_service.extract_incident()
        # 3. If is_incident and confidence > threshold:
        #    - Check for duplicates in Firestore
        #    - Save incident to Firestore with metadata
        #    - Find affected users (route matching)
        #    - Send FCM alerts if severity >= medium
        # 4. Return result
        
        raise NotImplementedError("Process workflow pending")
    
    async def validate_incident(
        self, 
        incident: IncidentDetails,
        min_confidence: float = 0.7
    ) -> bool:
        """Validate if extracted incident should be persisted.
        
        Validation rules:
        - Confidence score >= threshold
        - Line code is valid (KJ, AG, SBK, etc.)
        - Station name exists in database
        - Not a duplicate (check Firestore)
        
        Args:
            incident: Extracted incident details
            min_confidence: Minimum confidence threshold (0.0-1.0)
            
        Returns:
            True if incident should be saved
        """
        # TODO: Implement validation logic
        # 1. Check confidence >= min_confidence
        # 2. Validate line code against known lines
        # 3. Validate station name
        # 4. Check Firestore for duplicates (line + station + time window)
        
        raise NotImplementedError("Validation logic pending")
    
    async def save_incident(
        self, 
        incident: IncidentDetails,
        source_text: str,
        metadata: dict[str, Any]
    ) -> str | None:
        """Save validated incident to Firestore.
        
        Args:
            incident: Validated incident details
            source_text: Original text for reference
            metadata: Source metadata (author, url, timestamp)
            
        Returns:
            Document ID if saved, None if failed
        """
        # TODO: Implement persistence
        # 1. Import firestore client from core.firebase
        # 2. Create incident document
        # 3. Add metadata and timestamps
        # 4. Return document ID
        
        raise NotImplementedError("Persistence logic pending")
    
    async def notify_affected_users(
        self, 
        incident: IncidentDetails
    ) -> int:
        """Send alerts to users affected by incident.
        
        Args:
            incident: Incident to notify about
            
        Returns:
            Number of notifications sent
        """
        # TODO: Implement notification logic
        # 1. Query Firestore for users with matching routes
        # 2. Filter by time window (active commute times)
        # 3. Send FCM via alert_service.send_alert_to_device()
        # 4. Track notification metrics
        # 5. Return count
        
        raise NotImplementedError("Notification logic pending")


# Service singleton
_incident_service: IncidentService | None = None


def get_incident_service() -> IncidentService:
    """Get or create Incident service singleton."""
    global _incident_service
    if _incident_service is None:
        _incident_service = IncidentService()
    return _incident_service
