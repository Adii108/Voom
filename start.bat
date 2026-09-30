@echo off
echo ========================================================
echo Starting Voom (Backend + Frontend) Locally...
echo ========================================================

echo Starting FastAPI Backend on port 8000...
start "Voom Backend" cmd /k "cd /d %~dp0backend && call .\venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

echo Starting Next.js Frontend on port 3000...
start "Voom Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Waiting 4 seconds for servers to start...
timeout /t 4 /nobreak >nul

echo Opening browser at http://localhost:3000...
start http://localhost:3000

echo ========================================================
echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:3000
echo ========================================================
pause
