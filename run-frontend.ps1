# LEDGERLINE Frontend Launcher
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Starting LEDGERLINE Frontend (React + Vite)     " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$frontendDir = Join-Path $PSScriptRoot "frontend"
Set-Location -Path $frontendDir

if (-not (Test-Path "node_modules")) {
    Write-Host "Node dependencies not found. Installing packages..." -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "npm install failed."
        exit 1
    }
}

Write-Host "`nStarting Vite development server on http://localhost:5173 ..." -ForegroundColor Green
& npm run dev
