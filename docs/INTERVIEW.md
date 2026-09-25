# Interview Preparation

Anticipated interview questions organized by topic, with concise answers.

---

## Architecture & Technology Choices

### Why Next.js instead of plain React (Create React App)?

Next.js provides file-system routing, server-side rendering capabilities, built-in optimization, and a structured project layout. For a multi-page application like a video conferencing platform, App Router's layout system is a natural fit. CRA is no longer actively maintained and lacks built-in routing.

### Why the App Router instead of Pages Router?

App Router is the current recommended architecture by the Next.js team. It provides React Server Components, nested layouts, and a more intuitive file-system routing pattern. Since this is a new project, there's no reason to use the legacy approach.

### Why FastAPI instead of Django or Flask?

FastAPI is required by the assignment. Beyond that, FastAPI offers automatic request validation through Pydantic, auto-generated API documentation (Swagger), async support, and modern Python type hints. Django would be heavier than needed (includes an ORM, admin panel, auth — much of which we don't use). Flask would require more manual setup for validation and documentation.

### Why SQLite instead of PostgreSQL?

The assignment requires SQL but not a specific database server. SQLite eliminates infrastructure complexity — no database server installation, no connection management, no credentials. SQLAlchemy abstracts the SQL dialect, so migration to PostgreSQL requires only changing the connection string.

### Why SQLAlchemy instead of raw SQL?

SQLAlchemy provides a declarative model layer that maps Python classes to database tables. This makes the code more readable and maintainable than string-based SQL queries. It also provides database-agnostic query building, meaning the same code works with SQLite and PostgreSQL.

### Why REST instead of GraphQL?

REST is the simplest, most widely understood API pattern. This application has well-defined resources (meetings, participants) with predictable operations (create, read, join). GraphQL adds complexity that isn't justified — there's no need for flexible queries, no deeply nested data, and no mobile client that would benefit from reduced over-fetching.

### Why TypeScript instead of JavaScript?

TypeScript catches errors at compile time, provides better IDE support, and serves as inline documentation through type annotations. It's the industry standard for professional Next.js projects. The small overhead in verbosity is outweighed by the reduction in runtime errors.

### Why Tailwind CSS?

Tailwind enables rapid UI development with consistent design tokens. Instead of writing custom CSS files and naming classes, utility classes are applied directly in JSX. This reduces context-switching and produces a smaller production bundle through automatic purging of unused styles.

---

## Project Structure

### Why a monorepo instead of separate repositories?

A monorepo keeps the entire project in a single Git history, making atomic commits possible (e.g., changing an API endpoint and its frontend consumer in one commit). It simplifies development setup and code review. The `frontend/` and `backend/` separation still provides clear boundaries.

### Why separate `frontend/` and `backend/` directories?

They use different runtimes (Node.js vs Python), different dependency systems (`package.json` vs `requirements.txt`), and will be deployed to different platforms. Mixing them in one directory would create confusion about which files belong to which system.

### Why centralize API calls in `lib/api.ts`?

If API calls are scattered across components, changing the backend URL, adding authentication headers, or modifying error handling requires updating every component. A centralized client ensures consistency and makes refactoring a one-file change.

### Why the layered backend architecture (routes → services → models)?

This separation of concerns ensures that:
- Routes are thin (parse request, return response)
- Business logic lives in services (testable independently)
- Database access is isolated in models
This makes the code easier to test, debug, and extend.

---

## Database

### Why are participants separate from users?

A participant is a session-level concept (someone in a specific meeting), while a user is an account-level concept. Guests can join meetings without creating an account — they're participants but not users. This distinction is important for the join-with-display-name feature.

### Why use foreign keys?

Foreign keys enforce referential integrity at the database level. For example, a participant's `meeting_id` must reference an existing meeting. Without foreign keys, orphaned records could accumulate, leading to data inconsistency.

### Why is `meeting_code` separate from the database `id`?

The database `id` is an auto-incrementing integer — an internal implementation detail. Exposing it would reveal how many meetings have been created (information leakage) and produce predictable, guessable identifiers. `meeting_code` is a human-readable, randomly generated string designed for sharing.

### What are the limitations of SQLite?

- Single-writer concurrency (one write at a time, reads are concurrent)
- No network access (runs in-process only)
- Limited data types (no native DATETIME, JSON types)
- No user/role-based access control
- File-based storage is problematic in ephemeral deployment environments

---

## Deployment

### How will you deploy a Next.js + FastAPI application?

The frontend deploys to Vercel (designed for Next.js). The backend deploys separately to a Python-compatible platform (Railway, Render, or Fly.io). The frontend communicates with the backend via the `NEXT_PUBLIC_API_URL` environment variable.

### What happens to SQLite in production?

SQLite stores data in a local file. In ephemeral serverless environments, the file may be lost on redeployment. Options include:
- Using a persistent volume (Railway supports this)
- Migrating to Turso (hosted SQLite-compatible database)
- Migrating to PostgreSQL (requires only changing the connection string due to SQLAlchemy)

---

*This document will be updated as more features are implemented.*
