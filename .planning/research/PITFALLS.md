# Pitfalls Research

**Domain:** AI Video Ingestion, Real-Time WebSockets & Containerized Tactical Systems  
**Researched:** 2026-11-04  
**Confidence:** HIGH  

## Critical Pitfalls

### Pitfall 1: OpenCV RTSP Buffer Accumulation Delay

**What goes wrong:**
During live RTSP camera monitoring, the video feed stutters and slowly falls behind reality by 30 seconds to several minutes. Face detections appear long after the person has walked out of frame.

**Why it happens:**
OpenCV's `cv2.VideoCapture` uses FFmpeg's internal FIFO buffer by default. When face detection takes 50–100ms per frame, incoming frames buffer continuously. The reader grabs ancient frames from the back of the queue instead of the current camera view.

**How to avoid:**
1. Implement a dedicated, multi-threaded `RTSPStreamReader` class with a thread-safe queue of size 1.
2. The background thread reads frames continuously; whenever a new frame arrives, it drops any older unread frame.
3. Configure `OPENCV_FFMPEG_CAPTURE_OPTIONS = "rtsp_transport;tcp"`.

**Warning signs:**
Testing with a stopwatch or real camera shows delayed timestamps, or memory usage increases steadily over minutes of playback.

**Phase to address:**
Phase 4 (Live RTSP Camera Monitoring).

---

### Pitfall 2: React 19 / Next.js 16 Leaflet Heatmap Context Mismatch

**What goes wrong:**
Installing third-party heatmap packages like `react-leaflet-heatmap-layer` throws React lifecycle runtime crashes: `TypeError: Cannot read properties of undefined (reading 'addLayer')` or hydration errors during SSR.

**Why it happens:**
Legacy React-Leaflet wrapper packages depend on obsolete React 16/17 context internals and do not support React 19's concurrent rendering or Next.js 16 App Router SSR.

**How to avoid:**
Do NOT use third-party wrapper components. Build a native, lightweight `HeatmapLayer.tsx` component that:
1. Dynamically imports `leaflet` and `leaflet.heat` only on the client (`useEffect` or `typeof window !== 'undefined'`).
2. Obtains the map instance directly via React-Leaflet's official `useMap()` hook.
3. Adds `L.heatLayer(points, options)` imperatively and cleans it up in the `useEffect` return block.

**Warning signs:**
Build failures or blank screens when opening the map page.

**Phase to address:**
Phase 3 (Sighting / Detection Heatmap).

---

### Pitfall 3: Blocking the Async Event Loop with CPU-Heavy Vector Math

**What goes wrong:**
When an investigator initiates a search across hundreds of stored face crops, the entire web server becomes unresponsive. WebSockets disconnect, mobile officer GPS pings timeout with 504 Gateway errors, and the UI freezes.

**Why it happens:**
Executing NumPy cosine similarity calculations or nested Python loops inside a normal `async def` endpoint blocks FastAPI's single asyncio event loop.

**How to avoid:**
1. Offload vector search loops to worker threads using `asyncio.to_thread(sync_vector_search_fn, ...)`.
2. For large datasets, leverage PostgreSQL query filtering before computing similarity in Python, or batch calculate embeddings using matrix dot products (`np.dot(crop_matrix, target_vector)`).

**Warning signs:**
API latency spikes across all unrelated endpoints whenever a video analysis or search job runs.

**Phase to address:**
Phase 2 (Smart Match Ranking) and Phase 3 (AI Search Session).

---

### Pitfall 4: Docker OOM (Out Of Memory) Crashes During Video Processing

**What goes wrong:**
When deploying via `docker compose up`, uploading a video causes the backend container to silently restart or exit with code 137 (SIGKILL).

**Why it happens:**
PyTorch, OpenCV frame decoders, and ONNX Runtime allocate significant RAM per video. In default container configurations or limited VPS hosts (<4GB RAM), the Linux kernel OOM killer terminates the container immediately.

**How to avoid:**
1. Explicitly limit OpenCV thread pools at the top of the AI script before importing cv2:
   ```python
   import os
   os.environ["OMP_NUM_THREADS"] = "1"
   os.environ["OPENBLAS_NUM_THREADS"] = "1"
   ```
2. Allocate minimum 4GB RAM to the Docker daemon or VPS host.
3. Downsample video frames to a maximum dimension of 1280px before passing to YOLOv8.

**Warning signs:**
Container suddenly disappears or `docker inspect` shows `"OOMKilled": true`.

**Phase to address:**
Phase 4 (Docker Containerization).

---

### Pitfall 5: Broken PDF Layouts Using Headless Web Compilers

**What goes wrong:**
Attempting to generate case report PDFs using headless Chrome or fragile client-side html2pdf libraries results in clipped tables, overlapping text, missing photos, and huge multi-megabyte files.

**Why it happens:**
Client-side PDF libraries capture low-resolution DOM canvases rather than actual vector documents.

**How to avoid:**
Use server-side Python `reportlab` or `weasyprint` with dedicated, print-specific CSS templates (`@page { size: A4 portrait; margin: 15mm; }`). Store pre-sized thumbnail crops so report generation requires minimal memory.

**Warning signs:**
PDFs taking longer than 5 seconds to generate or rendering with missing images.

**Phase to address:**
Phase 3 (Investigation Case Report).

---
*Pitfalls research: 2026-11-04*
