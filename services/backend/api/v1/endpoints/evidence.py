import uuid
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from services.backend.api import deps
from database.models.auth import User
from database.models.registry import MissingPerson
from database.models.system import SightingEvidence, ActivityLog
from services.backend.schemas.evidence import (
    SightingEvidenceCreate,
    SightingEvidenceUpdateStatus,
    SightingEvidenceResponse,
)

router = APIRouter()

@router.get("/case/{case_id}", response_model=List[SightingEvidenceResponse])
async def get_evidence_for_case(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
) -> List[SightingEvidence]:
    """
    Retrieve all recorded sighting evidence for a given Missing Person case.
    Ordered by similarity score descending, then most recent first.
    """
    # Verify case exists
    person = await db.get(MissingPerson, case_id)
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Missing person case with ID {case_id} not found",
        )

    query = (
        select(SightingEvidence)
        .where(SightingEvidence.missing_person_id == case_id)
        .order_by(SightingEvidence.similarity_score.desc(), SightingEvidence.created_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/sighting/{sighting_id}", response_model=SightingEvidenceResponse)
async def get_sighting_evidence(
    sighting_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
) -> SightingEvidence:
    """
    Retrieve a single sighting evidence record by ID.
    """
    sighting = await db.get(SightingEvidence, sighting_id)
    if not sighting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sighting evidence with ID {sighting_id} not found",
        )
    return sighting


@router.post("/sighting", response_model=SightingEvidenceResponse, status_code=status.HTTP_201_CREATED)
async def create_sighting_evidence(
    evidence_in: SightingEvidenceCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_current_user_optional),
) -> SightingEvidence:
    """
    Record a new sighting evidence entry with crop image, full context frame, and detection metrics.
    """
    person = await db.get(MissingPerson, evidence_in.missing_person_id)
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Missing person case {evidence_in.missing_person_id} not found",
        )

    sighting = SightingEvidence(
        missing_person_id=evidence_in.missing_person_id,
        detection_event_id=evidence_in.detection_event_id,
        crop_image_path=evidence_in.crop_image_path,
        full_frame_path=evidence_in.full_frame_path,
        similarity_score=evidence_in.similarity_score,
        quality_score=evidence_in.quality_score,
        model_version=evidence_in.model_version,
        verification_status="Unreviewed",
        bounding_box=evidence_in.bounding_box,
    )
    db.add(sighting)
    await db.commit()
    await db.refresh(sighting)
    return sighting


@router.patch("/sighting/{sighting_id}/status", response_model=SightingEvidenceResponse)
async def update_sighting_status(
    sighting_id: uuid.UUID,
    status_update: SightingEvidenceUpdateStatus,
    db: AsyncSession = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_current_user_optional),
) -> SightingEvidence:
    """
    Update verification status (Unreviewed -> Confirmed / Rejected) and capture investigator review notes.
    Writes an immutable audit log entry into ActivityLog.
    """
    sighting = await db.get(SightingEvidence, sighting_id)
    if not sighting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sighting evidence with ID {sighting_id} not found",
        )

    old_status = sighting.verification_status
    new_status = status_update.verification_status

    # Validate state transition
    valid_transitions = {
        "Unreviewed": ["Confirmed", "Rejected", "Unreviewed"],
        "Confirmed": ["Rejected", "Confirmed", "Unreviewed"],
        "Rejected": ["Confirmed", "Rejected", "Unreviewed"],
    }

    if new_status not in valid_transitions.get(old_status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification status transition from {old_status} to {new_status}",
        )

    # Update record
    user_id = current_user.id if current_user else None
    sighting.verification_status = new_status
    sighting.reviewed_at = datetime.utcnow()
    sighting.reviewed_by_id = user_id
    if status_update.review_notes is not None:
        sighting.review_notes = status_update.review_notes

    # Write immutable audit log
    audit_log = ActivityLog(
        user_id=user_id,
        action="sighting_status_updated",
        entity_type="SightingEvidence",
        entity_id=sighting.id,
        details=json.dumps({
            "old_status": old_status,
            "new_status": new_status,
            "review_notes": status_update.review_notes,
            "reviewed_by_id": str(user_id) if user_id else "system_operator",
            "missing_person_id": str(sighting.missing_person_id),
        }),
    )
    db.add(audit_log)

    await db.commit()
    await db.refresh(sighting)
    return sighting
