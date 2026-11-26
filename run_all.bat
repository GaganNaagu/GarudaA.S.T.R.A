@echo off
setlocal enabledelayedexpansion
title Garuda A.S.T.R.A - Dev Environment Launcher

cd /d "%~dp0"

echo ===================================================================
echo   GARUDA A.S.T.R.A - Unified Dev Launcher (Windows)
echo   Target: Backend (:8000) ^| Web Dashboard (:3000) ^| Mobile (:8081)
echo ===================================================================

:: 1. Detect Python Executable
set "PYTHON_CMD="
if exist "services\venv\Scripts\python.exe" (
    set "PYTHON_CMD=services\venv\Scripts\python.exe"
) else if exist "venv\Scripts\python.exe" (
    set "PYTHON_CMD=venv\Scripts\python.exe"
) else (
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        set "PYTHON_CMD=python"
    ) else (
        echo [ERROR] Python not found. Please install Python or set up services\venv.
        pause
        exit /b 1
    )
)
echo [OK] Using Python: !PYTHON_CMD!

:: 2. Check Node & NPM
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js / npm not found on PATH.
    pause
    exit /b 1
)
echo [OK] Node.js and NPM detected.

:: 3. Configure ADB Port Forwarding (if device/emulator is connected)
where adb >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Setting up ADB reverse port forwarding for Android...
    adb reverse tcp:8000 tcp:8000 >nul 2>nul
    adb reverse tcp:8081 tcp:8081 >nul 2>nul
    echo [OK] ADB reverse ports mapped (8000, 8081).
)

echo.
echo Launching services in dedicated console windows...
echo.

:: Launch Backend (:8000) in new window
start "Garuda A.S.T.R.A - Backend (:8000)" cmd /k "cd /d "%~dp0" && title [Garuda] Backend (:8000) && color 0B && set PYTHONPATH=. && !PYTHON_CMD! -m uvicorn services.backend.main:app --reload --host 0.0.0.0 --port 8000"

:: Launch Web Dashboard (:3000) in new window
start "Garuda A.S.T.R.A - Web Dashboard (:3000)" cmd /k "cd /d "%~dp0apps\web-dashboard" && title [Garuda] Web Dashboard (:3000) && color 0A && npm run dev"

:: Launch Mobile App (:8081) in new window
start "Garuda A.S.T.R.A - Mobile App (:8081)" cmd /k "cd /d "%~dp0apps\mobile-app" && title [Garuda] Mobile App (:8081) && color 0E && npx expo start"

echo ===================================================================
echo   ALL 3 SERVICES HAVE BEEN LAUNCHED IN SEPARATE WINDOWS:
echo.
echo   1. FastAPI Backend:     http://localhost:8000
echo      Interactive Docs:    http://localhost:8000/docs
echo.
echo   2. Web Dashboard:       http://localhost:3000
echo.
echo   3. Mobile App (Metro):  http://localhost:8081
echo                           (Press 'a' in the Metro window for Android)
echo ===================================================================
echo.
echo To terminate all services at once, run: stop_all.bat
echo or close the individual command windows.
echo.
pause
