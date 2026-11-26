import uuid
import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from fastapi import FastAPI
from fastapi.testclient import TestClient

from services.backend.api import deps
from services.backend.api.v1.endpoints.timeline import router as timeline_router
from services.backend.schemas.timeline import (
    TimelineEvent,
    TimelineEventLink,
    CaseTimelineResponse,
)
from services.backend.services.timeline_service import _normalize_dt
from database.models.registry import MissingPerson
from database.models.ai_events import DetectionEvent, Alert
from database.models.system import SightingEvidence

test_app = FastAPI()
test_app.include_router(timeline_router, prefix="/api/v1/timeline")

mock_db = AsyncMock()
test_app.dependency_overrides[deps.get_db] = lambda: mock_db
client = TestClient(test_app)

def test_normalize_dt_utility():
    # Naive datetime
    naive = datetime(2026, 11, 4, 12, 0, 0)
    aware = _normalize_dt(naive)
    assert aware.tzinfo is not None
    assert aware.tzinfo == timezone.utc

    # None datetime defaults to current UTC
    none_dt = _normalize_dt(None)
    assert none_dt.tzinfo is not None

    # Compare without raising TypeError
    aware_dt = datetime.now(timezone.utc)
    res = sorted([aware, none_dt, aware_dt])
    assert len(res) == 3

def test_timeline_schemas_validation():
    link = TimelineEventLink(
        type="evidence",
        label="View Crop",
        sighting_id="sighting-123",
        crop_image_path="uploads/crops/crop1.jpg"
    )
    event = TimelineEvent(
        id="det-1",
        event_type="SIGHTING_DETECTED",
        category="detection",
        title="AI Facial Match",
        description="Confidence 94.2%",
        timestamp=datetime.now(timezone.utc),
        confidence=94.2,
        link=link
    )
    response = CaseTimelineResponse(
        case_id="case-123",
        case_number="MP-2026-001",
        full_name="Aarav Sharma",
        total_events=1,
        events=[event]
    )
    assert response.total_events == 1
    assert response.events[0].category == "detection"
    assert response.events[0].link.type == "evidence"

def test_get_timeline_nonexistent_case():
    fake_id = str(uuid.uuid4())
    mock_db.get.return_value = None
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    res = client.get(f"/api/v1/timeline/case/{fake_id}")
    assert res.status_code == 404
    data = res.json()
    error_msg = data.get("detail") or data.get("error", {}).get("message", "")
    assert "not found" in str(error_msg).lower()

def test_get_timeline_invalid_order_param():
    fake_id = str(uuid.uuid4())
    res = client.get(f"/api/v1/timeline/case/{fake_id}?order=diagonal")
    assert res.status_code == 422

def test_get_timeline_case_success():
    case_uuid = uuid.uuid4()
    mock_person = MagicMock(spec=MissingPerson)
    mock_person.id = case_uuid
    mock_person.case_number = "MP-2026-0891"
    mock_person.full_name = "Kavita Verma"
    mock_person.last_seen_location = "Sector 18 Metro Station"
    mock_person.last_seen_at = datetime(2026, 11, 4, 10, 0, 0, tzinfo=timezone.utc)
    mock_person.created_at = datetime(2026, 11, 4, 11, 0, 0, tzinfo=timezone.utc)
    mock_person.status = "Reported"
    mock_person.priority = "High"
    mock_person.photo_path = "uploads/reference/kavita.jpg"

    mock_db.get.return_value = mock_person

    # Mock execute for queries (detections, sightings, alerts, dispatches, audits)
    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = []
    mock_res.scalars.return_value.first.return_value = mock_person
    mock_db.execute.return_value = mock_res

    res = client.get(f"/api/v1/timeline/case/{case_uuid}")
    assert res.status_code == 200
    data = res.json()
    assert data["case_id"] == str(case_uuid)
    assert data["case_number"] == "MP-2026-0891"
    assert data["full_name"] == "Kavita Verma"
    assert "events" in data
    assert isinstance(data["events"], list)
    # Check that events include CASE_CREATED, LAST_SEEN, and PHOTO_UPLOADED
    event_types = [e["event_type"] for e in data["events"]]
    assert "CASE_CREATED" in event_types
    assert "LAST_SEEN" in event_types
    assert "PHOTO_UPLOADED" in event_types
