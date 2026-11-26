@echo off
setlocal enabledelayedexpansion
title Garuda A.S.T.R.A - Stop All Services

echo ===================================================================
echo   Stopping Garuda A.S.T.R.A Services (Ports 8000, 3000, 8081)
echo ===================================================================

for %%P in (8000 3000 8081) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        echo Killing process on port %%P (PID %%a)...
        taskkill /F /PID %%a >nul 2>nul
    )
)

echo.
echo [OK] All Garuda A.S.T.R.A server processes stopped.
timeout /t 2 >nul
