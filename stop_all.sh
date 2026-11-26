#!/usr/bin/env bash
# ==============================================================================
# GARUDA A.S.T.R.A — Stop All Development Services (Ports 8000, 3000, 8081)
# ==============================================================================

echo "==================================================================="
echo "  Stopping Garuda A.S.T.R.A Services (Ports 8000, 3000, 8081)"
echo "==================================================================="

for PORT in 8000 3000 8081; do
    if command -v lsof &>/dev/null; then
        PID=$(lsof -ti :$PORT 2>/dev/null || true)
        if [ -n "$PID" ]; then
            echo "Stopping process on port $PORT (PID $PID)..."
            kill -9 $PID 2>/dev/null || true
        fi
    elif command -v netstat &>/dev/null; then
        # Windows / Git Bash netstat fallback
        PID=$(netstat -ano 2>/dev/null | grep ":$PORT " | grep "LISTENING" | awk '{print $5}' | head -n 1)
        if [ -n "$PID" ]; then
            echo "Stopping process on port $PORT (PID $PID)..."
            taskkill //F //PID "$PID" 2>/dev/null || kill -9 "$PID" 2>/dev/null || true
        fi
    fi
done

echo "✔ All services on ports 8000, 3000, and 8081 stopped."
