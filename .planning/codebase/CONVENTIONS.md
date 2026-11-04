# Coding Conventions

**Analysis Date:** 2026-11-04

## Naming Patterns

**Files & Directories:**
- Python modules: `snake_case.py` (e.g., `services/backend/core/websocket_manager.py`)
- Python test files: `test_*.py` (e.g., `services/ai/tests/test_detection.py`)
- React/Next.js components: `PascalCase.tsx` (e.g., `apps/web-dashboard/src/components/ui/TacticalCard.tsx`)
- TypeScript utilities/services: `camelCase.ts` (e.g., `apps/mobile-app/src/services/gpsService.ts`)
- Next.js App Router route files: `page.tsx`, `layout.tsx`, `route.ts`

**Functions & Methods:**
- Python functions: `snake_case` (e.g., `calculate_iou`, `process_video_task`, `get_current_user`)
- TypeScript functions: `camelCase` (e.g., `fetchApi`, `startForegroundService`, `handleAlertResponse`)
- Event handlers: `handleEventName` or `onEventName` (e.g., `handleLogin`, `onStatusChange`)

**Variables & Constants:**
- Variables: `snake_case` in Python, `camelCase` in TypeScript
- Constants & Enums: `UPPER_SNAKE_CASE` (e.g., `API_V1_STR`, `CROPS_DIR`, `DEFAULT_THEME`)
- Private/Internal attributes: Leading underscore `_name` (e.g., `self._active_connections`)

**Types & Classes:**
- Classes & Interfaces: `PascalCase` (e.g., `MissingPerson`, `DetectionEvent`, `UserResponse`, `TacticalAlert`)
- Pydantic models: `EntityCreate`, `EntityUpdate`, `EntityResponse` (e.g., `UserCreate`, `AlertResponse`)
- TypeScript type aliases: `PascalCase` (e.g., `Alert`, `OfficerLocation`, `TelemetryPayload`)

## Code Style

**Python Style & Tooling:**
- PEP 8 compliance across all backend and AI scripts.
- Type annotations: Strictly used on all FastAPI routes, Pydantic schemas, and SQLAlchemy 2.0 `Mapped[...]` columns.
- Logging: Use standard library `logging.getLogger(__name__)` instead of bare `print` statements in production backend code.

**TypeScript / React Style & Tooling:**
- ESLint: Configured with `eslint-config-next` (`apps/web-dashboard/`)
- Formatting: 2 spaces indentation, double quotes or single quotes consistent per app, no trailing whitespace.
- Tailwind CSS: Class names organized utility-first with `clsx` and `tailwind-merge` (`apps/web-dashboard/src/lib/utils.ts`).

## Import Organization

**Python Order:**
1. Standard library imports (e.g., `os`, `sys`, `uuid`, `logging`, `datetime`, `pathlib`)
2. Third-party dependencies (e.g., `fastapi`, `sqlalchemy`, `pydantic`, `cv2`, `numpy`, `torch`)
3. Internal module imports:
   - Database models and sessions (`database.models.*`, `database.db.session`)
   - Backend core and dependencies (`services.backend.core.*`, `services.backend.api.deps`)
   - Schemas and utilities (`services.backend.schemas.*`)

**TypeScript Order:**
1. React and Next.js / React Native primitives (e.g., `import React, { useState, useEffect } from 'react'`)
2. Third-party packages (e.g., `lucide-react`, `leaflet`, `expo-location`)
3. Internal project paths (`@/components/...`, `@/lib/...`, `../services/...`)
4. Relative imports (`./types`, `./styles`)

## Error Handling Patterns

**Backend API:**
- Always raise `HTTPException` with appropriate status code and descriptive detail message:
  ```python
  if not person:
      raise HTTPException(status_code=404, detail="Missing person not found")
  ```
- Catch unexpected database or processing exceptions and normalize them via `services/backend/core/exceptions.py`.
- Subprocess isolation catches execution failures and logs them to `ai_pipeline.log` without crashing the parent web server.

**Frontend / Mobile Clients:**
- Graceful degradation: If a network request fails, log error details and fall back to tactical mock data or cached state so the UI remains interactive (`apps/web-dashboard/src/lib/api.ts`).
- Mobile async calls wrapped in `try/catch` with toast alerts informing the user of network or permission errors.

## Concurrency & Asynchronous Patterns

- **Async/Await:** All database operations in FastAPI routes use asynchronous SQLAlchemy queries (`await db.execute(...)`, `await db.commit()`).
- **Heavy Compute Isolation:** Deep learning inferences (YOLOv8, DeepFace) are NEVER executed directly in the main async event loop. They are delegated to an external subprocess via `video_processor.py` to prevent event loop starvation and thread deadlocks.
- **WebSocket Broadcasting:** Real-time messages are dispatched non-blocking using `asyncio.create_task` or batched asynchronous socket sends in `WebSocketManager`.

---
*Conventions analysis: 2026-11-04*

