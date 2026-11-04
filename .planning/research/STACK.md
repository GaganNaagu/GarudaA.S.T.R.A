# Stack Research

**Domain:** AI-Assisted Video Surveillance & Smart Tactical Dispatch Platform  
**Researched:** 2026-11-04  
**Confidence:** HIGH  

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Python / FastAPI | 3.12+ / >=0.111.0 | Backend REST API & Real-time WebSocket Server | High-throughput asynchronous ASGI runtime with native Pydantic v2 validation and WebSockets |
| SQLAlchemy / asyncpg | >=2.0.30 / >=0.29.0 | Database ORM & PostgreSQL Driver | Non-blocking database transactions; high concurrency under streaming telemetry |
| Next.js (App Router) | 16.2.6 (React 19) | Tactical Control Room Web Dashboard | Server-side rendering, API route proxying, and streaming UI components |
| React Native / Expo | 0.81.5 / SDK 54 | Field Responder Mobile App | Battle-tested cross-platform mobile framework with hardware GPS and background actions |
| YOLOv8n-face & AdaFace/FaceNet512 | PyTorch / ONNX | Real-time Face Detection & Biometric Embeddings | Lightweight, sub-50ms inference on standard CPUs; robust under non-frontal angles and CCTV blur |

### Supporting Libraries for Upgrades

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `leaflet.heat` | ^0.2.0 | Spatial Sighting Heatmaps | Overlays detection density gradients on top of OpenStreetMap in `LiveMap.tsx` |
| `reportlab` / `weasyprint` | Latest | Server-side PDF Case Reports | Compiles case info, evidence photos, and timeline into high-resolution downloadable PDFs |
| `pydantic-settings` | >=2.2.1 | Environment & Docker Config Validation | Ensures containerized deployments fail fast if credentials/URIs are invalid |
| `docker-compose` | 3.8 / Compose v2 | Multi-container Orchestration | Runs PostgreSQL, FastAPI backend, Next.js dashboard, and Nginx with a single command |
| `nginx:alpine` | Latest | Production Reverse Proxy & SSL Termination | Handles HTTPS/WSS, routes traffic to Next.js (:3000) and FastAPI (:8000), static cache |

### Development & Simulation Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `ffmpeg` | RTSP Feed Simulation | Loops pre-recorded CCTV footage into `rtsp://localhost:8554/live` for stable live demos |
| `alembic` | Database Schema Migrations | Automatically runs `alembic upgrade head` inside the Docker entrypoint script |

## Installation

```bash
# Python Backend Dependencies (add to services/requirements.txt)
pip install reportlab weasyprint leaflet-heat-py

# Web Dashboard Dependencies (in apps/web-dashboard/)
npm install leaflet.heat
npm install --save-dev @types/leaflet.heat
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `leaflet.heat` (Custom `useMap` hook) | `react-leaflet-heatmap-layer` | Legacy wrapper has peer-dependency conflicts with React 19 / Next.js 16 |
| `reportlab` / `weasyprint` | Client-side `jsPDF` | Server-side generation ensures consistent rendering across browsers and mobile |
| Simulated RTSP via FFmpeg | Live Physical IP Camera | Physical cameras introduce Wi-Fi drops and network lag during evaluation presentations |
| Docker Compose with Nginx | Kubernetes / Helm | Kubernetes adds unnecessary operational overhead for single-node / VPS evaluation |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| OpenCV default `cv2.VideoCapture` in single thread for RTSP | OpenCV's internal FFmpeg buffer accumulates frames, causing 10-60 second lag | Multi-threaded background frame grabber discarding stale frames |
| Client-side canvas screenshot for PDF reports | Broken formatting and blurry low-resolution captures | Server-side templated PDF compilation (`reportlab` / `weasyprint`) |
| In-browser client video processing | Browser crashes and heavy memory consumption on evaluator machines | Backend subprocess-isolated computer vision worker |

---
*Stack research: 2026-11-04*

