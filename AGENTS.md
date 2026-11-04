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
2. **ACTIVE BRANCH IS `phase-2`:**
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
   - Commit only related files, never messy bulk commits including secrets or cache.

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

## ⚙️ ARCHITECTURAL & CODING STANDARDS

1. **Subprocess ML Worker Isolation:**
   - Heavy computer vision inference (YOLOv8, DeepFace, ONNX) MUST run in an isolated Python subprocess via `services/backend/core/video_processor.py` -> `services/ai/run_pipeline.py`.
   - **NEVER** execute OpenCV video decoding or deep learning inference inside an `async def` FastAPI route — it blocks the asyncio event loop and terminates WebSockets.
2. **Database Queries:**
   - Use SQLAlchemy 2.0 async syntax (`await db.execute(select(...))`, `await db.commit()`).
   - For database migrations, navigate to `database/` and run `alembic revision --autogenerate -m "..."` followed by `alembic upgrade head`.
3. **Frontend Standards (Next.js 16 & React 19):**
   - App Router architecture in `apps/web-dashboard/src/app/`.
   - Use Tailwind CSS v4 utility classes.
   - Leaflet maps MUST use declarative React components and client-only mounting (`useMap()` hook in `useEffect`) to prevent Next.js SSR hydration mismatches.
4. **Secrets & Security:**
   - **NEVER** commit `.env`, `database/.env`, API keys, or private tokens to git.
   - Reference `TEST_CREDENTIALS.md` for local testing accounts only.

---

## 📋 GSD (GET SHIT DONE) & PLANNING RULES

Whenever an AI agent is working on this codebase:
1. Always check `.planning/ROADMAP.md` and `.planning/STATE.md` before starting any phase.
2. To plan an assigned phase:
   - Developer 1: `/gsd-plan-phase 2.1`
   - Developer 2: `/gsd-plan-phase 2.2`
3. All phase executions must update `.planning/STATE.md` upon completion.
4. Do not touch `.planning/` configuration without consulting the roadmap.
