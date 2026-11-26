from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from services.backend.api import deps
from services.backend.schemas.timeline import CaseTimelineResponse
from services.backend.services.timeline_service import build_case_timeline

router = APIRouter()

@router.get("/case/{case_id}", response_model=CaseTimelineResponse)
async def get_case_timeline(
    case_id: str,
    category: Optional[str] = Query(None, description="Filter events by category (case, detection, verification, dispatch, audit)"),
    order: str = Query("asc", pattern="^(asc|desc)$", description="Sort order by event timestamp (asc = chronological, desc = newest first)"),
    db: AsyncSession = Depends(deps.get_db),
) -> CaseTimelineResponse:
    """
    Retrieve aggregated chronological investigation lifecycle timeline for a Missing Person case.
    Accepts both UUID or case_number string.
    """
    return await build_case_timeline(db=db, case_id=case_id, category=category, order=order)
