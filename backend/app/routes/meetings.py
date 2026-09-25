"""Meeting routes — skeleton for Phase 04.

All meeting-related API endpoints will be defined here.
Route handlers should remain thin, delegating business logic
to the services layer.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/meetings", tags=["meetings"])

# Endpoints will be implemented in Phase 04:
# POST   /api/meetings/instant     — create instant meeting
# POST   /api/meetings/schedule     — create scheduled meeting
# GET    /api/meetings/upcoming     — list upcoming meetings
# GET    /api/meetings/recent       — list recent meetings
# GET    /api/meetings/{code}       — get meeting by code
# POST   /api/meetings/{code}/join  — join a meeting
