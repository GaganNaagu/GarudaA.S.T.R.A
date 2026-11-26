#!/usr/bin/env bash
# ==============================================================================
# GARUDA A.S.T.R.A — Unified Development Launcher (Linux / macOS / Git Bash)
# Launches:
#   1. FastAPI Backend on http://localhost:8000 (Swagger: /docs)
#   2. Next.js Web Dashboard on http://localhost:3000
#   3. Expo Mobile App on http://localhost:8081
# ==============================================================================

set -e

# Resolve project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==================================================================="
echo "  🦅 GARUDA A.S.T.R.A — Unified Dev Launcher"
echo "  Target: Backend (:8000) | Frontend (:3000) | Mobile (:8081)"
echo "==================================================================="

# 1. Detect Python Executable
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
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Error: Python not found. Please install Python or set up services/venv."
    exit 1
fi
echo "🐍 Using Python: $PYTHON_CMD"

# 2. Check Node & NPM
if ! command -v npm &> /dev/null; then
    echo "❌ Error: Node.js / npm not found on PATH."
    exit 1
fi
echo "📦 Using NPM: $(npm --version)"

# 3. Setup ADB Reverse for connected Android devices/emulators
if command -v adb &> /dev/null; then
    if adb get-state 2>/dev/null | grep -q "device"; then
        echo "📱 Android device detected. Forwarding localhost ports via ADB..."
        adb reverse tcp:8000 tcp:8000 2>/dev/null || true
        adb reverse tcp:8081 tcp:8081 2>/dev/null || true
        echo "   ✔ tcp:8000 -> tcp:8000"
        echo "   ✔ tcp:8081 -> tcp:8081"
    fi
fi

# Array to keep track of spawned child process PIDs
PIDS=()

cleanup() {
    echo ""
    echo "🛑 Shutting down all Garuda A.S.T.R.A services..."
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    wait 2>/dev/null || true
    echo "✔ All services stopped cleanly."
    exit 0
}

trap cleanup INT TERM EXIT

echo ""
echo "🚀 Starting 1/3: FastAPI Backend on http://localhost:8000..."
PYTHONPATH=. "$PYTHON_CMD" -m uvicorn services.backend.main:app --reload --host 0.0.0.0 --port 8000 2>&1 | sed -e 's/^/[BACKEND] /' &
PIDS+=($!)

echo "🚀 Starting 2/3: Next.js Web Dashboard on http://localhost:3000..."
(cd apps/web-dashboard && npm run dev) 2>&1 | sed -e 's/^/[WEB-DASH] /' &
PIDS+=($!)

echo "🚀 Starting 3/3: Expo Mobile App on http://localhost:8081..."
(cd apps/mobile-app && npx expo start) 2>&1 | sed -e 's/^/[MOBILE] /' &
PIDS+=($!)

echo ""
echo "==================================================================="
echo "  ✅ All 3 services are running concurrently!"
echo "  • Backend API:      http://localhost:8000  (Docs: http://localhost:8000/docs)"
echo "  • Web Dashboard:    http://localhost:3000"
echo "  • Mobile App Metro: http://localhost:8081"
echo ""
echo "  👉 Press Ctrl+C at any time to stop all services."
echo "==================================================================="

# Wait indefinitely for background jobs
wait
