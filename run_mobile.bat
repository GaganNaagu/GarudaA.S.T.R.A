@echo off
title [Garuda] Mobile App (:8081)
color 0E
cd /d "%~dp0"

echo ===================================================================
echo   [GARUDA A.S.T.R.A] EXPO MOBILE APP (:8081)
echo   Metro Bundler: http://localhost:8081
echo ===================================================================

where adb >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Mapping Android ADB ports...
    adb reverse tcp:8000 tcp:8000 >nul 2>nul
    adb reverse tcp:8081 tcp:8081 >nul 2>nul
    echo [OK] ADB reverse ports mapped (8000, 8081).
)

cd apps\mobile-app
echo.
echo Starting Expo Metro Bundler...
echo Press 'a' for Android, 'r' to reload, 'j' to open debugger.
echo.

npx expo start
pause
