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
2. **ACTIVE DEVELOPMENT TRUNK IS `phase-2` — ALWAYS PUSH DIRECTLY TO `phase-2`:**
   - **NO INTERMEDIATE FEATURE BRANCHES:** NEVER create extra branches like `feature/phase-2.1`, `feature/phase2.1`, `feature/phase-2.2`, `phase-2-track-a`, etc.
   - All work and commits for Milestone 2 MUST be made directly on `phase-2` and pushed directly to `origin/phase-2`.
   - Before pushing, always sync cleanly with `git pull --rebase origin phase-2`.
   - **NEVER** push commits directly to `main` or `phase-1` (`main` is frozen at Phase 1 baseline code for college evaluation staging; `phase-1` is an immutable historical snapshot).
3. **DEVELOPER WORKSTREAMS ARE FILE-PARTITIONED:**
   - Developer 1 works on Track A files, Developer 2 works on Track B files.
   - Because file paths are partitioned, both developers can push directly to `phase-2` without merge conflicts.
4. **ALWAYS SYNC BEFORE CODING:**
   - Before planning, creating files, or writing code, run:
     ```bash
     git fetch origin
     git checkout phase-2
     git pull --rebase origin phase-2
     ```
5. **ATOMIC CONVENTIONAL COMMITS:**
   - Use standard prefixes: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`.
   - Commit only related files, never messy bulk commits.

---

## 🔀 AUTONOMOUS MERGE CONFLICT RESOLUTION PROTOCOL (AI AGENTS)

When developers push directly to `phase-2`, conflicts may occasionally occur on shared files (e.g. router registrations, model exports, navigation links). **AI AGENTS MUST RESOLVE MERGE CONFLICTS AUTONOMOUSLY WITHOUT BLOCKING THE USER.**

### 🤖 Autonomous Resolution Workflow:

1. **DO NOT ABORT OR FORCE-PUSH:**
   - **NEVER** run `git rebase --abort`, `git merge --abort`, or `git push --force`.
   - **NEVER** choose `--ours` or `--theirs` blindly to discard code.
2. **INSPECT CONFLICT MARKERS:**
   - Run `git status` to identify all conflicted files (`both modified:`).
   - Read the conflict blocks delimited by `<<<<<<< HEAD`, `=======`, and `>>>>>>>`.
3. **INTELLIGENT ADDITIVE SYNTHESIS (KEEP BOTH SIDES):**
   - Because Developer 1 (Track A) and Developer 2 (Track B) build complementary features, conflicts are almost always additive:
     - **Shared Routers / Endpoints (`api/v1/router.py`):** Keep and register BOTH developers' endpoints and routers.
     - **Model Exports (`database/models/__init__.py`):** Export ALL models created by both developers.
     - **Navigation / Layouts (`Sidebar.tsx`, `Topbar.tsx`):** Retain nav items, badges, and tabs for BOTH features.
     - **Dependencies (`requirements.txt`, `package.json`):** Keep the superset of packages added by both developers.
   - Edit the conflicted file cleanly, removing all conflict markers.
4. **VERIFY INTEGRITY (TEST & BUILD):**
   - Run unit tests and compilation before finalizing:
     - Backend: `pytest services/tests/ -v`
     - Frontend: `cmd /c "cd apps\web-dashboard && npm run build"`
   - If tests fail, fix the merged import/syntax until green.
5. **STAGE & COMPLETE REBASE:**
   - `git add <resolved-files>`
   - `git rebase --continue` (or `git commit`)
   - Push cleanly to `phase-2`: `git push origin phase-2`
6. **ESCALATE ONLY ON LOGICAL CONTRADICTION:**
   - Only ask the user if there is an irreconcilable semantic collision (e.g. both developers fundamentally rewrote the exact same function with conflicting logic). In that rare case, present the diff and recommended resolution clearly.

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

# Rebase cleanly onto origin/phase-2:
git pull --rebase origin phase-2

# ⚠️ IF CONFLICTS OCCUR: Follow the Merge Conflict Protocol above (Stop, Inspect, Ask User).
```

### Step 4: Direct Push to `phase-2`
```bash
# Always push directly to origin/phase-2 (NEVER create or push to separate feature branches):
git push origin phase-2
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

### 🔹 Developer 2 (Co-Dev / Track B)
- **Phase 2.2:** Smart Match Ranking & Composite Scoring Engine
  - Focus: NumPy composite scoring service ($w_1 \cdot \text{Similarity} + w_2 \cdot \text{Quality} + w_3 \cdot \text{Recency}$), ranked leaderboard table UI, score breakdown tooltips.
- **Phase 2.4:** Intelligent Alert Center
  - Focus: Alert priority classifier (High/Medium/Low), multi-attribute alert filtering, grouping by missing person, batch operator actions.

> [!IMPORTANT]
> **Single Branch Policy (Direct `phase-2` Pushes Only):**  
> Both Developer 1 and Developer 2 work directly on the `phase-2` branch. **NEVER create intermediate feature branches** (like `feature/phase-2.1`, `feature/phase2.1`, etc.). Because Track A and Track B edit mutually exclusive files, simply running `git pull --rebase origin phase-2` before `git push origin phase-2` ensures 100% clean, conflict-free collaboration without branch clutter.

---

## 🎨 UI/UX DESIGN INTELLIGENCE & MANDATORY SKILL: `ui-ux-pro-max`

All UI/UX frontend work in `apps/web-dashboard` (new components, pages, tables, dialogs, charts, cards, styling, color palettes, responsive layouts, accessibility) **MUST USE THE `ui-ux-pro-max` SKILL**.

### Project-Level Installation & Discovery
To guarantee that **both Developer 1 and Developer 2 (and any AI agent working on either machine)** have access even if not installed globally:
- The skill is installed directly into the repository workspace at `.agents/skills/ui-ux-pro-max/`.
- Any AI agent (Antigravity, Claude Code, Cursor, Gemini CLI) automatically discovers workspace skills under `.agents/skills/`.

### How Agents & Devs Must Use `ui-ux-pro-max`
Before authoring or modifying any UI component or page:
1. **Query design system & style recommendations:**
   ```bash
   python .agents/skills/ui-ux-pro-max/scripts/search.py "law enforcement surveillance dashboard" --domain style
   ```
2. **Query specific component or UX guidance:**
   ```bash
   # For data tables, leaderboards, or evidence cards:
   python .agents/skills/ui-ux-pro-max/scripts/search.py "data table sorting dense" --domain ux
   
   # For Next.js / Tailwind best practices:
   python .agents/skills/ui-ux-pro-max/scripts/search.py "dialog modal accessible" --stack nextjs
   ```
3. **Mandatory Compliance for AI Agents:**
   - **Track A (Dev 1):** Evidence Gallery cards, side-by-side photo comparison, Lightbox modal, and Investigation Timeline UI **must** adhere to `ui-ux-pro-max` guidelines (dense data layout, high-contrast badges, keyboard accessibility).
   - **Track B (Dev 2):** Ranked Match Leaderboard, score breakdown tooltips, Alert Center triage cards, and batch action bars **must** query and adhere to `ui-ux-pro-max`.

---

## ⚡ FRONTEND PERFORMANCE & TAB OPTIMIZATION GUIDELINES (MANDATORY FOR DEV 1 & DEV 2)

To maintain sub-100ms UI responsiveness, high-density dashboard fluidity, and prevent sluggish tab switching across all pages:

1. **NEVER UNMOUNT TABS ON SWITCH (KEEP-ALIVE PATTERN):**
   - **Antipattern:** `{activeTab === 'tabA' ? <TabA /> : <TabB />}` destroys the component, dumps state, tears down the DOM, and causes full-page loading flashes on every click.
   - **Mandatory Pattern:** Use CSS visibility toggles to keep rendered tabs alive:
     ```tsx
     <div className={activeTab === 'tabA' ? 'block' : 'hidden'}><TabA /></div>
     <div className={activeTab === 'tabB' ? 'block' : 'hidden'}><TabB /></div>
     ```
   - This ensures **0ms instant switching**, preserves user scroll position, avoids reloading images/crops, and retains form or filter states.

2. **ELIMINATE NETWORK WATERFALLS VIA `Promise.all`:**
   - In page-level data loaders (e.g. `page.tsx`), always fetch parallel resources simultaneously:
     ```tsx
     const [person, evidence, timeline] = await Promise.all([
       getMissingPerson(id),
       getCaseEvidence(id),
       getCaseTimeline(id)
     ])
     ```
   - Pass pre-fetched data down as `initialData` so child tabs render immediately on mount without blank loading spinners.

3. **CLIENT-SIDE STALE-WHILE-REVALIDATE IN-MEMORY CACHE:**
   - Use in-memory client caching (`clientCache` in `lib/api.ts`) with a short TTL (30s) for read-heavy endpoints.
   - Invalidate specific cache keys on mutation (`updateStatus`, `patchStatus`, etc.).

4. **BACKGROUND REVALIDATION WITHOUT FULL-PAGE FLASH:**
   - Child components with tab filters or refresh buttons must re-fetch quietly in the background (`isLoading` true only when initial data is null/empty).

---

## 📋 GSD (GET SHIT DONE) & PLANNING RULES

Whenever an AI agent is working on this codebase:
1. Always check `.planning/ROADMAP.md` and `.planning/STATE.md` before starting any phase.
2. To plan an assigned phase:
   - Developer 1: `/gsd-plan-phase 2.1`
   - Developer 2: `/gsd-plan-phase 2.2`
3. All phase executions must update `.planning/STATE.md` upon completion.
4. Do not touch `.planning/` configuration without consulting the roadmap.

---

## 🧪 POST-EXECUTION TESTING & VERIFICATION PROTOCOL (MANDATORY FOR ALL AI AGENTS)

> [!IMPORTANT]
> **MANDATORY FOR ALL AGENTS (Dev 1 & Dev 2):**  
> After completing `/gsd-execute-phase` (or any feature implementation), the AI agent **MUST NEVER** simply state "Phase complete" or dump raw commit hashes.  
> The agent **MUST ALWAYS PROVIDE A STEP-BY-STEP DEVELOPER TESTING GUIDE** so the human developer (and their co-developer) can immediately verify the functionality locally.

Every phase completion summary generated by an AI agent must include:

### 1. Automated Verification Commands
Exact CLI commands to run unit tests, type checks, and migrations for all 3 supported Windows shells:

#### 🔹 Option A: PowerShell
```powershell
# Backend pytest suite:
$env:PYTHONPATH=".;services\venv\Lib\site-packages"
pytest services/tests/ -v

# Frontend Next.js build verification:
cmd /c "cd apps\web-dashboard && npm run build"

# Database migration check:
$env:PYTHONPATH="."
.\services\venv\Scripts\python.exe -m alembic -c database/alembic.ini current
```

#### 🔹 Option B: Command Prompt (CMD)
```cmd
:: Backend pytest suite:
set PYTHONPATH=.;services\venv\Lib\site-packages && pytest services/tests/ -v

:: Frontend Next.js build verification:
cd apps\web-dashboard && npm run build && cd ..\..

:: Database migration check:
set PYTHONPATH=. && services\venv\Scripts\python.exe -m alembic -c database/alembic.ini current
```

#### 🔹 Option C: Git Bash (MINGW64)
```bash
# Backend pytest suite:
PYTHONPATH=".;services/venv/Lib/site-packages" pytest services/tests/ -v

# Frontend Next.js build verification:
(cd apps/web-dashboard && npm run build)

# Database migration check:
PYTHONPATH=. ./services/venv/Scripts/python.exe -m alembic -c database/alembic.ini current
```

### 2. Local Environment Launch Commands
Exact commands to start all affected services across each shell:

#### 🔹 Option A: PowerShell
```powershell
# Terminal 1: FastAPI Backend (:8000)
$env:PYTHONPATH="."
.\services\venv\Scripts\python.exe -m uvicorn services.backend.main:app --reload

# Terminal 2: Web Dashboard (:3000)
cd apps\web-dashboard
npm run dev
```

#### 🔹 Option B: Command Prompt (CMD)
```cmd
:: Terminal 1: FastAPI Backend (:8000)
set PYTHONPATH=. && services\venv\Scripts\python.exe -m uvicorn services.backend.main:app --reload

:: Terminal 2: Web Dashboard (:3000)
cd apps\web-dashboard && npm run dev
```

#### 🔹 Option C: Git Bash (MINGW64)
```bash
# Terminal 1: FastAPI Backend (:8000)
PYTHONPATH=. ./services/venv/Scripts/python.exe -m uvicorn services.backend.main:app --reload

# Terminal 2: Web Dashboard (:3000)
cd apps/web-dashboard && npm run dev
```

### 3. Step-by-Step UI/UX Walkthrough (Clickable Instructions)
- **Target URL:** Exact page URL (e.g. `http://localhost:3000/missing`).
- **Interactive Actions:** Exactly which card, row, tab, or button to click.
- **Expected Visual States:** What modals, tooltips, lightboxes, and badges should appear (specifying colors and labels, e.g. "Green Confirmed Sighting Lead badge").
- **State Mutations:** What happens when saving or updating (e.g. "Toast notification appears, status badge updates to Confirmed, ActivityLog entry is written").

### 4. Interactive API & Database Inspection
- Links to FastAPI Swagger UI (`http://localhost:8000/docs`) highlighting the new endpoints.
- Sample cURL or Swagger test payloads.
- Database query to verify table persistence.

---

## 🌐 GCP HOSTING, DUAL-ENV ROUTING & AUTOMATED CI/CD (MANDATORY KNOWLEDGE FOR ALL AGENTS)

This project is hosted on a **GCP Ubuntu Linux VM** (`/opt/garuda-astra`) behind **Nginx** and **Cloudflare**, with automated selective CI/CD via GitHub Actions. All agents (Dev 1 & Dev 2) MUST respect these production/dev rules:

### 1. Subdomain & Nginx Architecture
- **`https://frontend.garudaastra.dpdns.org`** → Next.js Web Dashboard (`127.0.0.1:3000`) + same-origin reverse proxy for `/api/`, `/ws/`, and `/uploads/`.
- **`https://backend.garudaastra.dpdns.org`** → FastAPI Backend (`127.0.0.1:8000`) + `/docs` (Swagger UI), `/health/live`, and `/uploads/`.
- **`https://app.garudaastra.dpdns.org`** → Direct APK download (`apps/mobile-app/dist/garudaastra-release.apk` served as `GarudaASTRA.apk`).
- **Cloudflare DNS/SSL:** All 3 `A` records point to the GCP VM External IP (Proxied), with SSL/TLS mode set to **Flexible** (Cloudflare terminates HTTPS and talks to GCP Nginx on Port 80).

### 2. Dual-Environment API & WebSocket Rule (CRITICAL — NEVER HARDCODE `:8000`)
- Port `8000` is NOT exposed through GCP Firewall or Cloudflare Proxy.
- **ALWAYS** use `getApiUrl()` and `getSafeEvidenceUrl()` from `apps/web-dashboard/src/lib/api.ts`, and `getWsUrl()` in `apps/web-dashboard/src/lib/websocket.tsx`:
  - **Local / Offline Demo (`localhost` / `127.0.0.1`):** Routes to `http://localhost:8000/api/v1` and `ws://localhost:8000/api/v1/ws/connect`.
  - **Hosted / GCP / Cloudflare:** Routes to same-origin `/api/v1`, `/uploads/...`, and `wss://` / `ws://` through Nginx on Port 80/443.
- **NEVER** hardcode `:8000` or raw `process.env.NEXT_PUBLIC_API_URL` directly inside new pages or components.

### 3. Automated Selective CI/CD & Branch Switching
- **Workflow:** `.github/workflows/deploy.yml` triggers on `main` and `phase-*` (`phase-2`, `phase-3`, `phase-4`, etc.).
- **Branch Pinning (`.deploy-branch`):** The GCP VM tracks whichever branch is recorded in `/opt/garuda-astra/.deploy-branch`. Pushes to other branches are safely ignored until switched:
  - Switch via GitHub UI: **Actions ➔ Continuous Automated Deployment ➔ Run workflow ➔ enter target branch (`main`, `phase-3`, etc.)**.
  - Switch via SSH: `bash /opt/garuda-astra/scripts/deploy.sh <branch> --switch`.
- **Selective Restarts (`scripts/deploy.sh`):**
  - `database/` changes → runs `alembic upgrade head` + restarts `garuda-backend`.
  - `services/backend/` or `services/requirements.txt` changes → restarts `garuda-backend`.
  - `apps/web-dashboard/` changes → runs `npm run build` + restarts `garuda-frontend`.
  - `services/ai/` changes → restarts `garuda-ai` (heavy AI models are NOT restarted on frontend-only pushes).
  - `apps/mobile-app/` changes → builds release Android APK on GitHub's `ubuntu-latest` cloud runner (`npx expo prebuild` + `./gradlew assembleRelease`) and publishes it to `app.garudaastra.dpdns.org`.

### 4. GCP Server Consoles, Bootstrap & Docker Stack
- **Fresh Server Bootstrap:** `scripts/setup-gcp-server.sh` (installs Python, Node, Postgres, Nginx, systemd daemons, and domain configs).
- **Phase 4.3 Docker Stack (Alternative):** `docker-compose.yml`, `services/backend/Dockerfile`, `apps/web-dashboard/Dockerfile`, `docker/nginx/nginx.conf`.
- **Live Server Consoles (on GCP VM):**
  - Backend + AI logs: `sudo journalctl -u garuda-backend -f`
  - Frontend logs: `sudo journalctl -u garuda-frontend -f`
  - Nginx logs: `sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log`

---

## 🔬 STANDALONE AI DEBUG & INSPECTION TOOLS (MANDATORY FOR DEV 1 & DEV 2)

Whenever **any AI model, pipeline, scoring/ranking engine, or inference feature** is added or updated (e.g., face detection, 5-point alignment, AdaFace embedding, composite scoring, RTSP live stream ingestion, alert classification):

1. **Always Provide a Standalone Local Debug/Test Tool (No Backend / No DB / No Frontend Required):**
   - **Existing tools in `services/ai/`:**
     - **CLI Tester:** `services/ai/test_ai_match.py` (`python -m services.ai.test_ai_match --photo ... --video ...` or `--rtsp ...`)
     - **Visual GUI Inspector:** `services/ai/test_ai_gui.py` (`python -m services.ai.test_ai_gui`) — live crop-by-crop comparison, similarity % & cosine score, threshold slider, GPU/CPU toggle, and RTSP mode.
   - **Rule for Future Phases & Dev 2 (Track B):**
     - When completing any AI-related feature (such as Phase 2.2 Composite Match Scoring or Phase 3+ RTSP/tracking upgrades), **extend these standalone tools or add a dedicated `services/ai/test_*.py` script/GUI tab** so developers can directly feed raw inputs (photos, videos, embeddings, score vectors, RTSP URLs) and visually inspect intermediate outputs, scores, and failure cases **without** needing FastAPI, PostgreSQL, or Next.js running.
2. **Document Launch Commands:** Include the exact PowerShell / CMD / Git Bash commands to run the standalone debug tool in the phase completion summary.
