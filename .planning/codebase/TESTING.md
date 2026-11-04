# Testing Patterns

**Analysis Date:** 2026-11-04

## Test Framework

**Runners:**
- Python standard library `unittest` - AI detection and recognition unit test suites (`services/ai/tests/`)
- `pytest` (>=9.0.3) - Backend integration testing and test runner (`services/backend/scripts/test_server.py`)

**Assertion Libraries:**
- `unittest.TestCase` assertions (`assertEqual`, `assertTrue`, `assertFalse`, `assertAlmostEqual`, `assertRaises`)
- `httpx` status and payload validation in integration scripts

**Run Commands:**
```bash
# Run AI subsystem unit tests
python -m unittest discover services/ai/tests/

# Run individual test modules
python -m unittest services/ai/tests/test_detection.py
python -m unittest services/ai/tests/test_recognition.py

# Run live backend connectivity and auth smoke test (requires running server)
python services/backend/scripts/test_server.py

# Web dashboard linting check
cd apps/web-dashboard && npm run lint
```

## Test File Organization

**Location:**
- AI subsystem tests: Dedicated directory `services/ai/tests/`
- Backend server smoke test: Script location `services/backend/scripts/test_server.py`
- Frontend/Mobile tests: Currently no automated test suites configured in `apps/web-dashboard/` or `apps/mobile-app/`

**Naming:**
- AI tests: `test_<subsystem>.py` (e.g., `test_detection.py`, `test_recognition.py`)
- Backend integration scripts: `test_<component>.py` (e.g., `test_server.py`)

**Structure:**
```
services/
├── ai/
│   └── tests/
│       ├── __init__.py
│       ├── test_detection.py    # VideoService & FrameExtractor tests
│       └── test_recognition.py  # Cosine similarity, ranking, and identity tests
└── backend/
    └── scripts/
        ├── mock_ai_engine.py    # Mock alert generation simulator
        └── test_server.py       # Live HTTP health & login validation
```

## Test Structure

**Suite Organization:**
```python
import unittest
import tempfile
import cv2
import numpy as np

class TestVideoService(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.valid_video_path = os.path.join(self.temp_dir.name, "test_video.avi")
        # Generate synthetic video fixture with cv2.VideoWriter
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        out = cv2.VideoWriter(self.valid_video_path, fourcc, 20.0, (640, 480))
        for _ in range(10):
            out.write(np.zeros((480, 640, 3), dtype=np.uint8))
        out.release()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_get_video_properties_valid(self):
        props = VideoService.get_video_properties(self.valid_video_path)
        self.assertEqual(props["width"], 640)
        self.assertEqual(props["frame_count"], 10)
```

**Fixtures & Synthetic Data:**
- Synthetic Video Generation: `test_detection.py` builds in-memory avi test videos with specific resolutions and frame counts to verify extraction logic without external video files.
- Normalized Vectors: `test_recognition.py` constructs orthogonal, identical, and inverse vectors to verify cosine metric calculations and edge conditions.
- Temporary Directories: `tempfile.TemporaryDirectory()` used in `setUp` and `tearDown` to isolate test file generation and identity serialization.

## Mocking Strategy

- **Mock AI Ingestion:** `services/backend/scripts/mock_ai_engine.py` provides an event generator simulating incoming CCTV alerts, missing person detections, and camera heartbeats for frontend testing.
- **Client Fallback Mocks:** `apps/web-dashboard/src/lib/api.ts` defines static `MOCK_DATA` fixtures for alerts, missing persons, CCTV upload batches, users, and settings when the live backend is unreachable.
- **Unit Test Mocking:** `unittest.mock.patch` is used in AI tests to mock file system persistence during identity updates.

## Testing Gaps & Recommendations

- **Backend FastAPI TestClient:** Currently uses an external HTTP script (`test_server.py`) against a running server. Adding `pytest` suites using `httpx.ASGITransport` / `starlette.testclient.TestClient` and an in-memory SQLite / test PostgreSQL database is recommended.
- **Frontend Unit & Component Tests:** `apps/web-dashboard` lacks Jest/Vitest and React Testing Library setup for dashboard cards, tables, and Leaflet map interactions.
- **Mobile End-to-End Tests:** `apps/mobile-app` does not have automated tests for background location tracking, duty toggle, or secure storage handling.

---
*Testing patterns analysis: 2026-11-04*
