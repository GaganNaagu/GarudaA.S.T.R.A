# Project Research Summary

**Project:** GARUDA A.S.T.R.A — AI-Assisted Missing Person Recovery & Safe Return Network  
**Domain:** Public Safety Video Surveillance, Tactical Dispatch & Geospatial Decision Support  
**Researched:** 2026-11-04  
**Confidence:** HIGH  

## Executive Summary

GARUDA A.S.T.R.A is transitioning from an initial face-recognition prototype into an AI-assisted investigative and tactical decision-support system. While traditional solutions stop at "face matched in video," this upgraded platform manages the complete investigative lifecycle: defining structured search parameters across CCTV networks, ranking candidate matches transparently with composite confidence scoring, maintaining an auditable forensic evidence vault, reconstructing spatial-temporal movement trails, prioritizing nearby camera zones for rapid field search, and deploying turn-key infrastructure via Docker.

Research confirms that the highest evaluator impact is achieved through **visible, explainable, and demonstrable capabilities** rather than black-box complexity. By structuring development into three distinct 2-month phases—Phase 2 (Investigation Intelligence), Phase 3 (Structured Search & Spatial Analysis), and Phase 4 (Live Operations, Spatial Intelligence & Production Deployment)—every milestone produces concrete, demonstrable features for academic review boards.

Key technical risks—specifically OpenCV RTSP frame accumulation lag, React 19 Leaflet context incompatibilities, and async event loop blocking during vector calculations—have been analyzed and neutralized with proactive architectural patterns (multi-threaded frame buffering, native `useMap` hook wrappers, and `asyncio.to_thread` execution).

## Key Findings

### Recommended Stack
- **Backend & Compute:** FastAPI with Python 3.12, asyncpg, SQLAlchemy 2.0, YOLOv8n-face, DeepFace / FaceNet512, ReportLab/WeasyPrint for PDF generation.
- **Frontend Dashboard:** Next.js 16 (React 19), Tailwind CSS v4, Leaflet with `leaflet.heat` custom layer, Lucide icons.
- **Mobile Responder:** React Native 0.81.5 with Expo SDK 54, hardware GPS telemetry, background actions.
- **Production Infrastructure:** Docker Compose with Nginx reverse proxy, automated SSL, and health checks.

### Expected Features
- **Table Stakes (Phase 2):** Evidence Vault with original frames and crops, Smart Match Ranking with composite scores, Chronological Investigation Timeline, Priority-Tiered Alert Center.
- **Differentiators (Phase 3):** Wizard-driven AI Search Sessions with real-time progress bars, Dynamic Sighting Heatmap overlay on Leaflet, Aggregated Case Analytics, Downloadable PDF Case Dossier.
- **Advanced Operations (Phase 4):** Live RTSP Camera Monitoring (controlled simulated feed with real-time bounding boxes), Animated Movement Trajectory Playback on map, Rule-based Search Priority Zones, One-Command Docker Deployment with Nginx.

### Architecture Approach
A multi-tier monorepo architecture leveraging:
1. Subprocess-isolated computer vision workers to prevent memory collisions and segfaults.
2. A topic-based WebSocket bus for low-latency dispatch and search progress streaming.
3. Declarative, multi-layered Leaflet mapping separating heatmaps, movement polylines, and unit beacons.

### Critical Pitfalls & Mitigations
1. **RTSP Buffer Lag:** Resolved by using a multi-threaded `RTSPStreamReader` keeping only the latest frame.
2. **React 19 Map Hydration Errors:** Resolved by building a native `useMap()` hook wrapper around `leaflet.heat`.
3. **Event Loop Starvation:** Resolved by running vector math in worker threads (`asyncio.to_thread`).
4. **Container OOM:** Resolved by limiting OpenCV thread pools and resizing frames before detection.

## Implications for Roadmap

The research directly establishes the 3-phase execution roadmap:

### 📦 College Phase 2: Investigation Intelligence Layer (Months 1–2)
Transforms raw detection outputs into structured investigative knowledge.
- Deliverables: Evidence Vault with verification workflow, Smart Match Ranking leaderboard, AI Investigation Timeline, Intelligent Alert Center.

### 📦 College Phase 3: Structured Search & Spatial Analysis (Months 3–4)
Empowers investigators with active search tools and spatial intelligence.
- Deliverables: AI Search Session wizard with progress bars, Sighting Heatmap on city map, AI Analytics cards, Downloadable PDF Case Reports.

### 📦 College Phase 4: Live Operations, Spatial Intelligence & Production Deployment (Months 5–6)
Delivers real-time camera processing, predictive search zones, animated trajectories, and full Docker containerization.
- Deliverables: Live RTSP Camera Monitor with real-time bounding boxes, Animated Movement Trail playback, Search Priority Zones, Turnkey Docker Compose + Nginx + SSL stack, System Health Dashboard.

---
*Research summary: 2026-11-04*

