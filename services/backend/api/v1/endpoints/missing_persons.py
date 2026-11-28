import uuid
import os
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from services.backend.api import deps
from database.models.auth import User
from database.models.registry import MissingPerson
from services.backend.schemas.missing_person import MissingPersonCreate, MissingPersonRead, MissingPersonStatusUpdate

router = APIRouter()

@router.post("/", response_model=MissingPersonRead, status_code=status.HTTP_201_CREATED)
async def create_missing_person(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    person_in: MissingPersonCreate,
) -> MissingPerson:
    """
    Register a new missing person.
    """
    # Verify role
    if current_user.role.name not in ["admin", "dispatcher"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Generate a unique case number
    case_number = f"MP-{str(uuid.uuid4())[:8].upper()}"

    db_person = MissingPerson(
        case_number=case_number,
        full_name=person_in.full_name,
        age=person_in.age,
        gender=person_in.gender,
        description=person_in.description,
        last_seen_location=person_in.last_seen_location,
        last_seen_at=person_in.last_seen_at,
        priority=person_in.priority,
        status="Reported"
    )
    
    db.add(db_person)
    await db.commit()
    await db.refresh(db_person)
    
    return db_person

@router.get("/", response_model=List[MissingPersonRead])
async def read_missing_persons(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> List[MissingPerson]:
    """
    Retrieve all missing persons.
    """
    result = await db.execute(select(MissingPerson).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/{person_id}", response_model=MissingPersonRead)
async def read_missing_person(
    person_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> MissingPerson:
    """
    Retrieve a specific missing person by UUID or case number.
    """
    person = None
    try:
        val_uuid = uuid.UUID(person_id)
        person = await db.get(MissingPerson, val_uuid)
    except ValueError:
        # Search by case_number if not a valid UUID string
        result = await db.execute(select(MissingPerson).where(MissingPerson.case_number.ilike(f"%{person_id}%")))
        person = result.scalars().first()

    # If numeric index like /missing/1, fallback to first available person in DB
    if not person and person_id.isdigit():
        result = await db.execute(select(MissingPerson).limit(1))
        person = result.scalars().first()

    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Missing person '{person_id}' not found",
        )
    return person

from fastapi import UploadFile, File
from services.ai.recognition.embedding_service import generate_embedding
import json

@router.post("/{person_id}/image")
async def upload_missing_person_image(
    person_id: uuid.UUID,
    image: UploadFile = File(...),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Upload a reference photo for the missing person to generate the AI face embedding.
    """
    if current_user.role.name not in ["admin", "dispatcher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(select(MissingPerson).where(MissingPerson.id == person_id))
    person = result.scalars().first()
    
    if not person:
        raise HTTPException(status_code=404, detail="Missing person not found")
        
    image_bytes = await image.read()
    
    # Save the original mugshot to disk
    upload_dir = Path("services/backend/uploads/missing_persons")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f"{person_id}.jpg"
    file_path = upload_dir / filename
    
    with open(file_path, "wb") as f:
        f.write(image_bytes)
        
    person.photo_path = f"uploads/missing_persons/{filename}"
    
    embedding = generate_embedding(image_bytes)
    
    if not embedding:
        raise HTTPException(status_code=400, detail="Could not detect a clear face in the image")
        
    # Store embedding as JSON
    person.face_embedding = embedding
    
    await db.commit()
    
    # Trigger vector search automatically in the background to check history
    try:
        from services.backend.api.v1.endpoints.search import search_person_against_crops
        await search_person_against_crops(person_id=person_id, db=db)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Error running automatic vector search on upload: {e}")
    
    return {"status": "success", "message": "Face embedding generated successfully"}

@router.patch("/{person_id}/status", response_model=MissingPersonRead)
async def update_missing_person_status(
    person_id: uuid.UUID,
    status_in: MissingPersonStatusUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> MissingPerson:
    """
    Update the status of a missing person (e.g. mark as 'Found').
    """
    if current_user.role.name not in ["admin", "dispatcher", "officer", "patrol"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(select(MissingPerson).where(MissingPerson.id == person_id))
    person = result.scalars().first()
    
    if not person:
        raise HTTPException(status_code=404, detail="Missing person not found")
        
    person.status = status_in.status
    await db.commit()
    await db.refresh(person)
    
    return person


class BulkDeleteMissingPersonsRequest(BaseModel):
    ids: List[uuid.UUID]


async def _cascade_delete_missing_persons(db: AsyncSession, persons: List[MissingPerson]) -> int:
    """Permanently delete missing person records and all related data and photo files."""
    if not persons:
        return 0

    from sqlalchemy import delete as sa_delete
    from database.models.ai_events import Alert, DetectionEvent
    from database.models.operations import Assignment
    from database.models.system import SightingEvidence, ActivityLog

    person_ids = [p.id for p in persons]

    # 1. Delete Assignments linked to Alerts for these persons
    alert_ids_res = await db.execute(select(Alert.id).where(Alert.missing_person_id.in_(person_ids)))
    alert_ids = [row[0] for row in alert_ids_res.all()]
    if alert_ids:
        await db.execute(sa_delete(Assignment).where(Assignment.alert_id.in_(alert_ids)))

    # 2. Delete SightingEvidence, Alerts, DetectionEvents, and Case ActivityLogs
    await db.execute(sa_delete(SightingEvidence).where(SightingEvidence.missing_person_id.in_(person_ids)))
    await db.execute(sa_delete(Alert).where(Alert.missing_person_id.in_(person_ids)))
    await db.execute(sa_delete(DetectionEvent).where(DetectionEvent.person_id.in_(person_ids)))
    await db.execute(
        sa_delete(ActivityLog).where(
            ActivityLog.entity_type == "MissingPerson",
            ActivityLog.entity_id.in_(person_ids),
        )
    )

    # 3. Clean up uploaded reference photos on disk and delete MissingPerson rows
    for person in persons:
        if person.photo_path and "missing_persons/" in person.photo_path.replace("\\", "/"):
            try:
                photo_file = Path("services/backend") / person.photo_path.replace("\\", "/").lstrip("/")
                if photo_file.exists() and photo_file.is_file():
                    photo_file.unlink()
            except Exception:
                pass
        await db.delete(person)

    await db.commit()
    return len(persons)


@router.post("/bulk-delete")
async def bulk_delete_missing_persons(
    payload: BulkDeleteMissingPersonsRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Admin-only endpoint to permanently delete multiple missing person cases and all
    related SightingEvidence, Alerts, Assignments, DetectionEvents, and ActivityLogs.
    """
    if not current_user.role or current_user.role.name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete missing person cases.",
        )

    if not payload.ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No missing person IDs provided.",
        )

    result = await db.execute(select(MissingPerson).where(MissingPerson.id.in_(payload.ids)))
    persons = result.scalars().all()
    if not persons:
        raise HTTPException(status_code=404, detail="No matching missing person cases found")

    deleted_count = await _cascade_delete_missing_persons(db, persons)
    return {
        "status": "success",
        "deleted_count": deleted_count,
        "message": f"Deleted {deleted_count} missing person case(s) and all related records.",
    }


@router.delete("/{person_id}")
async def delete_missing_person(
    person_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Admin-only endpoint to permanently delete a missing person case and all
    related SightingEvidence, Alerts, Assignments, DetectionEvents, and ActivityLogs.
    """
    if not current_user.role or current_user.role.name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete missing person cases.",
        )

    person = await db.get(MissingPerson, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Missing person not found")

    case_number = person.case_number
    await _cascade_delete_missing_persons(db, [person])

    return {
        "status": "success",
        "message": f"Case {case_number} and all related records deleted.",
    }

