"""Health check router.

Separated from main.py to follow the pattern of one router per
resource/concern. This keeps main.py focused on app configuration
and middleware setup.
"""

from fastapi import APIRouter

from app.config import settings

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health_check():
    """Health check endpoint for monitoring and deployment verification."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }
