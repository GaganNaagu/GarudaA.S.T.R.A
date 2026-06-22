import os
import cv2
import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from database.db.session import SessionLocal
from database.models.infrastructure import VideoFootage
from services.ai.detection.face_detection import FaceDetector

logger = logging.getLogger(__name__)

# Base path for saving crops
CROPS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "backend", "uploads", "crops")

def process_video_task(video_id: str):
    """
    Background task to process a video, extract frames, detect faces,
    crop them, and save to disk for future recognition.
    """
    db: Session = SessionLocal()
    try:
        # Fetch the video record
        video = db.query(VideoFootage).filter(VideoFootage.id == uuid.UUID(video_id)).first()
        if not video:
            logger.error(f"VideoFootage {video_id} not found in database.")
            return

        # Ensure crops directory exists
        video_crops_dir = os.path.join(CROPS_DIR, str(video.id))
        os.makedirs(video_crops_dir, exist_ok=True)

        video_path = video.file_path
        if not os.path.exists(video_path):
            logger.error(f"Video file not found on disk: {video_path}")
            video.status = "ERROR"
            db.commit()
            return

        # Start processing
        video.status = "PROCESSING"
        db.commit()
        
        logger.info(f"Starting background processing for video {video_id} at {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"Failed to open video file {video_path}")
            video.status = "ERROR"
            db.commit()
            return

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 30.0

        # Process approx 2 frames per second
        frame_interval = max(1, int(fps / 2))
        
        frame_count = 0
        saved_crops = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break # End of video

            # Only process every Nth frame
            if frame_count % frame_interval == 0:
                # Detect faces
                faces = FaceDetector.detect_faces(frame, threshold=0.35)
                
                for face_idx, face in enumerate(faces):
                    x1, y1, x2, y2 = face["facial_area"]
                    
                    # Ensure coordinates are within image bounds
                    h, w = frame.shape[:2]
                    x1 = max(0, x1)
                    y1 = max(0, y1)
                    x2 = min(w, x2)
                    y2 = min(h, y2)
                    
                    # Crop the face
                    if x2 > x1 and y2 > y1:
                        crop_img = frame[y1:y2, x1:x2]
                        
                        # Only save if crop is reasonably sized
                        if crop_img.shape[0] >= 30 and crop_img.shape[1] >= 30:
                            crop_filename = f"frame_{frame_count}_face_{face_idx}.jpg"
                            crop_path = os.path.join(video_crops_dir, crop_filename)
                            cv2.imwrite(crop_path, crop_img)
                            saved_crops += 1

            frame_count += 1

        cap.release()
        
        # Mark as completed
        video.status = "COMPLETED"
        db.commit()
        logger.info(f"Finished processing video {video_id}. Saved {saved_crops} facial crops.")

    except Exception as e:
        logger.error(f"Error processing video {video_id}: {e}")
        try:
            video = db.query(VideoFootage).filter(VideoFootage.id == uuid.UUID(video_id)).first()
            if video:
                video.status = "ERROR"
                db.commit()
        except:
            pass
    finally:
        db.close()
