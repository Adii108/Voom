"""Meeting service — business logic for meeting operations.

This layer sits between routes and models. Route handlers call
service functions, which handle validation, data transformation,
and database operations. This separation means:

1. Routes stay thin (parse request → call service → return response)
2. Business logic is testable independently of HTTP
3. Multiple routes can reuse the same logic
"""

import secrets
import string
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.database import DEFAULT_USER_ID
from app.models.meeting import Meeting, MeetingType, MeetingStatus
from app.models.participant import Participant


def generate_meeting_code() -> str:
    """Generate a collision-resistant, cryptographically secure meeting code.

    Format: vom-{3 chars}-{4 chars}-{3 chars} (e.g. 'vom-k9x-m2w7-p4q')
    Using 36 alphanumeric characters over 10 random positions yields
    36^10 = 3,656,158,440,062,976 (3.65 quadrillion) possible unique codes.
    This guarantees that every meeting gets a completely unique link that
    cannot collide or be intermixed with any other meeting.
    """
    chars = string.ascii_lowercase + string.digits
    part1 = "".join(secrets.choice(chars) for _ in range(3))
    part2 = "".join(secrets.choice(chars) for _ in range(4))
    part3 = "".join(secrets.choice(chars) for _ in range(3))
    return f"vom-{part1}-{part2}-{part3}"


def generate_meeting_link(meeting_code: str) -> str:
    """Build the shareable meeting link from a meeting code.

    Uses FRONTEND_URL from configuration or relative path.
    """
    clean_code = meeting_code.strip().lower()
    return f"{settings.FRONTEND_URL}/meeting/{clean_code}"


def _ensure_unique_code(db: Session) -> str:
    """Generate a meeting code that doesn't already exist in the database."""
    for _ in range(10):
        code = generate_meeting_code().lower()
        existing = db.query(Meeting).filter(
            func.lower(Meeting.meeting_code) == code
        ).first()
        if not existing:
            return code
    raise RuntimeError("Failed to generate unique meeting code")



def create_instant_meeting(db: Session) -> Meeting:
    """Create an instant meeting and return it.

    Flow:
    1. Generate unique meeting code
    2. Generate shareable link
    3. Create meeting record with status=WAITING, type=INSTANT
    4. Persist to database
    5. Return the meeting object
    """
    code = _ensure_unique_code(db)
    link = generate_meeting_link(code)

    meeting = Meeting(
        meeting_code=code,
        title="Instant Meeting",
        meeting_type=MeetingType.INSTANT,
        status=MeetingStatus.WAITING,
        host_id=DEFAULT_USER_ID,
        meeting_link=link,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


def create_instant_meeting_with_code(db: Session, meeting_code: str) -> Meeting:
    """Create or retrieve an instant meeting with a specified code.

    Guarantees that direct navigation or shared links work even if
    the database restarted or the meeting was initiated client-side.
    """
    clean_code = meeting_code.strip().lower()
    existing = get_meeting_by_code(db, clean_code)
    if existing:
        return existing

    link = generate_meeting_link(clean_code)
    meeting = Meeting(
        meeting_code=clean_code,
        title="Instant Meeting",
        meeting_type=MeetingType.INSTANT,
        status=MeetingStatus.WAITING,
        host_id=DEFAULT_USER_ID,
        meeting_link=link,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


def create_scheduled_meeting(
    db: Session,
    title: str,
    description: str | None,
    scheduled_at: datetime,
    duration: int,
) -> Meeting:
    """Create a scheduled meeting and return it.

    Flow:
    1. Generate unique meeting code
    2. Generate shareable link
    3. Create meeting with provided details
    4. Persist to database
    5. Return the meeting object

    Validation (e.g., scheduled_at must be in the future) is handled
    at the route/schema level, not here. The service trusts its inputs.
    """
    code = _ensure_unique_code(db)
    link = generate_meeting_link(code)

    meeting = Meeting(
        meeting_code=code,
        title=title,
        description=description,
        meeting_type=MeetingType.SCHEDULED,
        status=MeetingStatus.WAITING,
        host_id=DEFAULT_USER_ID,
        scheduled_at=scheduled_at,
        duration=duration,
        meeting_link=link,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


def get_meeting_by_code(db: Session, meeting_code: str) -> Meeting | None:
    """Retrieve a meeting by its public meeting code (case-insensitive)."""
    clean_code = meeting_code.strip().lower()
    return db.query(Meeting).filter(
        func.lower(Meeting.meeting_code) == clean_code
    ).first()



def join_meeting(
    db: Session,
    meeting_code: str,
    display_name: str,
) -> tuple[Meeting, Participant] | None:
    """Join a meeting by code.

    Flow:
    1. Look up the meeting by code
    2. If not found, return None
    3. Create a participant record
    4. Return (meeting, participant)

    Returns None if the meeting doesn't exist.
    """
    meeting = get_meeting_by_code(db, meeting_code)
    if not meeting:
        return None

    participant = Participant(
        meeting_id=meeting.id,
        display_name=display_name,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    db.refresh(meeting)
    return meeting, participant


def get_upcoming_meetings(db: Session) -> list[Meeting]:
    """Get meetings with status=WAITING (upcoming/not yet started).

    Returns meetings ordered by scheduled_at (soonest first),
    with instant meetings (no scheduled_at) at the end.
    """
    return (
        db.query(Meeting)
        .filter(Meeting.status == MeetingStatus.WAITING)
        .filter(Meeting.host_id == DEFAULT_USER_ID)
        .order_by(Meeting.scheduled_at.asc().nullslast(), Meeting.created_at.desc())
        .all()
    )


def get_recent_meetings(db: Session) -> list[Meeting]:
    """Get meetings with status=ENDED or ACTIVE (recent activity).

    Returns meetings ordered by most recently created first.
    Limited to 20 to avoid loading the entire history.
    """
    return (
        db.query(Meeting)
        .filter(Meeting.status.in_([MeetingStatus.ENDED, MeetingStatus.ACTIVE]))
        .filter(Meeting.host_id == DEFAULT_USER_ID)
        .order_by(Meeting.created_at.desc())
        .limit(20)
        .all()
    )
