import logging
from services.backend.core.websocket_manager import manager
from database.db.session import AsyncSessionLocal
from database.models.personnel import Officer, DispatchUnit
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
import uuid

logger = logging.getLogger(__name__)

class TelemetryService:
    def __init__(self):
        self._active_units: dict = {}

    def get_active_units(self) -> dict:
        return self._active_units

    async def process_patrol_telemetry(self, unit_id: str, payload: dict):
        """
        Receives GPS and battery telemetry from a patrol unit.
        Updates the in-memory active unit state, database (optional),
        and broadcasts it in real-time to all Dashboard Dispatchers/Admins.
        """
        event_type = payload.get("event_type", "PERIODIC")
        status = payload.get("status", "on_duty")

        if event_type == "DUTY_OFF" or status == "OFF DUTY" or event_type == "LOGOUT":
            if unit_id in self._active_units:
                del self._active_units[unit_id]
        else:
            self._active_units[unit_id] = {
                "unit_id": unit_id,
                "data": payload,
            }

        telemetry_event = {
            "type": "telemetry",
            "unit_id": unit_id,
            "data": payload
        }
        
        lat = payload.get("lat")
        lng = payload.get("lng")
        officer_name = payload.get("officer_name", "Field Officer")
        battery = payload.get("battery", 100)

        # Optional DB update - safely guarded so that DB latency or offline DB never drops live broadcasts
        if lat is not None and lng is not None:
            try:
                # Try parsing as UUID if unit_id is a valid UUID string
                parsed_uuid = None
                try:
                    parsed_uuid = uuid.UUID(unit_id)
                except (ValueError, AttributeError):
                    pass

                if parsed_uuid:
                    async with AsyncSessionLocal() as db:
                        result = await db.execute(
                            select(Officer)
                            .options(joinedload(Officer.dispatch_unit))
                            .where(Officer.user_id == parsed_uuid)
                        )
                        officer = result.scalar_one_or_none()
                        if officer and officer.dispatch_unit:
                            officer.dispatch_unit.last_known_lat = lat
                            officer.dispatch_unit.last_known_lng = lng
                            await db.commit()
            except Exception as db_err:
                logger.debug(f"[TELEMETRY] Non-critical DB sync skipped: {db_err}")

        # Broadcast to dispatchers and admins so map updates in real-time
        try:
            await manager.broadcast_global_alert(telemetry_event)
            logger.info(f"📡 [TELEMETRY] Broadcast {unit_id} ({officer_name}) -> lat: {lat}, lng: {lng}, battery: {battery}%")
        except Exception as broadcast_err:
            logger.error(f"❌ [TELEMETRY] Broadcast failed: {broadcast_err}")

telemetry_service = TelemetryService()
