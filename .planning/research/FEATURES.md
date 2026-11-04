# Feature Research

**Domain:** AI-Assisted Missing Person Recovery & Smart Tactical Dispatch Platform  
**Researched:** 2026-11-04  
**Confidence:** HIGH  

## Feature Landscape

### Table Stakes (Expected Core Capabilities)

Features users and evaluators expect in an investigation decision-support system.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Evidence Vault | Investigators must audit the photographic proof behind any match | LOW | Original frame, face crop, timestamp, camera ID, similarity score, verification state |
| Smart Match Ranking | Binary yes/no is insufficient; operators need ranked confidence with evidence breakdown | MEDIUM | Composite score formulation: $w_1 \cdot \text{similarity} + w_2 \cdot \text{quality} + w_3 \cdot \text{recency}$ |
| AI Investigation Timeline | Case progress must be audited chronologically from report to resolution | LOW | Reconstructs events from system logs, detections, alerts, and field unit updates |
| Intelligent Alert Center | Unprioritized alert feeds overwhelm dispatchers during incidents | MEDIUM | Automated High / Medium / Low priority tiers with badge styling and audio cues |

### Differentiators (Competitive & Presentation Advantage)

Signature capabilities that set GARUDA A.S.T.R.A apart during evaluation.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI Search Session (Signature) | Transforms tool from passive detector to active investigator search console | MEDIUM | Multi-step wizard: select case, cameras, time window, threshold; live progress bar |
| Sighting / Detection Heatmap | Immediate visual clarity of high-concentration sighting hotspots on city map | LOW | Dynamic gradient layer rendered over Leaflet map |
| Downloadable PDF Case Report | Tangible, printable investigative case dossier for archival or court evidence | MEDIUM | Server-generated PDF including photos, timeline, map snapshots, and verification logs |
| Live RTSP Camera Monitoring | Visual demonstration of live face detection bounding boxes and instant popups | MEDIUM | Controlled simulated stream via FFmpeg to guarantee 100% demo uptime |
| Animated Movement Trail | Dynamic temporal-spatial playback showing subject trajectory across cameras | MEDIUM | Animated polyline and sequential marker highlights with time scrubber |
| Search Priority Zones | Actionable decision support telling search teams which nearby cameras to check next | LOW | Rule-based spatial radius and temporal decay from last confirmed sighting |
| One-Command Docker Stack | Evaluators can clone and run the full production system in under 2 minutes | MEDIUM | Docker Compose running PostgreSQL, FastAPI, Next.js, and Nginx with SSL |

### Anti-Features (Deliberately Excluded)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Weapon & Violence Detection | Broadens surveillance scope | Dilutes core missing-person recovery focus and adds training complexity | Strict focus on facial biometrics and search decision support |
| Complex Probabilistic Next-Location ML | Sounds sophisticated | Requires massive urban transport datasets and produces unexplainable predictions | Rule-based geographic proximity and time-decay search priority zones |
| Direct Production Physical RTSP Hardware | Realistic camera feeds | Network drops and RTSP buffer lag cause live presentations to freeze or crash | Controlled local RTSP stream simulation using FFmpeg looping real CCTV video |

## Feature Dependencies

```
[Evidence Vault]
    └──required by──> [Smart Match Ranking]
    └──required by──> [AI Investigation Timeline]
    └──required by──> [AI Search Session]
                           └──feeds into──> [Sighting Heatmap]
                                                └──enhances──> [Search Priority Zones]
                                                └──feeds into──> [Investigation Case Report (PDF)]

[AI Pipeline Core] ──powers──> [Live RTSP Monitoring]
[All Services] ──packaged by──> [Production Docker Stack]
```

## Milestone Mapping to College Phases

### Phase 2: Investigation Intelligence Layer (Month 1-2)
- [ ] Evidence Vault (Models, API, Evidence Gallery UI)
- [ ] Smart Match Ranking (Composite scoring, Leaderboard table)
- [ ] AI Investigation Timeline (Event aggregator, Chronological vertical UI)
- [ ] Intelligent Alert Center (Priority tiers, filtering, batch actions)

### Phase 3: Structured Search & Spatial Analysis (Month 3-4)
- [ ] AI Search Session Wizard (Multi-step parameters, live progress bar)
- [ ] Sighting / Detection Heatmap (`leaflet.heat` integration on LiveMap)
- [ ] AI Analytics & Case Insights (Summary statistics, metric cards)
- [ ] Investigation Case Report (Downloadable PDF generator)

### Phase 4: Live Operations, Spatial Intelligence & Production Deployment (Month 5-6)
- [ ] Live RTSP Camera Monitoring (Simulated stream, bounding boxes, instant alerts)
- [ ] Temporal Correlation Animated Playback (Animated polyline trail, scrubber)
- [ ] Search Priority Zones (Distance & time decay radius visualization)
- [ ] Docker Compose Production Deployment (FastAPI, Next.js, Postgres, Nginx, SSL)
- [ ] System Health & Telemetry Dashboard (Component status cards)

---
*Feature research: 2026-11-04*

