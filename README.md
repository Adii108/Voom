# Voom — Video Conferencing Platform

A functional video conferencing web application inspired by Zoom's design and user experience.

## Tech Stack

| Layer      | Technology            |
|------------|-----------------------|
| Frontend   | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend    | Python, FastAPI       |
| Database   | SQLite, SQLAlchemy    |
| API        | REST                  |
| Deployment | Vercel (frontend), TBD (backend) |

## Project Structure

```
Voom/
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/# Reusable UI components
│   │   └── lib/       # Utilities and API client
│   └── ...
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── main.py    # Application entry point
│   │   ├── config.py  # Configuration
│   │   ├── database.py# Database setup
│   │   ├── models/    # SQLAlchemy ORM models
│   │   ├── schemas/   # Pydantic request/response schemas
│   │   ├── routes/    # API route handlers
│   │   └── services/  # Business logic
│   └── requirements.txt
└── docs/              # Architecture and design documentation
```

## Getting Started

### Prerequisites

- Node.js >= 18
- Python >= 3.10
- npm

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

Verify with: `GET http://localhost:8000/api/health`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

The application will be available at `http://localhost:3000`.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — System design and request flows
- [Decisions](docs/DECISIONS.md) — Engineering decision log with trade-offs
- [Interview](docs/INTERVIEW.md) — Anticipated interview questions and answers
