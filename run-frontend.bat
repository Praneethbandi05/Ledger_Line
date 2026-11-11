@echo off
setlocal
title LEDGERLINE Frontend

echo ==================================================
echo   Starting LEDGERLINE Frontend (React + Vite)
echo ==================================================

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo Node dependencies not found. Installing packages...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed.
        pause
        exit /b 1
    )
)

echo Starting Vite development server on http://localhost:5173 ...
call npm run dev
pause
