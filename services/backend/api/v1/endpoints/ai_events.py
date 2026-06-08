from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database.db.session import get_db
from database.models.ai_events import DetectionEvent, Alert
from services.ai.core.recognition import process_face
from services.backend.api.v1.endpoints.websockets import manager
import base64

router = APIRouter()

@router.post("/")
async def ingest_ai_event(
    camera_id: str = Form(...),
    location_lat: float = Form(...),
    location_lng: float = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """
    Ingest a detection event from an edge camera or mock engine.
    """
    # 1. Simulate reading the image
    image_bytes = b""
    if image:
        image_bytes = await image.read()
    else:
        # If no image is provided, we simulate an empty byte array for the mock
        image_bytes = b"mock_image_data"
        
    # 2. Process with AI module
    match_result = await process_face(image_bytes)
    
    if not match_result or not match_result.get("match_found"):
        return {"status": "success", "message": "No match found"}
        
    # 3. If a match is found, create the DetectionEvent
    missing_person_id = match_result.get("missing_person_id")
    confidence = match_result.get("confidence")
    
    event = DetectionEvent(
        camera_id=camera_id,
        missing_person_id=missing_person_id,
        confidence_score=confidence,
        location_lat=location_lat,
        location_lng=location_lng
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    # 4. Generate an Alert for the Dispatcher
    alert = Alert(
        missing_person_id=missing_person_id,
        detection_event_id=event.id,
        status="pending",
        alert_location_lat=location_lat,
        alert_location_lng=location_lng
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    # 5. Broadcast to Admin & Dispatcher via WebSocket
    payload = {
        "event": "possible_match_detected",
        "data": {
            "alert_id": alert.id,
            "missing_person_id": missing_person_id,
            "camera_id": camera_id,
            "confidence": confidence,
            "lat": location_lat,
            "lng": location_lng
        }
    }
    
    # Send to dispatcher role specifically, or broadcast to all dispatchers
    await manager.broadcast_to_role("dispatcher", payload)
    await manager.broadcast_to_role("admin", payload)
    
    return {"status": "success", "event_id": event.id, "alert_id": alert.id}
