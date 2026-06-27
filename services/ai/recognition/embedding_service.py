import logging
import cv2
import sys
import numpy as np
import torch
from typing import List, Optional
from transformers import AutoModel
from huggingface_hub import snapshot_download

logger = logging.getLogger(__name__)

import os

# Initialize AdaFace model globally to keep it in memory
adaface_model = None
adaface_load_error = None

def init_adaface_model():
    global adaface_model, adaface_load_error
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        local_model_path = os.path.abspath(os.path.join(current_dir, "..", "models", "cvlface_adaface_ir50_ms1mv2"))
        
        # Ensure the models folder exists
        os.makedirs(os.path.dirname(local_model_path), exist_ok=True)
        
        if os.path.exists(local_model_path) and os.path.isdir(local_model_path) and any(os.scandir(local_model_path)):
            logger.info(f"Loading AdaFace Model from local directory: {local_model_path}")
            if local_model_path not in sys.path:
                sys.path.append(local_model_path)
            adaface_model = AutoModel.from_pretrained(
                local_model_path, 
                trust_remote_code=True,
                local_files_only=True
            )
            adaface_model.eval()
            logger.info("AdaFace model loaded successfully from local directory.")
            adaface_load_error = None
        else:
            logger.info("Downloading & Initializing AdaFace Model (IR50) from Hugging Face...")
            model_dir = snapshot_download("minchul/cvlface_adaface_ir50_ms1mv2")
            if model_dir not in sys.path:
                sys.path.append(model_dir)
                
            adaface_model = AutoModel.from_pretrained(
                "minchul/cvlface_adaface_ir50_ms1mv2", 
                trust_remote_code=True
            )
            adaface_model.eval()
            logger.info("AdaFace model downloaded and loaded successfully.")
            adaface_load_error = None
    except Exception as e:
        adaface_load_error = e
        logger.error(f"Failed to load AdaFace model: {e}", exc_info=True)
        adaface_model = None

# Initialize on module import
init_adaface_model()

def generate_embedding(image_bytes: bytes) -> Optional[List[float]]:
    """
    Extracts the 512-dimensional facial embedding using AdaFace (CVLFace).
    Automatically detects and crops the face first if the input is a large raw photo (e.g. passport upload).
    
    Args:
        image_bytes: Raw bytes of the face image.
        
    Returns:
        A list of floats representing the embedding, or None if extraction fails.
    """
    global adaface_model, adaface_load_error
    
    if adaface_model is None:
        logger.error(f"AdaFace model is not initialized. Previous load error: {adaface_load_error}")
        # Attempt to retry loading the model
        logger.info("Attempting to re-initialize AdaFace model...")
        init_adaface_model()
        if adaface_model is None:
            logger.error(f"AdaFace model re-initialization failed. Error: {adaface_load_error}")
            return None

    try:
        # Convert bytes to cv2 image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None or img.size == 0: 
            return None
            
        h, w = img.shape[:2]
        
        # If the image is large (e.g. a raw passport photo upload), run detection and crop first
        if w > 150 or h > 150:
            from services.ai.detection.face_detection import FaceDetector
            from services.ai.detection.face_cropper import FaceCropper
            FaceDetector._initialize_model()
            faces = FaceDetector.detect_faces(img)
            if faces:
                cropped = FaceCropper.crop_face(img, faces[0]["facial_area"])
                if cropped is not None and cropped.size > 0:
                    img = cropped
                    h, w = img.shape[:2]
        
        face_size = f"{w}x{h}"
        
        # Calculate blur score defensively (check if image is already grayscale)
        if len(img.shape) == 2:
            gray = img
        else:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
        blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        
        # Resize to 112x112 (AdaFace standard input size)
        img_resized = cv2.resize(img, (112, 112))
        
        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
        
        # Normalize to [-1, 1] range: (pixel - 127.5) / 128.0
        img_normalized = (img_rgb.astype(np.float32) - 127.5) / 128.0
        
        # Transpose to (channels, height, width) -> (3, 112, 112)
        img_tensor = img_normalized.transpose(2, 0, 1)
        
        # Convert to tensor and add batch dimension -> (1, 3, 112, 112)
        tensor = torch.tensor(img_tensor).unsqueeze(0)
        
        with torch.no_grad():
            output = adaface_model(tensor)
            
            if isinstance(output, dict):
                features = output.get("embeddings") or output.get("features")
            else:
                features = output
                
            if features is None:
                logger.warning(f"AdaFace Diagnostics (FAIL): Face Size: {face_size}, Blur Score: {blur_score:.2f}, Model output did not contain features")
                return None
                
            # Flatten features to 512 floats
            embedding = features.cpu().numpy().flatten().tolist()
            
            logger.info(f"AdaFace Diagnostics: Face Size: {face_size}, Blur Score: {blur_score:.2f}, Embedding Found: True")
            return embedding
        
    except Exception as e:
        logger.error(f"Error during AdaFace embedding generation: {e}")
        return None
