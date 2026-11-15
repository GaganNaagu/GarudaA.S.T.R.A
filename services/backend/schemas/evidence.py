from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal, Dict, Any
from datetime import datetime
import uuid

class SightingEvidenceBase(BaseModel):
    missing_person_id: uuid.UUID
    detection_event_id: Optional[uuid.UUID] = None
    crop_image_path: str
    full_frame_path: str
    similarity_score: float
    quality_score: float = 0.0
    model_version: str = "Facenet512-v1"
    bounding_box: Optional[Dict[str, Any]] = None

class SightingEvidenceCreate(SightingEvidenceBase):
    pass

class SightingEvidenceUpdateStatus(BaseModel):
    verification_status: Literal["Unreviewed", "Confirmed", "Rejected"]
    review_notes: Optional[str] = None

class SightingEvidenceResponse(SightingEvidenceBase):
    id: uuid.UUID
    verification_status: str
    reviewed_by_id: Optional[uuid.UUID] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
