# Architecture

## System Overview

```
Browser (User)
     │
     ▼
┌─────────────┐
│   Next.js   │  ← Frontend (TypeScript, Tailwind CSS)
│  App Router │     Runs on port 3000 (dev)
└──────┬──────┘
       │  REST API calls (JSON over HTTP)
       ▼
┌─────────────┐
│   FastAPI    │  ← Backend (Python)
│   Server    │     Runs on port 8000 (dev)
└──────┬──────┘
       │
  ┌────┴────┐
  ▼         ▼
Routes   Middleware
  │       (CORS)
  ▼
Services     ← Business logic layer
  │
  ▼
SQLAlchemy   ← ORM / Data access layer
  │
  ▼
SQLite       ← Database (file-based)
```

## Backend Architecture

The backend follows a layered architecture:

```
routes/     → Thin HTTP handlers, request parsing, response formatting
services/   → Business logic, validation, data transformation
models/     → SQLAlchemy ORM models (database schema)
schemas/    → Pydantic models (API request/response contracts)
```

**Why layers?**
- Routes should not contain business logic — they parse requests and return responses
- Services encapsulate business rules and can be tested independently
- Models define the database schema and relationships
- Schemas define the API contract, separate from database models

## Frontend Architecture

```
app/                    → Next.js App Router pages
  page.tsx              → Dashboard (home)
  join/page.tsx         → Join meeting flow
  schedule/page.tsx     → Schedule meeting flow
  meeting/[id]/page.tsx → Meeting room (dynamic route)
components/             → Reusable UI components
lib/api.ts              → Centralized backend API client
```

## Database Relationships

```
Users ──(1:N)──▶ Meetings ──(1:N)──▶ Participants
```

Details will be documented after schema implementation (Phase 03).

## Request Flow Example: Create Instant Meeting

```
1. User clicks "New Meeting" on Dashboard
2. Frontend calls POST /api/meetings/instant
3. FastAPI route handler receives request
4. Service layer generates unique meeting code
5. Service layer creates meeting record in database
6. Service layer generates shareable invite link
7. Response returned with meeting details
8. Frontend redirects to /meeting/{meetingCode}
```
