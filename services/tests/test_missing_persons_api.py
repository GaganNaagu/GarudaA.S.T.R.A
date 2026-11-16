import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import FastAPI
from fastapi.testclient import TestClient

from services.backend.api import deps
from services.backend.api.v1.endpoints.missing_persons import router as mp_router
from database.models.auth import User, Role
from database.models.registry import MissingPerson

test_app = FastAPI()
test_app.include_router(mp_router, prefix="/api/v1/missing-persons")

mock_db = AsyncMock()
mock_user = MagicMock(spec=User)
mock_user.id = uuid.uuid4()
mock_user.email = "admin@astra.gov"
mock_role = MagicMock(spec=Role)
mock_role.name = "admin"
mock_user.role = mock_role

test_app.dependency_overrides[deps.get_db] = lambda: mock_db
test_app.dependency_overrides[deps.get_current_user] = lambda: mock_user
client = TestClient(test_app)

def test_get_missing_person_by_id_success():
    person_id = uuid.uuid4()
    mock_person = MagicMock(spec=MissingPerson)
    mock_person.id = person_id
    mock_person.case_number = "MP-TEST01"
    mock_person.full_name = "Test Person"
    mock_person.age = 25
    mock_person.gender = "Male"
    mock_person.description = "Test description"
    mock_person.last_seen_location = "Station"
    mock_person.last_seen_at = None
    mock_person.priority = "High"
    mock_person.status = "Reported"
    mock_person.photo_path = None
    mock_person.created_at = "2026-01-01T00:00:00"
    mock_person.updated_at = "2026-01-01T00:00:00"

    mock_db.get.return_value = mock_person
    response = client.get(f"/api/v1/missing-persons/{person_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["case_number"] == "MP-TEST01"
    assert data["full_name"] == "Test Person"

def test_get_missing_person_not_found():
    fake_id = str(uuid.uuid4())
    mock_db.get.return_value = None
    
    # Mock query returning empty scalars
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res
    
    response = client.get(f"/api/v1/missing-persons/{fake_id}")
    assert response.status_code == 404
