# Technology Stack

**Analysis Date:** 2026-11-04

## Languages

**Primary:**
- Python 3.12+ - Backend services, AI pipelines, data ingestion, database migrations (`services/backend/`, `services/ai/`, `database/`)
- TypeScript 5.x - Web dashboard and mobile application (`apps/web-dashboard/`, `apps/mobile-app/`)

**Secondary:**
- JavaScript (ES6+ / Node.js) - Mobile deployment scripts, Expo config plugins, build tooling (`apps/mobile-app/scripts/`, `apps/mobile-app/postinstall-patches.js`)
- SQL / PostgreSQL DDL - Relational database schemas and Alembic migration scripts (`database/alembic/versions/`)
- Bash / PowerShell - Environment provisioning and server execution scripts (`README.md`, `database/scripts/`)

## Runtime

**Environment:**
- Python 3.12+ (Virtual environment in `services/venv`)
- Node.js 20.x+ (Package manager and bundling for frontend/mobile apps)
- React Native 0.81.5 / Expo SDK 54 (Android / iOS mobile runtime)

**Package Managers:**
- `pip` (Python) - Virtualenv package management via `services/requirements.txt`
- `npm` (Node.js) - Dependency resolution with `package-lock.json` in `apps/web-dashboard/` and `apps/mobile-app/`

## Frameworks

**Core:**
- FastAPI (>=0.111.0) - High-performance async ASGI web framework for REST API and WebSocket gateway (`services/backend/main.py`)
- Uvicorn (>=0.30.0) - ASGI server implementation for FastAPI (`services/backend/`)
- SQLAlchemy (>=2.0.30) - Async ORM and query builder using asyncpg driver (`database/db/session.py`)
- Next.js 16.2.6 (App Router) & React 19.2.4 - Tactical Control Room Web Dashboard (`apps/web-dashboard/`)
- React Native 0.81.5 & Expo 54.0.0 - Field Patrol Mobile Application (`apps/mobile-app/`)
- Ultralytics YOLOv8 & DeepFace / FaceNet512 - Computer vision face detection, alignment, and facial embedding generation (`services/ai/`)

**Testing:**
- Pytest (>=9.0.3) - Backend integration and server testing (`services/backend/scripts/test_server.py`)
- Python `unittest` / Pytest - AI pipeline verification (`services/ai/tests/test_detection.py`, `services/ai/tests/test_recognition.py`)

**Build & Dev Tooling:**
- Alembic (>=1.13.1) - Relational database schema migrations (`database/alembic/`)
- Tailwind CSS v4 & PostCSS - Utility-first styling for web dashboard (`apps/web-dashboard/`)
- Expo CLI & EAS Build - React Native compilation and APK generation (`apps/mobile-app/eas.json`)
- ONNX Runtime - Hardware-accelerated inference for YOLOv8 face detection (`services/ai/models/yolov8n-face.onnx`)

## Key Dependencies

**Critical:**
- `insightface` / `ultralytics` / `deepface`: Face detection, bounding box extraction, and biometric embedding (`services/ai/`)
- `asyncpg` (>=0.29.0): High-speed asynchronous PostgreSQL driver (`database/db/session.py`)
- `pydantic` (>=2.7.0) & `pydantic-settings`: Strict type validation and configuration parsing (`services/backend/schemas/`, `services/backend/core/config.py`)
- `python-jose[cryptography]` & `passlib[bcrypt]`: JWT token issuance, verification, and PBKDF2/Bcrypt password hashing (`services/backend/core/security.py`)
- `react-native-background-actions` & `expo-task-manager`: Continuous background GPS tracking for officers on patrol (`apps/mobile-app/src/services/foregroundService.ts`)
- `leaflet` & `react-leaflet`: Tactical GIS mapping and sighting heatmap visualizer (`apps/web-dashboard/src/components/map/LiveMap.tsx`)

**Infrastructure:**
- `opencv-python-headless`: Video frame extraction, cropping, and Laplacian blur calculation (`services/ai/detection/`)
- `httpx` (>=0.27.0): Asynchronous HTTP client for internal services and third-party webhooks (`services/backend/`)
- `lucide-react`: Tactical icons across web dashboard components (`apps/web-dashboard/src/components/`)

## Configuration

**Environment:**
- Backend & Database: Configured via `.env` and `database/.env` (`DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Web Dashboard: `apps/web-dashboard/.env.local` / `NEXT_PUBLIC_API_URL`
- Mobile Application: `apps/mobile-app/.env` / `EXPO_PUBLIC_API_URL`

**Build Configurations:**
- `database/alembic.ini` - Database migration rules and metadata target
- `apps/web-dashboard/tsconfig.json` & `apps/web-dashboard/next.config.ts` - Next.js compilation
- `apps/mobile-app/tsconfig.json` & `apps/mobile-app/app.json` - Expo / React Native Android configuration

## Platform Requirements

**Development:**
- Python 3.12 virtual environment on Windows / macOS / Linux
- Node.js 20+ with npm
- Local PostgreSQL 14+ instance (default: `postgresql://postgres:postgres@localhost:5432/astra_db`)
- Android Studio / Android SDK (for compiling and emulating the mobile patrol application)

**Production:**
- Deployed Backend: `https://backend.garudaastra.dpdns.org`
- Deployed Web Dashboard: `https://frontend.garudaastra.dpdns.org`
- Mobile distribution via signed standalone APK (`apps/mobile-app/dist/garudaastra-release.apk`)
- Subprocess isolation for compute-heavy ML workloads to prevent OpenMP/CUDA memory collisions

---
*Stack analysis: 2026-11-04*
*Update after major dependency changes*
