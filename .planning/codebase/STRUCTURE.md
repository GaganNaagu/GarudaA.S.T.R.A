# Codebase Structure

**Analysis Date:** 2026-11-04

## Directory Layout

```
GarudaA.S.T.R.A/
├── .github/                  # CI/CD automation workflows (deploy.yml)
├── .planning/                # Project planning memory, codebase intelligence, roadmaps
│   └── codebase/             # System documentation and codebase maps
├── apps/                     # Client application frontends
│   ├── mobile-app/           # React Native / Expo tactical mobile app for field officers
│   │   ├── assets/           # Application icons, splash screens, alert audio files
│   │   ├── scripts/          # Mobile automation & APK deployment scripts
│   │   └── src/              # Mobile TypeScript source code
│   │       ├── components/   # UI components (TacticalCard, ScanLine, TacticalAlertPopup)
│   │       ├── constants/    # Theme definitions and color tokens
│   │       ├── screens/      # Application screens (Map, Alerts, Cases, Duty, Profile)
│   │       ├── services/     # Mobile device services (GPS, battery, socket, background)
│   │       └── utils/        # Tactical alert services and mock states
│   └── web-dashboard/        # Next.js 16 tactical command center web application
│       ├── public/           # Static web assets
│       └── src/              # Web TypeScript source code
│           ├── app/          # Next.js App Router pages (admin, alerts, missing, patrol, etc.)
│           ├── components/   # Layout, UI components, and Leaflet live maps
│           └── lib/          # API client, AuthContext, WebSocket provider, utilities
├── database/                 # PostgreSQL persistence and migration layer
│   ├── alembic/              # Alembic migration configurations and revision scripts
│   ├── db/                   # Database engine, base models, session generators
│   ├── models/               # SQLAlchemy ORM declarative models
│   └── scripts/              # Seed scripts for admin, test users, and demo data
├── docs/                     # General project documentation and setup notes
├── services/                 # Backend and compute services
│   ├── ai/                   # Computer vision and deep learning inference module
│   │   ├── core/             # AI configuration and logging setup
│   │   ├── dataset/          # Test images and evaluation benchmarks
│   │   ├── detection/        # Face detection (YOLOv8), cropping, preprocessing
│   │   ├── models/           # Pretrained weights (.onnx, .pt)
│   │   ├── recognition/      # Face embedding extraction, similarity, and ranking
│   │   └── tests/            # AI unit and integration tests
│   ├── backend/              # FastAPI REST API and WebSocket gateway
│   │   ├── api/              # API router, dependencies, and v1 endpoints
│   │   ├── core/             # Security, config, exceptions, video processing task
│   │   ├── schemas/          # Pydantic schemas for request/response serialization
│   │   ├── scripts/          # Mock AI engines and backend tests
│   │   ├── services/         # Business logic services (alerts, dispatch, telemetry)
│   │   └── uploads/          # Local media storage (videos, face crops, photos)
│   └── requirements.txt      # Python dependencies for backend and AI
├── shared/                   # Shared types and utilities across services
├── context.md                # Architectural onboarding and 7-phase implementation guide
├── GARUDA_ASTRA_Upgrades_Only_Report-1.md # Feature roadmap and major upgrade specifications
├── garuda_astra_technical_knowledge_base.md # Comprehensive domain reference manual
├── GUIDE.md                  # Project execution quickstart
├── README.md                 # Setup, virtual environment, and startup instructions
└── TEST_CREDENTIALS.md       # Default user logins for Admin, Dispatcher, and Officer roles
```

## Directory Purposes

**`apps/mobile-app`:**
- Purpose: Mobile tactical responder application executed by patrol officers on duty.
- Contains: React Native components, Expo modules, background task registration.
- Key files:
  - `apps/mobile-app/App.tsx`: App root with navigation and duty management.
  - `apps/mobile-app/src/services/foregroundService.ts`: Background location tracking task.
  - `apps/mobile-app/src/services/socketManager.ts`: Mobile WebSocket client for real-time dispatch alerts.
  - `apps/mobile-app/src/screens/MapScreen.tsx`: Real-time map displaying current location and tactical alerts.

**`apps/web-dashboard`:**
- Purpose: Central command and control room web application for dispatchers and administrators.
- Contains: Next.js App Router pages, Leaflet interactive maps, authentication providers.
- Key files:
  - `apps/web-dashboard/src/app/page.tsx`: Main overview and surveillance dashboard.
  - `apps/web-dashboard/src/components/map/LiveMap.tsx`: Interactive Leaflet map visualizing alerts and units.
  - `apps/web-dashboard/src/lib/api.ts`: API client with unified request handling and mock fallback.
  - `apps/web-dashboard/src/lib/websocket.tsx`: Real-time WebSocket context provider.

**`database`:**
- Purpose: Database configuration, ORM models, Alembic migrations, and seeding utilities.
- Contains: SQLAlchemy models, migration files, migration runner `alembic.ini`.
- Key files:
  - `database/models/__init__.py`: Registry of all SQLAlchemy ORM models.
  - `database/db/session.py`: Async engine and session factory.
  - `database/scripts/seed_users.py`: Seeding script for default role accounts.

**`services/backend`:**
- Purpose: Core backend web service exposing REST APIs and WebSocket real-time channels.
- Contains: FastAPI endpoints, business services, authentication, video processor task.
- Key files:
  - `services/backend/main.py`: Application entry point, middleware, and route mounting.
  - `services/backend/api/v1/router.py`: Top-level router aggregating all endpoint subrouters.
  - `services/backend/core/websocket_manager.py`: WebSocket connection and broadcasting manager.
  - `services/backend/core/video_processor.py`: Subprocess dispatcher for video analysis.

**`services/ai`:**
- Purpose: Computer vision module for face detection, tracking, blur filtering, and facial embedding.
- Contains: YOLOv8 face detector, DeepFace recognition service, alignment and similarity utilities.
- Key files:
  - `services/ai/pipeline.py`: Comprehensive video processing and face tracking pipeline.
  - `services/ai/run_pipeline.py`: Standalone CLI executable invoked by backend subprocesses.
  - `services/ai/detection/face_detection.py`: YOLOv8-face inference wrapper.
  - `services/ai/recognition/embedding_service.py`: DeepFace / FaceNet512 embedding generator.

## Key File Locations

**Entry Points:**
- Backend API: `services/backend/main.py`
- AI Pipeline CLI: `services/ai/run_pipeline.py`
- Web Dashboard: `apps/web-dashboard/src/app/page.tsx`
- Mobile Application: `apps/mobile-app/index.ts` and `App.tsx`

**Configuration:**
- Backend & DB: `services/backend/core/config.py` and `database/.env`
- Web Dashboard: `apps/web-dashboard/next.config.ts`, `apps/web-dashboard/tsconfig.json`
- Mobile App: `apps/mobile-app/app.json`, `apps/mobile-app/tsconfig.json`
- Alembic: `database/alembic.ini` and `database/alembic/env.py`

**Core Logic:**
- Alert & Dispatch Management: `services/backend/services/alert_service.py`, `services/backend/services/dispatch_service.py`
- Biometric Search: `services/backend/api/v1/endpoints/search.py`
- Face Tracking & Quality: `services/ai/detection/video_service.py`, `services/ai/detection/preprocessing.py`
- Biometric Similarity: `services/ai/recognition/similarity_service.py`
- Mobile Duty & Telemetry: `apps/mobile-app/src/services/dutyManager.ts`, `apps/mobile-app/src/services/gpsService.ts`

**Testing:**
- Backend Server Test: `services/backend/scripts/test_server.py`
- AI Detection Test: `services/ai/tests/test_detection.py`
- AI Recognition Test: `services/ai/tests/test_recognition.py`

## Naming Conventions

- Python files: `snake_case.py` (e.g., `video_processor.py`, `missing_persons.py`)
- Python classes: `PascalCase` (e.g., `VideoFootage`, `FaceDetector`, `Settings`)
- TypeScript React components: `PascalCase.tsx` (e.g., `LiveMap.tsx`, `TacticalAlertPopup.tsx`)
- TypeScript utilities & services: `camelCase.ts` (e.g., `dutyManager.ts`, `socketManager.ts`)
- Database tables: `plural_snake_case` (e.g., `detection_events`, `missing_persons`, `video_footages`)

---
*Structure analysis: 2026-11-04*

