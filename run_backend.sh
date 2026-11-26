#!/usr/bin/env bash
# ==============================================================================
# GARUDA A.S.T.R.A — Backend Server Interactive Launcher (:8000)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==================================================================="
echo "  🦅 [GARUDA A.S.T.R.A] FASTAPI BACKEND SERVER (:8000)"
echo "  URL: http://localhost:8000 | API Docs: http://localhost:8000/docs"
echo "==================================================================="

PYTHON_CMD=""
if [ -f "services/venv/Scripts/python.exe" ]; then
    PYTHON_CMD="services/venv/Scripts/python.exe"
elif [ -f "services/venv/bin/python" ]; then
    PYTHON_CMD="services/venv/bin/python"
elif [ -f "venv/Scripts/python.exe" ]; then
    PYTHON_CMD="venv/Scripts/python.exe"
elif [ -f "venv/bin/python" ]; then
    PYTHON_CMD="venv/bin/python"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

export PYTHONPATH="."
echo "🐍 Python: $PYTHON_CMD"
echo "🚀 Starting Uvicorn on http://localhost:8000 (reload enabled)..."
echo ""

exec "$PYTHON_CMD" -m uvicorn services.backend.main:app --reload --host 0.0.0.0 --port 8000
