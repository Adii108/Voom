"""Meeting routes — API endpoints for meeting management.

Each route handler follows the pattern:
1. Parse/validate request (handled by FastAPI + Pydantic)
2. Call the appropriate service function
3. Return the response

Route handlers should NOT contain business logic.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.meeting import (
    MeetingResponse,
    ScheduleMeetingRequest,
    JoinMeetingRequest,
    JoinMeetingResponse,
)
from app.services import meeting_service

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


@router.post(
    "/instant",
    response_model=MeetingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an instant meeting",
)
def create_instant_meeting(db: Session = Depends(get_db)):
    """Create a new instant meeting with a unique code and shareable link.

    This is the backend operation triggered by the "New Meeting" button.
    Returns the created meeting with its code and link.
    """
    meeting = meeting_service.create_instant_meeting(db)
    return meeting


@router.post(
    "/schedule",
    response_model=MeetingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule a meeting",
)
def schedule_meeting(
    request: ScheduleMeetingRequest,
    db: Session = Depends(get_db),
):
    """Create a scheduled meeting with title, description, date/time, and duration.

    Pydantic validates:
    - title: 1-200 chars, required
    - description: optional, max 2000 chars
    - scheduled_at: valid datetime, required
    - duration: 5-480 minutes, required
    """
    meeting = meeting_service.create_scheduled_meeting(
        db=db,
        title=request.title,
        description=request.description,
        scheduled_at=request.scheduled_at,
        duration=request.duration,
    )
    return meeting


@router.get(
    "/upcoming",
    response_model=list[MeetingResponse],
    summary="List upcoming meetings",
)
def list_upcoming_meetings(db: Session = Depends(get_db)):
    """Get all meetings with status 'waiting' (not yet started).

    Used by the dashboard's "Upcoming Meetings" section.
    Ordered by scheduled time (soonest first).
    """
    return meeting_service.get_upcoming_meetings(db)


@router.get(
    "/recent",
    response_model=list[MeetingResponse],
    summary="List recent meetings",
)
def list_recent_meetings(db: Session = Depends(get_db)):
    """Get recently active or ended meetings.

    Used by the dashboard's "Recent Meetings" section.
    Limited to 20 most recent.
    """
    return meeting_service.get_recent_meetings(db)


@router.get(
    "/{meeting_code}",
    response_model=MeetingResponse,
    summary="Get meeting by code",
)
def get_meeting(meeting_code: str, db: Session = Depends(get_db)):
    """Retrieve meeting details by its public meeting code.

    Returns 404 if the meeting code doesn't exist.
    This endpoint is used when:
    - Loading the meeting room page
    - Validating a meeting code before joining
    """
    meeting = meeting_service.get_meeting_by_code(db, meeting_code)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting '{meeting_code}' not found",
        )
    return meeting


@router.post(
    "/{meeting_code}/join",
    response_model=JoinMeetingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Join a meeting",
)
def join_meeting(
    meeting_code: str,
    request: JoinMeetingRequest,
    db: Session = Depends(get_db),
):
    """Join a meeting by code with a display name.

    Flow:
    1. Validate meeting exists (404 if not)
    2. Create participant record
    3. Return meeting details + participant info

    The display_name is validated by Pydantic (1-100 chars).
    """
    result = meeting_service.join_meeting(
        db=db,
        meeting_code=meeting_code,
        display_name=request.display_name,
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting '{meeting_code}' not found",
        )
    meeting, participant = result
    return JoinMeetingResponse(
        meeting=MeetingResponse.model_validate(meeting),
        participant=participant,
    )
