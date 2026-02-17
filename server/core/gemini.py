"""Core Gemini client initialization and configuration.

This module provides the low-level interface to Google's Gemini API.
All HTTP concerns (retries, timeouts, error handling) are handled here.
"""

from typing import Any

from google import genai

from core.config import get_settings

_settings = get_settings()


class GeminiClient:
    """Wrapper for Gemini API interactions."""
    
    def __init__(self) -> None:
        """Initialize Gemini client with configuration."""
        self.model_name = _settings.GEMINI_MODEL
        self.client = genai.Client(api_key=_settings.GEMINI_API_KEY)
    
    async def generate_content(
        self, 
        prompt: str, 
        system_instruction: str | None = None
    ) -> str:
        """Generate content from Gemini.
        
        Args:
            prompt: The user prompt/text to analyze
            system_instruction: Optional system instructions for the model
            
        Returns:
            Raw response text from Gemini
            
        Raises:
            GeminiAPIError: If API call fails
        """
        # TODO: Implement actual API call
        # - Add retry logic with exponential backoff
        # - Handle rate limits (429)
        # - Handle quota exceeded
        # - Handle timeout
        raise NotImplementedError("Gemini API integration pending")
    
    async def generate_structured(
        self,
        prompt: str,
        output_schema: dict[str, Any],
        system_instruction: str | None = None
    ) -> dict[str, Any]:
        """Generate structured JSON output from Gemini.
        
        Args:
            prompt: The user prompt/text to analyze
            output_schema: JSON schema defining expected output
            system_instruction: Optional system instructions
            
        Returns:
            Parsed JSON response matching output_schema
            
        Raises:
            GeminiAPIError: If API call fails
            GeminiParseError: If response doesn't match schema
        """
        # TODO: Implement with response_mime_type='application/json'
        raise NotImplementedError("Structured output integration pending")


class GeminiAPIError(Exception):
    """Raised when Gemini API call fails."""
    pass


class GeminiParseError(Exception):
    """Raised when Gemini response cannot be parsed."""
    pass


# Singleton client instance
_gemini_client: GeminiClient | None = None


def get_gemini_client() -> GeminiClient:
    global _gemini_client

    if _gemini_client is None:
        _gemini_client = GeminiClient()
        
    return _gemini_client
