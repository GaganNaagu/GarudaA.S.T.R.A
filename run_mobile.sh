#!/usr/bin/env bash
# ==============================================================================
# GARUDA A.S.T.R.A — Expo Mobile App Interactive Launcher (:8081)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==================================================================="
echo "  🦅 [GARUDA A.S.T.R.A] EXPO MOBILE APP (:8081)"
echo "  Metro Bundler: http://localhost:8081"
echo "==================================================================="

# Setup ADB reverse for connected Android emulator / physical device
if command -v adb &> /dev/null; then
    if adb get-state 2>/dev/null | grep -q "device"; then
        echo "📱 Android device detected. Forwarding ports via ADB..."
        adb reverse tcp:8000 tcp:8000 2>/dev/null || true
        adb reverse tcp:8081 tcp:8081 2>/dev/null || true
        echo "   ✔ tcp:8000 -> tcp:8000 (Backend API)"
        echo "   ✔ tcp:8081 -> tcp:8081 (Metro Bundler)"
    fi
fi

cd apps/mobile-app
echo ""
echo "🚀 Starting Expo Metro Bundler..."
echo "👉 Press 'a' for Android emulator, 'r' to reload, 'j' to open debugger"
echo ""

exec npx expo start
