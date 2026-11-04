# Roadmap: GARUDA A.S.T.R.A

## Overview

GARUDA A.S.T.R.A transitions from a core face-recognition pipeline into an AI-assisted missing-person recovery and tactical dispatch platform. Work across each 2-month college milestone (Phase 2, 3, 4) is partitioned into **two parallel developer tracks (Track A & Track B)**. This allows two developers to work concurrently on separate features without blocking dependencies or merge conflicts.

---

## Developer Workstream Division

| Milestone | Track A (Developer 1) | Track B (Developer 2) |
|---|---|---|
| **Phase 2: Investigation Intelligence** | **2.1**: Evidence Vault & Verification<br>**2.3**: AI Investigation Timeline | **2.2**: Smart Match Ranking Engine<br>**2.4**: Intelligent Alert Center |
| **Phase 3: Structured Search & Spatial** | **3.1**: AI Search Session Wizard<br>**3.3**: PDF Case Dossier Generator | **3.2**: Sighting Heatmap Layer<br>**3.4**: AI Analytics & Case Insights |
| **Phase 4: Live Ops & Production** | **4.1**: Live RTSP Camera Monitoring<br>**4.3**: Production Docker & Nginx Stack | **4.2**: Animated Movement Trail Map<br>**4.4**: Search Priority Zones Engine |

---

## Phase Details

### Phase 1: Database Foundation, Core APIs & Mobile Baseline (Completed)
**Goal**: Operational baseline for authentication, data persistence, face detection, and mobile alerting.  
**Status**: Completed (Baseline)

---

### College Milestone 2: Investigation Intelligence Layer

#### Phase 2.1 [Track A]: Evidence Vault & Verification Architecture
- **Goal**: Full forensic record per sighting and interactive verification workflow.
- **Depends on**: Phase 1
- **Requirements**: EVID-01, EVID-02, EVID-03
- **Success Criteria**:
  1. System records original CCTV frame, face crop, camera ID, timestamp, GPS, similarity score, blur quality score, and model version.
  2. Missing person case detail view includes an interactive Evidence Gallery.
  3. Investigators can toggle sighting status (`Unreviewed` → `Confirmed` → `Rejected`) with audit logging.
- **Plans**: 2 plans
  - [ ] 02.1-01: Evidence Vault models, file storage paths & verification REST endpoints
  - [ ] 02.1-02: Next.js Evidence Gallery UI component & status toggle actions

#### Phase 2.2 [Track B]: Smart Match Ranking & Composite Scoring Engine
- **Goal**: Replace binary match/no-match with a transparent, weighted candidate leaderboard.
- **Depends on**: Phase 1
- **Requirements**: RANK-01, RANK-02, RANK-03
- **Success Criteria**:
  1. Ranking service computes composite confidence score: $w_1 \cdot \text{Similarity} + w_2 \cdot \text{Quality} + w_3 \cdot \text{Recency}$.
  2. Sighting search results display a sortable ranked leaderboard table with percentage confidence.
  3. Hovering over a score displays a breakdown tooltip showing individual metric weights.
- **Plans**: 2 plans
  - [ ] 02.2-01: Backend composite scoring service & ranked candidate query endpoint
  - [ ] 02.2-02: Ranked Leaderboard Table UI with score explanation tooltips

#### Phase 2.3 [Track A]: AI Investigation Timeline
- **Goal**: Chronological reconstruction of all events in a missing person case.
- **Depends on**: Phase 2.1 (uses evidence records)
- **Requirements**: TIME-01, TIME-02, TIME-03
- **Success Criteria**:
  1. Backend aggregates lifecycle events across logs, detections, alerts, and field assignments.
  2. Web dashboard renders a vertical interactive timeline with distinct stage icons.
  3. Timeline entries link directly to evidence crops, camera locations, or dispatch logs.
- **Plans**: 2 plans
  - [ ] 02.3-01: Timeline event aggregation API querying system and case activity
  - [ ] 02.3-02: Interactive vertical timeline component on case details page

#### Phase 2.4 [Track B]: Intelligent Alert Center
- **Goal**: Automated priority triage, multi-attribute filtering, and batch operations.
- **Depends on**: Phase 2.2 (uses composite rank scores)
- **Requirements**: ALRT-01, ALRT-02, ALRT-03
- **Success Criteria**:
  1. Alerts auto-classified into High, Medium, and Low priority tiers with distinct color badges.
  2. Dashboard alert center supports filtering by priority, camera, date, and missing person.
  3. Operators can execute batch actions (acknowledge all, assign patrol unit, or dismiss).
- **Plans**: 2 plans
  - [ ] 02.4-01: Alert priority classifier logic & batch management endpoints
  - [ ] 02.4-02: Redesigned Alert Center dashboard with filters, badges & audio cues

---

### College Milestone 3: Structured Search & Spatial Analysis

#### Phase 3.1 [Track A]: AI Search Session Wizard & WebSocket Progress
- **Goal**: Active investigator search console with real-time percentage progress.
- **Depends on**: Phase 2.1
- **Requirements**: SRCH-01, SRCH-02, SRCH-03
- **Success Criteria**:
  1. Wizard UI allows configuring target case, reference photos, camera subset, time range, and threshold.
  2. Background execution streams real-time percentage progress over WebSocket.
  3. Candidate matches appear dynamically in a live preview table as frames are analyzed.
- **Plans**: 2 plans
  - [ ] 03.1-01: Search session data model, background worker & WebSocket progress channel
  - [ ] 03.1-02: Multi-step Search Session Wizard UI with live progress bar

#### Phase 3.2 [Track B]: Sighting Heatmap & Leaflet Spatial Layer
- **Goal**: Sighting concentration density visualized over the city map.
- **Depends on**: Phase 2.1
- **Requirements**: HEAT-01, HEAT-02, HEAT-03
- **Success Criteria**:
  1. Backend provides aggregated `[lat, lng, intensity]` matrix for any case.
  2. Leaflet map renders dynamic glowing heat overlay using `leaflet.heat` via a custom `useMap()` component.
  3. Map includes interactive radius and time-range filter controls.
- **Plans**: 2 plans
  - [ ] 03.2-01: Geospatial density aggregation API endpoint
  - [ ] 03.2-02: `HeatmapLayer.tsx` component with intensity & radius slider controls

#### Phase 3.3 [Track A]: Server-Side PDF Case Dossier Generator
- **Goal**: Downloadable, publication-quality investigation report.
- **Depends on**: Phase 2.3, Phase 3.1
- **Requirements**: REPT-01, REPT-02
- **Success Criteria**:
  1. Backend compiles case demographics, evidence photos, timeline logs, and verification history.
  2. High-resolution PDF generated server-side using WeasyPrint/ReportLab.
  3. One-click "Download PDF Report" button on the case dashboard.
- **Plans**: 2 plans
  - [ ] 03.3-01: Server-side PDF template compiler and document generation endpoint
  - [ ] 03.3-02: Dashboard report preview modal and instant download action

#### Phase 3.4 [Track B]: AI Analytics & Case Insights Dashboard
- **Goal**: High-level statistical summaries and detection pattern charts.
- **Depends on**: Phase 2.4
- **Requirements**: ANLT-01, ANLT-02
- **Success Criteria**:
  1. Dashboard displays case intelligence cards (frames scanned, faces detected, sightings, coverage).
  2. Visual distribution charts show detections per camera node and sightings over time.
- **Plans**: 2 plans
  - [ ] 03.4-01: Analytics aggregation service & statistical endpoints
  - [ ] 03.4-02: Analytics dashboard cards and detection trend charts

---

### College Milestone 4: Live Operations, Spatial Intelligence & Production Deployment

#### Phase 4.1 [Track A]: Live RTSP Camera Ingestion & Bounding Box Stream
- **Goal**: Controlled live video monitor with real-time face detection boxes.
- **Depends on**: Phase 3.1
- **Requirements**: RTSP-01, RTSP-02, RTSP-03
- **Success Criteria**:
  1. Multi-threaded `RTSPStreamReader` ingests FFmpeg-simulated CCTV stream with zero buffer lag.
  2. Live camera dashboard renders streaming video with real-time detection bounding boxes overlaid.
  3. Target match triggers immediate high-priority tactical alert popup and audio chime.
- **Plans**: 2 plans
  - [ ] 04.1-01: Multi-threaded RTSP frame reader & real-time detection event pipeline
  - [ ] 04.1-02: Live Surveillance Monitor page with canvas bounding box overlays

#### Phase 4.2 [Track B]: Temporal Correlation & Animated Movement Trail
- **Goal**: Visual animated playback of a subject moving between cameras over time.
- **Depends on**: Phase 3.2
- **Requirements**: TRAI-01, TRAI-02, TRAI-03
- **Success Criteria**:
  1. System sequences sightings into chronological travel trajectories.
  2. Leaflet map renders an animated movement trail with progressive polyline drawing.
  3. Time scrubber allows stepping through or playing back the subject's path.
- **Plans**: 2 plans
  - [ ] 04.2-01: Trajectory sequencing API connecting sightings by spatial-temporal proximity
  - [ ] 04.2-02: Animated polyline map component with interactive time scrubber

#### Phase 4.3 [Track A]: Production Docker Stack, Nginx SSL & Health Center
- **Goal**: Turnkey single-command container deployment with Nginx and SSL.
- **Depends on**: Phase 4.1
- **Requirements**: DOCK-01, DOCK-02, DOCK-03, DOCK-04
- **Success Criteria**:
  1. `docker compose up` starts Postgres, FastAPI backend, Next.js dashboard, and Nginx.
  2. Nginx terminates SSL, handles reverse proxying for REST (:8000), Next.js (:3000), and WSS.
  3. System Health Dashboard displays live component statuses (DB, AI Engine, WebSockets).
- **Plans**: 2 plans
  - [ ] 04.3-01: Multi-stage Dockerfiles, Nginx SSL configuration & docker-compose.yml
  - [ ] 04.3-02: System Health Monitor dashboard component & auto-migration entrypoint

#### Phase 4.4 [Track B]: Search Priority Zones & Decision Support Engine
- **Goal**: Recommend which nearby cameras search teams should inspect next.
- **Depends on**: Phase 4.2
- **Requirements**: ZONE-01, ZONE-02, ZONE-03
- **Success Criteria**:
  1. Backend calculates distance and time-decay scores from last confirmed sighting to all cameras.
  2. Map renders concentric color-coded priority circles (Red: High, Yellow: Medium, Green: Low).
  3. Prioritized camera list displayed in a sidebar for immediate tactical deployment.
- **Plans**: 2 plans
  - [ ] 04.4-01: Spatial proximity & time decay priority calculation service
  - [ ] 04.4-02: Priority Zones map overlay & recommended camera dispatch list

---

## Progress

**Execution Order:**
- **Phase 2:** Track A (2.1 → 2.3) runs in parallel with Track B (2.2 → 2.4)
- **Phase 3:** Track A (3.1 → 3.3) runs in parallel with Track B (3.2 → 3.4)
- **Phase 4:** Track A (4.1 → 4.3) runs in parallel with Track B (4.2 → 4.4)

| Phase | Track | Description | Plans | Status |
|---|---|---|---|---|
| **Phase 2.1** | Track A | Evidence Vault & Verification Architecture | 0/2 | Ready to plan |
| **Phase 2.2** | Track B | Smart Match Ranking Engine & Leaderboard | 0/2 | Ready to plan |
| **Phase 2.3** | Track A | AI Investigation Timeline Aggregator | 0/2 | Waiting |
| **Phase 2.4** | Track B | Intelligent Alert Center Prioritization | 0/2 | Waiting |
| **Phase 3.1** | Track A | AI Search Session Wizard & Progress | 0/2 | Waiting |
| **Phase 3.2** | Track B | Sighting Heatmap & Leaflet Spatial Layer | 0/2 | Waiting |
| **Phase 3.3** | Track A | Server-Side PDF Case Dossier Generator | 0/2 | Waiting |
| **Phase 3.4** | Track B | AI Analytics & Case Insights Dashboard | 0/2 | Waiting |
| **Phase 4.1** | Track A | Live RTSP Camera Ingestion & Bounding Boxes | 0/2 | Waiting |
| **Phase 4.2** | Track B | Temporal Correlation & Movement Animation | 0/2 | Waiting |
| **Phase 4.3** | Track A | Production Docker, Nginx SSL & Health Center | 0/2 | Waiting |
| **Phase 4.4** | Track B | Search Priority Zones & Decision Support | 0/2 | Waiting |

---
*Roadmap defined: 2026-11-04*
