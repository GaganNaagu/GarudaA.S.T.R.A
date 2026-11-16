# 🚀 GARUDA A.S.T.R.A — Co-Developer Onboarding & Git Workflow Guide

Welcome to the **GARUDA A.S.T.R.A** development team! This guide explains how to set up your local development environment, collaborate cleanly without merge conflicts, and follow our strict git push procedures.

---

## 📌 Core Rule: Branch Structure & Permissions

Our repository uses a staged branch workflow to preserve separate working code for each college milestone presentation:

| Branch | Purpose | Permissions |
|---|---|---|
| **`main`** | Frozen at **Phase 1** baseline code for milestone demonstration | **LOCKED.** Only Dev 1 (Repo Owner) merges here at the end of each major milestone. |
| **`phase-1`** | Immutable historical snapshot of Phase 1 | **LOCKED.** Do not push or touch. |
| **`phase-2`** | **Active trunk branch** for all current Phase 2 development | Base branch for all PRs. Merges approved by Dev 1. |
| **`phase-3` & `phase-4`** | Staging branches for future college milestones | Reserved for future milestones. |

> [!CAUTION]
> **ABSOLUTE RULE: NO FORCE PUSHING.**  
> Never run `git push --force`, `git push -f`, or `git push --force-with-lease` under any circumstances.

---

## 🛠️ Step 1: Clone & Checkout `phase-2`

When setting up the project locally:

```bash
# 1. Clone the repository
git clone https://github.com/GaganNaagu/GarudaA.S.T.R.A.git
cd GarudaA.S.T.R.A

# 2. Checkout the active development branch (phase-2)
git fetch origin
git checkout phase-2
git pull origin phase-2
```

---

## 📦 Step 2: Local Environment Setup

### 1. Universal Central Configuration (Single Root `.env`)
We use a **Single Source of Truth** config at the repository root. This powers FastAPI, Next.js, and Alembic together.

1. Create your local `.env` from the central template:
   ```bash
   cp .env.example .env
   ```
2. Verify configuration and live database connectivity:
   ```bash
   python scripts/env.py status
   ```
   *(By default, this connects to our shared Central Cloud PostgreSQL on Neon so you and your co-dev share the same live data and migrations).*

3. Need to switch between offline and shared mode?
   ```bash
   # Switch to shared team mode (Local servers + Cloud DB):
   python scripts/env.py switch hybrid

   # Switch to fully offline mode (Localhost DB):
   python scripts/env.py switch local

   # Switch to deployed mode (Cloud servers + Cloud DB):
   python scripts/env.py switch deployed
   ```

### 2. Python Backend & AI Environment
```powershell
# Create virtual environment inside services/
python -m venv services\venv

# Activate virtual environment (Windows PowerShell)
.\services\venv\Scripts\Activate.ps1

# Install backend & AI dependencies
pip install -r services\requirements.txt
```

### 3. Database Setup (Alembic Migrations)
With the central config active, apply database migrations directly:
```powershell
$env:PYTHONPATH="."
.\services\venv\Scripts\python.exe -m alembic -c database/alembic.ini upgrade head
```
*(Login credentials for test accounts are listed in [TEST_CREDENTIALS.md](./TEST_CREDENTIALS.md)).*

### 4. Web Dashboard (Next.js)
```bash
cd apps/web-dashboard
npm install
npm run dev
```
Dashboard will be live at `http://localhost:3000` (automatically reads endpoints from root `.env`).

### 5. Running the Backend Server
Choose the command block for your preferred terminal (always uses `python.exe -m uvicorn` to prevent Windows venv launcher path mismatch):

**PowerShell:**
```powershell
$env:PYTHONPATH="."
.\services\venv\Scripts\python.exe -m uvicorn services.backend.main:app --reload
```

**Command Prompt (CMD):**
```cmd
set PYTHONPATH=. && services\venv\Scripts\python.exe -m uvicorn services.backend.main:app --reload
```

**Git Bash (MINGW64):**
```bash
PYTHONPATH=. ./services/venv/Scripts/python.exe -m uvicorn services.backend.main:app --reload
```

Interactive API Swagger docs available at `http://127.0.0.1:8000/docs`.

---

## 👥 Step 3: Who Works on What (Milestone 2 Split)

| Workstream | Developer | Sub-Phases | Key Areas |
|---|---|---|---|
| **Track A** | **Developer 1 (Lead / Owner)** | **Phase 2.1 & Phase 2.3** | • Evidence Vault data models & file storage<br>• Evidence Gallery UI<br>• Investigation Timeline API & visual feed |
| **Track B** | **Developer 2 (Co-Dev)** | **Phase 2.2 & Phase 2.4** | • Smart Match Ranking formula ($w_1 \cdot \text{Sim} + w_2 \cdot \text{Qual} + w_3 \cdot \text{Rec}$)<br>• Ranked Leaderboard Table UI<br>• Intelligent Alert Center & priority triage |

> [!IMPORTANT]
> **Boundary Rule:** Neither developer should edit files assigned to the other track without explicit coordination. This guarantees clean, parallel development with ZERO merge conflicts.

---

## 🎨 Mandatory UI/UX Standards (`ui-ux-pro-max`)

To ensure that both developers and all AI assistants (Antigravity, Cursor, Claude Code) produce high-quality, professional, cohesive UI code, **the `ui-ux-pro-max` skill is bundled directly in this repository** under:
```
.agents/skills/ui-ux-pro-max/
```

### For Developers & AI Agents:
Whenever designing, building, or modifying any frontend component in `apps/web-dashboard`:
1. **Never guess UI patterns or write sloppy styles.**
2. **Search the UI Pro Max catalog** for domain-tested patterns:
   ```bash
   # Search design systems / styles:
   python .agents/skills/ui-ux-pro-max/scripts/search.py "law enforcement surveillance dashboard" --domain style

   # Search UX best practices (e.g. data tables, alerts, dialogs):
   python .agents/skills/ui-ux-pro-max/scripts/search.py "data table responsive dense" --domain ux

   # Search Next.js / Tailwind stack rules:
   python .agents/skills/ui-ux-pro-max/scripts/search.py "accessible modal dialog" --stack nextjs
   ```
3. **If using Antigravity:** The skill is automatically detected in `.agents/skills/ui-ux-pro-max` and can be invoked directly by name or CLI.

---

## 🔀 Step 4: Daily Git Push Workflow (Direct to `phase-2`)

> [!IMPORTANT]
> **Single Branch Policy (Direct `phase-2` Pushes Only):**  
> **DO NOT CREATE INTERMEDIATE FEATURE BRANCHES** (e.g. `feature/phase-2.1`, `feature/phase2.1`, etc.).  
> Both developers work and commit **directly on the `phase-2` branch**. Because Developer 1 (Track A) and Developer 2 (Track B) edit non-overlapping files, pushing directly to `phase-2` with `git pull --rebase` is 100% clean and eliminates branch clutter.

Follow this exact routine whenever coding, committing, and pushing:

### 1. Always stay on `phase-2` and sync before coding:
```bash
git checkout phase-2
git pull --rebase origin phase-2
```

### 2. Build & Test Feature:
If using **Antigravity AI Agent** or **GSD**, run:
- Dev 1: `/gsd-plan-phase 2.3`
- Dev 2: `/gsd-plan-phase 2.2`

### 3. Pre-Commit Safety Check:
```bash
# Check what has been modified or created
git status

# Make sure NO secrets, virtual environments, or heavy videos are staged
git diff
```

### 4. Atomic Commit:
```bash
# Stage only relevant files (never git add .)
git add services/backend/services/ranking_service.py apps/web-dashboard/src/components/RankingTable.tsx

# Conventional commit message:
git commit -m "feat(ranking): implement weighted candidate scoring service"
```

### 5. Pull Latest Remote Changes Before Pushing:
```bash
# Rebase cleanly to incorporate co-dev commits:
git fetch origin
git pull --rebase origin phase-2
```

### 6. Push Directly to `phase-2`:
```bash
# Push directly to origin/phase-2 (NEVER create or push to a feature branch):
git push origin phase-2
```

---

## 💥 Merge Conflict Handling (Mandatory for AI Agents & Devs)

If `git pull`, `git rebase`, or `git merge` encounters conflicts:

1. **Do NOT force push or blindly delete code.**
2. **If an AI agent is running:** The AI agent **MUST STOP and ask the user** for a decision. It must display the conflicted files and explain what both versions did.
3. **If resolving manually:**
   ```bash
   # Check which files have conflicts
   git status

   # Open conflicting files and look for <<<<<<< HEAD markers
   # Edit the file to combine the correct logic from both sides

   # Mark as resolved:
   git add <resolved-file>

   # Continue rebase/merge:
   git rebase --continue
   ```
4. Run verification tests before pushing to ensure nothing broke.

---

## 🧪 Post-Phase Execution Testing & Verification Protocol (Mandatory for AI Agents)

Whenever you or your AI agent completes a development phase (e.g. via `/gsd-execute-phase`), **the AI agent MUST return a step-by-step developer verification guide**. Never end a turn with just "Phase completed".

Every phase completion output must provide:
1. **Automated Test Commands (PowerShell, CMD, Git Bash):**

   **PowerShell:**
   ```powershell
   # Backend pytest suite:
   $env:PYTHONPATH=".;services\venv\Lib\site-packages"
   pytest services/tests/ -v

   # Frontend Next.js build check:
   cmd /c "cd apps\web-dashboard && npm run build"

   # Database migration check:
   $env:PYTHONPATH="."
   .\services\venv\Scripts\python.exe -m alembic -c database/alembic.ini current
   ```

   **Command Prompt (CMD):**
   ```cmd
   :: Backend pytest suite:
   set PYTHONPATH=.;services\venv\Lib\site-packages && pytest services/tests/ -v

   :: Frontend Next.js build check:
   cd apps\web-dashboard && npm run build && cd ..\..

   :: Database migration check:
   set PYTHONPATH=. && services\venv\Scripts\python.exe -m alembic -c database/alembic.ini current
   ```

   **Git Bash (MINGW64):**
   ```bash
   # Backend pytest suite:
   PYTHONPATH=".;services/venv/Lib/site-packages" pytest services/tests/ -v

   # Frontend Next.js build check:
   (cd apps/web-dashboard && npm run build)

   # Database migration check:
   PYTHONPATH=. ./services/venv/Scripts/python.exe -m alembic -c database/alembic.ini current
   ```

2. **Local Server Start Commands:**

   **PowerShell:**
   ```powershell
   # Terminal 1: Backend (:8000)
   $env:PYTHONPATH="."
   .\services\venv\Scripts\python.exe -m uvicorn services.backend.main:app --reload

   # Terminal 2: Web Dashboard (:3000)
   cd apps\web-dashboard
   npm run dev
   ```

   **Command Prompt (CMD):**
   ```cmd
   :: Terminal 1: Backend (:8000)
   set PYTHONPATH=. && services\venv\Scripts\python.exe -m uvicorn services.backend.main:app --reload

   :: Terminal 2: Web Dashboard (:3000)
   cd apps\web-dashboard && npm run dev
   ```

   **Git Bash (MINGW64):**
   ```bash
   # Terminal 1: Backend (:8000)
   PYTHONPATH=. ./services/venv/Scripts/python.exe -m uvicorn services.backend.main:app --reload

   # Terminal 2: Web Dashboard (:3000)
   cd apps/web-dashboard && npm run dev
   ```
3. **Interactive UI Walkthrough:**
   - Specific URLs to open (`http://localhost:3000/missing`).
   - Exact components, cards, tabs, and buttons to click.
   - Expected UI changes, modals, badges, and alerts.
4. **API Swagger & Database Verification:**
   - Swagger docs URL (`http://localhost:8000/docs`).
   - Tables and endpoints to inspect.

---

## 🛑 Common Pitfalls & Mistakes to Avoid

1. **⚠️ Never commit `.env` or credentials:**
   - `.env` files contain private keys and database passwords. Check `git status` before committing.
2. **⚠️ Never commit heavy video or crop files:**
   - All uploaded CCTV footage and cropped faces belong in `services/backend/uploads/` which is ignored by `.gitignore`. Committing videos will exceed GitHub's 100MB file limit.
3. **⚠️ Never run AI/ML inference on the FastAPI event loop:**
   - Heavy computer vision (YOLOv8, DeepFace) MUST run via `services/backend/core/video_processor.py` in an isolated Python subprocess to prevent event loop starvation and WebSocket drops.
4. **⚠️ Never alter old database migrations:**
   - Never edit previous files in `database/alembic/versions/`. Always generate a new migration with `alembic revision --autogenerate -m "..."`.
5. **⚠️ Never use synchronous Leaflet imports in Next.js:**
   - Leaflet references `window` which breaks SSR. Always use client-side mounting (`"use client"`) and the `useMap()` hook in `useEffect`.

---
Happy building! 🚀
