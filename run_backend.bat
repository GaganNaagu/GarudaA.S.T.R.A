@echo off
title [Garuda] Backend (:8000)
color 0B
cd /d "%~dp0"

echo ===================================================================
echo   [GARUDA A.S.T.R.A] FASTAPI BACKEND SERVER (:8000)
echo   URL: http://localhost:8000 ^| API Docs: http://localhost:8000/docs
echo ===================================================================

set "PYTHON_CMD="
if exist "services\venv\Scripts\python.exe" (
    set "PYTHON_CMD=services\venv\Scripts\python.exe"
) else if exist "venv\Scripts\python.exe" (
    set "PYTHON_CMD=venv\Scripts\python.exe"
) else (
    set "PYTHON_CMD=python"
)

set "PYTHONPATH=."
echo Python: %PYTHON_CMD%
echo Starting Uvicorn on http://localhost:8000 (reload enabled)...
echo.

%PYTHON_CMD% -m uvicorn services.backend.main:app --reload --host 0.0.0.0 --port 8000
pause
