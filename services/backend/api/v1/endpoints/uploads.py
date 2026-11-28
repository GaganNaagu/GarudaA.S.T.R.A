import os
import uuid
import shutil
import asyncio
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from database.db.session import get_db
from database.models.auth import User
from database.models.infrastructure import VideoFootage, FaceCrop
from services.backend.api import deps
from services.backend.core.video_processor import process_video_task

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads", "videos")

@router.post("/")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    camera_id: Optional[str] = Form(None),
    sector: Optional[str] = Form(None),
    priority: Optional[str] = Form("Normal"),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a new video footage for AI face processing.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Generate unique ID and save path
    video_id = uuid.uuid4()
    ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{video_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    def save_upload_file(upload_file, destination):
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

    try:
        await asyncio.to_thread(save_upload_file, file, file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # Create DB Record
    video_record = VideoFootage(
        id=video_id,
        filename=file.filename,
        file_path=file_path,
        status="PENDING",
        camera_id=camera_id,
        sector=sector,
        priority=priority
    )
    db.add(video_record)
    await db.commit()
    await db.refresh(video_record)

    # We no longer dispatch background task automatically
    # background_tasks.add_task(process_video_task, str(video_id))

    return {
        "id": str(video_id),
        "filename": video_record.filename,
        "status": video_record.status,
        "message": "Upload successful, awaiting manual analysis trigger."
    }

@router.post("/{video_id}/analyze")
async def analyze_video(
    video_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    try:
        video_uuid = uuid.UUID(video_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid video ID format")

    video = await db.get(VideoFootage, video_uuid)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if not os.path.exists(video.file_path):
        await db.delete(video)
        await db.commit()
        raise HTTPException(status_code=404, detail="Video file missing from server. Database record cleaned up.")

    if video.status == "PROCESSING":
        return {"message": "Video is already being processed."}

    background_tasks.add_task(process_video_task, str(video_id))
    return {"message": "Analysis started."}

@router.post("/batch-analyze")
async def batch_analyze_videos(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(VideoFootage).where(VideoFootage.status.in_(["PENDING", "ERROR"]))
    result = await db.execute(stmt)
    videos = result.scalars().all()
    
    triggered_count = 0
    missing_count = 0
    
    for v in videos:
        if not os.path.exists(v.file_path):
            await db.delete(v)
            missing_count += 1
            continue
            
        background_tasks.add_task(process_video_task, str(v.id))
        triggered_count += 1
        
    await db.commit()
    return {
        "message": f"Triggered analysis for {triggered_count} videos. Cleaned up {missing_count} missing files.",
        "triggered": triggered_count,
        "cleaned_up": missing_count
    }

@router.get("/")
async def get_uploads(db: AsyncSession = Depends(get_db)):
    """
    Get all uploaded video footages and their processing status.
    """
    stmt = select(VideoFootage).order_by(VideoFootage.created_at.desc())
    result = await db.execute(stmt)
    videos = result.scalars().all()
    
    # We can just return them as a list of dicts for simplicity
    results = []
    for v in videos:
        results.append({
            "id": str(v.id),
            "filename": v.filename,
            "status": v.status,
            "camera_id": v.camera_id,
            "sector": v.sector,
            "priority": v.priority,
            "progress": getattr(v, "progress", 0.0),
            "uploaded_at": v.created_at.isoformat() if v.created_at else None,
            "updated_at": v.updated_at.isoformat() if v.updated_at else None
        })
    return results


class BulkDeleteFootagesRequest(BaseModel):
    ids: List[uuid.UUID]


def _resolve_upload_file(raw_path: Optional[str]) -> Optional[Path]:
    if not raw_path:
        return None
    p = Path(raw_path)
    if p.exists() and p.is_file():
        return p
    clean = raw_path.replace("\\", "/").lstrip("/")
    if not clean.startswith("services/backend/"):
        candidate = Path("services/backend") / clean
        if candidate.exists() and candidate.is_file():
            return candidate
    return None


async def _cascade_delete_footages(db: AsyncSession, videos: List[VideoFootage]) -> int:
    """Permanently delete video footages, their FaceCrops, linked SightingEvidence, and files on disk."""
    if not videos:
        return 0

    from sqlalchemy import delete as sa_delete
    from database.models.system import SightingEvidence

    video_ids = [v.id for v in videos]

    # 1. Fetch FaceCrops for these videos so we can delete linked SightingEvidence & crop files
    crops_res = await db.execute(select(FaceCrop).where(FaceCrop.video_id.in_(video_ids)))
    crops = crops_res.scalars().all()
    crop_paths = [c.image_path for c in crops if c.image_path]

    if crop_paths:
        await db.execute(sa_delete(SightingEvidence).where(SightingEvidence.crop_image_path.in_(crop_paths)))

    # 2. Delete FaceCrops from DB
    await db.execute(sa_delete(FaceCrop).where(FaceCrop.video_id.in_(video_ids)))

    # 3. Delete crop image files on disk
    for crop_path in crop_paths:
        resolved = _resolve_upload_file(crop_path)
        if resolved:
            try:
                resolved.unlink()
            except Exception:
                pass

    # 4. Delete extracted frame files and original video files on disk, then DB records
    frames_dir = Path("services/backend/uploads/frames")
    for video in videos:
        if frames_dir.exists():
            for frame_file in frames_dir.glob(f"{video.id}_*"):
                try:
                    if frame_file.is_file():
                        frame_file.unlink()
                except Exception:
                    pass

        resolved_video = _resolve_upload_file(video.file_path)
        if resolved_video:
            try:
                resolved_video.unlink()
            except Exception:
                pass

        await db.delete(video)

    await db.commit()
    return len(videos)


@router.post("/bulk-delete")
async def bulk_delete_footages(
    payload: BulkDeleteFootagesRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Admin-only endpoint to permanently delete multiple stored video footages and all
    associated face crops, extracted frames, and sighting evidence.
    """
    if not current_user.role or current_user.role.name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete stored footages.",
        )

    if not payload.ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No footage IDs provided.",
        )

    result = await db.execute(select(VideoFootage).where(VideoFootage.id.in_(payload.ids)))
    videos = result.scalars().all()
    if not videos:
        raise HTTPException(status_code=404, detail="No matching video footages found")

    deleted_count = await _cascade_delete_footages(db, videos)
    return {
        "status": "success",
        "deleted_count": deleted_count,
        "message": f"Deleted {deleted_count} stored footage(s) and all related data.",
    }


@router.delete("/{video_id}")
async def delete_footage(
    video_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Admin-only endpoint to permanently delete a stored video footage and all
    associated face crops, extracted frames, and sighting evidence.
    """
    if not current_user.role or current_user.role.name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete stored footages.",
        )

    try:
        video_uuid = uuid.UUID(video_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid video ID format")

    video = await db.get(VideoFootage, video_uuid)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    filename = video.filename
    await _cascade_delete_footages(db, [video])
    return {
        "status": "success",
        "message": f"Footage '{filename}' and all related data deleted.",
    }
