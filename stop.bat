@echo off
title Stop Gaming Dashboard

echo Stopping Backend (port 8000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo   Killing PID %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo Stopping Frontend (port 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo   Killing PID %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Done. All servers stopped.
pause
