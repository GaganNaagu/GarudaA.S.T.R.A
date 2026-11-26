import uuid
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Set
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from database.models.registry import MissingPerson
from database.models.ai_events import DetectionEvent, Alert
from database.models.operations import Assignment
from database.models.system import SightingEvidence, ActivityLog
from database.models.infrastructure import CameraFeed, Location
from database.models.personnel import Officer, DispatchUnit
from services.backend.schemas.timeline import (
    TimelineEvent,
    TimelineEventLink,
    CaseTimelineResponse,
)

def _normalize_dt(dt: Optional[datetime]) -> datetime:
    if dt is None:
        return datetime.now(timezone.utc)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

async def _resolve_missing_person(db: AsyncSession, case_id: str) -> MissingPerson:
    target_uuid = None
    try:
        target_uuid = uuid.UUID(case_id)
    except ValueError:
        # Search by case_number
        query = select(MissingPerson).where(MissingPerson.case_number.ilike(f"%{case_id}%"))
        res = await db.execute(query)
        person = res.scalars().first()
        if not person and case_id.isdigit():
            res = await db.execute(select(MissingPerson).limit(1))
            person = res.scalars().first()
        if person:
            return person

    if target_uuid:
        person = await db.get(MissingPerson, target_uuid)
        if person:
            return person

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Missing person case '{case_id}' not found",
    )

async def build_case_timeline(
    db: AsyncSession,
    case_id: str,
    category: Optional[str] = None,
    order: str = "asc",
) -> CaseTimelineResponse:
    person = await _resolve_missing_person(db, case_id)
    raw_events: List[TimelineEvent] = []
    seen_event_ids: Set[str] = set()

    def add_event(event: TimelineEvent):
        if event.id not in seen_event_ids:
            seen_event_ids.add(event.id)
            raw_events.append(event)

    # 1. Case Lifecycle Events from MissingPerson
    if person.last_seen_at:
        last_seen_dt = _normalize_dt(person.last_seen_at)
        add_event(
            TimelineEvent(
                id=f"last-seen-{person.id}",
                event_type="LAST_SEEN",
                category="case",
                title=f"Last Known Sighting ({person.last_seen_location or 'Reported Area'})",
                description=f"Subject last observed at {person.last_seen_location or 'reported area'} prior to case filing.",
                timestamp=last_seen_dt,
                severity="Info",
                metadata={"last_seen_location": person.last_seen_location},
                link=TimelineEventLink(
                    type="case",
                    label="Last Seen Location",
                ),
            )
        )

    case_created_dt = _normalize_dt(person.created_at)
    add_event(
        TimelineEvent(
            id=f"case-created-{person.id}",
            event_type="CASE_CREATED",
            category="case",
            title=f"Missing Person Case Registered ({person.case_number})",
            description=f"{person.full_name} reported missing. Last seen at {person.last_seen_location or 'Unknown location'}.",
            timestamp=case_created_dt,
            severity=person.priority,
            metadata={
                "case_number": person.case_number,
                "priority": person.priority,
                "status": person.status,
                "last_seen_location": person.last_seen_location,
            },
            link=TimelineEventLink(
                type="case",
                label="Case Dossier",
                camera_id=None,
            ),
        )
    )

    if person.photo_path:
        add_event(
            TimelineEvent(
                id=f"photo-uploaded-{person.id}",
                event_type="PHOTO_UPLOADED",
                category="case",
                title="Reference Photo Uploaded & Biometrics Indexed",
                description="High-resolution reference profile ingested into AI facial vector database.",
                timestamp=case_created_dt + timedelta(seconds=1),
                metadata={"photo_path": person.photo_path},
                link=TimelineEventLink(
                    type="case",
                    label="Reference Photo",
                    crop_image_path=person.photo_path,
                ),
            )
        )

    # 2. Sighting Evidence (Vault Records)
    evidence_query = (
        select(SightingEvidence)
        .where(SightingEvidence.missing_person_id == person.id)
        .options(
            selectinload(SightingEvidence.reviewer),
            selectinload(SightingEvidence.detection_event).selectinload(DetectionEvent.camera_feed).selectinload(CameraFeed.location),
        )
    )
    evidence_res = await db.execute(evidence_query)
    sightings = evidence_res.scalars().all()
    sighting_ids = {s.id for s in sightings}

    detection_seen_ids: Set[uuid.UUID] = set()

    for s in sightings:
        s_dt = _normalize_dt(s.created_at)
        cam_name = "CCTV Node"
        loc_name = None
        lat = None
        lng = None
        if s.detection_event and s.detection_event.camera_feed:
            cam_name = s.detection_event.camera_feed.name
            if s.detection_event.camera_feed.location:
                loc_name = s.detection_event.camera_feed.location.name
                lat = s.detection_event.camera_feed.location.latitude
                lng = s.detection_event.camera_feed.location.longitude

        det_id_str = f"detection-sighting-{s.id}"
        if s.detection_event_id:
            detection_seen_ids.add(s.detection_event_id)
            det_id_str = f"detection-{s.detection_event_id}"

        add_event(
            TimelineEvent(
                id=det_id_str,
                event_type="SIGHTING_DETECTED",
                category="detection",
                title=f"AI Facial Match Detected on {cam_name}",
                description=f"Facial similarity score {s.similarity_score:.1f}% recorded{f' near {loc_name}' if loc_name else ''} (Quality: {s.quality_score:.1f}).",
                timestamp=s_dt,
                confidence=s.similarity_score,
                metadata={
                    "similarity_score": s.similarity_score,
                    "quality_score": s.quality_score,
                    "model_version": s.model_version,
                    "camera_name": cam_name,
                    "location_name": loc_name,
                },
                link=TimelineEventLink(
                    type="evidence",
                    label="View Sighting Crop",
                    sighting_id=str(s.id),
                    lat=lat,
                    lng=lng,
                    crop_image_path=s.crop_image_path,
                ),
            )
        )

        # Verification event if reviewed
        if s.reviewed_at and s.verification_status in ("Confirmed", "Rejected"):
            rev_dt = _normalize_dt(s.reviewed_at)
            actor_name = s.reviewer.full_name if s.reviewer else "Lead Investigator"
            is_confirmed = s.verification_status == "Confirmed"
            add_event(
                TimelineEvent(
                    id=f"verification-{s.id}",
                    event_type="EVIDENCE_VERIFIED" if is_confirmed else "EVIDENCE_REJECTED",
                    category="verification",
                    title=f"Evidence Lead {s.verification_status}: Sighting #{str(s.id)[:8]}",
                    description=(
                        f"Investigator {actor_name} verified lead as {s.verification_status}."
                        + (f' Notes: "{s.review_notes}"' if s.review_notes else "")
                    ),
                    timestamp=rev_dt,
                    actor=actor_name,
                    confidence=s.similarity_score,
                    severity="High" if is_confirmed else "Low",
                    metadata={
                        "verification_status": s.verification_status,
                        "review_notes": s.review_notes,
                        "sighting_id": str(s.id),
                    },
                    link=TimelineEventLink(
                        type="evidence",
                        label="View in Evidence Vault",
                        sighting_id=str(s.id),
                        crop_image_path=s.crop_image_path,
                    ),
                )
            )

    # 3. Direct Detection Events (if any not already covered by SightingEvidence)
    det_query = (
        select(DetectionEvent)
        .where(DetectionEvent.person_id == person.id)
        .options(
            selectinload(DetectionEvent.camera_feed).selectinload(CameraFeed.location),
        )
    )
    det_res = await db.execute(det_query)
    detections = det_res.scalars().all()

    for det in detections:
        if det.id in detection_seen_ids:
            continue
        det_dt = _normalize_dt(det.timestamp or det.created_at)
        cam_name = det.camera_feed.name if det.camera_feed else str(det.camera_id)[:8]
        loc_name = None
        lat = None
        lng = None
        if det.camera_feed and det.camera_feed.location:
            loc_name = det.camera_feed.location.name
            lat = det.camera_feed.location.latitude
            lng = det.camera_feed.location.longitude

        add_event(
            TimelineEvent(
                id=f"detection-{det.id}",
                event_type="SIGHTING_DETECTED",
                category="detection",
                title=f"AI Facial Match Detected on {cam_name}",
                description=f"Automated face recognition confidence {det.confidence_score:.1f}%{f' at {loc_name}' if loc_name else ''}.",
                timestamp=det_dt,
                confidence=det.confidence_score,
                metadata={
                    "confidence_score": det.confidence_score,
                    "camera_name": cam_name,
                    "location_name": loc_name,
                },
                link=TimelineEventLink(
                    type="evidence",
                    label="View Detection Frame",
                    camera_id=str(det.camera_id),
                    lat=lat,
                    lng=lng,
                    crop_image_path=det.image_path,
                ),
            )
        )

    # 4. Alerts and Unit Assignments
    alerts_query = (
        select(Alert)
        .where(Alert.missing_person_id == person.id)
        .options(
            selectinload(Alert.assignments).selectinload(Assignment.officer).selectinload(Officer.user),
            selectinload(Alert.assignments).selectinload(Assignment.dispatch_unit),
        )
    )
    alerts_res = await db.execute(alerts_query)
    alerts = alerts_res.scalars().all()
    alert_ids = {a.id for a in alerts}

    for alert in alerts:
        a_dt = _normalize_dt(alert.created_at)
        add_event(
            TimelineEvent(
                id=f"alert-triggered-{alert.id}",
                event_type="ALERT_TRIGGERED",
                category="dispatch",
                title=f"Tactical Alert Elevated ({alert.severity.upper()} SEVERITY)",
                description=f"Alert #{str(alert.id)[:8]} triggered across control network. Current status: {alert.status}.",
                timestamp=a_dt,
                severity=alert.severity,
                metadata={
                    "alert_id": str(alert.id),
                    "severity": alert.severity,
                    "status": alert.status,
                },
                link=TimelineEventLink(
                    type="alert",
                    label="Open Alert Record",
                    alert_id=str(alert.id),
                ),
            )
        )

        if alert.acknowledged_at:
            add_event(
                TimelineEvent(
                    id=f"alert-ack-{alert.id}",
                    event_type="ALERT_ACKNOWLEDGED",
                    category="dispatch",
                    title=f"Alert #{str(alert.id)[:8]} Acknowledged",
                    description="Central dispatch console acknowledged incident alert and mobilized local patrol units.",
                    timestamp=_normalize_dt(alert.acknowledged_at),
                    severity=alert.severity,
                    link=TimelineEventLink(
                        type="alert",
                        label="View Alert",
                        alert_id=str(alert.id),
                    ),
                )
            )

        if alert.resolved_at:
            add_event(
                TimelineEvent(
                    id=f"alert-resolved-{alert.id}",
                    event_type="CASE_RESOLVED",
                    category="dispatch",
                    title=f"Alert #{str(alert.id)[:8]} Resolved",
                    description="Incident status marked as resolved by field responding officers.",
                    timestamp=_normalize_dt(alert.resolved_at),
                    severity="Low",
                    link=TimelineEventLink(
                        type="alert",
                        label="View Alert",
                        alert_id=str(alert.id),
                    ),
                )
            )

        for asg in alert.assignments:
            asg_dt = _normalize_dt(asg.created_at)
            officer_name = (
                asg.officer.user.full_name
                if (asg.officer and asg.officer.user and asg.officer.user.full_name)
                else (f"Badge {asg.officer.badge_number}" if asg.officer else "Field Officer")
            )
            unit_name = asg.dispatch_unit.name if asg.dispatch_unit else "Patrol Unit"
            lat = asg.dispatch_unit.last_known_lat if asg.dispatch_unit else None
            lng = asg.dispatch_unit.last_known_lng if asg.dispatch_unit else None

            add_event(
                TimelineEvent(
                    id=f"assignment-{asg.id}",
                    event_type="UNIT_DISPATCHED",
                    category="dispatch",
                    title=f"Unit Dispatched: {unit_name}",
                    description=f"Officer {officer_name} dispatched to intercept coordinates. Status: {asg.status}.",
                    timestamp=asg_dt,
                    actor=officer_name,
                    metadata={
                        "assignment_id": str(asg.id),
                        "unit_name": unit_name,
                        "status": asg.status,
                    },
                    link=TimelineEventLink(
                        type="map",
                        label="View on Patrol Map",
                        alert_id=str(alert.id),
                        lat=lat,
                        lng=lng,
                    ),
                )
            )

    # 5. Activity Logs (Audit Trail Events)
    all_entity_ids = {person.id} | sighting_ids | alert_ids
    log_query = (
        select(ActivityLog)
        .where(
            (ActivityLog.entity_id.in_(all_entity_ids))
            | ((ActivityLog.entity_type == "MissingPerson") & (ActivityLog.entity_id == person.id))
        )
        .options(selectinload(ActivityLog.user))
    )
    log_res = await db.execute(log_query)
    logs = log_res.scalars().all()

    for log in logs:
        # Avoid duplicate case_created or lead_verified if already synthesized
        action = log.action or "AUDIT_LOG"
        if action == "CASE_REGISTERED":
            continue
        if action in ("LEAD_VERIFIED", "LEAD_REJECTED") and log.entity_id in sighting_ids:
            continue

        log_dt = _normalize_dt(log.created_at)
        actor_name = log.user.full_name if log.user else "System Console"
        parsed_details = {}
        if log.details:
            try:
                parsed_details = json.loads(log.details)
            except Exception:
                parsed_details = {"raw": log.details}

        # Check if video processed action
        event_type = "AUDIT_LOG"
        category_name = "audit"
        if "VIDEO" in action.upper():
            event_type = "VIDEO_PROCESSED"
            category_name = "detection"

        clean_title = action.replace("_", " ").title()
        add_event(
            TimelineEvent(
                id=f"audit-{log.id}",
                event_type=event_type,
                category=category_name,
                title=f"{clean_title} ({log.entity_type})",
                description=f"Action '{action}' recorded by {actor_name} on {log.entity_type} record.",
                timestamp=log_dt,
                actor=actor_name,
                metadata=parsed_details,
            )
        )

    # 6. Category Filtering
    events = raw_events
    if category and category.lower() != "all":
        events = [e for e in events if e.category.lower() == category.lower()]

    # 7. Chronological Sorting
    is_desc = order.lower() == "desc"
    events.sort(key=lambda e: _normalize_dt(e.timestamp), reverse=is_desc)

    return CaseTimelineResponse(
        case_id=str(person.id),
        case_number=person.case_number,
        full_name=person.full_name,
        total_events=len(events),
        events=events,
    )
