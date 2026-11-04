# GARUDA A.S.T.R.A — COMPREHENSIVE REVERSE-ENGINEERING & TECHNICAL KNOWLEDGE BASE

> **System Name:** GARUDA A.S.T.R.A (Advanced Security & Tactical Response Architecture / AI-Powered Surveillance, Tactical Response & Alerting)  
> **Repository Architecture:** Polyglot Monorepo (FastAPI Python Backend, PyTorch/YOLOv8/AdaFace AI Engine, Next.js 16 Web Dashboard, Expo SDK 54 / React Native 0.81 Android Mobile App, PostgreSQL Database with SQLAlchemy 2.0 Async ORM).  
> **Analysis Methodology:** 100% Directly extracted and reverse-engineered from source code.

---

## SECTION 1 — PROJECT OVERVIEW

### Project Objective
GARUDA A.S.T.R.A is an enterprise-grade public safety surveillance, facial recognition, and smart tactical dispatch platform. Its primary goal is to automate the detection of missing persons across video streams and CCTV camera networks, elevate high-confidence detections to actionable tactical alerts, and orchestrate field patrol units in real time through unified web and mobile interfaces.

### Real-World Problem Solved
Traditional public safety operations suffer from severe manual latency: operators must manually monitor dozens of camera feeds or analyze hours of archived CCTV video footage to locate missing persons, and then manually call or dispatch field officers. GARUDA A.S.T.R.A solves this by:
1. Automated Real-Time Ingestion & Vector Search across video streams using AI object detection (YOLOv8) and deep facial feature embeddings (AdaFace / 512-dimensional vector spaces).
2. Instant Control Room Alerting over authenticated WebSockets.
3. Automated Patrol Unit Routing & Live GPS Telemetry tracking field officers on dynamic map dashboards.

### Target Users
1. **Control Room Dispatchers & Operators:** Monitor live camera feeds, review AI detection alerts, verify matches, and dispatch field units via the Next.js Web Dashboard.
2. **System Administrators:** Manage user access, configure AI engine parameters (thresholds, execution engine: CPU vs GPU), monitor system health, and inspect audit logs via the Web Dashboard.
3. **Field Patrol Officers:** Receive tactical alert popups, accept assignments, update incident statuses (EN-ROUTE, INVESTIGATING, FOUND), and transmit location/battery telemetry via the React Native Mobile Application.

### Overall Workflow
```
[ Missing Person Registered ] ---> [ Photo Uploaded & AdaFace 512d Embedding Generated ]
                                                 |
                                                 v
[ Video Upload / Camera Feed Ingestion ] ---> [ Frame Extractor (skip=5) ]
                                                 |
                                                 v
                                    [ YOLOv8 Face Detection (1920 max dim) ]
                                                 |
                                                 v
                                  [ IoU Multi-Frame Object Tracking (IoU >= 0.3) ]
                                                 |
                                                 v
                                  [ Laplacian Variance Blur Score Calculation ]
                                                 |
                                                 v
                                  [ Select Sharpest Face Crop per Track ]
                                                 |
                                                 v
                                  [ AdaFace 512d Vector Embedding Extraction ]
                                                 |
                                                 v
                                  [ Cosine Similarity Vector Search vs DB ]
                                                 |
                                                 v
                             [ Match Found? (Similarity >= 0.30 Threshold) ]
                                                 |
                                     +-----------+-----------+
                                     | YES                   | NO
                                     v                       v
                      [ Create DetectionEvent ]     [ Save Crop & Continue ]
                                     |
                                     v
                          [ Create Alert (Pending) ]
                                     |
                                     v
             [ WebSocket Broadcast to Dashboard (Admins & Dispatchers) ]
                                     |
                                     v
                    [ Dispatcher Verifies Alert ("Verified") ]
                                     |
                                     v
             [ WebSocket Broadcast Assignment to Mobile Patrol Apps ]
                                     |
                                     v
                   [ Officer Accepts Assignment ("EN-ROUTE") ]
                                     |
                                     v
             [ Mobile App Stream Live GPS & Battery Telemetry (5s interval) ]
                                     |
                                     v
              [ Target Found -> Mark "FOUND" -> Auto-resolve Missing Person ]
```

---

## SECTION 2 — ARCHITECTURE

### Complete Architecture Overview
GARUDA A.S.T.R.A utilizes a decoupled, asynchronous micro-architecture organized inside a single monorepo:

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  +-----------------------------------+     +-----------------------------------+  |
|  |     Next.js 16 Web Dashboard      |     |    React Native / Expo Mobile     |  |
|  |  (React 19, Tailwind v4, Leaflet) |     |   (Android APK, Background Svc)   |  |
|  +-----------------+-----------------+     +-----------------+-----------------+  |
+--------------------|-----------------------------------------|--------------------+
                     | HTTP REST / WebSockets                  | HTTP REST / WebSockets
                     v                                         v
+-----------------------------------------------------------------------------------+
|                                  SERVER LAYER                                     |
|  +-----------------------------------------------------------------------------+  |
|  |                             FastAPI Backend Service                         |  |
|  |  - Auth & Security (JWT, OAuth2, Bcrypt)                                    |  |
|  |  - WebSocket Manager (ConnectionPool, Heartbeat, Role-Based Channels)       |  |
|  |  - Async SQLAlchemy 2.0 ORM Engine                                          |  |
|  +-------------------------------------+---------------------------------------+  |
+----------------------------------------|------------------------------------------+
                                         | Async Subprocess Execution
                                         v
+-----------------------------------------------------------------------------------+
|                                    AI LAYER                                       |
|  +-----------------------------------------------------------------------------+  |
|  |                      Isolated Subprocess Pipeline Engine                      |  |
|  |  - FrameExtractor (OpenCV)                                                  |  |
|  |  - FaceDetector (YOLOv8-face PyTorch/ONNX, Thread Limit=1)                  |  |
|  |  - IoU Tracker (Multi-object tracking across frames)                        |  |
|  |  - FaceCropper (25% padding) & Blur Filter (Laplacian Variance)             |  |
|  |  - EmbeddingService (AdaFace IR50 / 512-dim PyTorch Tensor)                |  |
|  +-------------------------------------+---------------------------------------+  |
+----------------------------------------|------------------------------------------+
                                         | Async Database Connection
                                         v
+-----------------------------------------------------------------------------------+
|                                  DATA STORAGE                                     |
|  +-----------------------------------------------------------------------------+  |
|  |                     PostgreSQL Database (20 Tables)                         |  |
|  |  - Users, Roles, Officers, Dispatch Units                                   |  |
|  |  - Missing Persons, Face Crops (Vector Embeddings in JSON)                  |  |
|  |  - Video Footages, Camera Feeds, Locations                                  |  |
|  |  - Detection Events, Alerts, Assignments, Activity Logs                     |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Component Breakdown
1. **Frontend Layer:**
   - **Next.js Web Dashboard (`apps/web-dashboard`):** React 19 / Next.js 16 (App Router) client application styled with Tailwind CSS v4. Features JWT authentication context (`auth-context.tsx`), WebSocket connection management (`websocket.tsx`), dynamic Leaflet maps (`MapComponent.tsx`), and tactical administration pages.
   - **React Native Mobile App (`apps/mobile-app`):** Expo SDK 54 / React Native 0.81 Android application tailored for field officers. Implements persistent background duty services (`dutyManager.ts`, `foregroundService.ts` via `react-native-background-actions`), location tracking (`gpsService.ts`), battery level monitoring (`batteryService.ts`), hardware back-button interception, siren/alert audio (`expo-audio`), and full-screen tactical alert popups (`TacticalAlertPopup.tsx`).
2. **Backend Server Layer (`services/backend`):** FastAPI application powered by Uvicorn. Exposes REST endpoints under `/api/v1` and WebSocket endpoints at `/api/v1/ws/connect`. Handles authentication, alert workflows, video analysis dispatching, and role-segmented WebSocket broadcasting.
3. **Database Layer (`database`):** PostgreSQL relational database managed via Async SQLAlchemy 2.0 ORM (`AsyncSessionLocal`) and Alembic schema migrations. Stores 20 relational entities including 512-dimensional floating-point embeddings saved as JSON arrays.
4. **AI Processing Layer (`services/ai`):** High-performance Python machine learning pipeline executing YOLOv8-face detection and AdaFace feature extraction. Runs inside isolated OS subprocesses (`asyncio.create_subprocess_exec`) to isolate CUDA/C++ runtime memory and prevent native segfaults (`SEGV 11`).

### Why This Architecture Works
- **Process Isolation:** Deep learning frameworks (PyTorch, OpenCV, OpenMP) can crash Python runtimes via native C++ thread contention. Offloading video processing to an isolated subprocess (`services/ai/run_pipeline.py`) ensures the FastAPI core server never crashes during heavy GPU/CPU inference.
- **Low Latency Real-Time Sync:** WebSockets eliminate HTTP polling latency. Control room updates and patrol dispatches happen in under 100 milliseconds.
- **Fault Tolerant Mobile Execution:** The mobile app wraps GPS, battery, and WebSocket operations inside an Android Foreground Service with ongoing system notifications, preventing the OS from killing background tracking when the app is minimized.

---

## SECTION 3 — FOLDER STRUCTURE

```
GarudaA.S.T.R.A/
├── apps/
│   ├── mobile-app/              # React Native / Expo Mobile Application
│   │   ├── android/             # Native Android build project & Gradle wrapper
│   │   ├── assets/              # Static icons, splash screens, alert sound (alert.mp3)
│   │   ├── src/
│   │   │   ├── components/      # Tactical UI components (TacticalAlertPopup, PulseIndicator, etc.)
│   │   │   ├── constants/       # Design tokens (theme.ts: COLORS, TYPOGRAPHY, SPACING)
│   │   │   ├── screens/         # Mobile screens (Alerts, Details, Map, DutyToggle, Cases, Logs, Profile)
│   │   │   ├── services/        # Hardware & network services (api, socketManager, dutyManager, etc.)
│   │   │   └── utils/           # Helper scripts & mock data (alertService.ts, mockState.ts)
│   │   ├── App.tsx              # Mobile root component & screen routing shell
│   │   ├── index.ts             # Expo entrypoint (registers root component)
│   │   ├── mock_ws_server.py    # Standalone Python WebSocket server for offline testing
│   │   └── package.json         # Mobile dependencies (expo, react-native, expo-location, etc.)
│   └── web-dashboard/           # Next.js 16 Web Dashboard
│       ├── public/              # Static web assets
│       ├── src/
│       │   ├── app/             # Next.js App Router pages (admin, alerts, missing, patrol, uploads, etc.)
│       │   ├── components/      # Web UI components & Leaflet Map components
│       │   └── lib/             # API client (api.ts), AuthContext, WebSocketProvider, utils
│       └── package.json         # Web dependencies (next, react, tailwindcss, lucide-react, leaflet)
├── database/                    # Database Layer
│   ├── alembic/                 # Alembic migration scripts and versions
│   ├── db/                      # SQLAlchemy Base class and AsyncSession engine setup
│   ├── models/                  # SQLAlchemy model definitions (auth, personnel, operations, registry, etc.)
│   └── scripts/                 # Database seed scripts (seed_admin.py, seed_data.py, seed_users.py)
├── services/                    # Backend & AI Services
│   ├── ai/                      # Computer Vision & Deep Learning Engine
│   │   ├── core/                # Core AI utilities
│   │   ├── detection/           # YOLOv8 face detection, cropper, frame extractor, blur scoring
│   │   ├── models/              # Model weights (yolov8n-face.pt, yolov8n-face.onnx)
│   │   ├── recognition/         # AdaFace embedding service, cosine similarity, ranking engine
│   │   ├── pipeline.py          # Unified analysis pipeline function (run_analysis_pipeline)
│   │   ├── register_face.py     # CLI script to register single face image into dataset
│   │   └── run_pipeline.py      # Subprocess CLI runner for video processing
│   └── backend/                 # FastAPI REST & WebSocket Backend
│       ├── api/                 # API router and dependencies (deps.py)
│       │   └── v1/
│       │       └── endpoints/   # Endpoint controllers (auth, alerts, missing_persons, uploads, etc.)
│       ├── core/                # System config, security, exceptions, video_processor, websocket_manager
│       ├── schemas/             # Pydantic validation schemas (user, alert, missing_person, system)
│       ├── services/            # Business logic services (dispatch_service, telemetry_service, alert_service)
│       └── main.py              # FastAPI application entrypoint
├── context.md                   # System implementation context & roadmap document
├── GUIDE.md                     # Project launch & execution guide
├── README.md                    # Project overview README
└── requirements.txt             # Unified Python dependencies (fastapi, torch, ultralytics, opencv-python, etc.)
```

---

## SECTION 4 — TECHNOLOGY STACK

### Backend Technologies
| Technology | Version / Spec | Purpose | Where Used | Files Using It |
| :--- | :--- | :--- | :--- | :--- |
| **Python** | `3.12` | Core execution runtime | Entire Backend & AI Layer | All `.py` files |
| **FastAPI** | `>= 0.111.0` | Asynchronous REST framework & OpenAPI router | REST endpoints & WebSockets | `services/backend/main.py`, `services/backend/api/*` |
| **Uvicorn** | `>= 0.30.0` (standard) | Asynchronous ASGI web server | Backend server runner | Entrypoint script / `GUIDE.md` |
| **SQLAlchemy** | `>= 2.0.30` | Async 2.0 ORM & Database Mapper | DB transactions, models, sessions | `database/db/session.py`, `database/models/*` |
| **asyncpg** | `>= 0.29.0` | High-performance async PostgreSQL driver | Async DB connection pooling | `database/db/session.py`, `services/backend/core/config.py` |
| **Alembic** | `>= 1.13.1` | Relational database migration tool | Schema creation & version upgrades | `database/alembic/*`, `database/alembic.ini` |
| **Pydantic** | `>= 2.7.0` | Schema validation & serialization | Request/response DTOs & settings | `services/backend/schemas/*`, `services/backend/core/config.py` |
| **python-jose** | `>= 3.3.0` | JWT encoding/decoding (`HS256`) | Auth session tokens & role claims | `services/backend/core/security.py`, `services/backend/api/deps.py` |
| **passlib / bcrypt** | `passlib>=1.7.4`, `bcrypt==3.2.2` | Secure password hashing (Bcrypt) | User password hashing | `services/backend/core/security.py` |
| **HTTPX** | `>= 0.27.0` | Async HTTP client | Inter-service requests & engine checks | `services/ai/detection/face_detection.py` |

### AI / Machine Learning Technologies
| Technology | Purpose | Where Used | Files Using It |
| :--- | :--- | :--- | :--- |
| **PyTorch & Torchvision** | Deep learning tensor computation engine | YOLOv8 & AdaFace execution | `services/ai/detection/face_detection.py`, `services/ai/recognition/embedding_service.py` |
| **Ultralytics YOLOv8** | Real-time face detection model (`yolov8n-face.pt`) | Face detection & bounding box extraction | `services/ai/detection/face_detection.py` |
| **ONNX Runtime** | High-performance CPU model inference engine | Accelerated CPU execution of `yolov8n-face.onnx` | `services/ai/detection/face_detection.py`, `services/ai/models/` |
| **AdaFace (CVLFace)** | 512-dimensional facial feature embedding model | Generating face vector signatures | `services/ai/recognition/embedding_service.py` (`minchul/cvlface_adaface_ir50_ms1mv2`) |
| **Hugging Face Transformers** | AutoModel loader with custom remote code | Loading AdaFace IR50 architecture | `services/ai/recognition/embedding_service.py` |
| **OpenCV (`cv2`)** | Image decoding, crop padding, Laplacian variance | Frame extraction, blur evaluation | `services/ai/detection/*`, `services/ai/pipeline.py` |
| **NumPy & SciPy** | Array manipulation & vector math | In-memory Cosine similarity matching | `services/backend/api/v1/endpoints/search.py`, `services/ai/recognition/` |
| *(Note on Legacy/Unused)* | `deepface_service.py` is an unused prototype; `insightface` in `requirements.txt` is not imported | Active pipeline runs exclusively via AdaFace | `services/ai/pipeline.py` |

### Frontend (Web Dashboard) Technologies
| Technology | Version / Spec | Purpose | Where Used | Files Using It |
| :--- | :--- | :--- | :--- | :--- |
| **Next.js** | `16.2.6` (App Router) | Modern React framework with server rendering | Web Dashboard root | `apps/web-dashboard/package.json` |
| **React** | `19.2.4` / `React DOM 19.2.4` | UI component rendering library | Dashboard pages & components | `apps/web-dashboard/src/**/*` |
| **Tailwind CSS** | `^4.0.0` (`@tailwindcss/postcss: ^4`) | Utility-first CSS styling engine (v4) | Global styling & dark tactical theme | `apps/web-dashboard/src/app/globals.css` |
| **Radix UI Primitives** | `@radix-ui/react-slot ^1.2.4` | Accessible unstyled UI components | Custom buttons & slot composition | `apps/web-dashboard/src/components/ui/*` |
| **Lucide React** | `^1.14.0` | Tactical command center icons | Dashboard navigation & status cards | `apps/web-dashboard/src/components/*` |
| **Leaflet / React-Leaflet** | `leaflet ^1.9.4` / `react-leaflet ^5.0.0` | Interactive map rendering | Dynamic patrol & alert map | `apps/web-dashboard/src/components/map/MapComponent.tsx` |
| **TypeScript** | `^5` | Strict static type checking | Web frontend codebase | `apps/web-dashboard/tsconfig.json` |

### Mobile App Technologies
| Technology | Version / Spec | Purpose | Where Used | Files Using It |
| :--- | :--- | :--- | :--- | :--- |
| **React Native** | `0.81.5` (React `19.1.0`) | Cross-platform mobile runtime | Mobile application root | `apps/mobile-app/package.json`, `App.tsx` |
| **Expo SDK** | `~54.0.0` | Mobile application development platform | Android project configuration | `apps/mobile-app/app.json` |
| **Foreground Service** | `react-native-background-actions ^4.1.0` | Persistent Android Foreground Service | Background duty persistence & tracking | `apps/mobile-app/src/services/foregroundService.ts` |
| **Expo Location** | `~19.0.8` | GPS location service | 5-second background GPS telemetry | `apps/mobile-app/src/services/gpsService.ts` |
| **Expo Battery** | `~10.0.8` | Battery status telemetry | Device battery level & charging state | `apps/mobile-app/src/services/batteryService.ts` |
| **Expo Notifications** | `~0.32.17` | Ongoing system notification | Sticky notification preventing OS kill | `apps/mobile-app/src/services/foregroundService.ts` |
| **Expo Audio** | `~1.1.1` | Native sound playback | Alert sirens & audible chime cues | `apps/mobile-app/src/screens/AlertDetailsScreen.tsx` |
| **Expo Secure Store** | `~15.0.8` | Encrypted hardware key-value storage | Secure JWT session persistence | `apps/mobile-app/src/services/api.ts` |
| **Expo Intent Launcher** | `~13.0.8` | Android native system intent triggers | App minimization & OS settings navigation | `apps/mobile-app/App.tsx`, `PermissionGuardScreen.tsx` |
| **Expo Task Manager** | `~14.0.9` | Background task orchestration | Task scheduling | `apps/mobile-app/package.json` |
| **Config Plugins** | `withBackgroundService.js`, `withShortCxxPath.js` | Custom Expo native manifest/build patches | Android foreground service & CMake path fixes | `apps/mobile-app/` |

---

## SECTION 5 — FRONTEND

### Web Dashboard Pages (`apps/web-dashboard/src/app`)
- **Main Dashboard (`/` — `page.tsx`):** Real-time command center interface. Displays overall system stats (Total Alerts, Pending Alerts, Verified Alerts, Total Missing Persons, Found Persons), live operational feed, quick action triggers (e.g., Test Alert simulation), and interactive Leaflet map showing active alerts and patrol units.
- **Login (`/login` — `page.tsx`):** Authentication form accepting email and password. Calls POST `/api/v1/auth/login`, stores JWT token in `localStorage`, and initializes `AuthContext`.
- **Alerts Feed (`/alerts` — `page.tsx`):** Comprehensive list of AI detection alerts. Supports sorting by status, priority, and confidence score. Allows dispatchers to change alert status to `Verified`, `Rejected False Positive`, or `FOUND`.
- **Alert Details (`/alerts/[id]` — `page.tsx`):** Detailed view of a single alert showing matched missing person details, camera location, confidence percentage, detection timestamp, cropped face image, and assignment controls.
- **Missing Persons (`/missing` — `page.tsx`):** Table of reported missing persons. Shows mugshots, case numbers, priority levels, and statuses.
- **New Missing Person (`/missing/new` — `page.tsx`):** Registration form for adding missing persons. Includes photo upload field which triggers automatic AdaFace 512d embedding generation and historical vector search.
- **Patrol & Dispatch (`/patrol` — `page.tsx`):** Field operations management. Shows active patrol units, unit status (Available, En-Route, Off-Duty), last known GPS coordinates, and current incident assignments.
- **Surveillance Feeds (`/surveillance` — `page.tsx`):** Video surveillance center. Displays active camera stream grids, stream status (Online/Offline), and stream health heartbeats.
- **Uploads & Video Analysis (`/uploads` — `page.tsx`):** Interface to drag-and-drop CCTV video files (`.mp4`, `.avi`). Features progress bar upload tracking (`uploadFootageWithProgress` via XMLHttpRequest), manual video analysis triggers (`analyzeVideo`), and batch analysis sweep (`batchAnalyzeVideos`).
- **Audit & System Logs (`/logs` — `page.tsx`):** Security activity log viewer displaying administrative actions, status changes, login events, and AI engine triggers.
- **System Settings (`/system` — `page.tsx`):** Configuration panel for adjusting processing engine (`cpu` vs `gpu`), detection confidence threshold, face extraction toggles, and sound notification settings.

### State Management & Context
- **`AuthContext` (`apps/web-dashboard/src/lib/auth-context.tsx`):** Manages user session state (`token`, `role`, `userId`, `fullName`). Handles automatic route protection (redirects unauthenticated users to `/login`) and persists authentication tokens in browser `localStorage`.
- **`WebSocketProvider` (`apps/web-dashboard/src/lib/websocket.tsx`):** React context provider managing the global WebSocket connection to `ws://localhost:8000/api/v1/ws/connect?token=...`. Features automatic 25-second ping/pong heartbeat, exponential backoff auto-reconnection (up to 30s delay), and automatic auth expiration handling (logs out if closed with WS code `1008`).

---

## SECTION 6 — BACKEND

### Server Architecture
The backend is built with Python 3.12 and FastAPI (`services/backend/main.py`). It follows a strict clean architecture:
- **`main.py`:** Application setup, CORS middleware configuration (`origins`), global exception handler registration, static file upload routing (`/uploads/{path}`), and API v1 router mounting.
- **`api/deps.py`:** Dependency injection framework. Provides database session management (`get_db`) and JWT token validation (`get_current_user`).
- **`core/security.py`:** Bcrypt password hashing (`get_password_hash`, `verify_password`) and JWT access token creation (`create_access_token`).
- **`core/websocket_manager.py`:** Thread-safe connection manager maintaining active WebSocket connection pools partitioned by role (`active_admins`, `active_dispatchers`, `active_patrols`). Handles personal messaging and global broadcasts.
- **`core/video_processor.py`:** Background video analysis orchestrator. Spawns an isolated Python process (`run_pipeline.py`) using `asyncio.create_subprocess_exec`, streams progress back to the database, and saves generated `FaceCrop` records.

### Complete Request & Authentication Lifecycle
```
[ Client Request ] 
       │
       ▼
[ CORS Middleware ] ──── (Rejects unlisted origins)
       │
       ▼
[ FastAPI Route Matcher ]
       │
       ▼
[ OAuth2 / Bearer Token Extraction ] ── (deps.py)
       │
       ├─► Decode JWT using SECRET_KEY & HS256 algorithm
       ├─► Extract `sub` (User UUID)
       └─► Query DB: `SELECT * FROM users WHERE id = :user_id JOIN roles`
       │
       ▼
[ Role / Permission Check ] ── (Controller verification)
       │
       ▼
[ Async Database Session (`get_db`) ]
       │
       ▼
[ Business Logic / Service Layer Execution ]
       │
       ▼
[ DB Transaction Commit & Refetch ]
       │
       ▼
[ Optional WebSocket Broadcast Trigger ]
       │
       ▼
[ Return JSON Response formatted by Pydantic Schema ]
```

---

## SECTION 7 — DATABASE

### Database Type & Engine
- **Database Engine:** PostgreSQL
- **ORM:** SQLAlchemy 2.0 Async (`postgresql+asyncpg://`)
- **Migration Tool:** Alembic

### Complete Entity-Relationship Schema (20 Tables)

```
                       +-------------------+
                       |       roles       |
                       +-------------------+
                                 │ 1
                                 │
                                 │ N
                       +-------------------+
                       |       users       |◄────────────────────────────────┐
                       +-------------------+                                 │
                                 │ 1                                         │
                                 │                                           │
                                 │ 1 (uselist=False)                         │
                       +-------------------+                                 │
                       |     officers      |                                 │
                       +-------------------+                                 │
                         │ 1             │ 1                                 │
                         │               │                                   │
                         │ N             │ N                                 │
                         v               v                                   │
    +----------------------+   +-------------------+                         │
    |    dispatch_units    |   |    assignments    |                         │
    +----------------------+   +-------------------+                         │
                                   │ N         │ N                           │
                                   │           │                             │
                                   │ 1         │ 1                           │
                                   v           v                             │
                         +-----------+   +-----------+                       │
                         | incidents |   |  alerts   |                       │
                         +-----------+   +-----------+                       │
                               │               │ 1                           │
                               │               │                             │
                               │               │ 1 (unique)                  │
                               │               v                             │
                               │         +------------------+                │
                               │         | detection_events |                │
                               │         +------------------+                │
                               │               │ N                           │
                               │               │                             │
                               │               │ 1                           │
                               │               v                             │
                               │         +------------------+                │
                               └────────►|  camera_feeds    |                │
                                         +------------------+                │
                                               │ N                           │
                                               │                             │
                                               │ 1                           │
                                               v                             │
                                         +------------------+                │
                                         |    locations     |                │
                                         +------------------+                │
                                                                             │
  +--------------------+      +--------------------+                         │
  |   missing_persons  |      |   video_footages   |                         │
  +--------------------+      +--------------------+                         │
            │ 1                         │ 1                                  │
            │                           │                                    │
            │ N                         │ N (cascade delete)                 │
            v                           v                                    │
  +--------------------+      +--------------------+                         │
  |  detection_events  |      |     face_crops     |                         │
  +--------------------+      +--------------------+                         │
                                                                             │
  +--------------------+      +--------------------+     +-------------------+
  |   notifications    |──1:N─|   activity_logs    |─1:N─|  evidence_files   |───┘ (uploader_id)
  +--------------------+      +--------------------+     +-------------------+

  +--------------------+      +--------------------+     +-------------------+
  |   system_status    |      |  ai_health_status  |     |  system_settings  |
  +--------------------+      +--------------------+     +-------------------+
```

### Table Definitions & Key Columns
1. **`roles`:** `id` (UUID, PK), `name` (String 50, Unique, Indexed: `admin`, `dispatcher`, `officer`, `patrol`), `permissions` (String).
2. **`users`:** `id` (UUID, PK), `email` (String 255, Unique, Indexed), `hashed_password` (String 255), `full_name` (String 255), `role_id` (FK -> `roles.id`).
3. **`officers`:** `id` (UUID, PK), `user_id` (FK -> `users.id`, Unique), `badge_number` (String 50, Unique, Indexed), `unit_type` (String 50), `status` (String 50, Default: "Off Duty"), `dispatch_unit_id` (FK -> `dispatch_units.id`).
4. **`dispatch_units`:** `id` (UUID, PK), `name` (String 100, Unique), `status` (String 50, Default: "Available"), `last_known_lat` (Float), `last_known_lng` (Float).
5. **`locations`:** `id` (UUID, PK), `name` (String 255), `latitude` (Float Double Precision), `longitude` (Float Double Precision), `address` (String).
6. **`camera_feeds`:** `id` (UUID, PK), `name` (String 255), `stream_url` (String 512), `status` (String 50, Default: "Online"), `last_heartbeat` (DateTime TZ), `location_id` (FK -> `locations.id`).
7. **`video_footages`:** `id` (UUID, PK), `filename` (String 255), `file_path` (String 1024), `status` (String 50, Default: "PENDING"), `camera_id` (String 255), `sector` (String 255), `priority` (String 50), `progress` (Float, Default: 0.0).
8. **`face_crops`:** `id` (UUID, PK), `video_id` (FK -> `video_footages.id`), `frame_idx` (Integer), `image_path` (String 1024), `embedding` (JSON — stores 512 float vector array).
9. **`incidents`:** `id` (UUID, PK), `title` (String 255), `description` (Text), `status` (String 50, Indexed, Default: "Open"), `severity` (String 50), `location_id` (FK -> `locations.id`), `camera_id` (FK -> `camera_feeds.id`).
10. **`incident_updates`:** `id` (UUID, PK), `incident_id` (FK -> `incidents.id`), `user_id` (FK -> `users.id`), `text` (Text).
11. **`assignments`:** `id` (UUID, PK), `officer_id` (FK -> `officers.id`), `dispatch_unit_id` (FK -> `dispatch_units.id`), `incident_id` (FK -> `incidents.id`), `alert_id` (FK -> `alerts.id`), `status` (String 50, Default: "Assigned").
12. **`missing_persons`:** `id` (UUID, PK), `case_number` (String 50, Unique, Indexed), `full_name` (String 255), `age` (Integer), `gender` (String 50), `description` (String), `photo_path` (String 255), `face_embedding` (JSON — stores 512 float vector array), `last_seen_location` (String 255), `last_seen_at` (DateTime TZ), `priority` (String 50, Default: "Normal"), `status` (String 50, Default: "Reported").
13. **`detection_events`:** `id` (UUID, PK), `camera_id` (FK -> `camera_feeds.id`), `timestamp` (DateTime TZ), `confidence_score` (Float), `match_type` (String 50), `person_id` (FK -> `missing_persons.id`), `bounding_box_json` (String), `frame_timestamp` (String 100), `image_path` (String 255).
14. **`alerts`:** `id` (UUID, PK), `detection_event_id` (FK -> `detection_events.id`, Unique), `status` (String 50, Indexed, Default: "Pending"), `severity` (String 50, Default: "High"), `acknowledged_at` (DateTime TZ), `resolved_at` (DateTime TZ), `missing_person_id` (FK -> `missing_persons.id`).
15. **`notifications`:** `id` (UUID, PK), `user_id` (FK -> `users.id`), `type` (String 50), `content` (Text), `is_read` (Boolean, Default: False).
16. **`activity_logs`:** `id` (UUID, PK), `user_id` (FK -> `users.id`), `action` (String 100), `entity_type` (String 50), `entity_id` (UUID), `details` (Text — JSON string).
17. **`evidence_files`:** `id` (UUID, PK), `file_path` (String 512), `uploader_id` (FK -> `users.id`), `incident_id` (FK -> `incidents.id`), `alert_id` (FK -> `alerts.id`).
18. **`system_status`:** `id` (UUID, PK), `component` (String 50, Unique), `status` (String 50), `last_checked` (DateTime TZ).
19. **`ai_health_status`:** `id` (UUID, PK), `status` (String 50), `last_ping` (DateTime TZ).
20. **`system_settings`:** `id` (UUID, PK), `processing_engine` (String 20, Default: "cpu"), `detection_threshold` (Float, Default: 0.45), `face_extraction_enabled` (Boolean, Default: True), `sound_alerts_enabled` (Boolean, Default: True).

---

## SECTION 8 — API DOCUMENTATION

### 1. Authentication Endpoints (`/api/v1/auth`)
- **`POST /api/v1/auth/login`**
  - **Purpose:** OAuth2 form-based login to authenticate users and generate JWT tokens.
  - **Request Body:** Form data (`username`: string, `password`: string).
  - **Auth Required:** No.
  - **Response (200):** `{"access_token": "...", "token_type": "bearer", "role": "admin", "user_id": "...", "full_name": "..."}`.
  - **Error Responses:** 401 Unauthorized (`"Incorrect email or password"`).
  - **DB Interactions:** Queries `users` joining `roles` where `lower(email) == username`.
  - **Files:** `services/backend/api/v1/endpoints/auth.py`.

### 2. Alert Management Endpoints (`/api/v1/alerts`)
- **`GET /api/v1/alerts/stats`**
  - **Purpose:** Retrieve aggregated system dashboard metrics.
  - **Auth Required:** Yes (Bearer JWT).
  - **Response (200):** `{"total_alerts": 12, "pending_alerts": 3, "verified_alerts": 5, "rejected_alerts": 2, "total_missing_persons": 8, "found_persons": 4, "total_detection_events": 45}`.
  - **Files:** `services/backend/api/v1/endpoints/alerts.py`.

- **`GET /api/v1/alerts/`**
  - **Purpose:** List alerts with detection and missing person details.
  - **Query Params:** `skip` (default 0), `limit` (default 100).
  - **Auth Required:** Yes (Bearer JWT).
  - **Behavior:** Officers see only `Verified` alerts. Admins/Dispatchers see all alerts sorted customly: Pending first -> Priority (Critical -> High -> Normal -> Low) -> Confidence Score DESC -> Date DESC.
  - **Files:** `services/backend/api/v1/endpoints/alerts.py`.

- **`PATCH /api/v1/alerts/{alert_id}/status`**
  - **Purpose:** Update alert status and trigger dispatches or auto-resolutions.
  - **Request Body:** `{"status": "Verified" | "EN-ROUTE" | "INVESTIGATING" | "TARGET LOST" | "FOUND" | "Rejected False Positive"}`.
  - **Auth Required:** Yes (Admin, Dispatcher, Officer, Patrol).
  - **Special Logic:**
    - If status = `"Verified"`: Executes `dispatch_service.assign_nearest_patrol` and broadcasts assignment over WebSockets.
    - If status = `"EN-ROUTE"`, `"INVESTIGATING"`, `"TARGET LOST"`, `"FOUND"`: Updates/creates officer `Assignment` record.
    - If status = `"FOUND"`: Auto-sets `missing_person.status = "Found"`.
  - **Broadcast:** Pushes `alert_status_updated` event to all WebSockets via `manager.broadcast_global_alert`.
  - **Files:** `services/backend/api/v1/endpoints/alerts.py`.

### 3. Missing Persons Endpoints (`/api/v1/missing-persons`)
- **`POST /api/v1/missing-persons/`**
  - **Purpose:** Register a new missing person record.
  - **Request Body:** `{"full_name": "...", "age": 30, "gender": "Male", "description": "...", "last_seen_location": "...", "priority": "High"}`.
  - **Auth Required:** Yes (Admin or Dispatcher).
  - **Files:** `services/backend/api/v1/endpoints/missing_persons.py`.

- **`POST /api/v1/missing-persons/{person_id}/image`**
  - **Purpose:** Upload reference mugshot, generate AdaFace 512d face embedding, and auto-trigger historical CCTV vector search.
  - **Request Body:** Multipart `image` file.
  - **Auth Required:** Yes (Admin or Dispatcher).
  - **Files:** `services/backend/api/v1/endpoints/missing_persons.py`.

### 4. AI Ingestion & Testing Endpoints (`/api/v1/ai-events`)
- **`POST /api/v1/ai-events/`**
  - **Purpose:** Edge camera or mock engine detection event ingestion.
  - **Request Body:** Form data (`camera_id`, `location_lat`, `location_lng`, `image` file).
  - **Logic:** Runs YOLOv8 face detection -> crops faces -> extracts AdaFace 512d embedding -> computes cosine similarity vs active missing persons (threshold 0.30) -> if matched, creates `DetectionEvent` & `Alert` -> broadcasts `possible_match_detected` over WebSockets.
  - **Files:** `services/backend/api/v1/endpoints/ai_events.py`.

- **`POST /api/v1/ai-events/test-alert`**
  - **Purpose:** Test endpoint to simulate a positive match alert for frontend verification.
  - **Files:** `services/backend/api/v1/endpoints/ai_events.py`.

### 5. Vector Search Endpoints (`/api/v1/search`)
- **`POST /api/v1/search/person/{person_id}`**
  - **Purpose:** Compares a missing person's embedding against all stored video `FaceCrop` embeddings using Cosine Similarity. Generates `DetectionEvent` and `Alert` records for matches exceeding threshold (default 0.30).
  - **Files:** `services/backend/api/v1/endpoints/search.py`.

- **`POST /api/v1/search/mass`**
  - **Purpose:** Sweeps ALL missing persons against ALL `FaceCrop` records in the database.
  - **Files:** `services/backend/api/v1/endpoints/search.py`.

### 6. Video Upload & Processing Endpoints (`/api/v1/uploads`)
- **`POST /api/v1/uploads/`**
  - **Purpose:** Upload video footage file (`.mp4`) to server. Creates `VideoFootage` record in status `PENDING`.
  - **Files:** `services/backend/api/v1/endpoints/uploads.py`.

- **`POST /api/v1/uploads/{video_id}/analyze`**
  - **Purpose:** Trigger background AI analysis on an uploaded video using `BackgroundTasks`.
  - **Files:** `services/backend/api/v1/endpoints/uploads.py`.

- **`POST /api/v1/uploads/batch-analyze`**
  - **Purpose:** Trigger background AI analysis for ALL pending/errored videos.
  - **Files:** `services/backend/api/v1/endpoints/uploads.py`.

### 7. WebSocket Endpoint (`/api/v1/ws`)
- **`WS /api/v1/ws/connect?token={JWT_TOKEN}`**
  - **Purpose:** Authenticated bidirectional WebSocket stream.
  - **Handling:** Authenticates JWT token via `get_ws_user`. Routes socket connection to `ConnectionManager` into role buckets (`admin`, `dispatcher`, `patrol`). Processes incoming ping/pong heartbeats and patrol location telemetry (`telemetry` event type).
  - **Files:** `services/backend/api/v1/endpoints/websockets.py`, `services/backend/core/websocket_manager.py`.

---

## SECTION 9 — AUTHENTICATION & AUTHORIZATION

- **Authentication Protocol:** OAuth2 Password Bearer with JSON Web Tokens (JWT).
- **Password Security:** Hashes passwords using Bcrypt (`CryptContext(schemes=["bcrypt"])`).
- **Token Claims:** JWT payload contains `sub` (User UUID string), `role` (Role Name string), and `exp` (Expiration timestamp). Token expires in 30 minutes by default (`ACCESS_TOKEN_EXPIRE_MINUTES = 30`).
- **Route Authorization:** Enforced via dependency injection (`deps.get_current_user`) and explicit role checks inside endpoint handlers (`if current_user.role.name not in ["admin", "dispatcher"]: raise HTTPException(403)`).
- **WebSocket Auth:** Token passed as query parameter `?token=...`. Validated during initial handshake. Invalid tokens close the connection with WS status code `1008` (Policy Violation).

---

## SECTION 10 — FEATURE BREAKDOWN

### Major Implemented Features
1. **Missing Person Registration & Automated Vector Indexing:**
   - **Frontend:** `/missing/new` form.
   - **Backend:** `POST /api/v1/missing-persons/` and `POST /api/v1/missing-persons/{id}/image`.
   - **AI/DB:** Photo cropped -> AdaFace 512d vector generated -> Saved to `missing_persons.face_embedding` -> Auto vector search triggered against historical video `FaceCrop` records.
2. **CCTV Video Analysis & Face Extraction Pipeline:**
   - **Frontend:** `/uploads` page with upload progress bar.
   - **Backend:** `POST /api/v1/uploads/` & `POST /api/v1/uploads/{id}/analyze` -> `process_video_task`.
   - **AI Pipeline Subprocess:** FrameExtractor -> YOLOv8 Face Detection -> IoU Object Tracking -> Laplacian Variance Blur Filtering -> Sharpest Frame Selection -> AdaFace Embedding Extraction -> Saved to `FaceCrop` DB table and disk (`uploads/crops/{video_id}/track_X_frame_Y.jpg`).
3. **Real-Time Match Detection & Control Room Alerting:**
   - **Ingestion:** Edge cameras post frames to `POST /api/v1/ai-events/`.
   - **Matching:** Cosine similarity calculation vs active missing persons.
   - **Alerting:** If matched, creates `DetectionEvent` & `Alert` -> WebSockets push `possible_match_detected` event to Control Room Dashboard -> Audible alert sounds.
4. **Smart Dispatch Orchestration & Patrol Unit Routing:**
   - **Verification:** Dispatcher reviews alert and clicks "Verify".
   - **Dispatch Service:** `dispatch_service.assign_nearest_patrol` broadcasts `assignment` event to mobile apps over WebSockets.
   - **Mobile Response:** Patrol officer receives full-screen `TacticalAlertPopup` overlay -> Accepts assignment -> Mobile app changes status to `EN-ROUTE` / `INVESTIGATING` -> Streams live GPS telemetry back to dashboard map.
5. **Mobile Field Telemetry & Foreground Lifecycle Management:**
   - **Duty Manager:** Field officer toggles "ACTIVE DUTY" -> Starts Android Foreground Service (`foregroundService.ts`) with ongoing notification -> Activates GPS tracking (`gpsService.ts`) & Battery monitoring (`batteryService.ts`) -> Streams telemetry to server every 5 seconds over WebSocket -> Disables Android hardware back button app termination.

---

## SECTION 11 — AI / ML

### Model Specifications & Pipeline
1. **Face Detector:** YOLOv8-face (`yolov8n-face.pt` PyTorch weights & `yolov8n-face.onnx` ONNX model).
   - **Execution:** Downscales 2K/4K frames to max dimension 1920px. Applies confidence thresholding (`0.30`), rejects tiny noise boxes (`< 20x20` pixels), and filters unnatural aspect ratios (`width/height` must be between `0.6` and `1.15`).
2. **Multi-Frame Object Tracker:** Intersection over Union (IoU) tracker (`calculate_iou`). Tracks faces across video frames using bounding box spatial overlap (threshold `0.3`, max missed frames `15`).
3. **Quality & Blur Assessor:** Calculates image sharpness using OpenCV Laplacian Variance (`cv2.Laplacian(gray, cv2.CV_64F).var()`). For every tracked subject, selects the single sharpest frame crop to pass to the embedding model.
4. **Face Embedder:** AdaFace (`cvlface_adaface_ir50_ms1mv2` IR50 architecture).
   - **Input:** Resizes crop to `112x112` RGB tensor, normalizes pixels to `[-1, 1]` range (`(pixel - 127.5) / 128.0`).
   - **Output:** 512-dimensional normalized float vector embedding.
5. **Vector Search Engine:** Cosine Similarity calculation (`similarity_service.py` & `search.py`):
   $$\text{Similarity}(A, B) = \frac{A \cdot B}{\|A\| \|B\|}$$
   Threshold set to `0.30` for CCTV ingestion and `0.40` for high-confidence ranking.

---

## SECTION 12 — REALTIME COMMUNICATION

### WebSocket Architecture
- **Server Endpoint:** `ws://localhost:8000/api/v1/ws/connect?token={JWT}` (`services/backend/api/v1/endpoints/websockets.py`).
- **Connection Pools (`ConnectionManager`):**
  - `active_admins`: `{ user_id: WebSocket }`
  - `active_dispatchers`: `{ user_id: WebSocket }`
  - `active_patrols`: `{ user_id: WebSocket }`
- **Heartbeat Protocol:** Client sends `{"type": "ping"}` every 25 seconds; server responds with `{"type": "pong"}`.
- **Event Types:**
  - `possible_match_detected`: Pushed to admins and dispatchers when AI detects a missing person.
  - `alert_status_updated`: Broadcasted globally when an alert changes status.
  - `assignment`: Sent to patrol units when a dispatcher verifies an alert.
  - `telemetry`: Sent from patrol units to server containing `{ lat, lng, batteryLevel, isCharging }`. Server updates `dispatch_units` location and broadcasts to control room map.

---

## SECTION 13 — ANALYTICS

### Aggregations & KPIs (`GET /api/v1/alerts/stats`)
The backend computes SQL count aggregations across database entities:
- `total_alerts`: `SELECT COUNT(id) FROM alerts`
- `pending_alerts`: `SELECT COUNT(id) FROM alerts WHERE status IN ('pending', 'Pending')`
- `verified_alerts`: `SELECT COUNT(id) FROM alerts WHERE status = 'Verified'`
- `rejected_alerts`: `SELECT COUNT(id) FROM alerts WHERE status = 'Rejected False Positive'`
- `total_missing_persons`: `SELECT COUNT(id) FROM missing_persons`
- `found_persons`: `SELECT COUNT(id) FROM missing_persons WHERE status = 'Found'`
- `total_detection_events`: `SELECT COUNT(id) FROM detection_events`

---

## SECTION 14 — EXTERNAL SERVICES

- **HuggingFace Hub (`huggingface_hub`):** Used by `EmbeddingService` to download pre-trained AdaFace weights (`snapshot_download("minchul/cvlface_adaface_ir50_ms1mv2")`).
- **OpenAI API Key / External AI Services:** Mentioned in `GUIDE.md` configuration notes for external model extensions.
- **Production Media Fallback Server:** `main.py` redirects missing local media requests to `https://backend.garudaastra.dpdns.org/uploads/{path}`.

---

## SECTION 15 — CONFIGURATION

### Key Environment Variables (`.env`)
- **Backend:**
  - `DATABASE_URL`: `postgresql://postgres:postgres@localhost:5432/astra_db`
  - `SECRET_KEY`: JWT signing secret
  - `ACCESS_TOKEN_EXPIRE_MINUTES`: `30`
- **Web Dashboard:**
  - `NEXT_PUBLIC_API_URL`: `http://localhost:8000/api/v1`
  - `NEXT_PUBLIC_WS_URL`: `ws://localhost:8000/api/v1/ws/connect`
- **Mobile Application:**
  - `EXPO_PUBLIC_API_URL`: `http://192.168.x.x:8000/api/v1`
  - `EXPO_PUBLIC_WS_URL`: `ws://192.168.x.x:8000/api/v1/ws/connect`

---

## SECTION 16 — IMPLEMENTATION DECISIONS

1. **Why Subprocess Execution for AI Pipeline (`video_processor.py`):** TensorFlow, PyTorch, and OpenCV rely on native C++ libraries (OpenMP, CUDA, MKL) that share global CPU thread locks. Running heavy video analysis in the main FastAPI ASGI thread resulted in segmentation faults (`SEGV 11`). Launching `run_pipeline.py` via `asyncio.create_subprocess_exec` isolates memory entirely.
2. **Why Raw JSON for Vectors in PostgreSQL:** For initial deployment simplicity without requiring native pgvector extension compilation on developer host environments, 512-dimensional embeddings are serialized as JSON arrays and compared in-memory using NumPy vector operations.
3. **Why Custom IoU + Laplacian Blur Filtering:** Video feeds contain hundreds of low-quality, blurry face frames of the same person. Extracting embeddings on every frame is computationally wasteful and dilutes vector accuracy. Computing Laplacian variance allows the pipeline to select only the single sharpest frame per tracked individual.
4. **Why Android Foreground Service for Mobile:** Android aggressive battery optimization kills background WebSockets and GPS location listeners after a few minutes. Wrapping location and socket services inside an Expo Foreground Service with ongoing system notifications guarantees continuous operational status.

---

## SECTION 17 — TECHNICAL CHALLENGES FOUND IN CODE

1. **Thread Contention & Segfault 11 Mitigations:** PyTorch and OpenCV multi-threading collided with FastAPI async event loops. Mitigated by setting `OMP_NUM_THREADS="1"`, `OPENBLAS_NUM_THREADS="1"`, `cv2.setNumThreads(0)`, and `torch.set_num_threads(1)` at the very top of `pipeline.py` before importing deep learning modules.
2. **CCTV Domain-Gap & Low Confidence Boost:** Real-world CCTV footage exhibits low resolution, noise, and harsh angles, producing lower raw cosine similarity scores compared to pristine passport photos. Mitigated in `ai_events.py` by lowering the match threshold to `0.30` and applying an empirical +30% confidence scaling boost for sub-40% matches.
3. **Database I/O Throttling in Subprocesses:** Updating database progress on every single video frame caused database lock contention. Mitigated in `video_processor.py` by throttling DB progress commits to minimum 1.0% progress intervals (`if prog - last_db_commit_prog >= 1.0`).

---

## SECTION 18 — PROJECT FLOW

### Workflow 1: Missing Person Case Registration
```
User (Dispatcher) fills form on Dashboard (/missing/new)
  ↓
POST /api/v1/missing-persons/ -> Creates `missing_persons` record (Status: "Reported")
  ↓
POST /api/v1/missing-persons/{id}/image -> Uploads mugshot to `uploads/missing_persons/`
  ↓
`generate_embedding()` -> Extracts 512d AdaFace vector -> Saved to `missing_person.face_embedding`
  ↓
Auto Triggers `search_person_against_crops()` -> Scans historical CCTV `FaceCrop` table
  ↓
Returns success response to Dashboard UI
```

### Workflow 2: CCTV Video File Batch Analysis
```
User uploads video file on Dashboard (/uploads)
  ↓
POST /api/v1/uploads/ -> Saves file to disk, creates `video_footages` record (Status: "PENDING")
  ↓
User clicks "Analyze" -> POST /api/v1/uploads/{id}/analyze
  ↓
FastAPI BackgroundTask -> Calls `process_video_task(video_id)`
  ↓
Spawns subprocess: `python -u services/ai/run_pipeline.py <path> <id> <crops_dir> <log_file>`
  ↓
Subprocess: FrameExtractor -> YOLOv8 Face Detect -> IoU Tracker -> Blur Filter
  ↓
Subprocess selects sharpest crop per track -> Generates AdaFace 512d embedding
  ↓
Subprocess outputs `RESULT: [...]` -> `process_video_task` parses JSON -> Inserts `FaceCrop` DB records
  ↓
Updates `video_footages.status = "COMPLETED"` & `progress = 100.0`
```

### Workflow 3: Real-Time Detection & Tactical Patrol Dispatch
```
CCTV Feed / Mock Engine sends frame -> POST /api/v1/ai-events/
  ↓
YOLOv8 detects face -> AdaFace generates embedding -> Cosine similarity vs Missing Persons
  ↓
Match confirmed (Similarity >= 0.30) -> Creates `DetectionEvent` & `Alert` (Status: "pending")
  ↓
WebSocket broadcast: `possible_match_detected` -> Control Room Dashboard receives alert & plays sound
  ↓
Dispatcher clicks "Verify" -> PATCH /api/v1/alerts/{id}/status (status="Verified")
  ↓
`dispatch_service.assign_nearest_patrol` -> WebSocket broadcast `assignment` to Mobile Apps
  ↓
Mobile App displays full-screen `TacticalAlertPopup` overlay & plays alert sound
  ↓
Officer taps "RESPOND" -> Status updated to "EN-ROUTE" -> Officer `Assignment` created
  ↓
Mobile App streams live GPS & Battery telemetry every 5s -> Dashboard map updates in real time
  ↓
Officer locates person -> Taps "MARK FOUND" -> Alert status set to "FOUND" -> `MissingPerson.status` set to "Found"
```

---

## SECTION 19 — FILE REFERENCE INDEX

| Module / Component | Folder | File Path | Important Classes / Functions | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Entry** | `services/backend` | `main.py` | `app`, `serve_uploads`, `health_live` | FastAPI app initialization & CORS setup |
| **Backend Config** | `services/backend/core` | `config.py` | `Settings`, `settings` | Environment settings & DB URI generation |
| **Security & JWT** | `services/backend/core` | `security.py` | `get_password_hash`, `verify_password`, `create_access_token` | Password hashing & JWT generation |
| **WebSocket Core** | `services/backend/core` | `websocket_manager.py` | `ConnectionManager`, `manager` | WebSocket connection pool & broadcasting |
| **Video Processor** | `services/backend/core` | `video_processor.py` | `process_video_task` | Spawns AI subprocess for video analysis |
| **API Dependencies** | `services/backend/api` | `deps.py` | `get_db`, `get_current_user` | Async DB session & JWT auth dependency |
| **Auth Endpoint** | `services/backend/api/v1/endpoints` | `auth.py` | `login_access_token` | OAuth2 login & token response |
| **Alerts Endpoint** | `services/backend/api/v1/endpoints` | `alerts.py` | `get_stats`, `read_alerts`, `update_alert_status` | Alert retrieval, stats, & dispatch triggers |
| **Missing Persons**| `services/backend/api/v1/endpoints` | `missing_persons.py` | `create_missing_person`, `upload_missing_person_image` | Missing person CRUD & mugshot embedding |
| **AI Ingestion** | `services/backend/api/v1/endpoints` | `ai_events.py` | `ingest_ai_event`, `test_alert` | Edge camera ingestion & detection alerts |
| **Vector Search** | `services/backend/api/v1/endpoints` | `search.py` | `search_person_against_crops`, `mass_search_all`, `cosine_similarity` | Vector similarity search vs FaceCrops |
| **Uploads Endpoint**| `services/backend/api/v1/endpoints` | `uploads.py` | `upload_video`, `analyze_video`, `batch_analyze_videos` | Video file upload & analysis triggers |
| **WebSocket Handler**| `services/backend/api/v1/endpoints` | `websockets.py` | `websocket_endpoint`, `get_ws_user` | WebSocket handshake & telemetry ingestion |
| **Dispatch Service** | `services/backend/services` | `dispatch_service.py` | `DispatchService`, `assign_nearest_patrol` | Patrol assignment dispatch logic |
| **Telemetry Service**| `services/backend/services` | `telemetry_service.py` | `TelemetryService`, `process_patrol_telemetry` | Patrol location & battery update |
| **AI Pipeline** | `services/ai` | `pipeline.py` | `run_analysis_pipeline`, `calculate_iou` | Unified detection, tracking, blur & embedding |
| **Face Detector** | `services/ai/detection` | `face_detection.py` | `FaceDetector`, `detect_faces` | YOLOv8-face detection on CPU/GPU |
| **Face Cropper** | `services/ai/detection` | `face_cropper.py` | `FaceCropper`, `crop_face` | Bounding box slicing with 25% padding |
| **Face Embedder** | `services/ai/recognition` | `embedding_service.py` | `generate_embedding`, `init_adaface_model` | AdaFace 512d vector embedding extraction |
| **Ranking Service** | `services/ai/recognition` | `ranking_service.py` | `rank_matches`, `get_best_match` | Cosine similarity ranking engine |
| **DB Base** | `database/db` | `base.py` | `Base`, `UUIDMixin`, `TimestampMixin` | SQLAlchemy declarative base & mixins |
| **DB Session** | `database/db` | `session.py` | `engine`, `AsyncSessionLocal` | Asyncpg database connection pool |
| **DB Models** | `database/models` | `registry.py`, `auth.py`, `ai_events.py`, `personnel.py`, etc. | `MissingPerson`, `User`, `Alert`, `Officer`, `VideoFootage`, etc. | 20 SQLAlchemy database entity models |
| **Web API Client** | `apps/web-dashboard/src/lib` | `api.ts` | `fetchApi`, `getAlerts`, `uploadFootageWithProgress` | Frontend REST API fetch wrapper |
| **Web Auth State** | `apps/web-dashboard/src/lib` | `auth-context.tsx` | `AuthProvider`, `useAuth` | React authentication context |
| **Web WebSocket** | `apps/web-dashboard/src/lib` | `websocket.tsx` | `WebSocketProvider`, `useWebSocket` | React WebSocket context with auto-reconnect |
| **Mobile Entry** | `apps/mobile-app` | `App.tsx` | `App` | Mobile app entry, state, nav, & lifecycle |
| **Duty Manager** | `apps/mobile-app/src/services` | `dutyManager.ts` | `goOnDuty`, `goOffDuty`, `sendEvent` | Persistent mobile background layer |
| **Socket Manager** | `apps/mobile-app/src/services` | `socketManager.ts` | `connectSocket`, `disconnectSocket`, `sendTelemetry` | Mobile WebSocket connection client |
| **Foreground Service**| `apps/mobile-app/src/services` | `foregroundService.ts` | `startForegroundService`, `stopForegroundService` | Android ongoing foreground notification |
| **GPS Service** | `apps/mobile-app/src/services` | `gpsService.ts` | `startGpsTracking`, `stopGpsTracking` | Location tracking & telemetry stream |
| **Permission Service**| `apps/mobile-app/src/services` | `permissionService.ts` | `checkAllPermissionsStatus`, `requestPermissionType` | Permission guard & degraded state monitoring |

---

## SECTION 20 — INTERVIEW KNOWLEDGE BASE

### 1. The Subprocess Video Processing Architecture
- **What it is:** The mechanism (`services/backend/core/video_processor.py`) that executes AI video processing inside a standalone OS process via Python's `asyncio.create_subprocess_exec`.
- **Why it exists in THIS project:** Deep learning libraries (PyTorch, Ultralytics YOLO, OpenCV) allocate C++ threads and GPU memory. Executing inference directly inside the main FastAPI server process caused non-deterministic segmentation faults (`SEGV 11`) due to OpenMP/C++ thread conflicts with FastAPI's async event loop.
- **How it works in THIS project:** `process_video_task` launches `services/ai/run_pipeline.py` with video arguments. The subprocess streams text progress over `stdout` (`PROGRESS:85.0`). The parent backend parses these lines, updates `video_footages.progress` in the database (throttled to 1% intervals), and reads final JSON results (`RESULT:[...]`) upon completion.
- **Trade-offs:** Introduces minor IPC (Inter-Process Communication) overhead, but guarantees 100% server uptime and zero segfault risks.

### 2. Multi-Frame IoU Tracking & Laplacian Blur Filtering
- **What it is:** A computer vision optimization algorithm (`services/ai/pipeline.py`) that tracks face bounding boxes across frames using Intersection over Union (IoU) and filters crops using Laplacian variance.
- **Why it exists in THIS project:** Analyzing every single frame of a 30 FPS CCTV feed yields thousands of redundant, blurry, or occluded face crops of the same person. Generating 512d vectors for all of them degrades performance and pollutes the database.
- **How it works in THIS project:**
  1. Frames extracted at interval `skip_interval=5`.
  2. YOLOv8 detects face bounding boxes.
  3. Spatial overlap between consecutive frames is checked via `calculate_iou(boxA, boxB)`. If IoU >= `0.3`, the detection is attached to an existing track; otherwise a new track is created.
  4. For every crop, Laplacian variance (`cv2.Laplacian(gray, cv2.CV_64F).var()`) measures edge sharpness.
  5. Upon track completion (max missed frames = `15`), ONLY the single sharpest frame crop per track is passed to AdaFace to generate an embedding.
- **Advantages:** Reduces vector embedding extraction overhead by ~95% while selecting the highest-quality face for recognition.

### 3. AdaFace 512-Dimensional Vector Embeddings & Cosine Search
- **What it is:** The primary facial recognition model (`services/ai/recognition/embedding_service.py`) and vector similarity search engine (`services/backend/api/v1/endpoints/search.py`).
- **Why it exists in THIS project:** Traditional facial landmark matching fails on unconstrained CCTV images. AdaFace projects facial features into a 512-dimensional normalized hypersphere, adapting feature weights based on image quality.
- **How it works in THIS project:**
  1. Cropped face resized to `112x112` RGB.
  2. Normalized to `[-1, 1]` range: `(pixel - 127.5) / 128.0`.
  3. Fed into AdaFace IR50 model (`cvlface_adaface_ir50_ms1mv2`) producing 512 float values.
  4. Matching performed via Cosine Similarity (`dot(A, B) / (norm(A) * norm(B))`). Scores above `0.30` trigger CCTV alerts.

### 4. Role-Partitioned WebSocket Connection Pools
- **What it is:** An in-memory real-time connection manager (`services/backend/core/websocket_manager.py`).
- **Why it exists in THIS project:** Different operational roles require different data streams. Patrol officers need targeted assignment alerts and shouldn't be spammed with raw camera detections; control room dispatchers need all global match alerts.
- **How it works in THIS project:** Keeps three distinct Python dictionaries: `active_admins`, `active_dispatchers`, `active_patrols`. Connections are authenticated via JWT on handshake and stored by `user_id`. `manager.broadcast_global_alert()` broadcasts to all three pools; `manager.broadcast_to_dispatchers()` targets control rooms; `manager.send_personal_message()` targets specific patrol units.

### 5. Android Foreground Service & Telemetry Persistence
- **What it is:** The mobile background layer (`apps/mobile-app/src/services/dutyManager.ts` & `foregroundService.ts`).
- **Why it exists in THIS project:** Modern Android OS versions terminate background WebSockets and GPS location tasks when the screen turns off or the app is minimized.
- **How it works in THIS project:** Toggling "ACTIVE DUTY" starts an Expo Foreground Service with an ongoing system notification ("GARUDA ASTRA — Active Tactical Tracking"). This prevents OS process termination. GPS coordinates (`gpsService.ts`) and battery levels (`batteryService.ts`) are fetched every 5 seconds and transmitted over the WebSocket (`socketManager.ts`). Hardware back-button presses are intercepted via React Native `BackHandler` and minimized via `IntentLauncher` to ensure officers remain on duty.

---
