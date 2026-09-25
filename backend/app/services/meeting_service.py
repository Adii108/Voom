"""Meeting service — business logic for meeting operations.

This layer sits between routes and models. Route handlers call
service functions, which handle validation, data transformation,
and database operations. This separation means:

1. Routes stay thin (parse request → call service → return response)
2. Business logic is testable independently of HTTP
3. Multiple routes can reuse the same logic
"""

import random
import string
from datetime import datetime

from sqlalchemy.orm import Session

from app.config import settings
from app.database import DEFAULT_USER_ID
from app.models.meeting import Meeting, MeetingType, MeetingStatus
from app.models.participant import Participant


def generate_meeting_code() -> str:
    """Generate a human-readable meeting code like 'VOM-482-917'.

    Format: VOM-{3 digits}-{3 digits}
    - 'VOM' prefix identifies it as a Voom meeting
    - Digits are easy to read aloud and type
    - 10^6 possible combinations (1 million) — sufficient for this scale

    At larger scale, we would:
    - Check for collisions against the database
    - Use longer codes or include letters
    - Consider a counter-based approach for guaranteed uniqueness
    """
    part1 = "".join(random.choices(string.digits, k=3))
    part2 = "".join(random.choices(string.digits, k=3))
    return f"VOM-{part1}-{part2}"


def generate_meeting_link(meeting_code: str) -> str:
    """Build the shareable meeting link from a meeting code.

    Uses FRONTEND_URL from configuration so the link points to
    the correct domain in both development and production.
    """
    return f"{settings.FRONTEND_URL}/meeting/{meeting_code}"


def _ensure_unique_code(db: Session) -> str:
    """Generate a meeting code that doesn't already exist in the database.

    Retries up to 10 times. With 1M possible codes, collisions are
    extremely rare at this scale but we handle them for correctness.
    """
    for _ in range(10):
        code = generate_meeting_code()
        existing = db.query(Meeting).filter(
            Meeting.meeting_code == code
        ).first()
        if not existing:
            return code
    # Fallback: if somehow all 10 attempts collide, raise an error.
    # This is practically impossible at this scale.
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
    """Retrieve a meeting by its public meeting code.

    Returns None if not found. The caller (route handler) is
    responsible for returning an appropriate HTTP error.
    """
    return db.query(Meeting).filter(
        Meeting.meeting_code == meeting_code
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
