import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from services.backend.api import deps
from database.models.auth import User
from database.models.registry import MissingPerson
from services.backend.schemas.missing_person import MissingPersonCreate, MissingPersonRead

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
        id=str(uuid.uuid4()),
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
