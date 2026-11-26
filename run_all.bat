@echo off
setlocal enabledelayedexpansion
title Garuda A.S.T.R.A - Dev Environment Launcher

cd /d "%~dp0"

echo ===================================================================
echo   GARUDA A.S.T.R.A - Spawning 3 Separate Interactive Terminals
echo   1. Backend Server (:8000)   - run_backend.bat
echo   2. Web Dashboard (:3000)    - run_frontend.bat
echo   3. Mobile App Metro (:8081) - run_mobile.bat
echo ===================================================================

where adb >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Setting up ADB reverse port forwarding...
    adb reverse tcp:8000 tcp:8000 >nul 2>nul
    adb reverse tcp:8081 tcp:8081 >nul 2>nul
    echo [OK] ADB reverse ports mapped (8000, 8081).
)

echo.
echo Launching 3 separate interactive command windows...
echo.

:: Launch Backend in separate interactive window
start "Garuda - Backend (:8000)" cmd /k ""%~dp0run_backend.bat""

:: Launch Frontend in separate interactive window
start "Garuda - Web Dashboard (:3000)" cmd /k ""%~dp0run_frontend.bat""

:: Launch Mobile in separate interactive window
start "Garuda - Mobile App (:8081)" cmd /k ""%~dp0run_mobile.bat""

echo ===================================================================
echo   ALL 3 INTERACTIVE WINDOWS HAVE BEEN SPAWNED SEPARATELY:
echo.
echo   1. FastAPI Backend:     http://localhost:8000 (Swagger: /docs)
echo   2. Web Dashboard:       http://localhost:3000
echo   3. Mobile App (Metro):  http://localhost:8081 (Press 'a' for Android)
echo ===================================================================
echo.
echo To stop all services at once, run: stop_all.bat
echo.
timeout /t 5 >nul
