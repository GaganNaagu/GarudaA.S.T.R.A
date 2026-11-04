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

### 1. Python Backend & AI Environment
```powershell
# Create virtual environment inside services/
python -m venv services\venv

# Activate virtual environment (Windows PowerShell)
.\services\venv\Scripts\Activate.ps1

# Install backend & AI dependencies
pip install -r services\requirements.txt
```

### 2. Database Setup (PostgreSQL + Alembic)
1. Ensure your PostgreSQL instance is running on `localhost:5432` with a database named `astra_db`.
2. Configure credentials in `database/.env` if needed (default: `postgresql://postgres:postgres@localhost:5432/astra_db`).
3. Apply database migrations:
```powershell
cd database
alembic upgrade head
cd ..
```
4. Seed test users (Admin, Dispatcher, Officer):
```powershell
$env:PYTHONPATH="."
.\services\venv\Scripts\python database\scripts\seed_users.py
```
*(Login credentials for test accounts are listed in [TEST_CREDENTIALS.md](./TEST_CREDENTIALS.md)).*

### 3. Web Dashboard (Next.js)
```bash
cd apps/web-dashboard
npm install
npm run dev
```
Dashboard will be live at `http://localhost:3000`.

### 4. Running the Backend Server
```powershell
# From project root with venv activated:
uvicorn services.backend.main:app --reload
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

## 🔀 Step 4: Daily Git Push Workflow (Step-by-Step)

Follow this exact routine whenever creating, committing, and pushing code:

### 1. Sync with `phase-2` before starting:
```bash
git checkout phase-2
git pull origin phase-2
```

### 2. Create your feature branch:
```bash
# Developer 2 example:
git checkout -b feature/phase-2.2-ranking

# Developer 1 example:
git checkout -b feature/phase-2.1-evidence
```

### 3. Build & Test Feature:
If using **Antigravity AI Agent** or **GSD**, run:
- Dev 1: `/gsd-plan-phase 2.1`
- Dev 2: `/gsd-plan-phase 2.2`

### 4. Pre-Commit Safety Check (Crucial):
```bash
# Check what has been modified or created
git status

# Make sure NO secrets, virtual environments, or heavy videos are staged
git diff
```

### 5. Atomic Commit:
```bash
# Stage only relevant files (never git add .)
git add services/backend/services/ranking_service.py apps/web-dashboard/src/components/RankingTable.tsx

# Conventional commit message:
git commit -m "feat(ranking): implement weighted candidate scoring service"
```

### 6. Pull Remote Changes Before Pushing:
```bash
# Prevent out-of-date rejection
git fetch origin
git pull --rebase origin phase-2
```

### 7. Push Feature Branch to GitHub:
```bash
# First push of the new branch:
git push -u origin feature/phase-2.2-ranking

# Subsequent pushes:
git push origin feature/phase-2.2-ranking
```

### 8. Open a Pull Request (PR) on GitHub:
- **Base repository/branch:** `phase-2` (⚠️ NEVER target `main`!).
- **Compare branch:** `feature/phase-2.2-ranking`.
- **Reviewer:** Assign **Developer 1** (Repo Owner).
- **Merge:** Dev 1 reviews the diff, runs verification, and merges cleanly into `phase-2`.

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
