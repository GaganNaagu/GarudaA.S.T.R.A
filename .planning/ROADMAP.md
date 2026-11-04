# Roadmap: GARUDA A.S.T.R.A

## Overview

GARUDA A.S.T.R.A transitions from a core face-recognition pipeline into a comprehensive AI-assisted missing-person recovery and tactical dispatch platform. Development is organized into three major college milestone phases (Phase 2, Phase 3, Phase 4) delivering forensic auditing, structured search workflows, spatial heatmaps, live video monitoring, and turnkey production Docker deployment.

## Phases

- [x] **Phase 1: Database Foundation, Core APIs & Mobile Baseline** - Initial monorepo scaffolding, FastAPI REST & WebSocket server, YOLOv8 face detector, and Expo patrol app. (Completed)
- [ ] **Phase 2: Investigation Intelligence Layer** - Evidence vault, smart match ranking with composite scoring, chronological case timeline, and intelligent alert center.
- [ ] **Phase 3: Structured Search & Spatial Analysis** - AI search session wizard with real-time progress, sighting density heatmap, case analytics, and downloadable PDF reports.
- [ ] **Phase 4: Live Operations, Spatial Intelligence & Production Deployment** - Controlled live RTSP monitoring with real-time bounding boxes, animated movement trails, search priority zones, and production Docker compose stack with Nginx.

---

## Phase Details

### Phase 1: Database Foundation, Core APIs & Mobile Baseline (Completed)
**Goal**: Operational baseline for authentication, data persistence, face detection, and mobile alerting.  
**Depends on**: Nothing  
**Requirements**: Foundational REST endpoints, WebSocket hub, database models, mobile app baseline.  
**Success Criteria**:
1. Operators can log in via JWT and receive alerts over authenticated WebSockets.
2. Missing persons can be registered with facial photos and embeddings.
3. Uploaded CCTV videos extract face crops and perform cosine similarity search.
4. Mobile app connects to backend, transmits GPS telemetry, and receives alert notifications.

---

### Phase 2: Investigation Intelligence Layer
**Goal**: Transform detection events into an auditable, ranked forensic investigation record.  
**Depends on**: Phase 1  
**Requirements**: EVID-01, EVID-02, EVID-03, RANK-01, RANK-02, RANK-03, TIME-01, TIME-02, TIME-03, ALRT-01, ALRT-02, ALRT-03  
**Success Criteria**:
1. Every candidate sighting stores a complete forensic package (frame, crop, camera ID, timestamp, GPS, similarity score, blur quality score, model version).
2. Missing person case view provides an Evidence Gallery with interactive verification actions (`Unreviewed` → `Confirmed` → `Rejected`).
3. Sighting search results display a ranked leaderboard table with transparent composite score breakdown rather than a binary match.
4. An interactive vertical timeline visually reconstructs the chronological progression of each case from reporting to resolution.
5. Control room alerts are automatically classified into High, Medium, and Low priority tiers with multi-attribute filtering.

**Plans**: 4 plans
- [ ] 02-01: Evidence Vault Data Models, API Endpoints & Verification Workflow
- [ ] 02-02: Smart Match Ranking Scoring Engine & Leaderboard Table UI
- [ ] 02-03: AI Investigation Timeline Aggregator & Visual Component
- [ ] 02-04: Intelligent Alert Center Prioritization, Filtering & Batch Actions

---

### Phase 3: Structured Search & Spatial Analysis
**Goal**: Provide active, wizard-driven investigative searches and spatial sighting intelligence.  
**Depends on**: Phase 2  
**Requirements**: SRCH-01, SRCH-02, SRCH-03, HEAT-01, HEAT-02, HEAT-03, ANLT-01, ANLT-02, REPT-01, REPT-02  
**Success Criteria**:
1. Investigators can launch an AI Search Session configuring specific cases, cameras, time windows, and threshold parameters.
2. Search sessions stream real-time percentage progress over WebSockets with live candidate match previews.
3. Leaflet map renders dynamic glowing heatmap overlays displaying sighting concentration density across camera networks.
4. Case analytics dashboard provides visual metric cards and charts detailing search coverage and detection distributions.
5. Operators can generate and download a publication-grade PDF case report compiling photos, evidence, timeline, and map snapshots.

**Plans**: 4 plans
- [ ] 03-01: AI Search Session Wizard & WebSocket Progress Streaming
- [ ] 03-02: Leaflet Heatmap Layer Integration & Intensity Controls
- [ ] 03-03: AI Analytics & Case Insights Dashboard Cards & Charts
- [ ] 03-04: Server-Side PDF Case Dossier Generator & One-Click Download

---

### Phase 4: Live Operations, Spatial Intelligence & Production Deployment
**Goal**: Live camera processing, movement path animation, search priority zones, and turnkey Docker deployment.  
**Depends on**: Phase 3  
**Requirements**: RTSP-01, RTSP-02, RTSP-03, TRAI-01, TRAI-02, TRAI-03, ZONE-01, ZONE-02, ZONE-03, DOCK-01, DOCK-02, DOCK-03, DOCK-04  
**Success Criteria**:
1. Live RTSP monitor displays video playback with real-time face detection bounding boxes and instant popups on target matches.
2. Leaflet map features an animated movement trail showing sequential sightings over time with an interactive time scrubber.
3. Map highlights rule-based Search Priority Zones (High/Medium/Low circles) around cameras based on last confirmed sighting time and distance.
4. A single `docker compose up` command starts PostgreSQL, FastAPI backend, Next.js frontend, and Nginx reverse proxy with SSL.
5. System Health Dashboard provides real-time status indicators for database, AI engine, WebSockets, and active patrol units.

**Plans**: 4 plans
- [ ] 04-01: Live RTSP Camera Monitoring & Real-time Bounding Box Overlay
- [ ] 04-02: Temporal Correlation & Animated Movement Trail Playback on Leaflet Map
- [ ] 04-03: Search Priority Zones Engine & Camera Prioritization Sidebar
- [ ] 04-04: Production Docker Compose Stack, Nginx SSL Reverse Proxy & Health Dashboard

---

## Progress

**Execution Order:**
Phases execute in numeric order: Phase 2 → Phase 3 → Phase 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Baseline Foundation | 1/1 | Completed | 2026-10-15 |
| 2. Investigation Intelligence | 0/4 | Ready to plan | - |
| 3. Structured Search & Spatial | 0/4 | Waiting | - |
| 4. Live Ops & Docker Deployment | 0/4 | Waiting | - |

---
*Roadmap defined: 2026-11-04*
