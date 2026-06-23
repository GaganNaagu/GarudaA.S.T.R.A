import cv2
import sys
import os
import time

# Add 'services/ai' and the root workspace directory to sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
ai_dir = os.path.abspath(os.path.join(script_dir, '..'))
root_dir = os.path.abspath(os.path.join(ai_dir, '..', '..'))

if ai_dir not in sys.path:
    sys.path.insert(0, ai_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Suppress TensorFlow logging warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

from detection.video_service import VideoService
from detection.frame_extractor import FrameExtractor
from detection.face_detection import FaceDetector
from detection.face_cropper import FaceCropper
from detection.preprocessing import Preprocessor
from services.ai.recognition.embedding_service import generate_embedding
from services.ai.recognition.ranking_service import get_best_match
from services.ai.recognition.identity_manager import load_identities

def run_pipeline(video_path: str, start_frame: int = 0):
    # Support webcam index by converting to int if possible
    try:
        source = int(video_path)
    except ValueError:
        source = video_path

    if isinstance(source, str) and not os.path.exists(source):
        print(f"Error: Video file not found at {source}")
        return

    print(f"--- 1. Analyzing Video ---")
    props = VideoService.get_video_properties(source)
    print(f"Properties: {props}")

    print(f"\n--- 2. Extracting Frames (Skip=5, Start={start_frame}) ---")
    frame_gen = FrameExtractor.extract_frames(source, skip_interval=5, start_frame=start_frame)
    
    # Load registered identities from JSON storage
    print("\n--- Loading Registered Identities ---")
    identities_dict = load_identities()
    database = []
    for person_id, info in identities_dict.items():
        database.append({
            "id": info["name"],  # Use name directly as the display identifier
            "embedding": info["embedding"]
        })
    print(f"Loaded {len(database)} registered identity/identities.")
    
    start_time = time.time()
    
    print("\nPress 'q' in the video window to stop the demo.")
    
    window_name = "Garuda A.S.T.R.A - Detection & Recognition Pipeline Demo"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
    
    total_frames_str = str(props.get("frame_count", "?")) if props else "?"
    
    for frame, idx in frame_gen:
        # Create a copy of the frame to draw on
        display_frame = frame.copy()
        
        # 3. Face Detection
        faces = FaceDetector.detect_faces(frame, threshold=0.30)
        
        elapsed = time.time() - start_time
        info_text = f"Frame: {idx} / {total_frames_str} | Faces: {len(faces)} | Time: {elapsed:.1f}s"
        
        # Position on top right
        text_size = cv2.getTextSize(info_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
        text_x = max(20, display_frame.shape[1] - text_size[0] - 20)
        
        # Add a black background rectangle for text readability
        cv2.rectangle(display_frame, (text_x - 10, 15), (text_x + text_size[0] + 10, 55), (0, 0, 0), -1)
        cv2.putText(display_frame, info_text, (text_x, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        
        for i, face in enumerate(faces):
            area = face["facial_area"]
            score = face["score"]
            
            # 4. Cropping
            crop = FaceCropper.crop_face(frame, area)
            
            # Show the raw crop in its own tiny window
            if crop is not None and crop.size > 0:
                if i < 5:  # Limit to 5 crop windows to avoid spam
                    cv2.imshow(f"Crop {i+1}", crop)
            
            # 5. Preprocessing (raw crop, no resizing)
            text = f"Unknown ({score:.2f})"
            box_color = (0, 0, 255)  # Red (Unknown)
            
            if crop is not None and crop.size > 0:
                jpeg_bytes = Preprocessor.preprocess_face(crop)
                
                if jpeg_bytes:
                    # 6. Recognition Integration
                    emb = generate_embedding(jpeg_bytes)
                    if emb:
                        match_found, matched_name, conf = get_best_match(emb, database)
                        if match_found:
                            text = f"{matched_name} ({conf:.2f})"
                            box_color = (0, 255, 0)  # Green (Matched)
            
            # Draw bounding box and label on the display frame
            cv2.rectangle(display_frame, (area[0], area[1]), (area[2], area[3]), box_color, 2)
            cv2.putText(display_frame, text, (area[0], max(0, area[1] - 10)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, box_color, 2)
            
        # Clean up extra crop windows if faces disappear
        for j in range(len(faces), 5):
            try:
                cv2.destroyWindow(f"Crop {j+1}")
            except cv2.error:
                pass
        
        # Display the frame with bounding boxes
        cv2.imshow(window_name, display_frame)

        
        # Wait 1ms and check if user pressed 'q' to quit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("\nDemo stopped by user.")
            break
            
    # Cleanup OpenCV windows
    cv2.destroyAllWindows()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python demo_pipeline.py <path_to_video.mp4> [start_frame_index]")
    else:
        start_idx = int(sys.argv[2]) if len(sys.argv) >= 3 else 0
        run_pipeline(sys.argv[1], start_frame=start_idx)
