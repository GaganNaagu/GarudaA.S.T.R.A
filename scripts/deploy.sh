#!/usr/bin/env bash
# ==============================================================================
# GARUDA A.S.T.R.A — Automated Selective Deployment Script
# Supports dynamic branch tracking (phase-2 -> main) with granular restarts.
# ==============================================================================

set -euo pipefail

APP_DIR="/opt/garuda-astra"
TARGET_BRANCH="${1:-}"

# Log with timestamp
log() {
  echo -e "\033[1;34m[GARUDA-DEPLOY $(date +'%Y-%m-%d %H:%M:%S')]\033[0m $1"
}

warn() {
  echo -e "\033[1;33m[WARNING]\033[0m $1"
}

success() {
  echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

cd "$APP_DIR"

# 1. Determine active branch
if [ -z "$TARGET_BRANCH" ]; then
  TARGET_BRANCH=$(git rev-parse --abbrev-ref HEAD)
fi

log "Starting deployment on branch: \033[1;32m$TARGET_BRANCH\033[0m"

# 2. Fetch latest changes
git config core.fileMode false || true
git fetch origin "$TARGET_BRANCH"

# Ensure we are on the target branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
  log "Switching active branch from $CURRENT_BRANCH to $TARGET_BRANCH..."
  git checkout -f "$TARGET_BRANCH"
fi

# 3. Detect file changes between local HEAD and remote branch
PREV_COMMIT=$(git rev-parse HEAD)
git reset --hard "origin/$TARGET_BRANCH"
NEW_COMMIT=$(git rev-parse HEAD)

if [ "$PREV_COMMIT" = "$NEW_COMMIT" ]; then
  log "Repository already up-to-date at commit $NEW_COMMIT. No restarts needed."
  exit 0
fi

CHANGED_FILES=$(git diff --name-only "$PREV_COMMIT" "$NEW_COMMIT")
log "Changed files detected:"
echo "$CHANGED_FILES" | sed 's/^/  - /'

# 4. Check Database Migrations (Alembic)
if echo "$CHANGED_FILES" | grep -qE "^database/"; then
  log "Database schema or migrations modified. Applying Alembic migrations..."
  if [ -d "services/venv" ]; then
    source services/venv/bin/activate
    export PYTHONPATH="."
    python3 -m alembic -c database/alembic.ini upgrade head
    deactivate
    success "Alembic migrations applied cleanly."
  else
    warn "services/venv not found. Skipping alembic upgrade."
  fi
fi

# 5. Check Python Backend & Dependencies
BACKEND_CHANGED=false
if echo "$CHANGED_FILES" | grep -qE "^services/requirements.txt"; then
  log "Backend requirements.txt updated. Upgrading Python virtualenv packages..."
  source services/venv/bin/activate
  pip install --no-cache-dir -r services/requirements.txt
  deactivate
  BACKEND_CHANGED=true
fi

if echo "$CHANGED_FILES" | grep -qE "^services/backend/|^database/|^core_config.py"; then
  BACKEND_CHANGED=true
fi

if [ "$BACKEND_CHANGED" = true ]; then
  log "Restarting FastAPI Backend service (garuda-backend)..."
  if systemctl is-active --quiet garuda-backend; then
    sudo systemctl restart garuda-backend
    success "garuda-backend restarted successfully."
  elif docker compose ps --services 2>/dev/null | grep -q "backend"; then
    docker compose restart backend
    success "Docker backend container restarted."
  else
    warn "Neither systemd garuda-backend nor Docker container running."
  fi
else
  log "No backend changes. Preserving active backend process."
fi

# 6. Check Next.js Frontend & Dependencies
FRONTEND_CHANGED=false
if echo "$CHANGED_FILES" | grep -qE "^apps/web-dashboard/package.json|^apps/web-dashboard/package-lock.json"; then
  log "Frontend package.json updated. Installing npm packages..."
  cd apps/web-dashboard
  npm install --prefer-offline --no-audit
  cd ../..
  FRONTEND_CHANGED=true
fi

if echo "$CHANGED_FILES" | grep -qE "^apps/web-dashboard/"; then
  FRONTEND_CHANGED=true
fi

if [ "$FRONTEND_CHANGED" = true ]; then
  log "Building and restarting Next.js Web Dashboard..."
  cd apps/web-dashboard
  npm run build
  cd ../..

  if systemctl is-active --quiet garuda-frontend; then
    sudo systemctl restart garuda-frontend
    success "garuda-frontend restarted successfully."
  elif docker compose ps --services 2>/dev/null | grep -q "frontend"; then
    docker compose restart frontend
    success "Docker frontend container restarted."
  else
    warn "Neither systemd garuda-frontend nor Docker container running."
  fi
else
  log "No frontend changes. Preserving active frontend process."
fi

# 7. Check AI Pipeline Services
if echo "$CHANGED_FILES" | grep -qE "^services/ai/"; then
  log "AI inference or pipeline files changed."
  if systemctl is-active --quiet garuda-ai; then
    sudo systemctl restart garuda-ai
    success "garuda-ai service restarted."
  else
    log "AI pipeline operates via on-demand FastAPI sub-processes; changes are live."
  fi
fi

# 8. Check Nginx configuration
if echo "$CHANGED_FILES" | grep -qE "^docker/nginx/|^nginx/"; then
  log "Nginx configuration updated. Reloading Nginx..."
  sudo nginx -t && sudo systemctl reload nginx
  success "Nginx reloaded cleanly."
fi

success "Deployment of commit $(git rev-parse --short HEAD) on branch '$TARGET_BRANCH' completed successfully!"
