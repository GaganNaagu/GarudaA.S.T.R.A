from fastapi import APIRouter
from services.backend.api.v1.endpoints import auth, websockets, missing_persons, alerts

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(websockets.router, prefix="/ws", tags=["websockets"])
api_router.include_router(missing_persons.router, prefix="/missing-persons", tags=["missing_persons"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
