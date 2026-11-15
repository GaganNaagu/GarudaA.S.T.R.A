import uuid
import pytest
from unittest.mock import AsyncMock
from pydantic import ValidationError
from fastapi import FastAPI
from fastapi.testclient import TestClient

from services.backend.api import deps
from services.backend.api.v1.endpoints.evidence import router as evidence_router
from services.backend.schemas.evidence import (
    SightingEvidenceCreate,
    SightingEvidenceUpdateStatus,
    SightingEvidenceResponse,
)

test_app = FastAPI()
test_app.include_router(evidence_router, prefix="/api/v1/evidence")

# Mock database dependency
mock_db = AsyncMock()
test_app.dependency_overrides[deps.get_db] = lambda: mock_db
client = TestClient(test_app)

def test_sighting_status_schema_validation():
    valid_unreviewed = SightingEvidenceUpdateStatus(verification_status="Unreviewed")
    assert valid_unreviewed.verification_status == "Unreviewed"

    valid_confirmed = SightingEvidenceUpdateStatus(
        verification_status="Confirmed", review_notes="Matched subject jacket"
    )
    assert valid_confirmed.verification_status == "Confirmed"
    assert valid_confirmed.review_notes == "Matched subject jacket"

    valid_rejected = SightingEvidenceUpdateStatus(verification_status="Rejected")
    assert valid_rejected.verification_status == "Rejected"

    with pytest.raises(ValidationError):
        SightingEvidenceUpdateStatus(verification_status="InvalidStatus")


def test_sighting_create_schema_validation():
    person_id = uuid.uuid4()
    evidence_in = SightingEvidenceCreate(
        missing_person_id=person_id,
        crop_image_path="uploads/crop.jpg",
        full_frame_path="uploads/frame.jpg",
        similarity_score=85.0,
        quality_score=90.5,
    )
    assert evidence_in.missing_person_id == person_id
    assert evidence_in.similarity_score == 85.0
    assert evidence_in.model_version == "Facenet512-v1"


def test_get_evidence_nonexistent_case():
    fake_id = str(uuid.uuid4())
    mock_db.get.return_value = None
    response = client.get(f"/api/v1/evidence/case/{fake_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_evidence_nonexistent_sighting():
    fake_id = str(uuid.uuid4())
    mock_db.get.return_value = None
    response = client.get(f"/api/v1/evidence/sighting/{fake_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_patch_status_invalid_payload():
    fake_id = str(uuid.uuid4())
    response = client.patch(
        f"/api/v1/evidence/sighting/{fake_id}/status",
        json={"verification_status": "NotAValidStatus"},
    )
    assert response.status_code == 422
