# Voom — Zoom Workplace Clone (SDE Fullstack Project)

A functional, high-fidelity video conferencing web application clone of **Zoom Workplace** that replicates Zoom's visual design, user experience, and core meeting workflows. Built for the SDE Fullstack evaluation.

---

## 🌐 Live Deployments

- **Frontend (Vercel)**: Deployed & connected to Render backend
- **Backend (Render)**: [`https://voom-backend-hkh3.onrender.com`](https://voom-backend-hkh3.onrender.com)
- **API Swagger Docs**: [`https://voom-backend-hkh3.onrender.com/docs`](https://voom-backend-hkh3.onrender.com/docs)
- **GitHub Repository**: Public repository ready for evaluation

---

## 🌟 Core Features (Must-Have Checklist)

| Feature | Requirement | Status | Implementation Details |
| :--- | :--- | :--- | :--- |
| **1. Landing Dashboard** | Clean professional Zoom Workplace UI, Navbar with profile/settings, 4 Action Buttons, Upcoming & Recent meetings | ✅ Done | Exact Zoom Workplace dashboard with Orange **New Meeting**, Blue **Join**, Blue **Schedule**, Blue **Share Screen**, live digital clock, and real-time meeting lists from SQLite. |
| **2. Instant Meetings** | Create instantly, unique Meeting ID, shareable invite link, redirect to meeting room | ✅ Done | Instant creation generates unique high-entropy IDs (e.g., `vom-xxx-xxx-xxx`), provides one-click copyable invite links, and routes directly to the in-call room. |
| **3. Join Meeting** | Join using Meeting ID or invite link, enter display name, validate existence | ✅ Done | Zoom styled join modal supporting direct code/link parsing, custom display name, audio/video toggle preferences, and backend validation. |
| **4. Schedule Meetings** | Title, description, date/time, duration, auto-generate link, store in DB, show in Upcoming | ✅ Done | Full Zoom Schedule modal saving to SQLite database via `POST /api/meetings/schedule`, automatically reflected in the Upcoming Meetings section. |
| **5. Live Video Room** | Camera/mic toggles, screen share, participant management, live chat, leave meeting | ✅ Done | WebRTC multi-peer peer-to-peer conferencing with Google/Cloudflare STUN, dual signaling (WebSocket + HTTP fallback), screen sharing, participants drawer, and live chat. |
| **6. Database & Seed Data** | Custom SQLite schema with models and initial seed data | ✅ Done | Normalized `User`, `Meeting`, and `Participant` tables seeded automatically on startup with upcoming and recent meetings. |


| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Lucide Icons | First-class routing, type safety, modular component architecture, and small production bundle |
| **Backend** | Python, FastAPI, Uvicorn | High performance asynchronous I/O, native Pydantic validation, and auto-generated Swagger UI |
| **Database** | SQLite, SQLAlchemy 2.0 ORM | Zero-config SQL persistence with declarative typed models and migration path to PostgreSQL |
| **API Architecture** | REST with Service Layer Pattern | Strict separation between HTTP route handlers and core business logic |

---

## 📁 Repository Structure

```
Voom/
├── frontend/                  # Next.js application
│   ├── src/
│   │   ├── app/               # App Router pages (/, /join, /schedule, /meeting/[id])
│   │   ├── components/        # Reusable UI components (Button, Input, Modal, Toast, Card, Navbar)
│   │   └── lib/               # Typed API client wrapper (api.ts)
│   └── package.json
├── backend/                   # FastAPI application
│   ├── app/
│   │   ├── main.py            # App entry point, CORS & lifespan configuration
│   │   ├── config.py          # Environment settings loader
│   │   ├── database.py        # SQLAlchemy engine, session generator & default user seeder
│   │   ├── models/            # ORM entities (User, Meeting, Participant)
│   │   ├── schemas/           # Pydantic request & response validation contracts
│   │   ├── routes/            # APIRouter endpoints (/api/health, /api/meetings)
│   │   └── services/          # Pure domain business logic (meeting_service.py)
│   ├── tests/                 # Automated API test suite (test_meetings.py)
│   └── requirements.txt
└── docs/                      # Engineering documentation
    ├── ARCHITECTURE.md        # System design & component interaction flows
    ├── DECISIONS.md           # Engineering decision log with trade-offs (D001–D016)
    └── INTERVIEW_PREP.md      # Comprehensive technical interview & defense guide
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >= 18.0.0
- **Python**: >= 3.10
- **npm** or **pnpm**

---

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run automated tests
python tests/test_meetings.py

# Start FastAPI backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- Health check: `GET http://127.0.0.1:8000/api/health`

---

### 2. Frontend Setup

In a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local

# Run production build check
npm run build

# Start Next.js development server
npm run dev
```

- Web App: `http://localhost:3000`

---

## 📚 Technical Documentation & Interview Prep

- 📐 [Architecture Documentation](docs/ARCHITECTURE.md) — System layers, ER diagrams, and sequence flows.
- ⚖️ [Engineering Decision Log](docs/DECISIONS.md) — 16 detailed architectural decisions with trade-offs and alternatives.
- 🎯 [Interview Preparation Guide](docs/INTERVIEW_PREP.md) — Deep-dive answers to post-submission evaluation questions regarding scale, WebRTC, database indexing, and security.
