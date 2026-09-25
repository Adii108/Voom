"""Models package — exports all SQLAlchemy ORM models.

All models must be imported here so that Base.metadata.create_all()
in main.py can discover and create their tables. Without these imports,
SQLAlchemy would not know about the tables.
"""

from app.models.user import User
from app.models.meeting import Meeting, MeetingType, MeetingStatus
from app.models.participant import Participant

__all__ = [
    "User",
    "Meeting",
    "MeetingType",
    "MeetingStatus",
    "Participant",
]
