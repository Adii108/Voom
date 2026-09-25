"""Pydantic schemas for meeting-related API requests and responses.

These schemas serve three purposes:
1. Request validation — FastAPI automatically validates incoming JSON
2. Response serialization — controls exactly what fields are returned
3. API documentation — Swagger UI shows these schemas automatically

Separating schemas from models means we can:
- Return different fields than what's stored in the database
- Validate input without coupling to ORM column definitions
- Version the API contract independently of the database schema
"""

from datetime import datetime

from pydantic import BaseModel, Field


# ─── Request Schemas ─────────────────────────────────────────────

class ScheduleMeetingRequest(BaseModel):
    """Request body for POST /api/meetings/schedule."""
    title: str = Field(
        ..., min_length=1, max_length=200,
        description="Meeting title",
    )
    description: str | None = Field(
        None, max_length=2000,
        description="Optional meeting description",
    )
    scheduled_at: datetime = Field(
        ..., description="When the meeting is scheduled (ISO 8601)",
    )
    duration: int = Field(
        ..., ge=5, le=480,
        description="Duration in minutes (5 min to 8 hours)",
    )


class JoinMeetingRequest(BaseModel):
    """Request body for POST /api/meetings/{meeting_code}/join."""
    display_name: str = Field(
        ..., min_length=1, max_length=100,
        description="How the participant's name appears in the meeting",
    )


# ─── Response Schemas ────────────────────────────────────────────

class ParticipantResponse(BaseModel):
    """Participant data returned in API responses."""
    id: int
    display_name: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class MeetingResponse(BaseModel):
    """Meeting data returned in API responses.

    Uses `from_attributes = True` so Pydantic can read directly
    from SQLAlchemy model instances (which use attribute access,
    not dict access).
    """
    id: int
    meeting_code: str
    title: str | None
    description: str | None
    meeting_type: str
    status: str
    scheduled_at: datetime | None
    duration: int | None
    meeting_link: str
    created_at: datetime
    participants: list[ParticipantResponse] = []

    model_config = {"from_attributes": True}


class JoinMeetingResponse(BaseModel):
    """Response for joining a meeting — includes both meeting and participant info."""
    meeting: MeetingResponse
    participant: ParticipantResponse
