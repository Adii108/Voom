"""Meeting model.

Represents both instant and scheduled meetings.

Design decisions:
- `meeting_code` is a human-readable, randomly generated string
  (e.g., "VOM-482-917") used for sharing. The database `id` is
  never exposed to users — this prevents information leakage
  (sequential IDs reveal how many meetings exist) and guessable URLs.

- `status` tracks the meeting lifecycle: waiting → active → ended.
  This is essential for differentiating upcoming vs recent meetings
  without relying solely on timestamps.

- `meeting_type` distinguishes instant from scheduled meetings.
  This enables different display logic on the dashboard (instant
  meetings may not have a title/description).

- `meeting_link` stores the full shareable URL. While it could be
  computed from meeting_code + frontend URL, storing it explicitly
  makes the API response self-contained and avoids coupling the
  backend to frontend URL structure.
"""

from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    String,
    Text,
    Integer,
    DateTime,
    ForeignKey,
    Enum,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MeetingType(str, PyEnum):
    """Whether a meeting was created instantly or scheduled."""
    INSTANT = "instant"
    SCHEDULED = "scheduled"


class MeetingStatus(str, PyEnum):
    """Lifecycle status of a meeting."""
    WAITING = "waiting"      # Created/scheduled, not yet started
    ACTIVE = "active"        # Currently in progress
    ENDED = "ended"          # Completed


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    meeting_code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )

    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    meeting_type: Mapped[MeetingType] = mapped_column(
        Enum(MeetingType), nullable=False, default=MeetingType.INSTANT
    )

    status: Mapped[MeetingStatus] = mapped_column(
        Enum(MeetingStatus), nullable=False, default=MeetingStatus.WAITING
    )

    host_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )

    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    duration: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="Duration in minutes"
    )

    meeting_link: Mapped[str] = mapped_column(String(500), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    # Relationships
    host: Mapped["User"] = relationship("User", back_populates="meetings")
    participants: Mapped[list["Participant"]] = relationship(
        "Participant", back_populates="meeting", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Meeting code={self.meeting_code!r} type={self.meeting_type}>"
