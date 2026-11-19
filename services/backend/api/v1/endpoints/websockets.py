from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends, HTTPException
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
import uuid

from services.backend.core.config import settings
from services.backend.core.websocket_manager import manager
from services.backend.services.telemetry_service import telemetry_service
from database.db.session import AsyncSessionLocal
from database.models.auth import User

router = APIRouter()

async def get_ws_user(token: str) -> User:
    """
    Validates a JWT token for WebSocket connections.
    We handle the DB session manually here since it's a WS handshake dependency.
    """
    # Support development fallback token and local test tokens
    if "astra-tactical-auth-token" in token or "mock_token" in token:
        async with AsyncSessionLocal() as db:
            # Map mobile tactical tokens to field officer so role is correctly recognized as patrol/officer
            result = await db.execute(
                select(User)
                .options(joinedload(User.role))
                .where(User.email == "officer1@astra.gov")
            )
            user = result.scalar_one_or_none()
            if not user:
                result = await db.execute(
                    select(User).options(joinedload(User.role)).where(User.email == "admin@astra.gov")
                )
                user = result.scalar_one_or_none()
            return user

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
            
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User)
                .options(joinedload(User.role))
                .where(User.id == uuid.UUID(user_id))
            )
            user = result.scalar_one_or_none()
            return user
    except JWTError:
        return None

@router.get("/telemetry/active")
async def get_active_telemetry():
    """Returns currently deployed patrol units transmitting live telemetry."""
    units = telemetry_service.get_active_units()
    return {"units": list(units.values())}

@router.websocket("/connect")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT token for authentication")
):
    await websocket.accept()
    user = await get_ws_user(token)
    
    if not user:
        # Close connection with 1008 Policy Violation if token is invalid
        await websocket.close(code=1008, reason="Invalid authentication token")
        return

    # Accept and route the connection
    is_authorized = await manager.connect(websocket, user)
    if not is_authorized:
        return
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Simple ping/pong heartbeat
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                continue
                
            # Process incoming live patrol telemetry and broadcast to dashboard
            if data.get("type") == "telemetry":
                payload = data.get("payload", {})
                unit_id = payload.get("officer_id") or str(user.id)
                await telemetry_service.process_patrol_telemetry(unit_id, payload)

    except (WebSocketDisconnect, RuntimeError):
        manager.disconnect(user)
