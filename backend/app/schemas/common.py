"""Shared Pydantic schemas used across multiple endpoints.

These provide consistent response shapes so the frontend always
knows what structure to expect.
"""

from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Standard error response returned by all endpoints on failure.

    Using a consistent error shape means the frontend error handling
    logic can be written once in api.ts rather than per-endpoint.
    """
    detail: str


class MessageResponse(BaseModel):
    """Generic success response for operations that don't return data."""
    message: str
