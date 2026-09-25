from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

# SQLite requires check_same_thread=False when used with FastAPI's
# async request handling, because requests may be served by different
# threads than the one that created the engine.
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base class for all ORM models."""
    pass


def get_db():
    """FastAPI dependency that provides a database session per request.

    Yields a SQLAlchemy session and ensures it is closed after the
    request completes, even if an exception occurs.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Default user ID used throughout the application when no
# authentication is implemented. Defined as a constant so it's
# easy to find and replace when adding real auth.
DEFAULT_USER_ID = 1


def seed_default_user():
    """Create a default user and sample meetings if tables are empty.

    This is called during application startup to satisfy the assignment
    requirement: "Sample Data: Seed your database."
    The function is idempotent — safe to call on every startup.
    """
    from datetime import datetime, timedelta
    from app.models.user import User
    from app.models.meeting import Meeting, MeetingType, MeetingStatus
    from app.config import settings

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
        if not user:
            user = User(
                name="Aditya Umre",
                email="aditya.umre@zoom.us",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.name = "Aditya Umre"
            user.email = "aditya.umre@zoom.us"
            db.commit()

        # Seed sample meetings if none exist or recent is empty
        recent_count = db.query(Meeting).filter(Meeting.status.in_([MeetingStatus.ENDED, MeetingStatus.ACTIVE])).count()
        if recent_count == 0:
            now = datetime.now()
            frontend_url = settings.FRONTEND_URL.rstrip("/")
            
            sample_meetings = [
                Meeting(
                    meeting_code="vom-842-910-sync",
                    title="Weekly Team Sync & Sprint Review",
                    description="Review sprint deliverables, unblock team, and align on upcoming roadmap goals.",
                    meeting_type=MeetingType.SCHEDULED,
                    status=MeetingStatus.WAITING,
                    host_id=user.id,
                    scheduled_at=now + timedelta(hours=3),
                    duration=45,
                    meeting_link=f"{frontend_url}/meeting/vom-842-910-sync",
                ),
                Meeting(
                    meeting_code="vom-319-582-ui",
                    title="Design System & UI Component Alignment",
                    description="Finalize Zoom Workplace web client components and responsive layouts.",
                    meeting_type=MeetingType.SCHEDULED,
                    status=MeetingStatus.WAITING,
                    host_id=user.id,
                    scheduled_at=now + timedelta(days=1, hours=2),
                    duration=30,
                    meeting_link=f"{frontend_url}/meeting/vom-319-582-ui",
                ),
                Meeting(
                    meeting_code="vom-501-724-arch",
                    title="Frontend Architecture & WebRTC Deep Dive",
                    description="Evaluate WebRTC peer connection stability, ICE gathering, and STUN/TURN configs.",
                    meeting_type=MeetingType.SCHEDULED,
                    status=MeetingStatus.WAITING,
                    host_id=user.id,
                    scheduled_at=now + timedelta(days=2, hours=4),
                    duration=60,
                    meeting_link=f"{frontend_url}/meeting/vom-501-724-arch",
                ),
                Meeting(
                    meeting_code="vom-109-847-hist",
                    title="Daily Engineering Standup",
                    description="Quick 15-minute daily sync.",
                    meeting_type=MeetingType.INSTANT,
                    status=MeetingStatus.ENDED,
                    host_id=user.id,
                    scheduled_at=None,
                    duration=15,
                    meeting_link=f"{frontend_url}/meeting/vom-109-847-hist",
                ),
                Meeting(
                    meeting_code="vom-662-411-past",
                    title="Product Architecture & Demo Review",
                    description="Full platform walkthrough with stakeholders.",
                    meeting_type=MeetingType.SCHEDULED,
                    status=MeetingStatus.ENDED,
                    host_id=user.id,
                    scheduled_at=now - timedelta(days=1),
                    duration=45,
                    meeting_link=f"{frontend_url}/meeting/vom-662-411-past",
                ),
            ]
            for m in sample_meetings:
                existing = db.query(Meeting).filter(Meeting.meeting_code == m.meeting_code).first()
                if not existing:
                    db.add(m)
            db.commit()

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

