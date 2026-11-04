# Codebase Concerns

**Analysis Date:** 2026-11-04

## Tech Debt

**In-Memory Linear Vector Search (`services/backend/api/v1/endpoints/search.py`):**
- Issue: Vector matching queries all `FaceCrop` rows from PostgreSQL via SQLAlchemy (`select(FaceCrop)`), loads their JSON embeddings into Python memory, and evaluates cosine similarity sequentially using NumPy.
- Why: Implemented as a rapid prototyping solution during initial development without requiring external vector extensions.
- Impact: While workable for small batches (<1,000 crops), searching across tens of thousands of video frames will cause severe memory bloat and API timeouts (>5-10s response latency).
- Fix approach: Migrate to PostgreSQL `pgvector` extension with an HNSW or IVFFlat index, allowing cosine distance (`<=>`) queries directly at the database layer.

**Subprocess Model Re-initialization (`services/backend/core/video_processor.py`):**
- Issue: Every uploaded video initiates a new OS subprocess executing `services/ai/run_pipeline.py`. Each execution re-imports PyTorch, ONNX Runtime, and DeepFace weights from disk.
- Why: Implemented to isolate OpenMP, CUDA, and TensorFlow memory spaces to prevent C-level segmentation faults (SEGV 11) from crashing the FastAPI ASGI server.
- Impact: Adds a 3 to 6-second model loading penalty per video processed, reducing batch throughput.
- Fix approach: Implement a persistent worker daemon or Celery/Redis queue where worker processes stay warm with pre-loaded model weights while remaining memory-isolated from the API server.

**Unused `shared/` Directory:**
- Issue: `shared/` in the project root is empty despite the monorepo architecture.
- Why: Services and frontend apps were built in parallel with duplicated type definitions and schemas.
- Impact: Schema discrepancies between TypeScript interfaces (`apps/web-dashboard/src/lib/`) and Pydantic schemas (`services/backend/schemas/`) must be reconciled manually.
- Fix approach: Establish shared TypeScript types or generate them automatically from backend OpenAPI schemas.

## Known Bugs & Edge Cases

**Video Processing Stuck in `PROCESSING` on Subprocess Crash:**
- Symptoms: If an uploaded video has corrupt headers or causes an out-of-memory error inside the Python subprocess, `VideoFootage.status` remains in `PROCESSING` indefinitely.
- Trigger: Uploading unreadable or corrupted video codecs.
- Workaround: Manual database update setting status back to `FAILED` or deleting the record.
- Root cause: Missing exception handling wrapping the subprocess exit code check to update the database state on non-zero exit.

**Path Traversal Risk in Static Upload Server (`services/backend/main.py`):**
- Symptoms: `serve_uploads` handles `/uploads/{path:path}` by directly joining paths without sanitizing against directory traversal sequences (`..`).
- Trigger: Requesting `/uploads/../../core/config.py`.
- Workaround: Production reverse proxy (Nginx) blocking suspicious URI paths.
- Root cause: Manual path construction rather than using FastAPI's built-in `StaticFiles(directory=..., html=False)`.

## Security Considerations

**Default Secret Key in Configuration:**
- Risk: `services/backend/core/config.py` sets a fallback `SECRET_KEY = "change-this-in-production-to-a-secure-random-string"`. If a deployment lacks an explicit `.env` variable, JWT signatures can be easily forged, granting unauthorized administrative privileges.
- Current mitigation: Production `.env` provides a dedicated secret on live servers.
- Recommendations: Add an assertion at backend startup raising a fatal error if `SECRET_KEY` equals the default value when `ENVIRONMENT == "production"`.

**Hardcoded Test Credentials in Repository:**
- Risk: `TEST_CREDENTIALS.md` and `database/scripts/seed_users.py` store default passwords (e.g., `Admin@123`, `Officer@123`).
- Current mitigation: Intended for local development seeding only.
- Recommendations: Ensure database seeding scripts cannot be executed in production environments without an explicit `--confirm-dev-environment` flag.

## Performance Bottlenecks

**Large Video Processing CPU/Memory Spikes:**
- Problem: Analyzing high-framerate 4K or 1080p CCTV footage extracts thousands of frames, consuming several gigabytes of RAM during frame tracking and Laplacian blur scoring.
- Where: `services/ai/detection/frame_extractor.py` and `services/ai/detection/video_service.py`.
- Mitigation: Currently downsamples frame intervals, but processing concurrency should be throttled so multiple simultaneous uploads do not exhaust host memory.

**Mobile Background Location Battery Drain:**
- Problem: `expo-location` and `react-native-background-actions` streaming GPS coordinates every few seconds drains patrol officers' mobile batteries quickly.
- Where: `apps/mobile-app/src/services/foregroundService.ts`.
- Mitigation: Implement adaptive sampling that lowers GPS polling frequency when the device accelerometer indicates the officer is stationary.

## Fragile Areas

**Windows vs. Linux Native Pathing & C++ Dependencies:**
- Windows systems face max path length limitations (`withShortCxxPath.js` was needed for mobile Android builds) and missing Visual C++ build tools for compiling `insightface` wheels.
- Linux systems require explicit `libgl1-mesa-glx` packages installed for OpenCV headless execution.

**Nested AI Planning Folder (`services/ai/.planning/`):**
- The repository previously contained an isolated `.planning` folder inside `services/ai/` from earlier component development. This should be consolidated or archived so all project management and codebase intelligence lives in the root `.planning/` directory.

---
*Concerns analysis: 2026-11-04*
