# GARUDA A.S.T.R.A — Project Interview Master Guide
> **System Name:** GARUDA A.S.T.R.A (AI-Powered Surveillance, Tactical Response & Alerting / Advanced Security & Tactical Response Architecture)  
> **Repository Type:** Polyglot Full-Stack Monorepo (FastAPI, PyTorch/YOLOv8/AdaFace, Next.js 15, React Native/Expo, PostgreSQL Async SQLAlchemy 2.0)  
> **Target Role:** Software Development Engineer (Full-Stack / Backend / AI Systems / SDE Intern / Fresher)

---

## TABLE OF CONTENTS
1. [PART 1 — Project Overview](#part-1--project-overview)
2. [PART 2 — Complete Architecture](#part-2--complete-architecture)
3. [PART 3 — Request Flow (End-to-End Traces)](#part-3--request-flow-end-to-end-traces)
4. [PART 4 — Codebase Study Roadmap](#part-4--codebase-study-roadmap)
5. [PART 5 — File-by-File Code Explanation](#part-5--file-by-file-code-explanation)
6. [PART 6 — Database Analysis](#part-6--database-analysis)
7. [PART 7 — API Analysis](#part-7--api-analysis)
8. [PART 8 — Authentication & Security](#part-8--authentication--security)
9. [PART 9 — Concurrency, Race Conditions & Scaling](#part-9--concurrency-race-conditions--scaling)
10. [PART 10 — Performance & Optimization](#part-10--performance--optimization)
11. [PART 11 — Project-Specific Deep Dive (AI Video Pipeline & Match Engine)](#part-11--project-specific-deep-dive)
12. [PART 12 — Interview Questions (Levels 1–5)](#part-12--interview-questions)
13. [PART 13 — "Why" Questions (Technology & Architecture Trade-offs)](#part-13--why-questions)
14. [PART 14 — What I Must Be Able to Explain (Checklist)](#part-14--what-i-must-be-able-to-explain)
15. [PART 15 — Final Interview Revision Plan](#part-15--final-interview-revision-plan)

---

## PART 1 — PROJECT OVERVIEW

### 1. What Problem Does This Project Solve?
Traditional public safety and search-and-rescue operations face severe operational latency when locating missing persons or persons-of-interest. Human operators must manually monitor dozens of live CCTV camera feeds or comb through hours of archived surveillance video. Once a suspect or missing individual is sighted, manual telephone calls are made to dispatch patrol officers, leading to critical delays.

**GARUDA A.S.T.R.A** solves this problem by automating the end-to-end intelligence and tactical response loop:
1. **Automated Facial Ingestion & Recognition:** Employs computer vision (YOLOv8 face detection) and deep facial feature representations (AdaFace 512-dimensional embeddings) to scan video streams and video uploads for missing individuals.
2. **Instant Control Room Alerting:** Generates real-time detection events and streams tactical alerts with live cropped imagery to control room dispatchers over authenticated WebSockets.
3. **Automated Field Dispatch & Mobile Telemetry:** Enables dispatchers to verify alerts and dispatch field patrol officers. Field officers receive instant push overlays on their Android mobile apps, accept assignments, update operational statuses, and continuously stream live GPS/battery telemetry back to the control room map.

---

### 2. Who Are the Users?
The application is designed for three distinct operational user roles:
1. **Control Room Dispatchers:**
   - Monitor live surveillance camera streams and real-time AI detection alerts.
   - Verify detection events against reported missing persons.
   - Assign nearest available patrol units to high-priority alerts.
2. **Field Patrol Officers:**
   - Receive tactical alert popups on mobile devices in real time.
   - Accept assignments, update status to `EN-ROUTE`, `INVESTIGATING`, or `FOUND`.
   - Stream background GPS coordinates and device battery levels to the central map.
3. **System Administrators:**
   - Register system users, assign roles, and audit security activity logs.
   - Configure AI engine processing mode (`cpu` vs `gpu`), detection thresholds, and sound triggers.
   - Monitor backend health, database connectivity, and AI subprocess status.

---

### 3. What Are the Main Features?
- **Missing Person Registry & Vector Indexing:** Register cases with photos; automatically extracts 512d AdaFace facial embeddings and sweeps historical CCTV face crops for retroactive matches.
- **CCTV Video Upload & Background AI Batch Processing:** Upload CCTV footage files (`.mp4`, `.avi`), extract frames, track faces across frames using IoU tracking, filter blur using Laplacian variance, extract 512d vector embeddings only for the sharpest crop per track, and store them in PostgreSQL.
- **Live Edge Detection Ingestion & Tactical Alerting:** Edge camera endpoints receive live frames, detect faces, compare vectors against active missing persons, and push real-time alerts to dispatchers.
- **Role-Based WebSocket Broadcasting:** Low-latency bidirectional communication partitioned across `active_admins`, `active_dispatchers`, and `active_patrols`.
- **Interactive Leaflet Tactical Map:** Visualizes live alerts, camera locations, and moving patrol officers with real-time GPS coordinates.
- **Persistent Android Background Service:** Mobile app runs an Android Foreground Service with ongoing system notification to maintain GPS tracking and WebSocket connectivity when the app is minimized or the screen is locked.

---

### 4. Complete Technology Stack

| Technology | Category / Layer | Version / Spec | Purpose in this Project | Important Files Where Used | What happens if removed or replaced |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Python** | Runtime | `3.12` | Core execution environment for backend APIs and AI computer vision pipeline. | Entire `services/` directory | Project cannot run; Python provides native integration with PyTorch, OpenCV, and FastAPI. |
| **FastAPI** | Backend Web Framework | `^0.110.0` | High-performance ASGI framework providing REST endpoints, OpenAPI docs (`/docs`), and WebSocket management. | `services/backend/main.py`<br>`services/backend/api/` | If replaced with Flask/Django, asynchronous WebSocket handling and automatic Pydantic request validation become significantly more complex and slower. |
| **Uvicorn** | ASGI Web Server | `^0.28.0` | Asynchronous server running the FastAPI application event loop. | Server entrypoint (`uvicorn services.backend.main:app`) | FastAPI cannot handle incoming HTTP/WebSocket network connections without an ASGI server. |
| **SQLAlchemy (Async)** | Database ORM | `^2.0.28` | Asynchronous Object Relational Mapper interfacing with PostgreSQL via async/await queries. | `database/db/session.py`<br>`database/models/*.py` | Raw SQL queries would be required, losing type safety, schema relationships, eager loading (`joinedload`), and migration consistency. |
| **asyncpg** | Database Driver | `^0.29.0` | High-performance async driver for PostgreSQL in Python. | `services/backend/core/config.py`<br>`database/db/session.py` | SQLAlchemy cannot connect asynchronously to PostgreSQL without an async DBAPI driver. |
| **Alembic** | DB Migrations | `^1.13.1` | Manages relational database schema versioning, upgrades, and table creation. | `database/alembic.ini`<br>`database/alembic/` | Database schema changes would need manual SQL scripts executed on the database server, leading to schema drift. |
| **Pydantic** | Validation / Serialization | `^2.6.4` | Enforces request/response data schemas, type safety, and environment variable configuration. | `services/backend/schemas/*.py`<br>`services/backend/core/config.py` | API endpoints would lack automatic JSON request validation, error formatting, and response serialization. |
| **python-jose** | Auth & Token Security | `^3.3.0` | Encodes and decodes JSON Web Tokens (JWT) using HS256 for user session authentication. | `services/backend/core/security.py`<br>`services/backend/api/deps.py` | JWT authentication fails; would need session cookies or alternate token libraries. |
| **passlib (bcrypt)** | Password Security | `^1.7.4` | Securely hashes passwords using Bcrypt before saving to database. | `services/backend/core/security.py` | Plaintext or insecure passwords would be stored, creating severe security vulnerabilities. |
| **PyTorch** | Deep Learning / ML | `^2.2.0` | Core tensor computation framework executing deep neural networks (YOLO & AdaFace). | `services/ai/detection/face_detection.py`<br>`services/ai/recognition/embedding_service.py` | AI face detection and embedding extraction cannot execute. |
| **Ultralytics YOLOv8** | Object Detection | `8.x` (`yolov8n-face`) | Real-time face detection model extracting facial bounding box coordinates from video frames. | `services/ai/detection/face_detection.py` | Face detection fails; cannot find faces in raw CCTV video frames. |
| **ONNX Runtime** | Inference Acceleration | CPU Engine | Accelerated execution of `yolov8n-face.onnx` on CPU architectures. | `services/ai/detection/face_detection.py` | CPU face detection slows down by 2x–4x without ONNX quantization and graph optimization. |
| **AdaFace (CVLFace)** | Feature Representation | IR50 (`ms1mv2`) | Deep CNN generating 512-dimensional vector embeddings from normalized face crops. | `services/ai/recognition/embedding_service.py` | Face recognition fails; cannot compare face identity similarity across low-quality CCTV frames. |
| **OpenCV (`cv2`)** | Image Processing | `^4.9.0` | Video frame decoding, bounding box cropping, resizing (`112x112`), and Laplacian blur scoring. | `services/ai/detection/*`<br>`services/ai/pipeline.py` | Cannot decode video files into frame arrays or calculate image sharpness metrics. |
| **NumPy** | Vector Math | `^1.26.4` | Fast array manipulation and Cosine Similarity vector dot product calculations. | `services/backend/api/v1/endpoints/search.py`<br>`services/ai/recognition/` | In-memory vector similarity searches across thousands of facial embeddings become unfeasible. |
| **Next.js** | Web Frontend | `15.1.0` (App Router) | React framework providing server-side structure, file-based routing, and control room dashboard. | `apps/web-dashboard/` | Replaced by SPA (Vite/CRA), losing App Router capabilities and unified layout structures. |
| **React** | UI Library | `19.0.0` | Declarative UI rendering for the web dashboard. | `apps/web-dashboard/src/` | No UI component hierarchy. |
| **Tailwind CSS** | Styling | `^3.4.1` | Utility-first styling for dark-mode tactical command center design. | `apps/web-dashboard/src/app/globals.css` | UI styles would require manual CSS files. |
| **Leaflet / React-Leaflet** | Tactical Mapping | `^1.9.4` / `^4.2.1` | Interactive map rendering alerts, cameras, and patrol GPS markers on web dashboard. | `apps/web-dashboard/src/components/map/MapComponent.tsx` | Dispatchers cannot visually monitor incidents and officer locations on a map. |
| **React Native / Expo** | Mobile App | `~52.0.23` / `0.76.5` | Cross-platform mobile development environment targeting Android tactical patrol units. | `apps/mobile-app/` | Patrol officers cannot receive field assignments or stream location data from mobile devices. |
| **Expo Location** | Mobile Hardware | `~18.0.4` | Fetches device GPS coordinates in foreground and background. | `apps/mobile-app/src/services/gpsService.ts` | Backend cannot track patrol unit positions on tactical maps. |
| **Expo Battery** | Mobile Hardware | `~8.0.1` | Reads patrol device battery level and charging status for telemetry. | `apps/mobile-app/src/services/batteryService.ts` | Dispatchers cannot assess whether a field unit's device is running out of power. |
| **Expo Notifications** | Mobile OS Layer | `~0.29.13` | Displays ongoing system notifications required by Android for persistent background execution. | `apps/mobile-app/src/services/foregroundService.ts` | Android OS battery management kills the mobile app's background GPS and WebSocket tracking. |

---

## PART 2 — COMPLETE ARCHITECTURE

### Architecture Diagram
```
+----------------------------------------------------------------------------------------------------+
|                                           CLIENT LAYER                                             |
|                                                                                                    |
|  +--------------------------------------------+    +--------------------------------------------+  |
|  |       Next.js 15 Web Dashboard             |    |          Expo / React Native App           |  |
|  |   - AuthContext (JWT stored in LocalStorage)|    |   - Persistent Foreground Service          |  |
|  |   - WebSocketProvider (Heartbeat, Auto-Rec)|    |   - GPS Service (5s Polling)               |  |
|  |   - Leaflet Map (Live Alerts & Patrol GPS) |    |   - Battery Service (Device Telemetry)     |  |
|  |   - Surveillance Grid, Uploads & Logs      |    |   - TacticalAlertPopup (Full-Screen Alert) |  |
|  +----------------------+---------------------+    +---------------------+----------------------+  |
+-------------------------|------------------------------------------------|-------------------------+
                          |                                                |
                          | HTTP REST (JSON / Multipart)                   | HTTP REST (JSON)
                          | WebSocket (ws://.../ws/connect)                | WebSocket (ws://.../ws/connect)
                          v                                                v
+----------------------------------------------------------------------------------------------------+
|                                        BACKEND SERVER LAYER                                        |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  |                            FastAPI Application (Python 3.12)                                 |  |
|  |                                                                                              |  |
|  |  [ Middleware & Security ]                                                                    |  |
|  |  - CORS Middleware (Localhost + Production DPDNS Domain)                                     |  |
|  |  - Global Exception Handlers (Validation, HTTP, Uncaught)                                    |  |
|  |  - OAuth2 Password Bearer + JWT Token Decoder (deps.get_current_user)                          |  |
|  |                                                                                              |  |
|  |  [ REST API Routers (/api/v1) ]                                                               |  |
|  |  - /auth            -> Login, JWT Issue, Role Extraction                                     |  |
|  |  - /alerts          -> Stats, List, PATCH Status (Verified, En-Route, Found)                 |  |
|  |  - /missing-persons -> CRUD, Image Upload + 512d Embedding + Retroactive Search              |  |
|  |  - /ai-events       -> Live Camera Ingestion, Detection Events, Mock Alert Trigger           |  |
|  |  - /uploads         -> Video Upload, Background Video Analysis Dispatch                      |  |
|  |  - /search          -> In-Memory Cosine Similarity Vector Search Engine                      |  |
|  |  - /admin & /settings-> User Admin, Config Parameters (CPU/GPU Engine)                       |  |
|  |                                                                                              |  |
|  |  [ Real-Time WebSocket Manager ]                                                             |  |
|  |  - active_admins: {user_id: WebSocket}                                                       |  |
|  |  - active_dispatchers: {user_id: WebSocket}                                                  |  |
|  |  - active_patrols: {user_id: WebSocket}                                                      |  |
|  |  - Ingests 'telemetry' events -> Updates DB -> Broadcasts location to Dashboard              |  |
|  |                                                                                              |  |
|  |  [ Video Processor Core (BackgroundTasks) ]                                                  |  |
|  |  - Launches AI Subprocess (`asyncio.create_subprocess_exec`)                                   |  |
|  |  - Streams stdout progress ('PROGRESS:X%') -> Throttled DB commit (1% intervals)              |  |
|  |  - Ingests final JSON ('RESULT:[...]') -> Inserts FaceCrop records into DB                   |  |
|  +------------------------------+----------------------------------+----------------------------+  |
+---------------------------------|----------------------------------|-------------------------------+
                                  |                                  |
                                  | Async Subprocess Execution       | Asyncpg (SQLAlchemy 2.0 ORM)
                                  v                                  v
+----------------------------------------------------+  +--------------------------------------------+
|                  AI ENGINE LAYER                   |  |              DATABASE LAYER                |
|                                                    |  |                                            |
|  [ Subprocess Runner: run_pipeline.py ]            |  |  [ PostgreSQL Relational Database ]        |
|  - Process Isolation: Zero SEGV 11 Thread Contention|  |  - 20 Relational Tables                    |
|                                                    |  |  - JSON Columns for 512d Vector Embeddings|
|  [ Computer Vision Pipeline ]                      |  |                                            |
|  1. FrameExtractor: OpenCV (skip_interval=5)       |  |  Core Tables:                              |
|  2. FaceDetector: YOLOv8-face (ONNX/PyTorch)       |  |  - users, roles, officers, dispatch_units  |
|     (Max dimension 1920, Aspect Ratio Filter)      |  |  - missing_persons, face_crops             |
|  3. IoU Tracker: Multi-object spatial tracking     |  |  - camera_feeds, locations, video_footages |
|  4. Blur Filter: Laplacian Variance Sharpness      |  |  - detection_events, alerts, assignments   |
|  5. AdaFace IR50: 512d normalized vector tensor    |  |  - activity_logs, notifications            |
+----------------------------------------------------+  +--------------------------------------------+
```

### Component Connections & Protocols
1. **Web Dashboard <-> Backend:**
   - **HTTP REST:** Communicates with `/api/v1/*` using standard `fetch()` or `XMLHttpRequest` (for file upload progress). Headers include `Authorization: Bearer <JWT>`.
   - **WebSocket:** Connects to `ws://localhost:8000/api/v1/ws/connect?token=<JWT>`. Receives real-time alert updates (`possible_match_detected`, `alert_status_updated`) and officer telemetry. Sends 25-second ping heartbeats.
2. **Mobile App <-> Backend:**
   - **HTTP REST:** Authenticates at `/api/v1/auth/login` and updates assigned alert statuses at `/api/v1/alerts/{id}/status`.
   - **WebSocket:** Connects to the same WebSocket endpoint. Receives targeted `assignment` events and transmits periodic `telemetry` JSON packets `{lat, lng, batteryLevel, isCharging}`.
3. **Backend <-> Database:**
   - Uses **SQLAlchemy 2.0 Async Engine** connected via **asyncpg** over TCP (port 5432). All queries use `async with AsyncSessionLocal()` with explicit transaction commits.
4. **Backend <-> AI Engine:**
   - Instead of running GPU/CPU deep learning models directly in the FastAPI ASGI thread (which causes C++ thread locks and segmentation faults), the backend spawns a separate OS subprocess running `services/ai/run_pipeline.py` via `asyncio.create_subprocess_exec`.
   - Communication occurs through standard streams: parent captures `stdout` progress lines (`PROGRESS:50.0`) and reads final JSON output (`RESULT:[...]`).

---

## PART 3 — REQUEST FLOW

### Flow 1: Missing Person Case Registration & Historical CCTV Vector Sweep
```
1. User (Dispatcher/Admin) fills form on Dashboard (/missing/new) with name, age, last seen location, priority.
2. Next.js triggers createMissingPerson(data) in apps/web-dashboard/src/lib/api.ts.
3. Sends POST /api/v1/missing-persons/ with JSON body.
4. services/backend/api/deps.py validates JWT Bearer token and user role ('admin' or 'dispatcher').
5. Endpoint create_missing_person in services/backend/api/v1/endpoints/missing_persons.py generates case number MP-XXXXXX.
6. Saves MissingPerson record to database with status="Reported".
7. Next.js receives created person ID and immediately triggers uploadMissingPersonImage(id, file).
8. Sends POST /api/v1/missing-persons/{person_id}/image with Multipart form data.
9. Endpoint upload_missing_person_image saves image to services/backend/uploads/missing_persons/{id}.jpg.
10. Calls generate_embedding(image_bytes) in services/ai/recognition/embedding_service.py.
11. EmbeddingService runs YOLOv8 face detection, crops face, resizes to 112x112, normalizes to [-1, 1], and runs AdaFace IR50 to generate 512 float values.
12. MissingPerson.face_embedding is updated in PostgreSQL.
13. Endpoint automatically calls search_person_against_crops(person_id, db) in services/backend/api/v1/endpoints/search.py.
14. Search engine queries all FaceCrop records from historical video footage, executes Cosine Similarity (threshold >= 0.30), creates DetectionEvent and Alert records for any matches, and commits to DB.
15. Response returned to Next.js; UI redirects to /missing.
```

---

### Flow 2: CCTV Video Footage Upload & Background AI Face Extraction
```
1. User drops video file (.mp4) on /uploads page and clicks "Upload Footage".
2. Next.js calls uploadFootageWithProgress() in apps/web-dashboard/src/lib/api.ts.
3. Sends POST /api/v1/uploads/ via XMLHttpRequest to stream upload progress bar.
4. services/backend/api/v1/endpoints/uploads.py saves video to services/backend/uploads/videos/{uuid}.mp4 and creates VideoFootage DB record (status="PENDING", progress=0.0).
5. User clicks "Analyze" -> Next.js calls analyzeVideo(id) -> POST /api/v1/uploads/{id}/analyze.
6. Endpoint schedules process_video_task(video_id) using FastAPI BackgroundTasks.
7. Background task in services/backend/core/video_processor.py updates VideoFootage.status="PROCESSING".
8. video_processor.py executes asyncio.create_subprocess_exec(python, "services/ai/run_pipeline.py", video_path, video_id, crops_dir, log_file).
9. Subprocess executes run_analysis_pipeline() in services/ai/pipeline.py:
   a. FrameExtractor reads frames using OpenCV (skip_interval=5 frames).
   b. FaceDetector detects faces using YOLOv8 (yolov8n-face.pt/onnx).
   c. IoU Tracker groups detections into temporal subject tracks (IoU >= 0.3).
   d. Laplacian Variance blur scoring computes sharpness for every crop in a track.
   e. When a track ends, pipeline selects ONLY the single sharpest face crop.
   f. Sharpest crop is processed by AdaFace to generate 512d vector embedding.
   g. Crops saved to disk (uploads/crops/{video_id}/track_X_frame_Y.jpg).
10. Subprocess prints "PROGRESS:X" over stdout. video_processor.py parses progress and commits to DB at 1% intervals.
11. Subprocess completes and prints "RESULT:[{crop_path, frame_idx, embedding}, ...]".
12. video_processor.py parses JSON and bulk-inserts FaceCrop records into PostgreSQL.
13. Updates VideoFootage.status="COMPLETED", progress=100.0, and commits transaction.
```

---

### Flow 3: Live Detection Event, Real-Time Alerting, and Tactical Patrol Dispatch
```
1. Edge camera (or mock simulator) sends frame to POST /api/v1/ai-events/ with camera_id and lat/lng coordinates.
2. Endpoint ingest_ai_event in services/backend/api/v1/endpoints/ai_events.py fetches all active MissingPerson records with embeddings.
3. FaceDetector detects faces; FaceCropper extracts crops; Preprocessor normalizes images.
4. generate_embedding() computes 512d AdaFace vector for each detected face.
5. get_best_match() in services/ai/recognition/ranking_service.py compares vector against all active missing persons using Cosine Similarity (threshold=0.30).
6. If match found (e.g. similarity >= 0.30):
   a. Applies CCTV confidence boost: if confidence < 40%, scales to confidence + 30%.
   b. Creates DetectionEvent record (confidence score, camera_id, image_path, timestamp).
   c. Creates Alert record (status="Pending", severity="High", missing_person_id).
   d. Commits transaction to PostgreSQL.
   e. Triggers manager.broadcast_global_alert({"event": "possible_match_detected", "data": alert_data}).
7. Control room Next.js dashboard receives WebSocket event:
   - WebSocketProvider updates alert state.
   - Triggers audio alarm (audio/alert.mp3).
   - Alert appears on dashboard live feed and tactical Leaflet map.
8. Dispatcher inspects match on /alerts/[id] and clicks "Verify".
9. Web dashboard sends PATCH /api/v1/alerts/{id}/status with {"status": "Verified"}.
10. alerts.py endpoint calls dispatch_service.assign_nearest_patrol(db, alert, lat, lng).
11. dispatch_service.py finds available patrol unit and calls manager.broadcast_to_patrols({"event": "assignment", "data": assignment_payload}).
12. Field officer's React Native app receives WebSocket event:
   - Plays audio alert.
   - Displays full-screen modal TacticalAlertPopup.tsx.
13. Officer taps "RESPOND" on mobile app:
   - Mobile app sends PATCH /api/v1/alerts/{id}/status with {"status": "EN-ROUTE"}.
   - Backend creates Assignment record linking Officer, Alert, and DispatchUnit.
   - Broadcasts alert_status_updated to control room dashboard.
14. Mobile app GPS service (gpsService.ts) sends telemetry every 5 seconds over WebSocket:
   - Packet: {"type": "telemetry", "lat": 12.97, "lng": 77.59, "batteryLevel": 0.85, "isCharging": false}.
   - websockets.py receives telemetry -> TelemetryService updates dispatch_units table -> Broadcasts to web map.
15. Officer arrives at scene, locates individual, and taps "MARK FOUND":
   - Sends PATCH /api/v1/alerts/{id}/status with {"status": "FOUND"}.
   - Backend sets Alert.status="FOUND", Alert.resolved_at=now(), and auto-sets MissingPerson.status="Found".
   - Control room dashboard reflects resolved case in real time.
```

---

## PART 4 — CODEBASE STUDY ROADMAP

To master the codebase efficiently for technical interviews, follow this structured 4-stage execution order.

```
STAGE 1: System Foundation, Config & Database Models
   │  (Understand data structures, environment config, and relational schema)
   ▼
STAGE 2: Backend Architecture, Auth & Core Endpoints
   │  (Understand FastAPI routing, JWT auth, WebSocket connection manager, and services)
   ▼
STAGE 3: AI Computer Vision Engine & Subprocess Pipeline
   │  (Understand YOLOv8, IoU tracking, Laplacian sharpness, AdaFace embeddings, and subprocess isolation)
   ▼
STAGE 4: Frontend Applications (Web Dashboard & Mobile Patrol App)
      (Understand Next.js App Router, Leaflet maps, React Native Foreground Service & Telemetry)
```

---

### STAGE 1: System Foundation, Config & Database Models

#### 1.1 `services/backend/core/config.py`
- **Study Priority:** MUST STUDY DEEPLY
- **Lines:** 1–35
- **Key Classes/Vars:** `Settings`, `settings`, `DATABASE_URL`, `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- **What it does:** Uses Pydantic `BaseSettings` to load environment variables and construct the async PostgreSQL URI (`postgresql+asyncpg://`).
- **Interview Focus:** How settings are loaded, why asyncpg is needed in the DB connection string, and how default fallbacks operate.

#### 1.2 `database/db/base.py` & `database/db/session.py`
- **Study Priority:** MUST STUDY DEEPLY
- **Lines:** `base.py` (1–20), `session.py` (1–22)
- **Key Classes/Vars:** `Base`, `UUIDMixin`, `TimestampMixin`, `engine`, `AsyncSessionLocal`, `get_db()`
- **What it does:** Declares SQLAlchemy base model mixins (auto-generating UUID primary keys and `created_at`/`updated_at` timestamps) and configures the `create_async_engine` connection pool.
- **Interview Focus:** Difference between sync and async SQLAlchemy engines; how `get_db` acts as an async generator dependency.

#### 1.3 `database/models/*.py`
- **Study Priority:** MUST STUDY DEEPLY
- **Files:** `auth.py`, `personnel.py`, `operations.py`, `registry.py`, `infrastructure.py`, `ai_events.py`, `system.py`
- **Key Classes:** `User`, `Role`, `Officer`, `DispatchUnit`, `Incident`, `Assignment`, `MissingPerson`, `CameraFeed`, `VideoFootage`, `FaceCrop`, `DetectionEvent`, `Alert`
- **What it does:** Defines 20 relational entities, foreign keys, relationships (`joinedload` targets), and JSON vector storage columns.
- **Interview Focus:** How `FaceCrop.embedding` and `MissingPerson.face_embedding` store 512d vectors in JSON; 1-to-1 relationship between `User` and `Officer`; cascade deletes on `FaceCrop`.

---

### STAGE 2: Backend Architecture, Auth & Core Endpoints

#### 2.1 `services/backend/main.py`
- **Study Priority:** MUST STUDY DEEPLY
- **Lines:** 1–55
- **Key Functions/Vars:** `app`, `origins`, `serve_uploads`, `health_live`
- **What it does:** FastAPI application entrypoint. Configures CORS, mounts `/api/v1` routes, registers custom exception handlers, and serves static files with fallback to production CDN.
- **Interview Focus:** Order of middleware execution; why CORS origins must be explicitly listed; how `/uploads/{path}` provides fallback redirection.

#### 2.2 `services/backend/core/security.py` & `services/backend/api/deps.py`
- **Study Priority:** MUST STUDY DEEPLY
- **Lines:** `security.py` (1–29), `deps.py` (1–49)
- **Key Functions:** `verify_password`, `get_password_hash`, `create_access_token`, `get_current_user`
- **What it does:** Implements Bcrypt password hashing and JWT token creation/decoding. `deps.py` acts as FastAPI dependency injection extracting the `sub` claim and loading the `User` with their `Role`.
- **Interview Focus:** JWT signing with HS256; token expiration handling; role-based access control inside FastAPI dependencies.

#### 2.3 `services/backend/core/websocket_manager.py` & `services/backend/api/v1/endpoints/websockets.py`
- **Study Priority:** MUST STUDY DEEPLY
- **Lines:** `websocket_manager.py` (1–98), `websockets.py` (1–70)
- **Key Classes/Functions:** `ConnectionManager`, `manager.connect()`, `manager.broadcast_global_alert()`, `websocket_endpoint()`
- **What it does:** Manages in-memory WebSocket connections partitioned into role dictionaries (`active_admins`, `active_dispatchers`, `active_patrols`). Handles ping/pong heartbeats and incoming officer GPS telemetry.
- **Interview Focus:** Why connections are bucketed by role; how connection drops are cleaned up; concurrency safety during async WebSocket sends.

#### 2.4 `services/backend/api/v1/endpoints/alerts.py`
- **Study Priority:** MUST STUDY DEEPLY
- **Lines:** 1–236
- **Key Functions:** `get_stats()`, `read_alerts()`, `update_alert_status()`
- **What it does:** Aggregates dashboard KPI counts; serves alerts with custom status/priority ordering; handles state transitions (`Verified`, `EN-ROUTE`, `FOUND`), dispatches patrol units, and auto-resolves missing person cases.
- **Interview Focus:** Complex SQL `order_by` using `case` statements; status transition side-effects; dispatching integration.

#### 2.5 `services/backend/api/v1/endpoints/search.py` & `ai_events.py`
- **Study Priority:** MUST STUDY DEEPLY
- **Lines:** `search.py` (1–190), `ai_events.py` (1–231)
- **Key Functions:** `cosine_similarity()`, `search_person_against_crops()`, `mass_search_all()`, `ingest_ai_event()`
- **What it does:** Implements in-memory Cosine Similarity vector search; ingests live camera frames; generates detection events and triggers WebSocket broadcasts.
- **Interview Focus:** Mathematical definition of Cosine Similarity; handling CCTV domain-gap with empirical confidence boosting; duplicate alert suppression.

#### 2.6 `services/backend/core/video_processor.py` & `services/backend/api/v1/endpoints/uploads.py`
- **Study Priority:** MUST STUDY DEEPLY
- **Lines:** `video_processor.py` (1–135), `uploads.py` (1–120)
- **Key Functions:** `process_video_task()`, `upload_video()`, `analyze_video()`
- **What it does:** Spawns isolated Python subprocesses for heavy video analysis using `asyncio.create_subprocess_exec`; parses stdout progress lines; bulk-inserts `FaceCrop` records into PostgreSQL.
- **Interview Focus:** Why subprocess isolation was chosen over in-process execution (preventing OpenMP/C++ SEGV 11 segfaults); progress throttling to avoid DB lock contention.

---

### STAGE 3: AI Computer Vision Engine & Subprocess Pipeline

#### 3.1 `services/ai/pipeline.py` & `services/ai/run_pipeline.py`
- **Study Priority:** MUST STUDY DEEPLY
- **Lines:** `pipeline.py` (1–196), `run_pipeline.py` (1–35)
- **Key Functions:** `run_analysis_pipeline()`, `calculate_iou()`
- **What it does:** Orchestrates the multi-stage CV pipeline: frame extraction (skip=5) -> YOLOv8 face detection -> IoU tracking across frames -> Laplacian variance blur filtering -> selection of sharpest crop per track -> AdaFace 512d embedding extraction.
- **Interview Focus:** Why threading limits (`OMP_NUM_THREADS=1`) are set before imports; how IoU multi-object tracking reduces redundant vector extraction by ~95%.

#### 3.2 `services/ai/detection/face_detection.py` & `face_cropper.py`
- **Study Priority:** MUST STUDY DEEPLY
- **Lines:** `face_detection.py` (1–144), `face_cropper.py` (1–60)
- **Key Classes:** `FaceDetector`, `FaceCropper`
- **What it does:** Executes YOLOv8-face on CPU (using ONNX runtime) or GPU; resizes frames >1920px; filters small noise boxes (<20x20px) and unnatural aspect ratios (0.6–1.15); applies 25% bounding box padding for facial feature preservation.
- **Interview Focus:** ONNX export for CPU acceleration; bounding box heuristic filters; aspect ratio validation.

#### 3.3 `services/ai/recognition/embedding_service.py` & `ranking_service.py`
- **Study Priority:** MUST STUDY DEEPLY
- **Lines:** `embedding_service.py` (1–187), `ranking_service.py` (1–50)
- **Key Functions:** `init_adaface_model()`, `generate_embedding()`, `get_best_match()`
- **What it does:** Downloads and loads AdaFace IR50 model (`minchul/cvlface_adaface_ir50_ms1mv2`); normalizes face crops to `112x112` RGB tensors; extracts 512-dimensional unit vector embeddings; ranks matches by cosine similarity.
- **Interview Focus:** AdaFace architecture vs standard FaceNet/ArcFace; input tensor normalization `(pixel - 127.5) / 128.0`; handling directory nesting and HuggingFace weights.

---

### STAGE 4: Frontend Applications (Web Dashboard & Mobile Patrol App)

#### 4.1 `apps/web-dashboard/src/lib/auth-context.tsx` & `websocket.tsx`
- **Study Priority:** SHOULD STUDY
- **Lines:** `auth-context.tsx` (1–75), `websocket.tsx` (1–125)
- **Key Components:** `AuthProvider`, `useAuth`, `WebSocketProvider`, `useWebSocket`
- **What it does:** Manages authentication token persistence in browser `localStorage`, automatic redirection for unauthenticated routes, and WebSocket connection with 25s ping/pong heartbeat and exponential backoff reconnection.
- **Interview Focus:** Reconnection strategies; handling WebSocket close code 1008 (Policy Violation / Auth Expired).

#### 4.2 `apps/web-dashboard/src/components/map/MapComponent.tsx` & `page.tsx`
- **Study Priority:** SHOULD STUDY
- **Lines:** `MapComponent.tsx` (1–110), `/app/page.tsx` (1–350)
- **What it does:** Renders dynamic Leaflet map displaying active alerts with colored severity markers and moving patrol units updated via WebSocket telemetry.
- **Interview Focus:** Dynamic client-side rendering of Leaflet in Next.js (disabling SSR for `window` object compatibility).

#### 4.3 `apps/mobile-app/App.tsx`, `dutyManager.ts` & `foregroundService.ts`
- **Study Priority:** MUST STUDY DEEPLY
- **Lines:** `App.tsx` (1–600), `dutyManager.ts` (1–80), `foregroundService.ts` (1–50)
- **Key Functions:** `goOnDuty()`, `startForegroundService()`, `startGpsTracking()`, `BackHandler.addEventListener()`
- **What it does:** Manages field officer duty lifecycle. Toggling "ON DUTY" starts an Android Foreground Service with an ongoing notification to prevent OS termination; streams GPS/battery telemetry every 5s; intercepts hardware back button to minimize rather than terminate app.
- **Interview Focus:** Why Android Foreground Services are necessary for background location tracking; mobile battery optimization mitigations.

---

## PART 5 — FILE-BY-FILE CODE EXPLANATION

### 1. `services/backend/main.py`
- **Responsibility:** Main application entrypoint, middleware configuration, static file serving, and router registration.
- **Important Imports:** `FastAPI`, `CORSMiddleware`, `FileResponse`, `RedirectResponse`, `settings`, `api_router`.
- **Important Variables:** `app` (FastAPI instance), `origins` (CORS whitelist), `uploads_path` (`services/backend/uploads`).
- **Key Functions:**
  - `serve_uploads(path: str)` (Lines 41–47): Checks if requested uploaded file exists locally on disk; if missing, issues HTTP 307 redirect to production CDN (`https://backend.garudaastra.dpdns.org/uploads/{path}`).
  - `health_live()` (Lines 49–51): Returns `{"status": "alive"}` for Kubernetes/Docker container health probes.
- **Data In/Out:** Ingests HTTP requests; routes to sub-routers; returns JSON responses or media files.
- **Dependencies:** Depends on `services/backend/core/config.py`, `services/backend/api/v1/router.py`.

---

### 2. `services/backend/core/websocket_manager.py`
- **Responsibility:** Thread-safe in-memory WebSocket connection pool and role-segmented broadcasting engine.
- **Important Classes & Methods:**
  - `ConnectionManager`:
    - `self.active_admins: Dict[str, WebSocket]`: Admin connections mapped by `user_id`.
    - `self.active_dispatchers: Dict[str, WebSocket]`: Control room dispatcher connections.
    - `self.active_patrols: Dict[str, WebSocket]`: Mobile patrol unit connections.
    - `connect(websocket, user)`: Validates role and stores socket in correct bucket. Closes with code `1008` if role is unauthorized.
    - `disconnect(user)`: Removes user from bucket upon disconnect.
    - `broadcast_global_alert(message)`: Iterates and sends JSON to all connected admins, dispatchers, and patrols.
    - `send_personal_message(message, user_id, role)`: Direct message targeting a single officer/dispatcher.
- **Why it matters for interviews:** Solves multi-tenant real-time routing without requiring an external Redis Pub/Sub layer for single-instance deployments.

---

### 3. `services/backend/core/video_processor.py`
- **Responsibility:** Background task executor for CCTV video analysis and AI subprocess lifecycle management.
- **Important Functions:**
  - `process_video_task(video_id: str)` (Lines 18–135):
    - Fetches `VideoFootage` from DB using `AsyncSessionLocal()`.
    - Spawns isolated subprocess: `python -u services/ai/run_pipeline.py <video_path> <video_id> <crops_dir> <log_file>`.
    - Reads `stdout` stream line-by-line:
      - `PROGRESS:X`: Updates `video.progress = X`. Commits to DB only when `prog - last_db_commit_prog >= 1.0` (throttles I/O).
      - `RESULT:[...]`: Parses final JSON containing face crop paths, frame numbers, and 512d embeddings.
      - Bulk creates `FaceCrop` database records.
      - Sets `video.status = "COMPLETED"`, `video.progress = 100.0`.
- **Why it matters for interviews:** Direct solution to Python C++ thread contention and OpenMP segmentation faults (`SEGV 11`).

---

### 4. `services/ai/pipeline.py`
- **Responsibility:** Core computer vision orchestration pipeline combining detection, tracking, blur assessment, and embedding extraction.
- **Important Environment Flags (Lines 3–9):** Sets `OMP_NUM_THREADS="1"`, `OPENBLAS_NUM_THREADS="1"`, `MKL_NUM_THREADS="1"` to eliminate CPU thread race conditions.
- **Key Functions:**
  - `calculate_iou(boxA, boxB) -> float` (Lines 27–42): Computes Intersection over Union of two bounding boxes:
    $$\text{IoU} = \frac{\text{Area}(\text{Intersection})}{\text{Area}(\text{BoxA}) + \text{Area}(\text{BoxB}) - \text{Area}(\text{Intersection})}$$
  - `run_analysis_pipeline(...)` (Lines 43–196):
    - Extracts frames with `skip_interval=5`.
    - Runs YOLOv8 face detection.
    - Matches boxes to existing active tracks if `IoU >= 0.3`.
    - Computes Laplacian variance sharpness: `cv2.Laplacian(gray, cv2.CV_64F).var()`.
    - Stores the crop with the maximum sharpness score per track.
    - When a track is lost (`missed_frames > 15`), runs AdaFace embedding extraction on the sharpest crop only.

---

### 5. `services/ai/recognition/embedding_service.py`
- **Responsibility:** Deep facial feature embedding extraction using AdaFace IR50.
- **Key Functions:**
  - `init_adaface_model()` (Lines 18–94): Checks for local weights in `services/ai/models/cvlface_adaface_ir50_ms1mv2`. If missing, downloads from HuggingFace (`minchul/cvlface_adaface_ir50_ms1mv2`).
  - `generate_embedding(image_bytes: bytes) -> Optional[List[float]]` (Lines 98–187):
    - Decodes image bytes to OpenCV BGR array.
    - If input is a large uncropped photo (>150x150), runs YOLOv8 detection and crops face first.
    - Resizes to `112x112` RGB.
    - Normalizes pixel values to `[-1, 1]` range: `(pixel - 127.5) / 128.0`.
    - Feeds tensor into AdaFace model producing a 512-dimensional float list.

---

### 6. `services/backend/api/v1/endpoints/alerts.py`
- **Responsibility:** Alert listing, KPI statistics, status transitions, and smart dispatch triggers.
- **Key Functions:**
  - `get_stats()` (Lines 21–70): Runs `select(func.count(Alert.id))` across status types (`pending`, `Verified`, `Rejected`) and missing persons.
  - `read_alerts()` (Lines 71–123): For officers, filters `Alert.status == 'Verified'`. For dispatchers/admins, sorts by Pending first -> Missing Person Priority (Critical -> High -> Normal -> Low) -> Confidence Score DESC -> Date DESC.
  - `update_alert_status()` (Lines 124–235): Updates alert status. If `Verified`, invokes `dispatch_service.assign_nearest_patrol`. If `EN-ROUTE`, creates/updates officer `Assignment`. If `FOUND`, auto-updates `MissingPerson.status = "Found"`. Broadcasts `alert_status_updated` to all WebSockets.

---

### 7. `services/backend/api/v1/endpoints/search.py`
- **Responsibility:** In-memory vector similarity search comparing missing person embeddings against CCTV `FaceCrop` records.
- **Key Functions:**
  - `cosine_similarity(v1, v2) -> float` (Lines 18–30): Calculates normalized dot product:
    $$\text{Cosine Similarity} = \frac{v_1 \cdot v_2}{\|v_1\| \|v_2\|}$$
  - `search_person_against_crops(person_id, threshold=0.30)` (Lines 31–118): Fetches person's 512d embedding, loops over all `FaceCrop.embedding` records, creates `DetectionEvent` and `Alert` records for matches >= 0.30, and applies +30% confidence boost for sub-40% matches.
  - `mass_search_all(threshold=0.30)` (Lines 119–190): Sweeps all active missing persons against all face crops in a single batch pass.

---

## PART 6 — DATABASE ANALYSIS

### 1. Database Technology & Configuration
- **Technology:** PostgreSQL
- **Driver:** `asyncpg` (`postgresql+asyncpg://`)
- **ORM:** SQLAlchemy 2.0 Async (`AsyncSession`, `select`, `joinedload`)
- **Schema Management:** Alembic migrations (`database/alembic/`)
- **Primary Key Strategy:** UUIDv4 across all tables via `UUIDMixin` in `database/db/base.py`.

---

### 2. Table-by-Table Schema Breakdown (20 Tables)

| Model / Table | Important Fields & Types | Relationships | Used By |
| :--- | :--- | :--- | :--- |
| **`roles`** | `id` (UUID, PK)<br>`name` (String 50, Unique, Indexed: `admin`, `dispatcher`, `officer`, `patrol`)<br>`permissions` (String) | `1:N` with `users` | Auth dependency (`deps.py`), WebSocket manager |
| **`users`** | `id` (UUID, PK)<br>`email` (String 255, Unique, Indexed)<br>`hashed_password` (String 255)<br>`full_name` (String 255)<br>`role_id` (FK -> `roles.id`) | `N:1` with `roles`<br>`1:1` with `officers`<br>`1:N` with `activity_logs`, `evidence_files` | `auth.py`, `deps.py`, `admin.py` |
| **`officers`** | `id` (UUID, PK)<br>`user_id` (FK -> `users.id`, Unique)<br>`badge_number` (String 50, Unique, Indexed)<br>`unit_type` (String 50)<br>`status` (String 50, Default: "Off Duty")<br>`dispatch_unit_id` (FK -> `dispatch_units.id`) | `1:1` with `users`<br>`N:1` with `dispatch_units`<br>`1:N` with `assignments` | `alerts.py`, `dispatch_service.py`, `telemetry_service.py` |
| **`dispatch_units`** | `id` (UUID, PK)<br>`name` (String 100, Unique)<br>`status` (String 50, Default: "Available")<br>`last_known_lat` (Float)<br>`last_known_lng` (Float) | `1:N` with `officers`<br>`1:N` with `assignments` | `telemetry_service.py`, `dispatch_service.py`, `patrol` web page |
| **`locations`** | `id` (UUID, PK)<br>`name` (String 255)<br>`latitude` (Float Double Precision)<br>`longitude` (Float Double Precision)<br>`address` (String) | `1:N` with `camera_feeds`, `incidents` | Map markers, incident geolocation |
| **`camera_feeds`** | `id` (UUID, PK)<br>`name` (String 255)<br>`stream_url` (String 512)<br>`status` (String 50, Default: "Online")<br>`last_heartbeat` (DateTime TZ)<br>`location_id` (FK -> `locations.id`) | `N:1` with `locations`<br>`1:N` with `detection_events` | `ai_events.py`, `surveillance` page |
| **`video_footages`** | `id` (UUID, PK)<br>`filename` (String 255)<br>`file_path` (String 1024)<br>`status` (String 50, Default: "PENDING")<br>`camera_id` (String 255)<br>`sector` (String 255)<br>`priority` (String 50)<br>`progress` (Float, Default: 0.0) | `1:N` with `face_crops` (cascade delete) | `uploads.py`, `video_processor.py` |
| **`face_crops`** | `id` (UUID, PK)<br>`video_id` (FK -> `video_footages.id`)<br>`frame_idx` (Integer)<br>`image_path` (String 1024)<br>`embedding` (JSON — stores 512 float vector array) | `N:1` with `video_footages` | `video_processor.py`, `search.py` |
| **`missing_persons`** | `id` (UUID, PK)<br>`case_number` (String 50, Unique, Indexed)<br>`full_name` (String 255)<br>`age` (Integer)<br>`gender` (String 50)<br>`description` (String)<br>`photo_path` (String 255)<br>`face_embedding` (JSON — stores 512 float vector array)<br>`last_seen_location` (String 255)<br>`priority` (String 50)<br>`status` (String 50, Default: "Reported") | `1:N` with `detection_events`, `alerts` | `missing_persons.py`, `search.py`, `ai_events.py` |
| **`detection_events`**| `id` (UUID, PK)<br>`camera_id` (FK -> `camera_feeds.id`)<br>`timestamp` (DateTime TZ)<br>`confidence_score` (Float)<br>`match_type` (String 50)<br>`person_id` (FK -> `missing_persons.id`)<br>`image_path` (String 255)<br>`frame_timestamp` (String 100) | `N:1` with `camera_feeds`<br>`N:1` with `missing_persons`<br>`1:1` with `alerts` | `ai_events.py`, `search.py`, `alerts.py` |
| **`alerts`** | `id` (UUID, PK)<br>`detection_event_id` (FK -> `detection_events.id`, Unique)<br>`status` (String 50, Indexed, Default: "Pending")<br>`severity` (String 50, Default: "High")<br>`acknowledged_at` (DateTime TZ)<br>`resolved_at` (DateTime TZ)<br>`missing_person_id` (FK -> `missing_persons.id`) | `1:1` with `detection_events`<br>`N:1` with `missing_persons`<br>`1:N` with `assignments` | `alerts.py`, `dispatch_service.py`, `websocket_manager.py` |
| **`assignments`** | `id` (UUID, PK)<br>`officer_id` (FK -> `officers.id`)<br>`dispatch_unit_id` (FK -> `dispatch_units.id`)<br>`incident_id` (FK -> `incidents.id`)<br>`alert_id` (FK -> `alerts.id`)<br>`status` (String 50, Default: "Assigned") | `N:1` with `officers`, `dispatch_units`, `alerts` | `alerts.py`, `dispatch_service.py` |
| **`incidents`** | `id` (UUID, PK)<br>`title` (String 255)<br>`description` (Text)<br>`status` (String 50, Indexed)<br>`severity` (String 50)<br>`location_id` (FK -> `locations.id`) | `1:N` with `incident_updates`, `assignments` | Incident tracking module |
| **`incident_updates`**| `id` (UUID, PK)<br>`incident_id` (FK -> `incidents.id`)<br>`user_id` (FK -> `users.id`)<br>`text` (Text) | `N:1` with `incidents`, `users` | Incident audit trail |
| **`notifications`** | `id` (UUID, PK)<br>`user_id` (FK -> `users.id`)<br>`type` (String 50)<br>`content` (Text)<br>`is_read` (Boolean, Default: False) | `N:1` with `users` | User notification center |
| **`activity_logs`** | `id` (UUID, PK)<br>`user_id` (FK -> `users.id`)<br>`action` (String 100)<br>`entity_type` (String 50)<br>`entity_id` (UUID)<br>`details` (Text / JSON String) | `N:1` with `users` | Audit & compliance logging (`/logs`) |
| **`evidence_files`** | `id` (UUID, PK)<br>`file_path` (String 512)<br>`uploader_id` (FK -> `users.id`)<br>`incident_id` (FK -> `incidents.id`)<br>`alert_id` (FK -> `alerts.id`) | `N:1` with `users` | File upload storage |
| **`system_status`** | `id` (UUID, PK)<br>`component` (String 50, Unique)<br>`status` (String 50)<br>`last_checked` (DateTime TZ) | Standalone | System health probes |
| **`ai_health_status`**| `id` (UUID, PK)<br>`status` (String 50)<br>`last_ping` (DateTime TZ) | Standalone | AI engine monitoring |
| **`system_settings`** | `id` (UUID, PK)<br>`processing_engine` (String 20: `cpu`/`gpu`)<br>`detection_threshold` (Float: `0.45`)<br>`face_extraction_enabled` (Boolean: `True`)<br>`sound_alerts_enabled` (Boolean: `True`) | Standalone | `settings.py`, `face_detection.py` |

---

### 3. Database Interview Questions & Trade-Offs

#### Why Relational (PostgreSQL) vs Non-Relational (MongoDB)?
- **Relational Strengths in this Project:** Strict foreign-key integrity between Users -> Officers -> Assignments -> Alerts -> DetectionEvents -> MissingPersons prevents orphan records (e.g., an assignment pointing to a deleted alert).
- **Transactional Consistency:** State transitions (e.g., changing an alert to `Verified` while atomically creating an `Assignment` and updating `MissingPerson.status`) require ACID transaction guarantees (`db.commit()`).

#### How are Vector Embeddings Stored and Queried?
- **Current Implementation:** Vector embeddings (512 float values) are stored as JSON arrays (`face_embedding = Column(JSON)`).
- **Search Execution:** Fetched into memory and computed using NumPy vector dot products via Python (`services/backend/api/v1/endpoints/search.py`).

---

### POSSIBLE IMPROVEMENTS (Future Roadmap)
- **pgvector Extension:** Migrate `JSON` embedding columns to native PostgreSQL `vector(512)` data types. Add HNSW (Hierarchical Navigable Small World) or IVFFlat indexes to enable sub-millisecond database-level vector searches (`ORDER BY embedding <=> query_vector LIMIT 10`), eliminating the need to load all embeddings into Python RAM.
- **Connection Pooling Optimization:** Implement external PgBouncer connection pooling to handle thousands of concurrent short-lived backend connections.
- **Read Replicas:** Route heavy vector sweep queries (`POST /api/v1/search/mass`) to read replicas, preventing analytical query spikes from blocking transactional API operations.

---

## PART 7 — API ANALYSIS

### Complete API Endpoint Reference Table

| Method | Endpoint | Input (Params / Body) | Authentication | Handler Function & File | Database Action / Logic | Response (Status & Data) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/login` | Form: `username`, `password` | None (Public) | `login_access_token`<br>`endpoints/auth.py:20` | Queries `users` + `roles`; validates Bcrypt password hash. | **200:** `{"access_token", "token_type": "bearer", "role", "user_id", "full_name"}`<br>**401:** Invalid credentials |
| **GET** | `/api/v1/alerts/stats` | None | Bearer JWT | `get_stats`<br>`endpoints/alerts.py:21` | Executes `COUNT` aggregations on `Alert`, `MissingPerson`, and `DetectionEvent`. | **200:** `{"total_alerts", "pending_alerts", "verified_alerts", ...}` |
| **GET** | `/api/v1/alerts/` | Query: `skip`, `limit` | Bearer JWT | `read_alerts`<br>`endpoints/alerts.py:71` | Fetches alerts with eager `joinedload` on `detection_event`, `missing_person`, `assignments`. | **200:** `List[AlertRead]` sorted by Pending -> Priority -> Confidence |
| **PATCH** | `/api/v1/alerts/{id}/status` | Body: `{"status": str}` | Bearer JWT (`admin`, `dispatcher`, `officer`) | `update_alert_status`<br>`endpoints/alerts.py:124` | Updates alert status; triggers `assign_nearest_patrol` if `Verified`; auto-resolves missing person if `FOUND`; broadcasts WS alert. | **200:** Updated `AlertRead`<br>**400:** Already assigned<br>**404:** Alert not found |
| **POST** | `/api/v1/missing-persons/` | JSON: `full_name`, `age`, `gender`, `last_seen_location`, `priority` | Bearer JWT (`admin`, `dispatcher`) | `create_missing_person`<br>`endpoints/missing_persons.py:17` | Generates `MP-XXXXXX` case number; inserts `MissingPerson` record. | **201:** `MissingPersonRead` |
| **GET** | `/api/v1/missing-persons/` | Query: `skip`, `limit` | Bearer JWT | `read_missing_persons`<br>`endpoints/missing_persons.py:51` | Selects all missing persons with pagination. | **200:** `List[MissingPersonRead]` |
| **POST** | `/api/v1/missing-persons/{id}/image` | Multipart: `image` file | Bearer JWT (`admin`, `dispatcher`) | `upload_missing_person_image`<br>`endpoints/missing_persons.py:68` | Saves mugshot to disk; runs AdaFace to extract 512d vector; saves to DB; triggers auto vector search against historical `FaceCrop` records. | **200:** `{"status": "success", "message": "Face embedding generated successfully"}` |
| **PATCH** | `/api/v1/missing-persons/{id}/status` | JSON: `{"status": str}` | Bearer JWT | `update_missing_person_status`<br>`endpoints/missing_persons.py:121` | Updates missing person status (`Reported`, `Found`, `Closed`). | **200:** `MissingPersonRead` |
| **POST** | `/api/v1/ai-events/` | Form: `camera_id`, `location_lat`, `location_lng`, Multipart: `image` | None / API Key | `ingest_ai_event`<br>`endpoints/ai_events.py:25` | Runs YOLO face detection -> AdaFace embedding -> Cosine similarity vs active missing persons -> Creates `DetectionEvent` + `Alert` -> WS Broadcast. | **200:** `{"status": "success", "events_created": [...]}` |
| **POST** | `/api/v1/ai-events/test-alert` | None | Bearer JWT | `test_alert`<br>`endpoints/ai_events.py:170` | Creates simulated detection event & alert; broadcasts `possible_match_detected` over WebSockets. | **200:** `{"status": "success", "alert_id": ...}` |
| **POST** | `/api/v1/search/person/{id}` | Query: `threshold` (default 0.30) | Bearer JWT | `search_person_against_crops`<br>`endpoints/search.py:31` | Compares missing person vector against all `FaceCrop` records using Cosine Similarity; creates alerts for matches. | **200:** `{"message", "matches_found", "matches": [...]}` |
| **POST** | `/api/v1/search/mass` | Query: `threshold` (default 0.30) | Bearer JWT | `mass_search_all`<br>`endpoints/search.py:119` | Sweeps all reported missing persons against all `FaceCrop` records in a single batch pass. | **200:** `{"message", "matches_found"}` |
| **POST** | `/api/v1/uploads/` | Multipart: `file`, `camera_id`, `sector`, `priority` | Bearer JWT | `upload_video`<br>`endpoints/uploads.py:24` | Writes video to disk (`uploads/videos/{uuid}.mp4`); inserts `VideoFootage` record in status `PENDING`. | **200:** `VideoFootage` record |
| **POST** | `/api/v1/uploads/{id}/analyze` | Path: `id` | Bearer JWT | `analyze_video`<br>`endpoints/uploads.py:65` | Dispatches `process_video_task` to FastAPI `BackgroundTasks`. | **200:** `{"status": "processing_started"}` |
| **POST** | `/api/v1/uploads/batch-analyze` | None | Bearer JWT | `batch_analyze_videos`<br>`endpoints/uploads.py:90` | Dispatches background processing tasks for all `PENDING` or `ERROR` videos. | **200:** `{"status": "batch_processing_started", "queued_videos": [...]}` |
| **WS** | `/api/v1/ws/connect` | Query: `token` | Bearer JWT (in query param) | `websocket_endpoint`<br>`endpoints/websockets.py:22` | Authenticates user; registers in `ConnectionManager` role pool; receives `ping` and `telemetry` events; streams alerts. | Bidirectional WebSocket stream |
| **GET** | `/api/v1/settings/` | None | Bearer JWT | `get_settings`<br>`endpoints/settings.py:15` | Returns AI processing engine (`cpu`/`gpu`) and detection threshold. | **200:** `{"processing_engine", "detection_threshold", ...}` |
| **POST** | `/api/v1/settings/` | JSON: settings object | Bearer JWT (`admin`) | `update_settings`<br>`endpoints/settings.py:27` | Updates system-wide settings in DB. | **200:** Updated settings object |
| **GET** | `/health/live` | None | None (Public) | `health_live`<br>`main.py:49` | Health probe. | **200:** `{"status": "alive"}` |

---

## PART 8 — AUTHENTICATION AND SECURITY

### 1. Complete Authentication Lifecycle

```
[ User enters Email & Password on Next.js Login Page (/login) ]
                        │
                        ▼
[ Next.js API client sends POST /api/v1/auth/login ]
  Content-Type: application/x-www-form-urlencoded
  Body: username=dispatcher@astra.local&password=password123
                        │
                        ▼
[ Backend Handler: services/backend/api/v1/endpoints/auth.py ]
  1. Executes: SELECT * FROM users JOIN roles WHERE lower(email) = :username
  2. Calls pwd_context.verify(password, user.hashed_password) via passlib (Bcrypt)
  3. If invalid -> Raises HTTP 401 ("Incorrect email or password")
                        │
                        ▼
[ Token Generation: services/backend/core/security.py ]
  1. Claims: {"sub": str(user.id), "role": user.role.name, "exp": now + 30 mins}
  2. Signs token using HMAC-SHA256 (HS256) with SECRET_KEY
                        │
                        ▼
[ Response returned to Client ]
  {"access_token": "eyJhbGci...", "token_type": "bearer", "role": "dispatcher", ...}
                        │
                        ▼
[ Client Storage & Subsequent Requests ]
  - Web Dashboard: Stores token in browser localStorage ('astra_token')
  - Attaches header: `Authorization: Bearer eyJhbGci...` on all REST requests
  - WebSocket: Connects via `ws://localhost:8000/api/v1/ws/connect?token=eyJhbGci...`
```

---

### 2. Security Mechanisms & Missing Protections

#### Current Implementation:
- **Password Hashing:** Bcrypt (`passlib.context.CryptContext(schemes=["bcrypt"])`) with automatic salting and work factor configuration.
- **JWT Architecture:** Stateless tokens signed with symmetric `HS256` key; expiration enforced via the `exp` standard claim (default 30 minutes).
- **Role-Based Access Control (RBAC):** Verified at the endpoint level via `current_user.role.name in ["admin", "dispatcher"]`.
- **WebSocket Handshake Validation:** Token extracted from query parameter; closed immediately with code `1008` (Policy Violation) if token is invalid or expired.

#### Potential Weaknesses & How to Improve (Interview Analysis):
1. **JWT Stored in `localStorage`:**
   - *Current Risk:* Vulnerable to Cross-Site Scripting (XSS) attacks. Any injected script can read `localStorage.getItem('astra_token')`.
   - *Improvement:* Store JWT inside an `HttpOnly`, `Secure`, `SameSite=Strict` HTTP cookie, preventing client-side JavaScript access.
2. **Missing Refresh Token Rotation:**
   - *Current Risk:* Access tokens expire in 30 minutes with no refresh mechanism; users are abruptly logged out mid-operation.
   - *Improvement:* Implement short-lived Access Tokens (5 minutes) coupled with database-backed, rotating Refresh Tokens (7 days) stored in HttpOnly cookies.
3. **No Centralized Token Revocation (Blacklist):**
   - *Current Risk:* If an officer's phone is compromised, a valid JWT cannot be revoked until the 30-minute expiration elapses.
   - *Improvement:* Maintain a Redis-based token revocation blocklist or increment a `token_version` integer on the `users` table checked during token decoding.
4. **WebSocket Authentication via Query Parameter:**
   - *Current Risk:* Query parameters (`?token=...`) can appear in server access logs and browser histories.
   - *Improvement:* Authenticate WebSockets via initial message handshake or HTTP cookie headers.

---

## PART 9 — CONCURRENCY, RACE CONDITIONS & SCALING

### Scenario 1: Multiple Officers Accept the Same Alert Simultaneously

```
CURRENT BEHAVIOR:
- When an officer taps "RESPOND", Next.js/mobile sends PATCH /api/v1/alerts/{id}/status with status="EN-ROUTE".
- The handler in alerts.py (lines 191–195) inspects `len(alert.assignments) > 0` in Python memory. If an assignment exists, it raises HTTP 400 ("Alert is already assigned to another officer.").

POSSIBLE PROBLEM (Race Condition):
- If 10 patrol officers tap "RESPOND" at the exact same millisecond, 10 concurrent requests execute `SELECT ... WHERE alert_id = :id` simultaneously. All 10 see `len(alert.assignments) == 0`.
- All 10 execute `db.add(Assignment(...))` and commit, resulting in 10 officers assigned to 1 alert.

POSSIBLE SOLUTION:
1. Database Unique Constraint: Add a unique constraint `UNIQUE (alert_id)` on the `assignments` table so only the first database commit succeeds; all concurrent commits fail with a constraint violation.
2. Row-Level Pessimistic Locking: Use `select(Alert).where(Alert.id == alert_id).with_for_update()` in SQLAlchemy to lock the database row during the transaction.
```

---

### Scenario 2: High Concurrency Video Uploads and AI Inference

```
CURRENT BEHAVIOR:
- Each video analysis request triggers `process_video_task` via FastAPI `BackgroundTasks`.
- `video_processor.py` spawns a standalone OS process (`run_pipeline.py`).

POSSIBLE PROBLEM (Server Resource Exhaustion):
- If 20 dispatchers upload 20 video files simultaneously, FastAPI spawns 20 concurrent Python subprocesses, each attempting to load YOLOv8 and AdaFace models into RAM/VRAM and decoding frames.
- This causes Out-Of-Memory (OOM) crashes or CPU saturation.

POSSIBLE SOLUTION:
- Decoupled Distributed Task Queue (Celery + Redis / RabbitMQ):
  - Ingest videos and push task IDs to a message queue.
  - Run dedicated Celery GPU/CPU worker pools with concurrency capped at available hardware capacity (e.g. `concurrency=2` for GPU).
  - Background workers pull jobs sequentially without degrading the REST API server.
```

---

### Scenario 3: Real-Time WebSocket Broadcast Bottleneck at Scale

```
CURRENT BEHAVIOR:
- `ConnectionManager` maintains in-memory Python dictionaries: `self.active_patrols`, `self.active_dispatchers`.
- Broadcasting iterates through the dictionary and awaits `connection.send_json(message)`.

POSSIBLE PROBLEM (Single-Instance Memory & Slow Client Blocking):
- If the backend scales horizontally to 4 load-balanced server instances, an alert generated on Instance 1 will NOT reach dispatchers connected via WebSockets to Instance 2, 3, or 4.
- A slow mobile network connection can stall the broadcast iteration.

POSSIBLE SOLUTION:
- Redis Pub/Sub Backplane:
  - When an alert occurs, publish the event to a Redis channel (`redis.publish("astra_alerts", payload)`).
  - All backend server instances subscribe to the channel and broadcast to their locally connected clients.
  - Wrap individual socket sends in non-blocking fire-and-forget tasks (`asyncio.create_task(conn.send_json(...))`).
```

---

## PART 10 — PERFORMANCE AND OPTIMIZATION

| Subsystem | Identified Bottleneck | Why it Becomes Slow Under Load | Implementation Fix |
| :--- | :--- | :--- | :--- |
| **Vector Similarity Search** | In-Memory Cosine Search in Python (`search.py`) | Loading thousands of 512d JSON arrays into Python memory to compute NumPy dot products scales as $O(N \cdot M)$ in RAM and CPU time. | Integrate PostgreSQL `pgvector` with HNSW indexing. Vector comparisons execute in C inside PostgreSQL with sub-millisecond index scans. |
| **Database Write Contention** | Subprocess Video Progress Tracking | Writing `video.progress` to PostgreSQL on every frame update causes heavy disk I/O and row locking. | **Already mitigated in code (`video_processor.py:84`):** Commits are throttled to minimum 1.0% progress intervals (`if prog - last_db_commit_prog >= 1.0`). |
| **Computer Vision Inference** | High-Resolution Frame Decoding | Running deep learning inference directly on 2K/4K CCTV video frames consumes excessive compute. | **Already mitigated in code (`face_detection.py:92`):** Downscales frames exceeding 1920px max dimension; scales bounding box coordinates back to original resolution. |
| **Redundant Facial Embeddings** | Video Frame Face Duplication | A 30 FPS video generates 30 identical face crops per second for a single standing subject. Extracting 512d vectors for all crops wastes 95% of compute. | **Already mitigated in code (`pipeline.py:73`):** Combines IoU multi-frame tracking with Laplacian blur sharpness scoring to extract embeddings ONLY for the sharpest frame per track. |
| **Frontend Map Rerenders** | Frequent Patrol GPS Updates | Streaming GPS telemetry every 5s from 100 officers can trigger full React DOM re-renders in Next.js. | Use localized React state or Leaflet marker ref updates (`marker.setLatLng([lat, lng])`) without re-rendering the parent page component. |
| **Static Media Serving** | Missing Local Images on Dev Servers | Serving high-res crop files directly from FastAPI disk can saturate ASGI worker threads. | **Already mitigated in code (`main.py:47`):** Issues HTTP 307 redirects to external production CDN (`backend.garudaastra.dpdns.org`) for missing local media files. |

---

## PART 11 — PROJECT-SPECIFIC DEEP DIVE
### Multi-Stage Computer Vision Pipeline & Subprocess Isolation Architecture

```
                                      VIDEO FOOTAGE (.mp4)
                                                │
                                                ▼
                                    [ OpenCV VideoService ]
                               (Extract fps, total_frames, dims)
                                                │
                                                ▼
                                    [ FrameExtractor Engine ]
                                  (skip_interval = 5 frames)
                                                │
                                                ▼
                                 [ YOLOv8-face Object Detector ]
                         - Scale down 2K/4K frames (max_dim = 1920)
                         - Filter noise boxes (w < 20 or h < 20)
                         - Filter aspect ratios (0.6 <= w/h <= 1.15)
                                                │
                                                ▼
                                [ Spatial IoU Temporal Tracker ]
                               (IoU >= 0.3 matches existing track)
                                                │
                                                ▼
                                [ Laplacian Blur Quality Filter ]
                             Var(Laplacian(gray)) -> Sharpness Score
                                                │
                                                ▼
                            [ Select Sharpest Face Crop per Track ]
                              (25% Bounding Box Spatial Padding)
                                                │
                                                ▼
                                [ AdaFace 512d Vector Embedder ]
                         - Resize to 112x112 RGB
                         - Normalize pixels: (x - 127.5) / 128.0
                         - Forward pass -> 512 normalized floats
                                                │
                                                ▼
                            [ JSON Result Output & Database Sync ]
                         - Subprocess prints "RESULT:[{...}]"
                         - Parent bulk-inserts into `face_crops`
```

---

### Detailed Technical Analysis

#### 1. Why Subprocess Isolation Was Mandatory
In early development, running PyTorch/Ultralytics and OpenCV inside the main FastAPI async thread caused non-deterministic segmentation faults (`SEGV 11`). 
- **The Cause:** PyTorch, OpenCV, OpenMP (`libgomp`), and FastAPI's `asyncio` event loop use conflicting C++ thread pools and signal handlers. 
- **The Solution (`video_processor.py:62`):** Video processing is delegated to an isolated OS process spawned via `asyncio.create_subprocess_exec(sys.executable, "-u", "services/ai/run_pipeline.py", ...)`. The subprocess has an isolated memory space; if an error occurs, the parent FastAPI ASGI server remains 100% stable.

#### 2. Thread Limit Enforcement (`pipeline.py:4–9`)
Before importing `cv2` or `torch`, the pipeline explicitly sets:
```python
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
cv2.setNumThreads(0)
torch.set_num_threads(1)
```
This forces all native C++ libraries to run in single-threaded mode per worker, eliminating CPU core thrashing.

#### 3. Blur Quality Selection via Laplacian Variance
To avoid running embedding extraction on blurry motion frames, `cv2.Laplacian` computes the second spatial derivative of the grayscale image:
$$\text{Variance} = \frac{1}{N} \sum (L(x, y) - \mu)^2$$
High variance indicates sharp, defined edges; low variance indicates motion blur. Only the frame with the highest variance in a temporal track is passed to AdaFace.

#### 4. AdaFace Vector Embedding Extraction (`embedding_service.py`)
- **Model:** AdaFace IR50 trained on MS1MV2 dataset.
- **Why AdaFace over ArcFace/FaceNet:** AdaFace introduces adaptive margin functions that dynamically scale feature weights based on image quality, excelling at unconstrained, low-resolution CCTV imagery.
- **Output:** A unit-normalized 512-dimensional vector:
  $$\|V\| = \sqrt{\sum_{i=1}^{512} v_i^2} \approx 1.0$$

---

## PART 12 — INTERVIEW QUESTIONS

### LEVEL 1 — Basic (Freshman / Intern Concepts)
1. **Q:** What is the purpose of FastAPI in this architecture?
   - **Concepts:** ASGI async framework, automatic Swagger documentation generation at `/docs`, type validation via Pydantic, WebSocket routing.
   - **Files to Study:** `services/backend/main.py`, `services/backend/api/deps.py`.
2. **Q:** How are passwords secured in the database?
   - **Concepts:** One-way Bcrypt hashing with random salt via Passlib; passwords never stored in plaintext.
   - **Files to Study:** `services/backend/core/security.py`.
3. **Q:** What is the difference between REST APIs and WebSockets in this project?
   - **Concepts:** REST is stateless request-response over HTTP (used for CRUD, logins, uploads); WebSockets provide persistent bidirectional full-duplex TCP channels (used for real-time alerts and live GPS telemetry).
   - **Files to Study:** `services/backend/api/v1/endpoints/alerts.py`, `services/backend/core/websocket_manager.py`.

---

### LEVEL 2 — Implementation & Code Logic
1. **Q:** Trace how an alert moves from "Pending" to "Verified" to "FOUND".
   - **Concepts:** `PATCH /api/v1/alerts/{id}/status`, `dispatch_service.assign_nearest_patrol`, WebSocket broadcast `alert_status_updated`, officer `Assignment` record creation, automatic `MissingPerson.status = "Found"` update.
   - **Files to Study:** `services/backend/api/v1/endpoints/alerts.py:124–235`.
2. **Q:** How does the system prevent extracting thousands of duplicate face embeddings from a single video?
   - **Concepts:** Frame extraction skipping (skip=5), IoU tracking (IoU >= 0.3) to cluster frames into tracks, Laplacian variance blur calculation to select only the single sharpest crop per track.
   - **Files to Study:** `services/ai/pipeline.py:43–196`.
3. **Q:** How does the mobile app keep streaming GPS coordinates when minimized?
   - **Concepts:** Android Foreground Service with ongoing persistent notification (`foregroundService.ts`), `gpsService.ts` interval polling, BackHandler interception.
   - **Files to Study:** `apps/mobile-app/src/services/dutyManager.ts`, `foregroundService.ts`.

---

### LEVEL 3 — Cross-Questions & Deep Logic
1. **Q:** Why did you use `asyncio.create_subprocess_exec` instead of Python `multiprocessing` or running inference directly inside FastAPI?
   - **Concepts:** Python C-extensions (PyTorch/OpenCV/OpenMP) share native process memory. In-process inference caused native segmentation faults (`SEGV 11`). Subprocess execution provides complete memory and crash isolation.
   - **Files to Study:** `services/backend/core/video_processor.py:50–70`.
2. **Q:** How does the vector search handle the domain gap between high-quality reference mugshots and low-quality CCTV frames?
   - **Concepts:** AdaFace adaptive quality margins; lower cosine similarity threshold (0.30 instead of 0.60); empirical confidence scaling boost (+30% for scores < 40%).
   - **Files to Study:** `services/backend/api/v1/endpoints/ai_events.py:93–103`, `search.py:83–86`.
3. **Q:** What happens if the database connection drops while a video is being processed in the background?
   - **Concepts:** Subprocess continues analysis writing to disk and local log file; parent catch block catches DB error, attempts status update to `ERROR`, and logs error without crashing the server.
   - **Files to Study:** `services/backend/core/video_processor.py:125–135`.

---

### LEVEL 4 — System Design & Scalability
1. **Q:** How would you scale this system from 10 camera feeds to 1,000 live RTSP streams?
   - **Concepts:** Edge computing nodes running YOLOv8 detection locally; streaming only detected face crops to backend; Kafka/RabbitMQ ingestion pipeline; distributed Celery workers for AdaFace embedding generation; pgvector/Milvus for vector search.
2. **Q:** How would you scale the WebSocket architecture across multiple server instances?
   - **Concepts:** Stateless backend instances behind an Nginx/ALB load balancer; Redis Pub/Sub backplane synchronizing broadcast events across all nodes.
3. **Q:** How would you prevent database locking when thousands of patrol units send GPS telemetry every 5 seconds?
   - **Concepts:** Write telemetry directly to an in-memory Redis geospatial index (`GEOADD`); periodically flush latest positions to PostgreSQL in batches; broadcast live positions to web dashboards directly from Redis.

---

### LEVEL 5 — Resume Trap Questions (Must Understand Before Claiming)
1. **Trap:** "I built real-time AI face recognition across CCTV video."
   - **Check:** Be ready to explain: What is the embedding dimension? (512 floats). Which model? (AdaFace IR50). What similarity metric? (Cosine similarity). What is the threshold? (0.30). Why not Haar Cascades or standard CNNs? (YOLOv8 is faster and robust to angle variations).
2. **Trap:** "Implemented full async backend with SQLAlchemy and FastAPI."
   - **Check:** Be ready to explain: Why `postgresql+asyncpg://`? What is the role of `joinedload`? (Eager loading foreign key relationships in a single SQL query to prevent N+1 query problems).

---

## PART 13 — "WHY" QUESTIONS

### 1. Why FastAPI instead of Django or Flask?
- **Current Reason:** Native asynchronous support (`async`/`await`) allows handling hundreds of persistent WebSocket connections and background tasks concurrently on a single thread event loop. Native Pydantic integration ensures strict schema validation.
- **Trade-Offs:** Django has built-in admin panels and ORM migration tools out of the box, but handling WebSockets requires Django Channels with ASGI Redis setup, adding significant boilerplate.

### 2. Why PostgreSQL + JSON Vectors instead of a Dedicated Vector Database (Pinecone / Milvus / Qdrant)?
- **Current Reason:** Eliminates operational complexity and external SaaS costs during development. PostgreSQL stores both structured relational business data (Users, Alerts, Assignments) and 512d JSON vector arrays in a single database engine.
- **Trade-Offs:** In-memory Python vector comparisons scale well up to ~50,000 face crops. Beyond that, migrating to PostgreSQL `pgvector` or Qdrant is required for sub-linear search latency.

### 3. Why AdaFace instead of FaceNet or ArcFace?
- **Current Reason:** Standard models (FaceNet/ArcFace) are trained on clean, high-resolution celebrity datasets and fail on unconstrained, low-resolution, blurry CCTV crops. AdaFace incorporates image quality into the loss function, adapting feature representations for low-quality imagery.

### 4. Why Android Foreground Services for the Mobile App?
- **Current Reason:** Modern Android OS versions (Android 12+) aggressively kill background WebSocket connections and throttle GPS listeners when an app is minimized to save battery. A Foreground Service with an ongoing notification is the only Android-approved mechanism for uninterrupted field tracking.

---

## PART 14 — WHAT I MUST BE ABLE TO EXPLAIN (Checklist)

Before attending a technical interview, ensure you can confidently explain:

- [ ] The core operational loop (Missing person registered -> CCTV video/camera processed -> AI match detected -> WebSocket alert -> Dispatcher verifies -> Patrol mobile responds).
- [ ] Complete tech stack: Python 3.12, FastAPI, PostgreSQL (asyncpg), Next.js 15, React Native Expo, PyTorch, YOLOv8, AdaFace, OpenCV.
- [ ] The 20 database tables and their relational foreign keys.
- [ ] Why video processing runs inside an isolated OS subprocess (`asyncio.create_subprocess_exec`).
- [ ] Why thread limits (`OMP_NUM_THREADS=1`) are set before importing PyTorch/OpenCV.
- [ ] How IoU multi-object tracking and Laplacian blur filtering reduce embedding extraction by ~95%.
- [ ] The mathematical formula for Cosine Similarity and why threshold 0.30 was selected for CCTV.
- [ ] How JWT authentication and role-based authorization operate across REST endpoints and WebSockets.
- [ ] How WebSocket connections are partitioned by role (`active_admins`, `active_dispatchers`, `active_patrols`).
- [ ] The complete lifecycle of an Alert (`Pending` -> `Verified` -> `EN-ROUTE` -> `INVESTIGATING` -> `FOUND`).
- [ ] How patrol GPS and battery telemetry are captured on mobile and streamed to the Leaflet web map.
- [ ] The race condition when multiple officers accept an alert simultaneously and how to fix it (row-level locks / DB unique constraints).
- [ ] How to scale the architecture to 1,000 cameras using Kafka, Celery worker pools, Redis Pub/Sub, and `pgvector`.

---

## PART 15 — FINAL INTERVIEW REVISION PLAN

```
================================================================================
SESSION 1: ARCHITECTURE & OPERATIONAL FLOWS (Focus: High-Level Mastery)
================================================================================
1. Review Part 1 (Problem, Users, Tech Stack Table).
2. Trace the 3 Core Workflows in Part 3 step-by-step:
   - Case Registration & Historical Vector Sweep.
   - Video Upload & Background AI Extraction.
   - Live AI Detection, Real-Time Alerting & Mobile Dispatch.
3. Draw the Architecture Diagram from Part 2 on paper from memory.
4. Goal: Be able to give a fluid 3-minute executive elevator pitch of the project.

================================================================================
SESSION 2: CODE & DATABASE DEEP DIVE (Focus: Code-Level Confidence)
================================================================================
1. Study the 6 critical backend files in Part 5:
   - `main.py`, `security.py`, `deps.py`, `websocket_manager.py`, `video_processor.py`, `alerts.py`.
2. Study the 3 critical AI files:
   - `pipeline.py`, `face_detection.py`, `embedding_service.py`.
3. Review the Database ER Schema in Part 6 (understand table relationships).
4. Review Part 11 (Subprocess isolation, IoU tracking, blur filtering, AdaFace normalization).
5. Goal: Be able to explain any function, line range, or data structure when asked.

================================================================================
SESSION 3: CROSS-QUESTIONS & SYSTEM DESIGN (Focus: Senior-Level Defensibility)
================================================================================
1. Practice answering all Level 1–5 Interview Questions in Part 12 out loud.
2. Review the Concurrency & Race Condition scenarios in Part 9.
3. Review the "Why" questions and technology trade-offs in Part 13.
4. Go through the checklist in Part 14 to verify complete conceptual mastery.
5. Goal: Confidently defend all architectural decisions, trade-offs, and scaling bottlenecks.
================================================================================
```
