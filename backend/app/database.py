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
    """Create a default user if the users table is empty.

    This is called during application startup. The default user
    acts as the "logged-in" user for all operations since the
    assignment does not require authentication.

    The function is idempotent — safe to call on every startup.
    """
    # Import here to avoid circular imports (models import Base from this module)
    from app.models.user import User

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
        if not existing:
            default_user = User(
                name="Default User",
                email="user@voom.app",
            )
            db.add(default_user)
            db.commit()
    finally:
        db.close()
