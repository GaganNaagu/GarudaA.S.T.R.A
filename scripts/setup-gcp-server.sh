#!/usr/bin/env bash
# ==============================================================================
# GARUDA A.S.T.R.A — Turnkey GCP Linux VM Bootstrap Script
# Transforms a fresh Ubuntu 22.04/24.04 VM into a fully automated production/dev host.
# Usage: sudo bash scripts/setup-gcp-server.sh <GITHUB_REPO_URL> [BRANCH]
# ==============================================================================

set -euo pipefail

REPO_URL="${1:-https://github.com/GaganNaagu/GarudaA.S.T.R.A.git}"
BRANCH="${2:-phase-2}"
INSTALL_DIR="/opt/garuda-astra"
DB_NAME="garuda_astra"
DB_USER="astra_user"
DB_PASS="astra_secure_pass_2026"

log() {
  echo -e "\033[1;36m[GARUDA-BOOTSTRAP $(date +'%H:%M:%S')]\033[0m $1"
}

success() {
  echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

warn() {
  echo -e "\033[1;33m[WARNING]\033[0m $1"
}

# 1. System updates & Dependencies
log "Step 1: Installing system packages, compilers, and OpenCV graphics libraries..."
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -y || warn "Some third-party apt repositories (e.g. cloudflareclient) had GPG warnings. Continuing..."
sudo apt-get install -y \
  git curl wget build-essential software-properties-common \
  python3 python3-pip python3-venv python3-dev \
  postgresql postgresql-contrib \
  nginx \
  libgl1 libglib2.0-0 libsm6 libxext6 libxrender-dev

# 2. Install Node.js 20 LTS (skip if Node >= 18 is already installed)
if ! command -v node &> /dev/null; then
  log "Step 2: Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - || warn "NodeSource repo setup had warnings"
  sudo apt-get install -y nodejs
else
  log "Step 2: Node.js $(node -v) is already installed. Skipping."
fi

# 3. Setup Project Directory & Permissions
log "Step 3: Setting up repository in $INSTALL_DIR..."
CURRENT_USER="${SUDO_USER:-$(whoami)}"
if [ ! -d "$INSTALL_DIR" ]; then
  sudo mkdir -p "$INSTALL_DIR"
  sudo chown -R "$CURRENT_USER:$CURRENT_USER" "$INSTALL_DIR"
  git clone -b "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
else
  sudo chown -R "$CURRENT_USER:$CURRENT_USER" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
  git fetch origin "$BRANCH" || true
  git checkout "$BRANCH" || true
  git pull --rebase origin "$BRANCH" || true
fi

cd "$INSTALL_DIR"
chmod +x scripts/*.sh 2>/dev/null || true

# 4. Configure PostgreSQL
log "Step 4: Configuring local PostgreSQL database..."
sudo systemctl enable --now postgresql
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS' CREATEDB SUPERUSER;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# 5. Environment Configs
log "Step 5: Writing environment configuration (.env)..."
mkdir -p services/backend/uploads/crops
mkdir -p services/backend/uploads/footage
mkdir -p services/backend/uploads/reference

DATABASE_URL="postgresql+asyncpg://$DB_USER:$DB_PASS@127.0.0.1:5432/$DB_NAME"

cat <<EOF > "$INSTALL_DIR/.env"
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=$DATABASE_URL
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASS
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
SECRET_KEY=astra_jwt_production_secret_key_college_eval_2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALLOWED_ORIGINS=*
NEXT_PUBLIC_API_URL=/api/v1
EOF

cp "$INSTALL_DIR/.env" "$INSTALL_DIR/services/backend/.env"

# 6. Setup Python Virtualenv & Backend
log "Step 6: Building Python virtual environment and running migrations..."
if [ ! -d "services/venv" ]; then
  python3 -m venv services/venv
fi

source services/venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install --no-cache-dir -r services/requirements.txt
export PYTHONPATH="."
python3 -m alembic -c database/alembic.ini upgrade head || warn "Alembic upgrade completed with warnings."
# Seed essential initial data if needed
python3 -m database.scripts.seed_demo_data || true
deactivate

# 7. Build Next.js Web Dashboard
log "Step 7: Compiling Next.js Web Dashboard..."
cd "$INSTALL_DIR/apps/web-dashboard"
npm install --prefer-offline --no-audit
npm run build
cd "$INSTALL_DIR"

# 8. Create Systemd Services
log "Step 8: Configuring systemd service daemons..."

# Backend service
cat <<EOF | sudo tee /etc/systemd/system/garuda-backend.service > /dev/null
[Unit]
Description=Garuda A.S.T.R.A FastAPI Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$INSTALL_DIR
Environment=PYTHONPATH=.
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=$INSTALL_DIR/services/venv/bin/python3 -m uvicorn services.backend.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Ensure directory ownership belongs to non-root user before starting services
sudo chown -R "$CURRENT_USER:$CURRENT_USER" "$INSTALL_DIR"
sudo -u "$CURRENT_USER" git config --global --add safe.directory "$INSTALL_DIR" || true
NPM_BIN=$(command -v npm || echo "/usr/bin/npm")

# Frontend service
cat <<EOF | sudo tee /etc/systemd/system/garuda-frontend.service > /dev/null
[Unit]
Description=Garuda A.S.T.R.A Next.js Web Dashboard
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$INSTALL_DIR/apps/web-dashboard
Environment=PORT=3000
Environment=NODE_ENV=production
ExecStart=$NPM_BIN start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable garuda-backend
sudo systemctl enable garuda-frontend
sudo systemctl restart garuda-backend
sudo systemctl restart garuda-frontend

# 9. Configure Nginx Reverse Proxy (Domains + IP Fallback)
log "Step 9: Configuring Nginx reverse proxy for Garuda A.S.T.R.A domains..."
cat <<EOF | sudo tee /etc/nginx/sites-available/garuda-astra > /dev/null
# 1. Mobile App Direct APK Download (app.garudaastra.dpdns.org)
server {
    listen 80;
    listen [::]:80;
    server_name app.garudaastra.dpdns.org;

    root $INSTALL_DIR/apps/mobile-app/dist;

    location / {
        default_type application/vnd.android.package-archive;
        add_header Content-Disposition 'attachment; filename="GarudaASTRA.apk"';
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files /garudaastra-release.apk =404;
    }
}

# 2. FastAPI Backend API & WebSockets (backend.garudaastra.dpdns.org)
server {
    listen 80;
    listen [::]:80;
    server_name backend.garudaastra.dpdns.org;

    client_max_body_size 500M;

    location /uploads/ {
        alias $INSTALL_DIR/services/backend/uploads/;
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}

# 3. Next.js Web Dashboard + Default IP Fallback (frontend.garudaastra.dpdns.org)
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name frontend.garudaastra.dpdns.org _;

    client_max_body_size 500M;

    # Static uploads (face crops & surveillance clips)
    location /uploads/ {
        alias $INSTALL_DIR/services/backend/uploads/;
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    # FastAPI REST & WebSocket APIs
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 86400;
    }

    # Next.js Web Dashboard
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/garuda-astra /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 10. Configure Sudoers for Passwordless Service Restarts (for CI/CD runner)
log "Step 10: Granting passwordless systemctl restart permissions to $CURRENT_USER..."
cat <<EOF | sudo tee /etc/sudoers.d/garuda-deploy > /dev/null
$CURRENT_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart garuda-backend, /bin/systemctl restart garuda-frontend, /bin/systemctl restart garuda-ai, /bin/systemctl reload nginx, /usr/sbin/nginx -t
EOF
sudo chmod 0440 /etc/sudoers.d/garuda-deploy

success "================================================================="
success "🚀 GARUDA A.S.T.R.A SERVER SETUP COMPLETED SUCCESSFULLY!"
success "================================================================="
echo -e "Access your application at: \033[1;34mhttp://$(curl -s ifconfig.me || echo 'YOUR_GCP_EXTERNAL_IP')\033[0m"
echo -e "Active Tracking Branch: \033[1;32m$BRANCH\033[0m"
echo -e "Deploy Script: \033[1;33m$INSTALL_DIR/scripts/deploy.sh\033[0m"
echo ""
echo "Next step: To connect GitHub Actions automatic deployment:"
echo "1. Go to your GitHub Repository -> Settings -> Actions -> Runners -> New self-hosted runner (Linux)"
echo "2. Run the 3 runner commands as $CURRENT_USER inside $INSTALL_DIR/actions-runner"
echo "3. Run: sudo ./svc.sh install && sudo ./svc.sh start"
echo "Every git push will now automatically update and selectively restart services in seconds!"
