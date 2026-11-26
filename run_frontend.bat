@echo off
title [Garuda] Web Dashboard (:3000)
color 0A
cd /d "%~dp0apps\web-dashboard"

echo ===================================================================
echo   [GARUDA A.S.T.R.A] NEXT.JS WEB DASHBOARD (:3000)
echo   URL: http://localhost:3000
echo ===================================================================
echo.

npm run dev
pause
