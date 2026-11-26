#!/usr/bin/env bash
# ==============================================================================
# GARUDA A.S.T.R.A — Next.js Web Dashboard Interactive Launcher (:3000)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/apps/web-dashboard"

echo "==================================================================="
echo "  🦅 [GARUDA A.S.T.R.A] NEXT.JS WEB DASHBOARD (:3000)"
echo "  URL: http://localhost:3000"
echo "==================================================================="
echo ""

exec npm run dev
