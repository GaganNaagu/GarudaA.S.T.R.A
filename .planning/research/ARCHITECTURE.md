# Architecture Research

**Domain:** Multi-Tier AI-Assisted Surveillance, Tactical Dispatch & Geospatial Decision Support  
**Researched:** 2026-11-04  
**Confidence:** HIGH  

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Client Presentation Tier                          │
│                                                                             │
│   Next.js 16 Web Dashboard (Control Room)    React Native Patrol Mobile     │
│   ┌─────────────────────────────────────┐    ┌───────────────────────────┐  │
│   │ • Search Session Wizard             │    │ • Incident Alerts & Sound │  │
│   │ • Live CCTV Monitor with Boxes      │    │ • Duty Status Toggle      │  │
│   │ • Leaflet Heatmap & Movement Trails │    │ • Background GPS Beacon   │  │
│   │ • Evidence Vault & PDF Report Exporter│  │ • Sighting Verification   │  │
│   └──────────────────┬──────────────────┘    └─────────────┬─────────────┘  │
└──────────────────────┼─────────────────────────────────────┼────────────────┘
                       │ HTTPS / WSS                         │ HTTPS / WSS
                       ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  Nginx Reverse Proxy & SSL Termination (:443)               │
│         /api/v1/* -> FastAPI (:8000)  |  /* -> Next.js (:3000)              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Application Service Tier                          │
│                                                                             │
│   FastAPI ASGI Application Server                                           │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │ • Auth & RBAC (Admin, Dispatcher, Officer)                           │  │
│   │ • WebSocket Hub (Topic Broadcaster: alerts, units, search_progress)  │  │
│   │ • SearchSession & Sighting Ranking Service                           │  │
│   │ • PDF Report Generator Service (ReportLab / WeasyPrint)              │  │
│   │ • Spatial Sighting & Priority Zone Calculator                        │  │
│   └──────────────────┬───────────────────────────────────────────────────┘  │
└──────────────────────┼──────────────────────────────────────────────────────┘
                       │                                      ▲
                       │ Async Database Pool                  │ Subprocess RPC / Log
                       ▼                                      ▼
┌─────────────────────────────────────────┐  ┌────────────────────────────────┐
│             Persistence Tier            │  │      AI Worker Subsystem       │
│                                         │  │                                │
│   PostgreSQL 14+ Relational DB          │  │  Python 3.12 Independent Worker│
│   • Cases, Missing Persons, Evidence    │  │  • Threaded RTSP Frame Grabber │
│   • VideoFootage, FaceCrops, Embeddings │  │  • YOLOv8 Face Detection       │
│   • Sightings, Alerts, Assignments      │  │  • Laplacian Blur Filter       │
│   • ActivityLogs, SystemSettings        │  │  • FaceNet512 Biometrics       │
└─────────────────────────────────────────┘  └────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation Details |
|-----------|----------------|------------------------|
| **Evidence Manager** | Stores original frames, face crops, and metadata; tracks verification workflow | `EvidenceFile` & `FaceCrop` models, FastAPI endpoints, local/cloud storage |
| **Ranking Service** | Calculates composite matching score using similarity, blur quality, and temporal weights | Pure NumPy evaluation service called by search endpoints |
| **Spatial Engine** | Aggregates GPS coordinates into heatmap intensity matrices and calculates priority search circles | Haversine distance calculations and geo-clustering algorithms |
| **PDF Generator** | Compiles case records, evidence images, and timelines into publication-quality dossiers | Server-side Python ReportLab/WeasyPrint rendering into downloadable byte streams |
| **Live RTSP Monitor** | Streams simulated/live camera frames, detects faces, draws bounding boxes, triggers instant alerts | Multi-threaded OpenCV reader piping frames through WebSocket/MJPEG stream |
| **Nginx Proxy** | Single ingress point for all web, API, and WebSocket connections | Dockerized Nginx with automated self-signed/Let's Encrypt certificates |

## Recommended Monorepo Layout

```
GarudaA.S.T.R.A/
├── apps/
│   ├── mobile-app/              # React Native / Expo application
│   └── web-dashboard/           # Next.js 16 Web Dashboard
│       └── src/
│           ├── components/
│           │   ├── evidence/    # Evidence gallery and card components
│           │   ├── search/      # Search session wizard
│           │   ├── map/         # LiveMap, HeatmapLayer, MovementTrail
│           │   └── timeline/    # Chronological investigation timeline
│           └── lib/api.ts       # Unified API client
├── database/                    # PostgreSQL models and Alembic migrations
├── docker/                      # Production container deployment assets
│   ├── Dockerfile.backend       # Multi-stage Python 3.12-slim build
│   ├── Dockerfile.web           # Next.js standalone container build
│   ├── nginx.conf               # Reverse proxy, WSS routing & SSL configuration
│   └── docker-compose.yml       # Production composition specification
├── services/
│   ├── ai/                      # Computer vision inference engine
│   └── backend/                 # FastAPI REST & WebSocket server
│       ├── api/v1/endpoints/
│       │   ├── search_session.py# Search session execution & progress
│       │   ├── evidence.py      # Evidence vault management
│       │   ├── reports.py       # PDF report generation
│       │   └── live_feed.py     # RTSP monitor and detection feed
│       └── services/            # Ranking, spatial analysis, report builders
└── shared/                      # Shared schemas and data contracts
```

## Architectural Patterns

### Pattern 1: Subprocess-Isolated AI Execution
To prevent PyTorch/TensorFlow C-level segfaults (SEGV 11) from crashing the asynchronous web server, all heavy frame extraction and model inference execute in dedicated worker processes. The FastAPI server communicates with the worker via command-line arguments, process stdout pipes, and database state transitions.

### Pattern 2: Topic-Based WebSocket Event Bus
The `WebSocketManager` maintains client subscription channels:
- `alerts`: Instant notification of new candidate sightings
- `units`: Live GPS locations of officers on patrol
- `search_progress`: Streaming percentage updates during video scans
- `live_detections`: Real-time bounding box coordinates for the RTSP live monitor

### Pattern 3: Composable Map Visualizations
The web dashboard's `LiveMap.tsx` acts as a declarative shell rendering multiple independent layer components:
1. Base Tile Layer (OpenStreetMap)
2. `HeatmapLayer` (`leaflet.heat` density overlay)
3. `MovementTrailLayer` (Animated polyline connecting chronological sightings)
4. `SearchPriorityZoneLayer` (Concentric circles highlighting search urgency)
5. `UnitMarkerLayer` (Live moving icons of active patrol units)

---
*Architecture research: 2026-11-04*
