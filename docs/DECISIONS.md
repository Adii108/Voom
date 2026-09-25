# Engineering Decision Log

Each entry documents a significant architectural or technology decision, including alternatives considered and trade-offs.

---

## D001: Monorepo with `frontend/` and `backend/` Separation

**Decision:** Structure the project as a monorepo with two top-level directories.

**Alternatives considered:**
1. Single directory with both runtimes intermixed
2. Two separate repositories
3. Next.js at root with `backend/` subdirectory

**Why this approach:**
- Clear separation of concerns at the filesystem level
- Each directory is self-contained with its own dependencies (`package.json` vs `requirements.txt`)
- Easier onboarding — contributors know immediately where frontend vs backend code lives
- Monorepo keeps everything in one Git history for atomic commits
- Standard industry pattern for polyglot projects

**Trade-offs:**
- Slightly more complex deployment (two separate deploy targets)
- Need to manage two sets of dependencies

**At larger scale:** Would consider Nx or Turborepo for monorepo tooling if more services are added.

---

## D002: Next.js with App Router

**Decision:** Use Next.js with the App Router (introduced in v13+) instead of Pages Router.

**Alternatives considered:**
1. Next.js Pages Router
2. Create React App (plain React)
3. Vite + React

**Why this approach:**
- App Router is the current recommended architecture by the Next.js team
- File-system based routing reduces boilerplate
- Built-in layout system for shared UI elements (navbar)
- Server Components available if needed for performance
- TypeScript support is first-class

**Trade-offs:**
- App Router has a steeper learning curve than Pages Router
- Some ecosystem libraries may still have Pages Router examples

**At larger scale:** App Router's Server Components would provide performance benefits for data-heavy pages.

---

## D003: TypeScript for Frontend

**Decision:** Use TypeScript instead of plain JavaScript.

**Alternatives considered:**
1. Plain JavaScript
2. JavaScript with JSDoc types

**Why this approach:**
- Catch type errors at compile time, reducing runtime bugs
- Better IDE support (autocomplete, refactoring)
- Self-documenting — types serve as inline documentation
- Industry standard for professional Next.js projects

**Trade-offs:**
- Slightly more verbose than plain JavaScript
- Adds a compilation step

---

## D004: Tailwind CSS for Styling

**Decision:** Use Tailwind CSS (utility-first) for styling.

**Alternatives considered:**
1. Vanilla CSS / CSS Modules
2. styled-components
3. Material UI / Chakra UI

**Why this approach:**
- Rapid UI development with utility classes
- No context-switching between CSS files and components
- Consistent design tokens (spacing, colors) built-in
- Small production bundle (purges unused CSS)
- Assignment allows Tailwind CSS

**Trade-offs:**
- HTML can become verbose with many utility classes
- Learning curve for developers unfamiliar with utility-first CSS

---

## D005: FastAPI for Backend

**Decision:** Use FastAPI as the Python web framework.

**Alternatives considered:**
1. Django + Django REST Framework
2. Flask
3. Express.js (Node.js)

**Why this approach:**
- Required by the assignment
- Automatic API documentation (Swagger UI at `/docs`)
- Built-in request validation via Pydantic
- Async support for future scalability
- Modern Python with type hints

**Trade-offs:**
- Smaller ecosystem than Django
- No built-in admin panel (Django has one)
- Separate deployment required (can't run on Vercel)

---

## D006: SQLite for Database

**Decision:** Use SQLite as the relational database.

**Alternatives considered:**
1. PostgreSQL
2. MySQL

**Why this approach:**
- Assignment requires SQL; SQLite is the simplest SQL database
- Zero configuration — no database server to install or manage
- Single file storage — easy to develop and test locally
- SQLAlchemy abstracts the SQL dialect, making migration to PostgreSQL straightforward

**Trade-offs:**
- No concurrent write support (single-writer lock)
- No built-in user/role management
- Persistence concerns in serverless/ephemeral deployment environments
- Limited data types compared to PostgreSQL

**At larger scale:** Would migrate to PostgreSQL or use Turso (hosted SQLite-compatible) for production.

---

## D007: SQLAlchemy as ORM

**Decision:** Use SQLAlchemy 2.x as the Object-Relational Mapper.

**Alternatives considered:**
1. Raw SQL queries
2. Tortoise ORM
3. Peewee

**Why this approach:**
- Required by the assignment
- Industry-standard Python ORM
- Declarative model definitions are readable and maintainable
- Database-agnostic — can switch from SQLite to PostgreSQL by changing the connection string
- Rich relationship support (1:N, M:N)

**Trade-offs:**
- Additional abstraction layer over raw SQL
- Can generate suboptimal queries if not careful

---

## D008: `venv` + `requirements.txt` for Python Dependencies

**Decision:** Use Python's built-in `venv` with a pinned `requirements.txt`.

**Alternatives considered:**
1. Poetry
2. Pipenv
3. Conda

**Why this approach:**
- Simplest, most universally understood approach
- No additional tooling required
- Evaluators can reproduce the environment with `pip install -r requirements.txt`
- Pinned versions ensure reproducible builds

**Trade-offs:**
- No lock file with dependency resolution (Poetry provides this)
- No separation of dev/prod dependencies in a single file

**At larger scale:** Would use Poetry for better dependency resolution and lock files.

---

## D009: Centralized API Client (`lib/api.ts`)

**Decision:** All backend API calls go through a single `api.ts` module.

**Alternatives considered:**
1. Scattered `fetch()` calls in each component
2. React Query / SWR for data fetching
3. Axios library

**Why this approach:**
- Single source of truth for the API base URL
- Consistent error handling across all requests
- Easy to refactor (e.g., switch from `fetch` to `axios`) without touching components
- Components remain focused on UI logic, not HTTP details

**Trade-offs:**
- Extra layer of indirection for simple requests

**At larger scale:** Would add React Query or SWR for caching, deduplication, and background refetching.

---

## D010: `meeting_code` Separate from Database `id`

**Decision:** Use a randomly generated, human-readable `meeting_code` (e.g., `VOM-482-917`) as the public identifier, never exposing the auto-increment `id`.

**Alternatives considered:**
1. Use the database `id` directly in URLs
2. Use UUIDs as primary keys

**Why this approach:**
- Auto-increment IDs leak information (sequential = guessable, reveals total count)
- Meeting codes are memorable and easy to share verbally
- UUIDs are too long for users to type or read aloud
- The database `id` remains available for efficient internal joins and foreign keys

**Trade-offs:**
- Must ensure uniqueness of generated codes (handled by UNIQUE constraint + retry)
- Extra column and index

---

## D011: Meeting Status and Type Enums

**Decision:** Add `status` (waiting/active/ended) and `meeting_type` (instant/scheduled) columns to the meetings table.

**Alternatives considered:**
1. Derive status from timestamps only (e.g., if `scheduled_at < now` then "past")
2. Use a single `is_active` boolean

**Why this approach:**
- Explicit status is clearer than timestamp arithmetic, especially for instant meetings that have no `scheduled_at`
- Enables straightforward queries: `WHERE status = 'waiting'` for upcoming, `WHERE status = 'ended'` for recent
- `meeting_type` allows different UI/logic for instant vs scheduled meetings
- Python `str` enums serialize to JSON naturally

**Trade-offs:**
- Status must be updated explicitly (e.g., when a meeting ends)

---

## D012: Participants as a Separate Entity from Users

**Decision:** Model participants as their own table, linked to meetings, with an optional link to users.

**Alternatives considered:**
1. Many-to-many join table between users and meetings
2. Store participant list as JSON in the meeting row

**Why this approach:**
- Guests can join without an account (nullable `user_id`)
- Each participant record captures session-specific data (`display_name`, `joined_at`)
- A user might use a different display name in different meetings
- Proper relational modeling avoids JSON anti-patterns in SQL

**Trade-offs:**
- More rows to manage than a JSON array
- Need to query a separate table for participant counts

---

## D013: Default User Instead of Authentication

**Decision:** Seed a default user on startup and use it for all operations.

**Alternatives considered:**
1. Build full JWT authentication before features
2. Skip user model entirely

**Why this approach:**
- Assignment explicitly states login is not required
- Having a real User record means foreign keys work correctly
- The architecture is auth-ready — adding login later means swapping the `DEFAULT_USER_ID` with the authenticated user's ID
- Skipping the user model would mean meetings have no host, breaking the relational model

**Trade-offs:**
- All meetings appear to be created by the same user
- No multi-user isolation

---

## D014: Service Layer Pattern (Thin Controllers)

**Decision:** Separate HTTP route handlers (`app/routes/meetings.py`) from domain business logic (`app/services/meeting_service.py`).

**Alternatives considered:**
1. Fat route handlers (putting SQLAlchemy queries and business logic directly in FastAPI routes)
2. Repository pattern with abstract base interfaces

**Why this approach:**
- Keeps API route handlers declarative and focused only on HTTP concerns (status codes, dependency injection, schema validation)
- Isolates business rules (unique meeting code collision retry loop, default status transitions, host assignment)
- Highly testable: business logic can be tested directly without simulating HTTP requests
- Simpler and more practical than the heavy repository pattern while providing 90% of the benefits

**Trade-offs:**
- Adds an extra layer and file per domain entity

---

## D015: Interactive Pre-Join Lobby & In-Room State Machine

**Decision:** Implement a dual-state meeting room experience: Pre-Join Lobby with device permissions and name prompt, transitioning into an interactive In-Call Room with local/remote video tiles, call timer, media toggles, and side drawer.

**Alternatives considered:**
1. Direct join without lobby preview
2. Separate URL for lobby (e.g., `/meeting/lobby/[id]`)

**Why this approach:**
- Mirrors production video conferencing UX (Google Meet, Zoom, MS Teams)
- Allows participants to check camera/mic status and select their display name before entering
- Single dynamic route `/meeting/[meetingId]` keeps URLs clean and shareable without messy route transitions
- Provides interactive media controls (mute/unmute, camera on/off, screen share state, live elapsed timer, real-time in-room chat)

**Trade-offs:**
- Meeting room page manages both lobby and in-call states in a single cohesive client component

---

## D016: Glassmorphic Dark Design System & Tailwind v4

**Decision:** Build a bespoke dark theme using CSS custom properties, glassmorphism blur filters, and Tailwind v4.

**Alternatives considered:**
1. Pre-built UI component libraries (MUI, Shadcn/ui, Ant Design)
2. Light mode default

**Why this approach:**
- Video conferencing applications are overwhelmingly preferred in dark mode to reduce eye strain and focus attention on video feeds
- Bespoke glassmorphism styling gives the application a state-of-the-art, premium look
- Custom reusable component primitives (`Button`, `Input`, `Card`, `Modal`, `Toast`) ensure exact adherence to design requirements without third-party bloat

**Trade-offs:**
- Backdrop blur requires modern browser GPU support

