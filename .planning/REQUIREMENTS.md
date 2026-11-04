# Requirements: GARUDA A.S.T.R.A

**Defined:** 2026-11-04  
**Core Value:** Empower investigators and dispatchers to move from a missing-person report to a structured set of candidate sightings, correlated evidence, and prioritized response actions with maximum speed and explainability.

## Active Requirements (v1 Major Upgrades)

### 1. Evidence Vault & Forensic Auditing (Phase 2.1 — Track A)

- [ ] **EVID-01**: System stores full forensic sighting record (original CCTV frame, face crop image, camera ID, timestamp, GPS location, similarity score, blur/quality score, model version).
- [ ] **EVID-02**: Investigator can view an interactive Evidence Gallery for each missing person case showing all candidate sightings and crops.
- [ ] **EVID-03**: Investigator can change sighting verification status (`Unreviewed` → `Confirmed` → `Rejected`) with audit timestamp and officer notes.

### 2. Smart Match Ranking & Scoring (Phase 2.2 — Track B)

- [ ] **RANK-01**: System calculates composite score for candidate sightings: $\text{Final Score} = w_1 \cdot \text{Similarity} + w_2 \cdot \text{Quality} + w_3 \cdot \text{Recency}$.
- [ ] **RANK-02**: Dashboard displays ranked leaderboard table of candidate matches sorted by composite score rather than raw binary yes/no.
- [ ] **RANK-03**: Interface provides a score explanation tooltip breaking down the exact percentage weights contributing to each candidate's score.

### 3. AI Investigation Timeline (Phase 2.3 — Track A)

- [ ] **TIME-01**: Backend aggregates case lifecycle events chronologically from `ActivityLog`, `DetectionEvent`, `Alert`, and `Assignment` tables.
- [ ] **TIME-02**: Web dashboard renders a vertical scrolling timeline with distinct icons for case creation, photo upload, video processing, sighting detection, dispatch, and resolution.
- [ ] **TIME-03**: Timeline entries link directly to corresponding evidence crops or alert dispatch records.

### 4. Intelligent Alert Center (Phase 2.4 — Track B)

- [ ] **ALRT-01**: System auto-classifies alerts into High, Medium, and Low priority tiers based on composite confidence and verification state.
- [ ] **ALRT-02**: Web dashboard alerts view supports multi-attribute filtering (priority, status, date, camera) and grouping by missing person.
- [ ] **ALRT-03**: Dispatchers can perform batch actions (acknowledge all, assign patrol unit, or dismiss false positives).

### 5. AI Search Session (Phase 3.1 — Track A)

- [ ] **SRCH-01**: Investigators can initiate structured search sessions selecting target missing person, reference photos, camera subset, time range, and similarity threshold.
- [ ] **SRCH-02**: System tracks search execution state and streams real-time percentage progress over WebSocket.
- [ ] **SRCH-03**: Search session view displays real-time ranked results dynamically updating as frames are processed.

### 6. Sighting / Detection Heatmap (Phase 3.2 — Track B)

- [ ] **HEAT-01**: Backend provides aggregated sighting density coordinates `[lat, lng, intensity]` for any missing person or search session.
- [ ] **HEAT-02**: Web dashboard renders dynamic glowing heatmap overlay via `leaflet.heat` on top of the interactive Leaflet map.
- [ ] **HEAT-03**: Heatmap provides time-range filter and intensity radius controls for operator customization.

### 7. Server-Side PDF Case Dossier Generator (Phase 3.3 — Track A)

- [ ] **REPT-01**: Backend compiles case dossiers (demographics, evidence photos, timeline logs, heatmap snapshots, and verification decisions) into server-generated PDFs.
- [ ] **REPT-02**: Dashboard provides a single-click "Download Investigation Report" button generating high-resolution, print-ready PDF files.

### 8. AI Analytics & Case Insights Dashboard (Phase 3.4 — Track B)

- [ ] **ANLT-01**: Dashboard displays case-level intelligence cards (total frames scanned, faces detected, candidate sightings, highest-confidence match, search coverage).
- [ ] **ANLT-02**: System includes visual distribution charts showing sightings per camera location and detections over time.

### 9. Live RTSP Camera Monitoring (Phase 4.1 — Track A)

- [ ] **RTSP-01**: Backend incorporates a multi-threaded `RTSPStreamReader` connected to a simulated RTSP feed (via FFmpeg loop) that drops stale frames to prevent buffer lag.
- [ ] **RTSP-02**: Control room dashboard renders live video player with real-time face detection bounding boxes overlaid.
- [ ] **RTSP-03**: Live detection of a registered missing person triggers an immediate high-priority tactical alert popup with audible chime.

### 10. Temporal Correlation & Movement Animation (Phase 4.2 — Track B)

- [ ] **TRAI-01**: System groups chronological sightings into candidate travel paths between camera locations.
- [ ] **TRAI-02**: Leaflet map features an animated movement trail with sequential marker appearance and progressive polyline drawing.
- [ ] **TRAI-03**: Interactive time scrubber allows operators to step through or replay the subject's detected movement sequence.

### 11. Production Docker Stack & Nginx (Phase 4.3 — Track A)

- [ ] **DOCK-01**: Multi-stage `Dockerfile` created for FastAPI backend, Next.js web dashboard, and Nginx reverse proxy.
- [ ] **DOCK-02**: `docker-compose.yml` orchestrates PostgreSQL, backend, frontend, and Nginx with volume mounts, environment templates, and auto-migrations.
- [ ] **DOCK-03**: Turnkey deployment runs with automated health checks, port forwarding, and SSL termination.
- [ ] **DOCK-04**: System Health Dashboard displays real-time live component status (AI engine, database, WebSockets, workers).

### 12. Search Priority Zones & Decision Support (Phase 4.4 — Track B)

- [ ] **ZONE-01**: System calculates geographic distance and time-decay scores from the last confirmed sighting to all registered camera nodes.
- [ ] **ZONE-02**: Map displays color-coded concentric search urgency circles (Red: High, Yellow: Medium, Green: Low) around suggested inspection areas.
- [ ] **ZONE-03**: Dashboard provides a prioritized sidebar list of recommended camera locations for immediate field officer deployment.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Weapon / Violence Detection | Dilutes core focus on missing person search and recovery |
| Machine Learning Mobility Predictions | Complex and unexplainable; replaced by intuitive rule-based Search Priority Zones |
| Physical Multi-Camera RTSP Hardware | Vulnerable to network dropouts during live demos; replaced by stable simulated RTSP stream |
| Mobile App Containerization in Docker | Mobile apps are distributed as compiled Android APKs |

## Traceability

| Requirement | Sub-Phase | Track | Status |
|-------------|-----------|-------|--------|
| EVID-01, EVID-02, EVID-03 | Phase 2.1 | Track A | Pending |
| RANK-01, RANK-02, RANK-03 | Phase 2.2 | Track B | Pending |
| TIME-01, TIME-02, TIME-03 | Phase 2.3 | Track A | Pending |
| ALRT-01, ALRT-02, ALRT-03 | Phase 2.4 | Track B | Pending |
| SRCH-01, SRCH-02, SRCH-03 | Phase 3.1 | Track A | Pending |
| HEAT-01, HEAT-02, HEAT-03 | Phase 3.2 | Track B | Pending |
| REPT-01, REPT-02 | Phase 3.3 | Track A | Pending |
| ANLT-01, ANLT-02 | Phase 3.4 | Track B | Pending |
| RTSP-01, RTSP-02, RTSP-03 | Phase 4.1 | Track A | Pending |
| TRAI-01, TRAI-02, TRAI-03 | Phase 4.2 | Track B | Pending |
| DOCK-01, DOCK-02, DOCK-03, DOCK-04 | Phase 4.3 | Track A | Pending |
| ZONE-01, ZONE-02, ZONE-03 | Phase 4.4 | Track B | Pending |

**Coverage:**
- Active requirements: 33 total
- Mapped to sub-phases: 33
- Unmapped: 0 ✅

---
*Requirements defined: 2026-11-04*
