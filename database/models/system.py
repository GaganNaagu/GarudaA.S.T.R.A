from sqlalchemy import String, ForeignKey, Text, Boolean, DateTime, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSON
from typing import Optional, TYPE_CHECKING
from datetime import datetime
import uuid

from database.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from database.models.auth import User
    from database.models.operations import Incident
    from database.models.ai_events import Alert, DetectionEvent
    from database.models.registry import MissingPerson

class Notification(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    type: Mapped[str] = mapped_column(String(50))
    content: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    
    user: Mapped["User"] = relationship()

class ActivityLog(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "activity_logs"

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(100))
    entity_type: Mapped[str] = mapped_column(String(50))
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column()
    details: Mapped[Optional[str]] = mapped_column(Text) # JSON string
    
    user: Mapped[Optional["User"]] = relationship()

class EvidenceFile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "evidence_files"

    file_path: Mapped[str] = mapped_column(String(512))
    uploader_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    incident_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("incidents.id"))
    alert_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("alerts.id"))
    
    uploader: Mapped["User"] = relationship()
    incident: Mapped[Optional["Incident"]] = relationship(back_populates="evidence_files")
    alert: Mapped[Optional["Alert"]] = relationship(back_populates="evidence_files")

class SystemStatus(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "system_status"

    component: Mapped[str] = mapped_column(String(50), unique=True)
    status: Mapped[str] = mapped_column(String(50))
    last_checked: Mapped[datetime] = mapped_column(DateTime(timezone=True))

class AIHealthStatus(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ai_health_status"

    status: Mapped[str] = mapped_column(String(50))
    last_ping: Mapped[datetime] = mapped_column(DateTime(timezone=True))

class SystemSettings(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "system_settings"

    processing_engine: Mapped[str] = mapped_column(String(20), default="cpu")
    detection_threshold: Mapped[float] = mapped_column(default=0.45)
    face_extraction_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    sound_alerts_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

class SightingEvidence(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "sighting_evidences"

    detection_event_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("detection_events.id"), nullable=True)
    missing_person_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("missing_persons.id"), index=True)
    crop_image_path: Mapped[str] = mapped_column(String(512))
    full_frame_path: Mapped[str] = mapped_column(String(512))
    similarity_score: Mapped[float] = mapped_column(Float)
    quality_score: Mapped[float] = mapped_column(Float, default=0.0)
    model_version: Mapped[str] = mapped_column(String(100), default="Facenet512-v1")
    verification_status: Mapped[str] = mapped_column(String(50), default="Unreviewed", index=True)
    reviewed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bounding_box: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    missing_person: Mapped["MissingPerson"] = relationship(back_populates="sighting_evidences")
    detection_event: Mapped[Optional["DetectionEvent"]] = relationship()
    reviewer: Mapped[Optional["User"]] = relationship()

    def __init__(self, **kw):
        super().__init__(**kw)
        if "verification_status" not in kw:
            self.verification_status = "Unreviewed"
        if "quality_score" not in kw:
            self.quality_score = 0.0
        if "model_version" not in kw:
            self.model_version = "Facenet512-v1"

