# """Incident extraction endpoints.

# Exposes Gemini-powered incident extraction to HTTP clients.
# """

# from fastapi import APIRouter, HTTPException

# from core.config import get_settings
# from api.schemas.gemini import (
#     IncidentExtractionRequest,
#     IncidentExtractionResponse,
#     BatchIncidentExtractionRequest,
#     BatchIncidentExtractionResponse,
# )
# from services.gemini_service import get_gemini_service
# from services.incident_service import get_incident_service

# router = APIRouter()
# settings = get_settings()


# @router.post("/extract", response_model=IncidentExtractionResponse)
# async def extract_incident(request: IncidentExtractionRequest) -> IncidentExtractionResponse:
#     """Extract incident information from social media text.
    
#     Takes raw text and returns structured incident details if detected.
    
#     Example:
#         POST /api/v1/incidents/extract
#         {
#             "text": "KJ Line stuck at Bangsar station again",
#             "source": "twitter"
#         }
        
#         Response:
#         {
#             "is_incident": true,
#             "incident": {
#                 "line": "KJ",
#                 "station": "Bangsar",
#                 "incident_type": "delay",
#                 "severity": "medium",
#                 "confidence_score": 0.92
#             }
#         }
#     """
#     try:
#         if not settings.GEMINI_API_KEY:
#             raise HTTPException(status_code=503, detail="Gemini API is not configured")
#         service = get_gemini_service()
#         result = await service.extract_incident(request)
#         return result
#     except HTTPException:
#         raise
#     except NotImplementedError as exc:
#         raise HTTPException(status_code=501, detail=str(exc))
#     except Exception as exc:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to extract incident: {str(exc)}"
#         )


# @router.post("/extract/batch", response_model=BatchIncidentExtractionResponse)
# async def extract_incidents_batch(
#     request: BatchIncidentExtractionRequest
# ) -> BatchIncidentExtractionResponse:
#     """Extract incidents from multiple texts in a single request.
    
#     Limited to 10 texts per request for rate limiting.
#     """
#     try:
#         # check for gemini api key available in settings
#         if not settings.GEMINI_API_KEY:
#             raise HTTPException(status_code=503, detail="Gemini API is not configured")

#         service = get_gemini_service()
#         result = await service.extract_incidents_batch(request)
#         return result
        
#     except HTTPException:
#         raise
#     except NotImplementedError as exc:
#         raise HTTPException(status_code=501, detail=str(exc))
#     except Exception as exc:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to process batch: {str(exc)}"
#         )


# @router.post("/process")
# async def process_social_media_post(
#     text: str,
#     source: str = "reddit",
#     save: bool = True
# ) -> IncidentExtractionResponse:
#     """Full processing pipeline: extract, validate, optionally save.
    
#     This endpoint runs the complete workflow:
#     1. Extract incident using Gemini
#     2. Validate confidence and duplicates
#     3. Save to Firestore (if save=True and valid)
#     4. Trigger notifications for affected users
    
#     Args:
#         text: Raw social media text
#         source: Source platform (reddit, twitter, user_report)
#         save: Whether to persist valid incidents
        
#     Returns:
#         Extraction result with processing status
#     """
#     try:
#         if not settings.GEMINI_API_KEY:
#             raise HTTPException(status_code=503, detail="Gemini API is not configured")
#         service = get_incident_service()
#         result = await service.process_social_media_post(
#             text=text,
#             source=source,
#             # TODO: Add metadata parameter if needed
#         )
#         return result
#     except HTTPException:
#         raise
#     except NotImplementedError as exc:
#         raise HTTPException(status_code=501, detail=str(exc))
#     except Exception as exc:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to process post: {str(exc)}"
#         )
