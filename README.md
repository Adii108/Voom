# Voom — Video Conferencing Platform

A modern, high-performance video conferencing web application inspired by Zoom's simplicity and enterprise-grade aesthetics. Built for the Scaler AI Labs technical evaluation.

---

## 🌟 Key Features

- **⚡ Instant Meetings**: Generate a unique, shareable meeting code (`VOM-XXX-XXX`) and direct link with a single click.
- **📅 Scheduled Sessions**: Plan meetings ahead with title, description, scheduled date/time, and duration.
- **🔑 Fast Join**: Direct meeting join via code or shared URL with custom display names.
- **🎥 Interactive Pre-Join Lobby**: Camera & microphone preview controls and name prompt before entering the room.
- **🖥️ In-Call Meeting Room**:
  - Multi-participant video grid layout with active tags
  - Audio and Video mute/unmute toggles with visual states
  - Screen share mode toggle
  - In-meeting chat drawer for live messaging
  - Participants panel
  - Real-time elapsed call timer
- **✨ Sleek Glassmorphic Dark UI**: Custom-tailored dark mode palette, backdrop blur panels, micro-animations, and responsive layouts.

---

## 🛠️ Tech Stack

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
