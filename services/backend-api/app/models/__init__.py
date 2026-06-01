from app.db.base import Base
from app.models.auth import User, Role
from app.models.personnel import Officer, DispatchUnit
from app.models.operations import Incident, IncidentUpdate, Assignment
from app.models.ai_events import DetectionEvent, Alert
from app.models.registry import MissingPerson
from app.models.infrastructure import Location, CameraFeed
from app.models.system import Notification, ActivityLog, EvidenceFile, SystemStatus, AIHealthStatus

# This file exposes all models so Alembic can discover them
__all__ = [
    "Base",
    "User", "Role",
    "Officer", "DispatchUnit",
    "Incident", "IncidentUpdate", "Assignment",
    "DetectionEvent", "Alert",
    "MissingPerson",
    "Location", "CameraFeed",
    "Notification", "ActivityLog", "EvidenceFile", "SystemStatus", "AIHealthStatus"
]
