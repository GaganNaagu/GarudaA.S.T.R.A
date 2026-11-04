# GARUDA A.S.T.R.A

## What This Is

GARUDA A.S.T.R.A (Advanced Security & Tactical Response Architecture / AI-Assisted Missing Person Recovery & Safe Return Network) is an enterprise-grade public safety surveillance, facial recognition, and smart tactical dispatch platform. It ingests video feeds and CCTV footage, runs AI face detection and biometric feature matching, elevates candidate sightings into prioritized alerts, reconstructs spatial-temporal investigation timelines, and orchestrates field patrol units in real time through unified web and mobile interfaces.

## Core Value

Empower investigators and dispatchers to move from a missing-person report to a structured set of candidate sightings, correlated evidence, and prioritized response actions with maximum speed and explainability.

## Requirements

### Validated

- ✓ FastAPI ASGI backend with REST API and topic-based WebSocket gateway — existing (Phase 1)
- ✓ PostgreSQL relational database with SQLAlchemy 2.0 AsyncSession and Alembic schema migrations — existing (Phase 1)
- ✓ JWT authentication and Role-Based Access Control (Admin, Dispatcher, Officer) — existing (Phase 1)
- ✓ AI pipeline with YOLOv8-face detection, IoU tracking, Laplacian blur scoring, and FaceNet512 facial embeddings — existing (Phase 1)
- ✓ Video footage upload, asynchronous subprocess-isolated processing, and crop extraction — existing (Phase 1)
- ✓ In-memory cosine similarity search against registered missing persons — existing (Phase 1)
- ✓ Next.js 16 Web Dashboard with Leaflet mapping, surveillance feed overview, and mock data fallback — existing (Phase 1)
- ✓ React Native / Expo mobile app for patrol officers with GPS telemetry, duty toggle, and tactical alerts — existing (Phase 1)
- ✓ Automated database seed scripts for roles, mock users, and test credentials — existing (Phase 1)

### Active

**College Phase 2 — Investigation Intelligence Layer:**
- [ ] Evidence Vault: Complete forensic record per sighting (original frame, face crop, camera ID, timestamp, GPS, similarity score, blur/quality score, model version, and verification workflow: Unreviewed → Confirmed → Rejected).
- [ ] Smart Match Ranking: Composite scoring formula combining face similarity, image quality, and temporal evidence into a ranked leaderboard with transparent breakdown.
- [ ] AI Investigation Timeline: Chronological event reconstruction aggregating system actions (case created → photo uploaded → video analyzed → sighting ranked → alert sent → officer assigned → sighting confirmed → resolved).
- [ ] Intelligent Alert Center: Automated priority classification (High, Medium, Low), multi-attribute filtering, grouping by missing person, and differentiated operational actions.

**College Phase 3 — Structured Search & Spatial Analysis:**
- [ ] AI Search Session (Signature Feature): Wizard-driven structured search interface (case selection, reference photo picking, camera filter, time window, similarity threshold, live progress tracking, and ranked sighting review).
- [ ] Sighting / Detection Heatmap: Dynamic Leaflet heat overlay (`leaflet.heat`) visualizing sighting concentration hotspots across city camera locations.
- [ ] AI Analytics & Case Insights: Aggregated metrics dashboard (frames scanned, faces detected, candidate sightings, highest-confidence match, search coverage) with visual charts.
- [ ] Investigation Case Report: Server-side downloadable PDF generator compiling case details, evidence photos, timeline logs, heatmap snapshots, and verification decisions.

**College Phase 4 — Live Operations, Spatial Intelligence & Production Deployment:**
- [ ] Live RTSP Camera Monitoring (Controlled Demo): Real-time video ingestion via simulated RTSP feed with live bounding box overlay, threaded frame extraction, and instant detection alert popups.
- [ ] Temporal & Cross-Location Correlation (Animated Playback): Interactive Leaflet map animation showing sequential movement between cameras over time with animated polyline trails and time scrubber.
- [ ] Search Priority Zones: Rule-based spatial prioritization highlighting nearby cameras into color-coded urgency zones (High/Medium/Low) based on last confirmed sighting time and distance.
- [ ] Production-Ready Docker Containerization: `docker compose up` stack running PostgreSQL, FastAPI backend, Next.js dashboard, Nginx reverse proxy, SSL termination, and automated database migrations.
- [ ] System Health & Telemetry Dashboard: Real-time status monitors for AI worker engine, PostgreSQL connectivity, WebSocket subscriptions, and mobile telemetry feeds.

### Out of Scope

- Generic weapon or violence detection — keep focus strictly on missing person search and recovery.
- Facial age progression models — out of scope for current timeline; maintain single biometric comparison.
- Unapproved real-world government/police database integrations — rely on self-contained PostgreSQL instance.
- Direct mobile app containerization in Docker — mobile app is compiled to native Android APK (`garudaastra-release.apk`).
- Heavy multi-camera hardware cluster deployment — core live demo operates via controlled RTSP stream to guarantee presentation reliability.

## Context

- Built as a College Major Project evaluated across three sequential milestone phases spaced approximately 2 months apart (Phase 2, Phase 3, Phase 4).
- Emphasis on visible, demonstrable, and visually compelling features that evaluators and judges can interact with (ranked tables, glowing heatmaps, animated movement trails, live video detection, and one-command Docker deployment).
- Existing polyglot monorepo codebase has operational Phase 1 baseline in place (`services/backend`, `services/ai`, `apps/web-dashboard`, `apps/mobile-app`, `database`).
- Additional upgrades or enhancements will be introduced organically during each development phase as operational requirements emerge.

## Constraints

- **Timeline**: 3 milestone phases with ~2 months between college submissions.
- **Demo Reliability**: Live features must have rock-solid fallback and simulated options (e.g. RTSP demo stream via FFmpeg) to prevent network or hardware failures during live presentations.
- **Hardware & Portability**: System must be runnable via Docker on standard PCs and cloud VPS instances without specialized host dependencies.
- **Backward Compatibility**: Existing database schemas and mobile API contracts must remain stable as new intelligence layers are added.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Structure into 3 College Phases (Phase 2, 3, 4) | Align GSD execution units with the 2-month university evaluation cycle | — Pending |
| Add Production Docker with Nginx & SSL to Phase 4 | Ensure turnkey portability and high engineering presentation value for final evaluation | — Pending |
| Retain Live RTSP via Controlled Stream Demo | Deliver high-impact live camera visual without production streaming instability | — Pending |
| Implement Search Priority Zones via rule-based distance/time decay | Provide intuitive next-location decision support without brittle ML models | — Pending |
| Implement Downloadable PDF for Investigation Reports | Ensure professional, shareable physical artifacts for project evaluation | — Pending |
| Use animated polyline playback for temporal correlation | Deliver high-impact visual representation of subject movement on Leaflet map | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-11-04 after initialization*

