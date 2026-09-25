"""Participant model.

Represents someone who has joined a specific meeting session.

Design decisions:
- Participants are separate from Users because:
  1. Guests can join with just a display name (no account needed)
  2. A participant is a session-level concept (one meeting),
     while a user is an account-level concept (permanent)
  3. The same user could join the same meeting multiple times
     (rejoining after disconnect) — each join is a new participant record

- `user_id` is nullable: if a registered user joins, we link them;
  if a guest joins, this is NULL. This supports both authenticated
  and anonymous participants without separate tables.

- `display_name` is always required regardless of whether the
  participant is a registered user, because users should be able
  to choose how they appear in each meeting.
"""

from datetime import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id"), nullable=False
    )

    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )

    display_name: Mapped[str] = mapped_column(String(100), nullable=False)

    joined_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    # Relationships
    meeting: Mapped["Meeting"] = relationship(
        "Meeting", back_populates="participants"
    )

    def __repr__(self) -> str:
        return f"<Participant name={self.display_name!r} meeting_id={self.meeting_id}>"
