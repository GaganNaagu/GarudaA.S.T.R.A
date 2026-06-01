from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import add_exception_handlers

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="GARUDA A.S.T.R.A API Backend",
    version="1.0.0"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Add custom global exception handlers
add_exception_handlers(app)

@app.get("/health/live", tags=["Health"])
async def health_live():
    return {"status": "alive"}

# TODO: Add router inclusion here when API routers are implemented
