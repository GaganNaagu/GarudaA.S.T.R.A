import uuid
from datetime import datetime
from database.models.system import SightingEvidence
from database.models.registry import MissingPerson

def test_sighting_evidence_model_defaults():
    person_id = uuid.uuid4()
    sighting = SightingEvidence(
        missing_person_id=person_id,
        crop_image_path="uploads/evidence/MP-12345/sighting_1/crop.jpg",
        full_frame_path="uploads/evidence/MP-12345/sighting_1/full_frame.jpg",
        similarity_score=87.5,
        quality_score=142.3,
        model_version="Facenet512-v1",
        bounding_box={"x": 100, "y": 150, "w": 80, "h": 95},
    )

    assert sighting.missing_person_id == person_id
    assert sighting.verification_status == "Unreviewed"
    assert sighting.similarity_score == 87.5
    assert sighting.quality_score == 142.3
    assert sighting.model_version == "Facenet512-v1"
    assert sighting.reviewed_by_id is None
    assert sighting.reviewed_at is None
    assert sighting.review_notes is None
    assert sighting.bounding_box == {"x": 100, "y": 150, "w": 80, "h": 95}

def test_sighting_evidence_status_update():
    person_id = uuid.uuid4()
    reviewer_id = uuid.uuid4()
    now = datetime.utcnow()

    sighting = SightingEvidence(
        missing_person_id=person_id,
        crop_image_path="uploads/crop.jpg",
        full_frame_path="uploads/full.jpg",
        similarity_score=92.0,
    )

    # Simulate reviewer confirmation
    sighting.verification_status = "Confirmed"
    sighting.reviewed_by_id = reviewer_id
    sighting.reviewed_at = now
    sighting.review_notes = "Subject confirmed by investigator"

    assert sighting.verification_status == "Confirmed"
    assert sighting.reviewed_by_id == reviewer_id
    assert sighting.reviewed_at == now
    assert sighting.review_notes == "Subject confirmed by investigator"
