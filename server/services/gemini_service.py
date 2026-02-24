from typing import Any

from core.gemini import get_gemini_client, GeminiClient
from api.schemas.gemini import (
    IncidentExtractionRequest,
    IncidentExtractionResponse,
    IncidentDetails,
    BatchIncidentExtractionRequest,
    BatchIncidentExtractionResponse,
)


class GeminiService:
    """Service for Gemini LLM operations.
    
    This class handles:
    - Prompt construction
    - API communication via GeminiClient
    - Response validation and parsing
    - Error handling and fallbacks
    """
    
    def __init__(self, client: GeminiClient | None = None) -> None:
        """Initialize service with Gemini client.
        
        Args:
            client: GeminiClient instance. If None, uses singleton.
        """
        self.client = client or get_gemini_client()
    
    async def extract_incident(
        self, 
        request: IncidentExtractionRequest
    ) -> IncidentExtractionResponse:
        """Extract incident information from social media text.
        
        Args:
            request: Contains text and source metadata
            
        Returns:
            Structured incident extraction result
            
        Raises:
            GeminiAPIError: If Gemini API fails
            GeminiParseError: If response cannot be parsed
        """
        # TODO: Implement incident extraction
        # 1. Build prompt with examples and instructions
        # 2. Define output schema for structured response
        # 3. Call GeminiClient.generate_structured()
        # 4. Validate response against IncidentDetails
        # 5. Return IncidentExtractionResponse
        
        raise NotImplementedError("Incident extraction logic pending")
    
    async def extract_incidents_batch(
        self,
        request: BatchIncidentExtractionRequest
    ) -> BatchIncidentExtractionResponse:
        """Extract incidents from multiple texts.
        
        Args:
            request: Contains list of texts to analyze
            
        Returns:
            Batch extraction results
            
        Note:
            Processes sequentially to respect rate limits.
            Consider asyncio.gather() with semaphore for parallel.
        """
        # TODO: Implement batch processing
        # 1. Validate batch size (respect rate limits)
        # 2. Process each text with extract_incident()
        # 3. Handle partial failures gracefully
        # 4. Return aggregated results
        
        raise NotImplementedError("Batch extraction logic pending")
    
    def _build_extraction_prompt(self, text: str, source: str) -> str:
        """Build prompt for incident extraction.
        
        Args:
            text: Raw social media text
            source: Platform source (reddit, twitter, etc.)
            
        Returns:
            Formatted prompt for Gemini
        """
        # TODO: Build comprehensive prompt with:
        # - System instructions
        # - Few-shot examples
        # - Output format specification
        # - Constraints and edge cases
        
        raise NotImplementedError("Prompt building logic pending")
    
    def _parse_incident_response(self, raw_response: dict[str, Any]) -> IncidentDetails:
        """Parse and validate Gemini response.
        
        Args:
            raw_response: Raw JSON from Gemini
            
        Returns:
            Validated IncidentDetails
            
        Raises:
            GeminiParseError: If response is invalid
        """
        # TODO: Implement parsing logic
        # 1. Validate required fields
        # 2. Normalize line codes (e.g., 'Kelana Jaya' → 'KJ')
        # 3. Validate station names against known list
        # 4. Calculate confidence score
        
        raise NotImplementedError("Response parsing logic pending")


# Service singleton
_gemini_service: GeminiService | None = None


def get_gemini_service() -> GeminiService:
    """Get or create Gemini service singleton."""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
