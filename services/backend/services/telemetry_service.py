import logging
from backend.core.websocket_manager import manager

logger = logging.getLogger(__name__)

class TelemetryService:
    @staticmethod
    async def process_patrol_telemetry(unit_id: str, payload: dict):
        """
        Receives GPS and battery telemetry from a patrol unit.
        Updates the database (optional) and broadcasts it to all Dispatchers.
        """
        telemetry_event = {
            "type": "telemetry",
            "unit_id": unit_id,
            "data": payload
        }
        
        # Broadcast to dispatchers and admins so map updates in real-time
        await manager.broadcast_global_alert(telemetry_event)

telemetry_service = TelemetryService()
