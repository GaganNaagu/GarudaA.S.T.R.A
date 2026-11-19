import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database.models.personnel import DispatchUnit, Officer
from database.models.operations import Assignment
from database.models.ai_events import Alert
from services.backend.core.websocket_manager import manager

logger = logging.getLogger(__name__)

class DispatchService:
    async def assign_nearest_patrol(self, db: AsyncSession, alert: Alert, event_lat: float, event_lng: float):
        """
        Broadcasts the verified alert to ALL available patrol units.
        Assignments are handled when officers accept via the /status endpoint.
        """
        person_name = alert.missing_person.full_name if getattr(alert, "missing_person", None) else "Missing Individual"
        case_no = alert.missing_person.case_number if getattr(alert, "missing_person", None) else f"#MP-{str(alert.id)[:5]}"
        photo_path = alert.missing_person.photo_path if getattr(alert, "missing_person", None) else None
        if not photo_path and getattr(alert, "detection_event", None) and alert.detection_event.image_path:
            photo_path = alert.detection_event.image_path

        data_body = {
            "alert_id": str(alert.id),
            "missing_person_id": str(alert.missing_person_id) if alert.missing_person_id else None,
            "person_name": person_name,
            "full_name": person_name,
            "case_number": case_no,
            "message": f"URGENT: Sighting Lead Confirmed for {person_name}. Intercept & verify.",
            "location_name": "Patrol Sector Lead",
            "lat": event_lat,
            "lng": event_lng,
            "confidence": 99.2,
            "image_path": photo_path
        }

        # The WebSocket payload mobile dutyManager expects for type=assignment
        # and web dashboard alerts page expects under data
        dispatch_payload = {
            "type": "assignment",
            "event": "possible_match_detected",
            "data": data_body,
            **data_body
        }

        # Broadcast to all connected clients (patrols, admins, dispatchers)
        await manager.broadcast_global_alert(dispatch_payload)
        await manager.broadcast_to_patrols(dispatch_payload)

        return None

dispatch_service = DispatchService()
