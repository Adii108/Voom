# Voom All-in-One Local Runner
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting Voom (Backend + Frontend) Locally..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000"

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev"

Write-Host "`nWaiting 4 seconds for servers to initialize..." -ForegroundColor DarkGray
Start-Sleep -Seconds 4

Write-Host "Opening Frontend in your default browser..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host "`nAll running!" -ForegroundColor Green
Write-Host "Backend API Docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "Frontend Web App: http://localhost:3000" -ForegroundColor Yellow
