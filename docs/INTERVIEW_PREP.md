# Voom — Interview & Technical Evaluation Guide

This guide is designed to help you ace your post-submission technical interview for the Scaler AI Labs role. It breaks down every architectural, database, and backend decision made in Voom, including trade-offs, alternatives, and scaling strategies.

---

## 1. High-Level Architecture & Tech Stack

### Q: Why did you choose this polyglot monorepo structure?
**Answer:**
> "I structured the project as a clean monorepo with explicit `frontend/` and `backend/` directories. This gives complete separation of concerns:
> 1. **Isolated environments:** Next.js uses Node.js with `package.json`, while FastAPI uses Python with `requirements.txt`. Neither pollutes the other.
> 2. **Single source of truth:** All code, API schemas, and documentation (`docs/DECISIONS.md`, `docs/ARCHITECTURE.md`) live together, enabling atomic commits and clear versioning.
> 3. **Future scaling:** If we break services down further (e.g. a dedicated WebRTC signaling service), adding another top-level service folder is trivial."

---

### Q: Why Next.js 15 (App Router) instead of Vite or plain React?
**Answer:**
> "Next.js with the App Router was chosen because:
> 1. **Modern standard:** The App Router is the current standard for production React development.
> 2. **First-class layout system:** Reusable shell components like our sticky navbar, global dark theme, and modal backdrop work out of the box without duplicate renders.
> 3. **Dynamic routing:** Dynamic parameters like `/meeting/[meetingId]` provide clean, shareable URLs without complex client-side router configurations.
> 4. **Production optimization:** Next.js automatically bundles and optimizes assets, code-splits routes, and enforces strict TypeScript compilation."

---

### Q: Why FastAPI for the backend?
**Answer:**
> "FastAPI was chosen because:
> 1. **High performance:** Built on Starlette and Uvicorn, FastAPI provides asynchronous I/O capabilities comparable to Node.js and Go.
> 2. **Automatic validation:** Native integration with Pydantic ensures request payloads are validated and typed before reaching business logic, returning standard 422 errors automatically.
> 3. **Auto-generated documentation:** Interactive OpenAPI/Swagger documentation is served at `/docs`, which accelerates frontend-backend contract validation.
> 4. **Modern Python:** Uses native type hints (`Mapped`, `Session`, `str | None`), making the codebase self-documenting and IDE-friendly."

---

## 2. Database Design & Data Modeling

### Q: Explain your database schema and why you designed it this way.
**Answer:**
> "The schema consists of three core relational models:
> 1. **`User`**: Represents platform users. Even without mandatory auth, having a seeded default user ensures meetings are tied to a real foreign key (`host_id`) rather than magic strings.
> 2. **`Meeting`**: Stores meeting metadata (`meeting_code`, `title`, `description`, `meeting_type`, `status`, `scheduled_at`, `duration`, `meeting_link`).
> 3. **`Participant`**: Tracks individual session joins with `meeting_id`, optional `user_id`, `display_name`, and `joined_at`.
>
> **Key Design Highlights:**
> - `meeting_code` has a `UNIQUE` index for $O(1)$ lookups.
> - `host_id` enforces referential integrity via a Foreign Key to `users.id`.
> - `participants` table uses `lazy='selectin'` relationship loading to prevent N+1 query problems when fetching meetings with attendees."

---

### Q: Why did you separate `participants` from `users` instead of a simple join table?
**Answer:**
> "A video conferencing platform has two distinct concepts: registered accounts and session participants.
> 1. **Guest access:** In real-world video conferencing, guests join with just a display name without creating an account. Having `user_id` nullable in `participants` makes guest access native.
> 2. **Session metadata:** A participant record captures time of joining (`joined_at`) and transient display name for that specific call.
> 3. **History audit:** If a user changes their platform name later, past meeting logs preserve the exact display name used during that session."

---

### Q: Why use a random `meeting_code` (e.g., `VOM-482-917`) instead of the numeric database `id`?
**Answer:**
> "1. **Security & Information Leakage:** Exposing auto-incrementing primary keys (`/meeting/1`, `/meeting/2`) allows attackers to enumerate all meetings and reveals company growth metrics.
> 2. **Human readability:** `VOM-XXX-XXX` is easy to read aloud, memorize, and type. UUIDs are too unwieldy (36 characters).
> 3. **Collision safety:** We generate codes with a retry loop (up to 10 attempts) checking for uniqueness before insert, backed by a DB-level unique constraint."

---

## 3. Backend & API Architecture

### Q: What is the Service Layer pattern and why did you use it?
**Answer:**
> "Instead of putting database queries directly inside route handlers ('fat controllers'), we introduced `app/services/meeting_service.py`.
> - **Thin routes:** Route handlers only handle HTTP concerns (request parsing, Pydantic validation, dependency injection, HTTP status codes).
> - **Isolated business logic:** The logic for code generation, uniqueness checks, default user assignment, and status filtering lives in the service layer.
> - **Testability:** Service functions accept a SQLAlchemy `Session` directly, allowing them to be unit-tested without needing an HTTP server."

---

### Q: What HTTP status codes do your endpoints return?
**Answer:**
> - `201 Created`: Used for `POST /api/meetings/instant`, `POST /api/meetings/schedule`, and `POST /api/meetings/{code}/join`.
> - `200 OK`: Used for `GET /api/meetings/{code}`, `GET /api/meetings/upcoming`, and `GET /api/meetings/recent`.
> - `404 Not Found`: Returned when a meeting code does not exist.
> - `422 Unprocessable Entity`: Automatically returned by FastAPI/Pydantic when required fields are missing, strings are empty, or durations are out of bounds (e.g. < 5 or > 480 mins)."

---

## 4. Scaling & Production Readiness

### Q: What would you change to scale this application to 100,000 daily active users?
**Answer:**
> 1. **Database:**
>    - Migrate SQLite to a managed **PostgreSQL** cluster with connection pooling (e.g., PgBouncer).
>    - Add read replicas for query-heavy endpoints (`/upcoming`, `/recent`).
> 2. **Caching:**
>    - Use **Redis** to cache meeting metadata by code with TTL (e.g., cache active meeting lookups).
> 3. **Video / Media Streaming:**
>    - For actual media, WebSockets alone don't scale. We would deploy an **SFU (Selective Forwarding Unit)** like **LiveKit** or **mediasoup** running WebRTC.
>    - Clients publish one upstream track to the SFU, and the SFU distributes downstream tracks to participants, avoiding an $O(N^2)$ mesh network.
> 4. **Horizontal Scaling:**
>    - Deploy FastAPI across multiple container instances (Docker + Kubernetes / ECS) behind an Application Load Balancer.
>    - Use Redis Pub/Sub for cross-instance WebSocket signaling."

---

### Q: How would you add authentication to this system?
**Answer:**
> "Because our data model already has a `User` table and foreign keys to `host_id`, adding authentication is straightforward:
> 1. Implement OAuth 2.0 / JWT login (Google SSO, GitHub, or email/password with Argon2 hashing).
> 2. Create a FastAPI dependency `get_current_user(token: str = Depends(oauth2_scheme)) -> User`.
> 3. Replace the `DEFAULT_USER_ID` in `meeting_service.py` with `current_user.id`.
> 4. Frontend stores the access token in `HttpOnly` Secure cookies or authorization header via the API client."
