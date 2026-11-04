# GARUDA A.S.T.R.A — AI Agent & Developer Guidelines

> **Target Audience:** Antigravity AI Assistant, Claude Code, Gemini CLI, Cursor, and Co-Developers.  
> **Repository:** `GarudaA.S.T.R.A`  
> **Active Milestone:** **College Phase 2**  
> **Active Base Branch:** `phase-2`  

---

## 🚨 CRITICAL GIT RULES (NON-NEGOTIABLE)

1. **NO FORCE PUSHING EVER:**
   - **NEVER** run `git push --force`, `git push -f`, or `git push --force-with-lease`.
   - Any force push to remote branches is strictly forbidden.
2. **ACTIVE BASE BRANCH IS `phase-2`:**
   - **NEVER** push commits directly to `main` or `phase-1`.
   - `main` is frozen at Phase 1 baseline code for college evaluation staging.
   - `phase-1` is an immutable historical archive.
   - All active feature branches MUST be branched off `phase-2` and targeted back to `phase-2` via Pull Requests.
3. **DEVELOPER 1 (REPO OWNER) IS THE MAIN MASTER:**
   - Developer 1 owns repository administration and final PR merges into `phase-2` and `main`.
   - Developer 2 (Co-Dev) works on assigned feature branches and submits Pull Requests for review.
4. **ALWAYS SYNC BEFORE CODING:**
   - Before planning, creating files, or writing code, run:
     ```bash
     git fetch origin
     git checkout phase-2
     git pull origin phase-2
     ```
5. **ATOMIC CONVENTIONAL COMMITS:**
   - Use standard prefixes: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`.
   - Commit only related files, never messy bulk commits.

---

## 🚀 COMPLETE GIT PUSH WORKFLOW & CHECKLIST

Whenever you or an AI agent pushes code to the remote repository, follow this exact step-by-step checklist:

### Step 1: Pre-Commit Safety Check
```bash
# Check modified and untracked files
git status

# Verify NO secrets, virtual environments, or media files are staged
git diff --cached
```

### Step 2: Atomic Commit
```bash
# Stage only files relevant to the current task
git add <path/to/specific/files>

# Commit with descriptive conventional message
git commit -m "feat(module): descriptive action taken"
```

### Step 3: Sync with Remote Before Pushing
```bash
# Fetch latest remote changes to prevent rejection
git fetch origin

# If working on a feature branch, rebase cleanly onto phase-2:
git pull --rebase origin phase-2
```

### Step 4: Safe Push
```bash
# If pushing a new feature branch for the first time:
git push -u origin <branch-name>

# Subsequent pushes to your existing feature branch:
git push origin <branch-name>
```

---

## ⚠️ COMMON PITFALLS & HOW TO AVOID THEM

### 🛑 Pitfall 1: Accidentally Pushing Secrets or Credentials
- **The Danger:** Committing `.env`, `database/.env`, API keys, or private tokens exposes sensitive credentials permanently in git history.
- **Rule:** Before committing, always check `git status`. Ensure `.env` files are never tracked. Reference `TEST_CREDENTIALS.md` for local mock logins only.

### 🛑 Pitfall 2: Committing Heavy Binary Files (Videos, Crops, Weights)
- **The Danger:** Pushing MP4 surveillance videos, thousands of JPEG face crops (`uploads/crops/`), or large model weights (`.pt`, `.onnx`) bloats the repository and causes GitHub 100MB file limit rejections.
- **Rule:** All uploaded videos and crops MUST stay in `services/backend/uploads/` which is ignored by `.gitignore`. Never track generated test videos or images in git.

### 🛑 Pitfall 3: Blocking FastAPI Event Loop with Heavy ML
- **The Danger:** Running OpenCV video decoding or YOLO/DeepFace model inference directly inside an `async def` FastAPI route blocks Python's single asyncio event loop, causing all WebSocket connections to drop and API requests to 504 Gateway Timeout.
- **Rule:** Heavy inference MUST run in an isolated Python subprocess via `services/backend/core/video_processor.py` -> `services/ai/run_pipeline.py`.

### 🛑 Pitfall 4: Retroactively Modifying Old Alembic Migrations
- **The Danger:** Editing previously applied migration files in `database/alembic/versions/` desynchronizes team databases and corrupts schema state.
- **Rule:** Never modify old migration files. Always create a new migration:
  ```bash
  cd database
  alembic revision --autogenerate -m "add_new_columns_to_table"
  alembic upgrade head
  ```

### 🛑 Pitfall 5: Next.js SSR Hydration Crashes with Leaflet
- **The Danger:** Importing Leaflet directly in server components causes `window is not defined` or hydration mismatch errors.
- **Rule:** Leaflet maps must use client-only mounting (`"use client"`, `dynamic(() => import(...), { ssr: false })`, and the `useMap()` hook in `useEffect`).

### 🛑 Pitfall 6: Editing Files Outside Assigned Track
- **The Danger:** Modifying files assigned to the other developer creates complex git merge conflicts.
- **Rule:** Strictly respect the workstream assignments below.

---

## 👥 DEVELOPER WORKSTREAM ASSIGNMENTS

Development in Phase 2 is strictly partitioned into two parallel, non-overlapping tracks:

### 🔹 Developer 1 (Lead / Track A)
- **Phase 2.1:** Evidence Vault & Verification Architecture
  - Focus: Database models (`EvidenceFile`), crop/frame storage, verification state machine (`Unreviewed` → `Confirmed` → `Rejected`), Evidence Gallery UI.
- **Phase 2.3:** AI Investigation Timeline
  - Focus: Case lifecycle event aggregation API, vertical scrolling timeline UI component.
- **Branch naming:** `phase-2-track-a` or `feature/phase-2.1-evidence`

### 🔹 Developer 2 (Co-Dev / Track B)
- **Phase 2.2:** Smart Match Ranking & Composite Scoring Engine
  - Focus: NumPy composite scoring service ($w_1 \cdot \text{Similarity} + w_2 \cdot \text{Quality} + w_3 \cdot \text{Recency}$), ranked leaderboard table UI, score breakdown tooltips.
- **Phase 2.4:** Intelligent Alert Center
  - Focus: Alert priority classifier (High/Medium/Low), multi-attribute alert filtering, grouping by missing person, batch operator actions.
- **Branch naming:** `phase-2-track-b` or `feature/phase-2.2-ranking`

> [!IMPORTANT]
> **Boundary Rule:** Neither developer should edit files assigned to the other track without explicit coordination. This guarantees clean, parallel development with ZERO merge conflicts.

---

## 📋 GSD (GET SHIT DONE) & PLANNING RULES

Whenever an AI agent is working on this codebase:
1. Always check `.planning/ROADMAP.md` and `.planning/STATE.md` before starting any phase.
2. To plan an assigned phase:
   - Developer 1: `/gsd-plan-phase 2.1`
   - Developer 2: `/gsd-plan-phase 2.2`
3. All phase executions must update `.planning/STATE.md` upon completion.
4. Do not touch `.planning/` configuration without consulting the roadmap.
