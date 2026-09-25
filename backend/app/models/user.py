"""User model.

Represents a registered user of the platform. Even though the
assignment uses a default/mock user (no authentication required),
having a proper User table means:

1. Meetings have a real host_id foreign key (not a magic string)
2. The schema is ready for authentication if added later
3. The database relationships are properly normalized
"""

from datetime import datetime

from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    # Relationship: a user can host many meetings
    meetings: Mapped[list["Meeting"]] = relationship(
        "Meeting", back_populates="host", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} name={self.name!r}>"
