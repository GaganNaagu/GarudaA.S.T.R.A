#!/usr/bin/env bash
# ==============================================================================
# GARUDA A.S.T.R.A — Launcher for 3 Separate Interactive Terminals
# Opens:
#   Window 1: FastAPI Backend (:8000)
#   Window 2: Next.js Web Dashboard (:3000)
#   Window 3: Expo Mobile App (:8081)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==================================================================="
echo "  🦅 Launching 3 Separate Interactive Terminals..."
echo "  1. Backend Server (:8000)   -> run_backend.sh"
echo "  2. Web Dashboard (:3000)    -> run_frontend.sh"
echo "  3. Mobile Metro App (:8081) -> run_mobile.sh"
echo "==================================================================="

# Setup ADB reverse once globally if available
if command -v adb &> /dev/null; then
    if adb get-state 2>/dev/null | grep -q "device"; then
        echo "📱 Android device detected. Forwarding ports via ADB..."
        adb reverse tcp:8000 tcp:8000 2>/dev/null || true
        adb reverse tcp:8081 tcp:8081 2>/dev/null || true
    fi
fi

# Function to spawn a script in a dedicated interactive terminal window
spawn_terminal() {
    local title="$1"
    local script="$2"

    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        # Windows / Git Bash
        if [ -f "/c/Program Files/Git/git-bash.exe" ]; then
            start "" "/c/Program Files/Git/git-bash.exe" --cd="$SCRIPT_DIR" -c "bash $script; echo ''; echo 'Press Enter to exit'; read"
        elif [ -f "C:/Program Files/Git/git-bash.exe" ]; then
            start "" "C:/Program Files/Git/git-bash.exe" --cd="$SCRIPT_DIR" -c "bash $script; echo ''; echo 'Press Enter to exit'; read"
        else
            cmd.exe /c start "$title" bash -c "cd '$SCRIPT_DIR' && bash $script; echo ''; echo 'Press Enter to exit'; read"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS Terminal
        osascript -e "tell app \"Terminal\" to do script \"cd \\\"$SCRIPT_DIR\\\" && bash $script\""
    elif command -v gnome-terminal &>/dev/null; then
        gnome-terminal --title="$title" -- bash -c "cd '$SCRIPT_DIR' && bash $script; exec bash"
    elif command -v x-terminal-emulator &>/dev/null; then
        x-terminal-emulator -T "$title" -e bash -c "cd '$SCRIPT_DIR' && bash $script; exec bash" &
    elif command -v konsole &>/dev/null; then
        konsole --new-tab -e bash -c "cd '$SCRIPT_DIR' && bash $script; exec bash" &
    elif command -v xfce4-terminal &>/dev/null; then
        xfce4-terminal --title="$title" -e "bash -c 'cd \"$SCRIPT_DIR\" && bash $script; exec bash'" &
    elif command -v kitty &>/dev/null; then
        kitty --title "$title" bash -c "cd '$SCRIPT_DIR' && bash $script; exec bash" &
    elif command -v alacritty &>/dev/null; then
        alacritty -t "$title" -e bash -c "cd '$SCRIPT_DIR' && bash $script; exec bash" &
    elif command -v xterm &>/dev/null; then
        xterm -title "$title" -e bash -c "cd '$SCRIPT_DIR' && bash $script; exec bash" &
    else
        echo "⚠️ No GUI terminal detected. Running $title in background."
        bash "$script" &
    fi
}

echo ""
echo "🚀 Spawning Backend window..."
spawn_terminal "Garuda - Backend (:8000)" "run_backend.sh"
sleep 1

echo "🚀 Spawning Web Dashboard window..."
spawn_terminal "Garuda - Web Dashboard (:3000)" "run_frontend.sh"
sleep 1

echo "🚀 Spawning Mobile App window..."
spawn_terminal "Garuda - Mobile App (:8081)" "run_mobile.sh"

echo ""
echo "==================================================================="
echo "  ✅ All 3 interactive terminal windows are open and running!"
echo "  • Backend API:      http://localhost:8000"
echo "  • Web Dashboard:    http://localhost:3000"
echo "  • Mobile App:       http://localhost:8081"
echo "==================================================================="
