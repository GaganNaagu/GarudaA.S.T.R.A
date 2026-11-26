from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal, Dict, Any, List
from datetime import datetime

class TimelineEventLink(BaseModel):
    type: Literal["evidence", "map", "alert", "case"]
    label: str
    sighting_id: Optional[str] = None
    alert_id: Optional[str] = None
    camera_id: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    crop_image_path: Optional[str] = None

class TimelineEvent(BaseModel):
    id: str
    event_type: str
    category: Literal["case", "detection", "verification", "dispatch", "audit"]
    title: str
    description: str
    timestamp: datetime
    actor: Optional[str] = None
    severity: Optional[str] = None
    confidence: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    link: Optional[TimelineEventLink] = None

    model_config = ConfigDict(from_attributes=True)

class CaseTimelineResponse(BaseModel):
    case_id: str
    case_number: str
    full_name: str
    total_events: int
    events: List[TimelineEvent]

    model_config = ConfigDict(from_attributes=True)
