"""Core Gemini client initialization and configuration.

This module provides the low-level interface to Google's Gemini API.
All HTTP concerns (retries, timeouts, error handling) are handled here.
"""

from typing import Any
import json
from google import genai
from google.genai import types

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
        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.1,
            )
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            return response.text
        except Exception as e:
            raise GeminiAPIError(f"Gemini API call failed: {str(e)}")

    async def generate_structured(
        self,
        prompt: str,
        output_schema: Any,
        system_instruction: str | None = None
    ) -> dict[str, Any]:
        """Generate structured JSON output from Gemini.
        
        Args:
            prompt: The user prompt/text to analyze
            output_schema: Output schema (can be a Pydantic model or dict)
            system_instruction: Optional system instructions
            
        Returns:
            Parsed JSON response matching output_schema
            
        Raises:
            GeminiAPIError: If API call fails
            GeminiParseError: If response cannot be parsed
        """
        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=output_schema,
                temperature=0.1,
            )
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            
            if not response.text:
                raise GeminiParseError("Empty response from Gemini")
                
            return json.loads(response.text)
        except json.JSONDecodeError as e:
            raise GeminiParseError(f"Failed to parse Gemini JSON response: {str(e)}")
        except Exception as e:
            raise GeminiAPIError(f"Gemini structured generation failed: {str(e)}")


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
