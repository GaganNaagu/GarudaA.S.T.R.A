# Architecture

**Analysis Date:** 2026-11-04

## Pattern Overview

**Overall:** Distributed Monorepo / Multi-Tier Tactical Surveillance & Smart Dispatch Platform with Subprocess-Isolated AI Workers.

**Key Characteristics:**
- **Decoupled Asynchronous Processing:** Heavy computer vision inference runs in dedicated subprocesses, preventing memory collisions, thread contention, and OpenMP/CUDA segfaults with the async web server.
- **Bi-Directional Real-Time Event Bus:** Low-latency WebSockets synchronize tactical state across command center consoles and field patrol units.
- **Fail-Safe Client Architecture:** Web dashboard and mobile application include graceful degradation fallbacks to cached or mock tactical datasets when the central backend is temporarily unreachable.

## Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Tier                       │
│  Next.js 16 Control Room Web App  │  React Native Expo App   │
│  (Leaflet Maps, Heatmaps, Feeds)  │  (GPS, Sirens, Tasks)    │
└──────────────┬──────────────────────────────┬───────────────┘
               │ HTTP REST (JSON)             │ WebSocket Frames
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 API Gateway & Real-Time Hub                 │
│         FastAPI ASGI Router (services/backend/api/)         │
│     WebSocket Connection Manager (core/websocket_manager)   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Domain & Business Services                  │
│  AlertService      │ DispatchService     │ TelemetryService │
│  SearchService     │ VideoProcessor Task │ ActivityLogger   │
└──────────────┬──────────────────────────────┬───────────────┘
               │ Subprocess RPC               │ Async Queries
               ▼                              ▼
┌───────────────────────────────┐ ┌───────────────────────────┐
│     AI Computer Vision        │ │    Data & Persistence     │
│  YOLOv8-face (ONNX/PyTorch)   │ │  PostgreSQL Relational DB │
│  Laplacian Blur Quality Gate  │ │  AsyncPG + SQLAlchemy 2.0 │
│  FaceNet512 Biometric Vector  │ │  Alembic Schema Versioning│
│  Cosine Similarity Matching   │ │  Local Evidence Vault     │
└───────────────────────────────┘ └───────────────────────────┘
```

**1. Presentation Tier (`apps/web-dashboard/`, `apps/mobile-app/`):**
- Purpose: Operator command and field responder interaction.
- Contains: Next.js pages, tactical cards, Leaflet GIS map components, Expo background location services, audio alert triggers.
- Depends on: Backend REST endpoints and WebSocket stream.

**2. API Gateway & Communication Layer (`services/backend/api/`, `services/backend/core/`):**
- Purpose: HTTP request routing, JWT authentication, permission verification, and WebSocket client orchestration.
- Contains: API routers (`v1/endpoints/`), auth dependencies (`deps.py`), WebSocket connection manager (`websocket_manager.py`).
- Depends on: Domain services and database session factory.

**3. Domain & Business Logic Layer (`services/backend/services/`, `services/backend/core/`):**
- Purpose: Incident lifecycle management, alert dispatching, vector comparison orchestration, and video processing scheduling.
- Contains: `AlertService`, `DispatchService`, `TelemetryService`, `process_video_task`.
- Depends on: SQLAlchemy ORM models, database sessions, and AI subprocess runners.

**4. AI Inference Subsystem (`services/ai/`):**
- Purpose: Computer vision ingestion, face detection, quality filtering, and biometric feature extraction.
- Contains: `FaceDetector` (YOLOv8n-face), `FrameExtractor`, `Preprocessor`, `embedding_service` (DeepFace/FaceNet512), `run_pipeline.py`.
- Depends on: OpenCV, PyTorch, ONNX Runtime, and local video/crop files.

**5. Persistence & Storage Layer (`database/`):**
- Purpose: Entity storage, schema migrations, and relational integrity.
- Contains: SQLAlchemy declarative models (`database/models/`), async session engine (`database/db/session.py`), Alembic revision history (`database/alembic/`).
- Depends on: PostgreSQL instance.

## Data Flow

**1. Video Upload & Automated Sighting Detection Flow:**
1. Investigator uploads CCTV footage through web dashboard (`POST /api/v1/uploads/`).
2. Server writes the file to disk and persists a `VideoFootage` record in status `PENDING`.
3. Background task `process_video_task` invokes `services/ai/run_pipeline.py` via an isolated Python subprocess.
4. AI pipeline extracts frames, runs YOLOv8-face detection, calculates Laplacian blur scores, tracks faces across frames using bounding-box IoU, and extracts FaceNet512 embeddings on the sharpest crops.
5. Generated face crops and embeddings are saved to disk and recorded in the database as `FaceCrop` rows.
6. Vector matching compares crop embeddings against active missing persons. If similarity exceeds the threshold (default 0.30/0.45), a `DetectionEvent` is saved.
7. An elevated `Alert` is created and broadcast to all connected WebSocket clients in real-time.

**2. Tactical Dispatch & Field Response Flow:**
1. WebSocket receives an Alert notification on the Control Room Dashboard.
2. Dispatcher reviews the sighting and assigns a patrol officer (`POST /api/v1/alerts/{id}/assign`).
3. Patrol officer's mobile app receives push event, plays tactical alert audio, and displays sighting details.
4. Mobile app streams continuous GPS telemetry (`POST /api/v1/telemetry/ping` / WebSocket) to update live dispatch map.
5. Officer arrives at scene, verifies sighting, and updates alert status to `ACKNOWLEDGED` or `RESOLVED`.

**State Management:**
- Backend: Stateless request handling with JWT authentication. Database maintains authoritative operational state; WebSockets maintain active in-memory connection pools.
- Web Dashboard: React context (`auth-context.tsx`) for user session and credentials; local React state for UI components.
- Mobile App: `expo-secure-store` for JWT persistence; `dutyManager.ts` managing on-duty/off-duty states and foreground worker lifecycle.

## Key Abstractions

**`WebSocketManager` (`services/backend/core/websocket_manager.py`):**
- Purpose: Central connection pool and topic-based broadcast hub.
- Pattern: Singleton manager handling client connection, heartbeat, topic subscription (`subscribe_to_topic`), and multi-client broadcasting (`broadcast_to_topic`).

**`AsyncSessionLocal` (`database/db/session.py`):**
- Purpose: Asynchronous transactional database unit-of-work.
- Pattern: Dependency injection generator (`get_db`) providing async context management across route handlers.

**`VideoProcessor` (`services/backend/core/video_processor.py`):**
- Purpose: Bridges asynchronous web requests with CPU-intensive deep learning tasks.
- Pattern: Process isolation worker that executes `python services/ai/run_pipeline.py` in an independent OS process to guarantee stability.

## Entry Points

**Backend Service:**
- Location: `services/backend/main.py`
- Triggers: Uvicorn ASGI server (`uvicorn services.backend.main:app --reload`)
- Responsibilities: CORS setup, route registration, global exception binding, upload directory serving.

**Web Dashboard:**
- Location: `apps/web-dashboard/src/app/layout.tsx` & `page.tsx`
- Triggers: `npm run dev` / `next start` (Next.js server)
- Responsibilities: Tactical surveillance dashboard view, navigation, authentication validation.

**Mobile Application:**
- Location: `apps/mobile-app/index.ts` & `App.tsx`
- Triggers: Expo mobile runtime (`expo start`)
- Responsibilities: Initialization of background task manager, permissions guard, and tactical navigation stack.

**AI Pipeline CLI:**
- Location: `services/ai/run_pipeline.py`
- Triggers: CLI invocation or subprocess spawn (`python services/ai/run_pipeline.py --video <path> --video-id <id> --crops-dir <dir>`)
- Responsibilities: Video decoding, face detection, tracking, crop generation, embedding calculation.

## Error Handling

- **Global HTTP Exception Handlers:** Defined in `services/backend/core/exceptions.py`, normalizing API errors into structured `{ "error": { "code": ..., "message": ... } }` payloads.
- **Client Mock Fallbacks:** In `apps/web-dashboard/src/lib/api.ts`, API request failures gracefully fall back to predefined tactical datasets so interface development and visual inspection remain operational offline.

---
*Architecture analysis: 2026-11-04*
