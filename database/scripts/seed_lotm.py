import asyncio
import uuid
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone
from PIL import Image, ImageDraw

from database.db.session import AsyncSessionLocal
from database.models.registry import MissingPerson

LOTM_CHARACTERS = [
    {
        'case_number': 'MP-LOTM-001',
        'full_name': 'Klein Moretti (Sherlock Moriarty)',
        'age': 24,
        'gender': 'Male',
        'identifying_marks': 'Black trench coat, silk top hat, silver pocket watch. Carries cane and revolver.',
        'last_seen_location': 'Backlund Bridge / Marine Promenade',
        'last_seen_date': datetime.now(timezone.utc) - timedelta(hours=4),
        'priority': 'Critical',
        'status': 'Reported',
        'photo_path': 'uploads/missing_persons/klein_moretti.jpg'
    },
    {
        'case_number': 'MP-LOTM-002',
        'full_name': 'Audrey Hall (Miss Justice)',
        'age': 19,
        'gender': 'Female',
        'identifying_marks': 'Blonde hair, emerald eyes, Backlund aristocratic gown. Accompanied by golden retriever (Susie).',
        'last_seen_location': 'Empress Borough / Bandra West',
        'last_seen_date': datetime.now(timezone.utc) - timedelta(hours=8),
        'priority': 'High',
        'status': 'Reported',
        'photo_path': 'uploads/missing_persons/audrey_hall.jpg'
    },
    {
        'case_number': 'MP-LOTM-003',
        'full_name': 'Leonard Mitchell (The Poet)',
        'age': 26,
        'gender': 'Male',
        'identifying_marks': 'Green eyes, loose unruly hair, prominent red gloves, Nighthawk longcoat.',
        'last_seen_location': 'Saint Selena Cathedral / CST Station',
        'last_seen_date': datetime.now(timezone.utc) - timedelta(hours=16),
        'priority': 'High',
        'status': 'Investigating',
        'photo_path': 'uploads/missing_persons/leonard_mitchell.jpg'
    },
    {
        'case_number': 'MP-LOTM-004',
        'full_name': 'Fors Wall (The Magician)',
        'age': 25,
        'gender': 'Female',
        'identifying_marks': 'Slender author, loose beige indoor coat, holding leather-bound notebook and tarot cards.',
        'last_seen_location': 'Prenton Street / Andheri Concourse',
        'last_seen_date': datetime.now(timezone.utc) - timedelta(days=1),
        'priority': 'Normal',
        'status': 'Reported',
        'photo_path': 'uploads/missing_persons/fors_wall.jpg'
    },
    {
        'case_number': 'MP-LOTM-005',
        'full_name': 'Derrick Berg (The Sun)',
        'age': 18,
        'gender': 'Male',
        'identifying_marks': 'Broad-shouldered youth, silver hair, heavy ceremonial axe strap, leather armor.',
        'last_seen_location': 'City of Silver Perimeter / Cubbon Bay',
        'last_seen_date': datetime.now(timezone.utc) - timedelta(days=2),
        'priority': 'Critical',
        'status': 'Reported',
        'photo_path': 'uploads/missing_persons/derrick_berg.jpg'
    }
]

def make_avatar(path: Path, title: str, subtitle: str, bg=(18, 24, 38), accent=(229, 169, 60)):
    path.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new('RGB', (480, 480), color=bg)
    draw = ImageDraw.Draw(img)
    draw.rectangle([(6, 6), (473, 473)], outline=accent, width=2)
    draw.ellipse([(140, 90), (340, 290)], outline=(148, 163, 184), width=3)
    draw.arc([(100, 300), (380, 460)], start=0, end=180, fill=(148, 163, 184), width=3)
    draw.text((24, 24), 'GARUDA A.S.T.R.A // TARGET PROFILE', fill=(148, 163, 184))
    draw.text((24, 400), title.upper(), fill=(255, 255, 255))
    draw.text((24, 425), subtitle, fill=accent)
    img.save(path, quality=90)

async def seed():
    uploads_dir = Path('services/backend/uploads/missing_persons')
    uploads_dir.mkdir(parents=True, exist_ok=True)
    async with AsyncSessionLocal() as db:
        for p in LOTM_CHARACTERS:
            img_path = Path('services/backend') / p['photo_path']
            make_avatar(img_path, p['full_name'], f"{p['case_number']} // PRIORITY {p['priority']}")
            mp = MissingPerson(
                id=uuid.uuid4(),
                case_number=p['case_number'],
                full_name=p['full_name'],
                age=p['age'],
                gender=p['gender'],
                description=p['identifying_marks'],
                last_seen_location=p['last_seen_location'],
                last_seen_at=p['last_seen_date'],
                priority=p['priority'],
                status=p['status'],
                photo_path=p['photo_path'],
            )
            db.add(mp)
        await db.commit()
        print('LOTM Missing Persons Seeded Successfully!')

if __name__ == '__main__':
    asyncio.run(seed())
