@echo off
title Gaming Dashboard

:: Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "LOCAL_IP=%%a"
    goto :found_ip
)
:found_ip
set "LOCAL_IP=%LOCAL_IP: =%"

echo Starting Backend (port 8000)...
start "Backend" cmd /k "cd /d %~dp0 && python -m uvicorn backend.main:app --reload --port 8000 --host 0.0.0.0"

timeout /t 2 /nobreak >nul

echo Starting Frontend (port 5173)...
start "Frontend" cmd /k "cd /d %~dp0 && npm run dev -- --host"

echo.
echo ============================================
echo   Gaming Dashboard
echo ============================================
echo.
echo   Local:    http://localhost:5173
echo   Network:  http://%LOCAL_IP%:5173
echo   Backend:  http://localhost:8000
echo.
echo   Share the Network URL with other machines
echo ============================================
echo.
pause
