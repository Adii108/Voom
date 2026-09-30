# Engineering Decision Log (Summary)

Key architectural and technical decisions documented with rationale, alternatives considered, and trade-offs.

---

### Quick Index

| ID | Topic | Decision | Primary Rationale |
| :--- | :--- | :--- | :--- |
| **D001** | Repo Structure | Monorepo (`frontend/`, `backend/`) | Clear separation of concerns, atomic git commits |
| **D002** | Frontend Framework | Next.js (App Router) | File-system routing, React Server Components, modern standard |
| **D003** | Language | TypeScript | Static type safety, fewer runtime bugs, superior IDE DX |
| **D004** | Styling | Tailwind CSS v4 | Utility-first, zero context-switching, purged bundle size |
| **D005** | Backend Framework | FastAPI (Python) | Async support, automatic Swagger docs, Pydantic validation |
| **D006** | Database | SQLite (relational) | Zero-config, single-file local dev, standard SQL compliant |
| **D007** | ORM | SQLAlchemy 2.x | DB-agnostic declarative models, clean migrations to Postgres |
| **D008** | Dependency Mgmt | Python `venv` + `requirements.txt` | Universal reproducibility, zero extra tooling required |
| **D009** | API Architecture | Centralized Client (`lib/api.ts`) | Single source of truth, consistent error handling |
| **D010** | Public Identifiers | Human-readable `meeting_code` | Obfuscates sequential IDs, easy verbal/text sharing |
| **D011** | Meeting Lifecycle | Explicit `status` & `meeting_type` Enums | Eliminates timestamp arithmetic, clean UI queries |
| **D012** | Participants Model | Separate `Participant` entity | Guest support (`user_id=null`), session-level metadata |
| **D013** | User Identity | Seeded Default User | Complies with no-auth spec while preserving foreign key integrity |
| **D014** | Layering Pattern | Service Layer (Thin Controllers) | Pure domain logic isolated from HTTP transport |
| **D015** | Meeting UX Flow | Pre-Join Lobby & In-Room State | Device check before joining, seamless single-route UX |
| **D016** | Visual System | Glassmorphic Dark Design System | Reduces video glare, high-contrast, premium aesthetic |
| **D017** | WebRTC Signaling | Unified Plan Transceivers & Determinism | Prevents SDP glare, track collisions, and asymmetric streams |

---

## Detailed Summaries

### D001: Monorepo Architecture
- **Decision:** Separate `frontend/` and `backend/` top-level directories in a single repository.
- **Why:** Keeps polyglot dependencies isolated (`package.json` vs `requirements.txt`) while allowing atomic cross-stack commits.
- **Trade-off:** Requires independent build and deployment pipelines (Vercel + Render).

### D002: Next.js App Router
- **Decision:** Next.js with App Router instead of Pages Router or plain React.
- **Why:** Modern React Server Components architecture, nested layout routing, and first-class TypeScript integration.
- **Trade-off:** Steeper learning curve than Create React App.

### D003: TypeScript for Frontend
- **Decision:** Strict TypeScript across all client components, hooks, and API callers.
- **Why:** Eliminates runtime undefined errors and provides self-documenting prop contracts.
- **Trade-off:** Minor type boilerplate for complex WebRTC peer objects.

### D004: Tailwind CSS v4 Styling
- **Decision:** Utility-first CSS using Tailwind CSS v4.
- **Why:** Rapid component authoring without context switching; dead-code elimination produces minimal CSS footprint.
- **Trade-off:** HTML class strings can be verbose.

### D005: FastAPI for Backend
- **Decision:** FastAPI with Pydantic request/response schemas.
- **Why:** High-performance async support, automated OpenAPI (`/docs`), and automatic request validation.
- **Trade-off:** Smaller built-in ecosystem compared to Django (no native admin UI).

### D006: SQLite for Relational Storage
- **Decision:** SQLite as the relational persistence engine.
- **Why:** Zero configuration, zero external service dependency, perfect for take-home portability.
- **Trade-off:** Single-writer concurrency lock; in multi-node production, migrate to PostgreSQL or Turso.

### D007: SQLAlchemy 2.x ORM
- **Decision:** SQLAlchemy 2.x declarative models.
- **Why:** Clean separation between database schemas and application code; switching DB engine only requires changing connection string.
- **Trade-off:** Adds an abstraction layer over raw SQL.

### D008: Dependency Management
- **Decision:** Standard `venv` and pinned `requirements.txt`.
- **Why:** Universal reproducibility across Windows/macOS/Linux without external managers like Poetry/Pipenv.
- **Trade-off:** No automatic dependency resolution locking.

### D009: Centralized API Client (`lib/api.ts`)
- **Decision:** Route all HTTP communication through a typed `api.ts` module.
- **Why:** Centralizes base URL configuration, credential handling, and error transformation.
- **Trade-off:** Adds an indirection layer over raw `fetch`.

### D010: Separate `meeting_code` from Primary Key
- **Decision:** Use formatted codes (e.g., `vom-abc-def`) rather than exposing database integer IDs.
- **Why:** Prevents enumeration attacks, hides total meeting volume, and allows easy verbal sharing.
- **Trade-off:** Requires uniqueness constraints and collision retry logic in service layer.

### D011: Explicit Status & Type Enums
- **Decision:** Store `status` (`waiting`, `active`, `ended`) and `meeting_type` (`instant`, `scheduled`).
- **Why:** Eliminates brittle timestamp arithmetic for state checks; enables direct indexed filtering.
- **Trade-off:** Status updates must be explicitly dispatched upon participant departure.

### D012: Decoupled Participant Entity
- **Decision:** Store participants in a dedicated table linked to meetings, with nullable `user_id`.
- **Why:** Allows unauthenticated guest participants to join with custom display names.
- **Trade-off:** Requires joining two tables to count meeting attendees.

### D013: Seeded Default Host User
- **Decision:** Auto-seed a persistent default user (`host_id=1`) on application startup.
- **Why:** Preserves relational foreign key constraints without requiring complex authentication screens.
- **Trade-off:** All locally generated meetings share a single default creator identity.

### D014: Service Layer Pattern (Thin Controllers)
- **Decision:** Separate FastAPI routes (`app/routes/`) from business logic (`app/services/`).
- **Why:** Keeps HTTP handlers declarative and allows business rules to be unit-tested in isolation.
- **Trade-off:** Creates additional files per domain entity.

### D015: Pre-Join Lobby & In-Room State Machine
- **Decision:** Implement a dual-state machine (Lobby → In-Call) inside `/meeting/[meetingId]`.
- **Why:** Lets users test camera/mic and set display name before entering; keeps shareable URLs uniform.
- **Trade-off:** Meeting page manages combined media lifecycle and call timer states.

### D016: Glassmorphic Dark Design System
- **Decision:** Custom dark theme with glassmorphic cards, backdrop blur, and tailored accent colors.
- **Why:** Reduces video glare during active calls and creates a polished, premium aesthetic.
- **Trade-off:** Backdrop filters depend on modern browser CSS support.

### D017: WebRTC Unified Plan & Deterministic Signaling
- **Decision:** Unified Plan transceivers with deterministic offer initiation (`participantId < peer.id`) and rollback handling.
- **Why:** Prevents duplicate dummy track m-sections, eliminates signaling glare collisions, and ensures symmetric video rendering.
- **Trade-off:** Requires careful track-to-transceiver synchronization when local media permissions change.
