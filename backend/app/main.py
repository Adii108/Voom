"""Voom — FastAPI application entry point.

This module is responsible ONLY for:
- Creating the FastAPI application instance
- Configuring middleware (CORS)
- Registering routers
- Managing application lifespan (database setup)

All endpoint logic lives in the routes/ package.
All business logic lives in the services/ package.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine, seed_default_user
import app.models  # noqa: F401 — import so Base.metadata discovers all tables
from app.routes.health import router as health_router
from app.routes.meetings import router as meetings_router
from app.routes.signaling import router as signaling_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler.

    Creates database tables on startup. In production, you would use
    Alembic migrations instead, but for a small take-home project
    auto-creation is acceptable and reduces setup friction.
    """
    Base.metadata.create_all(bind=engine)
    seed_default_user()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS middleware — allows localhost origins, Vercel deployments, and Cloudflare tunnels
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https:\/\/.*(\.vercel\.app|\.trycloudflare\.com)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers — each router handles a specific resource/concern.
app.include_router(health_router)
app.include_router(meetings_router)
app.include_router(signaling_router)
