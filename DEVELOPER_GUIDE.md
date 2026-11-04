# 🚀 GARUDA A.S.T.R.A — Co-Developer Onboarding & Git Workflow Guide

Welcome to the **GARUDA A.S.T.R.A** development team! This guide explains how to set up your local development environment, collaborate cleanly without merge conflicts, and follow our git workflow.

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
> Never run `git push --force` or `git push -f` under any circumstances.

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

---

## 🔀 Step 4: Daily Git Workflow (For Developer 2 / Feature Work)

### 1. Always start by syncing with `phase-2`:
```bash
git checkout phase-2
git pull origin phase-2
```

### 2. Create a dedicated feature branch:
```bash
# Example for Track B:
git checkout -b feature/phase-2.2-smart-ranking
```

### 3. Work on your assigned feature:
If using **Antigravity AI Agent** or **GSD**, run:
```text
/gsd-plan-phase 2.2
```
Your agent will automatically read [GEMINI.md](./GEMINI.md) / [AGENTS.md](./AGENTS.md) and adhere to all project boundaries.

### 4. Commit using Conventional Commits:
```bash
git add <modified-files>
git commit -m "feat(ranking): implement composite match scoring formula"
```

### 5. Push your feature branch to GitHub:
```bash
git push -u origin feature/phase-2.2-smart-ranking
```

### 6. Create a Pull Request (PR) on GitHub:
- Target base branch: **`phase-2`** (NOT `main`!).
- Compare branch: `feature/phase-2.2-smart-ranking`.
- Assign **Developer 1** as the Reviewer.
- Once Developer 1 reviews and approves, the branch is merged cleanly into `phase-2`.

---

## ⚠️ Important Developer Rules

1. **Never commit secrets:** Never commit `.env` files or API keys.
2. **Never run ML on async threads:** Computer vision inference (YOLO, DeepFace) runs in separate worker subprocesses via `video_processor.py`. Never block the FastAPI event loop.
3. **Keep `.planning/` in sync:** When you finish a sub-phase, make sure `.planning/STATE.md` and `.planning/ROADMAP.md` reflect your progress.

Happy building! 🚀
