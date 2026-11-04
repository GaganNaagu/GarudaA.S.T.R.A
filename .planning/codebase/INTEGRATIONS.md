# External Integrations

**Analysis Date:** 2026-11-04

## APIs & External Services

**Video & Surveillance Feeds:**
- RTSP / Video Stream Ingestion - CCTV streams, uploaded MP4/H.264 camera footage files (`services/backend/api/v1/endpoints/uploads.py`, `services/ai/detection/video_service.py`)
  - Integration method: Subprocess pipeline invoking OpenCV `cv2.VideoCapture` and frame extraction
  - Storage: Saved to `services/backend/uploads/` and mapped to `database.models.infrastructure.VideoFootage`
  - Fallback: Cloud redirect fallback to `https://backend.garudaastra.dpdns.org/uploads/{path}`

**Mapping & GIS Tile Services:**
- OpenStreetMap / Leaflet Tile Layer - Renders geographical maps for incident tracking, camera placement, patrol units, and detection heatmaps (`apps/web-dashboard/src/components/map/LiveMap.tsx`, `apps/mobile-app/src/screens/MapScreen.tsx`)
  - Integration method: HTTP tile requests to standard OSM servers
  - Auth: None (Public OSM tile service)

**Mobile Device Sensors & Hardware Services:**
- Expo Location API - Real-time GPS coordinates (latitude, longitude, speed, heading) streamed from officer devices (`apps/mobile-app/src/services/gpsService.ts`)
- Expo Battery API - Device battery percentage and charging state telemetry (`apps/mobile-app/src/services/batteryService.ts`)
- Expo Notifications & Audio - Audible tactical alert sirens and push notifications when high-confidence matches are found (`apps/mobile-app/src/utils/alertService.ts`)

## Data Storage

**Databases:**
- PostgreSQL (v14+) - Relational data store for operational entities, users, incident logs, detection events, and alerts
  - Connection: `DATABASE_URL` (defaults to `postgresql://postgres:postgres@localhost:5432/astra_db`)
  - Async Client: `asyncpg` via SQLAlchemy `AsyncSession` (`database/db/session.py`)
  - Sync Client: Standard `psycopg2` / `pg8000` via SQLAlchemy engine for Alembic migrations
  - Migrations: Alembic scripts in `database/alembic/versions/`

**Vector / Embedding Storage:**
- PostgreSQL `JSON` / `JSONB` columns - Storing 512-dimensional facial embedding vectors directly in `missing_persons.face_embedding` and `face_crops.embedding` (`database/models/registry.py`, `database/models/infrastructure.py`)
- In-memory Vector Search: Cosine similarity computation executed via NumPy array dot-product and norm calculations in `services/backend/api/v1/endpoints/search.py` and `services/ai/recognition/similarity_service.py`

**File Storage:**
- Local Disk Storage:
  - Reference missing person portraits: `services/backend/uploads/missing_persons/`
  - Video footage: `services/backend/uploads/`
  - Detected and aligned face crops: `services/backend/uploads/crops/{video_id}/`
  - Evidence attachments: `services/backend/uploads/evidence/`
- Production Remote Endpoint: `https://backend.garudaastra.dpdns.org/uploads/`

## Authentication & Identity

**Auth Provider:**
- Custom JWT (JSON Web Tokens) with role-based access control (RBAC) (`services/backend/core/security.py`, `services/backend/api/v1/endpoints/auth.py`)
  - Token Type: Bearer JWT signed using HMAC-SHA256 (`HS256`)
  - Expiration: Access tokens expire after 30 minutes; refresh tokens valid for 7 days
  - Storage:
    - Web Dashboard: `localStorage.getItem('astra_token')` (`apps/web-dashboard/src/lib/api.ts`)
    - Mobile App: Hardware-encrypted `expo-secure-store` (`apps/mobile-app/src/services/api.ts`)
  - System Roles: `Admin`, `Dispatcher`, `Officer` (`database/models/auth.py`)

**Permissions & Guards:**
- Backend Dependencies: `get_current_user`, `get_current_active_user`, `check_permissions` in `services/backend/api/deps.py`
- Mobile Guard: `PermissionGuardScreen.tsx` ensuring background location and notification permissions before duty activation

## Real-Time Communication

**WebSocket Infrastructure:**
- FastAPI WebSocket Gateway (`services/backend/core/websocket_manager.py`, `services/backend/api/v1/endpoints/websockets.py`)
  - Connection endpoint: `/api/v1/ws/{client_id}`
  - Protocol: JSON message frames with subscription topics (`alerts`, `incidents`, `units`, `telemetry`)
  - Heartbeat: Periodic ping/pong health maintenance to detect dropped mobile connections
  - Consumers:
    - Web Dashboard: `apps/web-dashboard/src/lib/websocket.tsx`
    - Mobile App: `apps/mobile-app/src/services/socketManager.ts`

## Monitoring & Observability

**Health Checks:**
- Server Liveness: `GET /health/live` returning `{"status": "alive"}`
- Database Connection Health: Checked dynamically on startup and status polls
- AI Subsystem Telemetry: `database.models.system.AIHealthStatus` tracking heartbeat timestamps

**Audit & Activity Logging:**
- Structured Activity Logs: `database.models.system.ActivityLog` recording operator ID, action type, entity target, and JSON metadata (`services/backend/api/v1/endpoints/admin.py`)
- Background Process Logging: Subprocess execution logs written to `ai_pipeline.log` in root workspace

---
*Integrations analysis: 2026-11-04*

