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

# Initialize AdaFace model & InsightFace 5-point aligner globally to keep them in memory
adaface_model = None
adaface_load_error = None
face_aligner_app = None


def init_face_aligner():
    global face_aligner_app
    if face_aligner_app is not None:
        return
    try:
        from insightface.app import FaceAnalysis
        app = FaceAnalysis(
            name="buffalo_l",
            allowed_modules=["detection"],
            providers=["CPUExecutionProvider"],
        )
        app.prepare(ctx_id=-1, det_size=(320, 320), det_thresh=0.3)
        face_aligner_app = app
        logger.info("InsightFace 5-point landmark aligner (det_10g) initialized.")
    except Exception as e:
        logger.warning(f"InsightFace aligner unavailable, falling back to unaligned crop: {e}")
        face_aligner_app = None

def init_adaface_model():
    global adaface_model, adaface_load_error
    try:
        import transformers
        # Patch for older custom models missing all_tied_weights_keys in newer transformers versions
        if not hasattr(transformers.PreTrainedModel, 'all_tied_weights_keys'):
            transformers.PreTrainedModel.all_tied_weights_keys = property(lambda self: {})
            
        current_dir = os.path.dirname(os.path.abspath(__file__))
        local_model_path = os.path.abspath(os.path.join(current_dir, "..", "models", "cvlface_adaface_ir50_ms1mv2"))
        
        # Ensure the models folder exists
        os.makedirs(os.path.dirname(local_model_path), exist_ok=True)
        
        if os.path.exists(local_model_path) and os.path.isdir(local_model_path) and any(os.scandir(local_model_path)):
            # Robustness: Check for double-nested directories (e.g., extracted zip)
            if not os.path.exists(os.path.join(local_model_path, "config.json")):
                inner_path = os.path.join(local_model_path, "cvlface_adaface_ir50_ms1mv2")
                if os.path.exists(os.path.join(inner_path, "config.json")):
                    local_model_path = inner_path
                else:
                    for d in os.scandir(local_model_path):
                        if d.is_dir() and os.path.exists(os.path.join(d.path, "config.json")):
                            local_model_path = d.path
                            break
            
            # Robustness: Check for Git LFS pointer issues (file too small)
            safetensors_path = os.path.join(local_model_path, "model.safetensors")
            if os.path.exists(safetensors_path) and os.path.getsize(safetensors_path) < 1000:
                raise ValueError("model.safetensors is a Git LFS pointer file (too small), not the actual weights.")
                
            logger.info(f"Loading AdaFace Model from local directory: {local_model_path}")
            if local_model_path not in sys.path:
                sys.path.insert(0, local_model_path) # Insert at front to avoid module collisions
                
            # The author of this model hardcoded relative paths like open('pretrained_model/model.yaml')
            # We must temporarily change the working directory to the model directory.
            original_cwd = os.getcwd()
            try:
                os.chdir(local_model_path)
                import yaml
                from omegaconf import OmegaConf
                from models import get_model
                with open('pretrained_model/model.yaml', 'r') as yf:
                    model_conf = OmegaConf.create(dict(yaml.safe_load(yf)))
                adaface_model = get_model(model_conf)
                adaface_model.load_state_dict_from_path('pretrained_model/model.pt')
            finally:
                os.chdir(original_cwd)

            if torch.cuda.is_available() and os.environ.get("GARUDA_PROCESSING_ENGINE", "").lower() != "cpu":
                adaface_model = adaface_model.to("cuda")
            adaface_model.eval()
            logger.info("AdaFace model loaded successfully from local directory.")
            adaface_load_error = None
        else:
            logger.info("Downloading & Initializing AdaFace Model (IR50) from Hugging Face...")
            try:
                model_dir = snapshot_download("minchul/cvlface_adaface_ir50_ms1mv2", local_files_only=True)
            except Exception:
                model_dir = snapshot_download("minchul/cvlface_adaface_ir50_ms1mv2")
            if model_dir not in sys.path:
                sys.path.insert(0, model_dir)
                
            original_cwd = os.getcwd()
            try:
                os.chdir(model_dir)
                import yaml
                from omegaconf import OmegaConf
                from models import get_model
                with open('pretrained_model/model.yaml', 'r') as yf:
                    model_conf = OmegaConf.create(dict(yaml.safe_load(yf)))
                adaface_model = get_model(model_conf)
                adaface_model.load_state_dict_from_path('pretrained_model/model.pt')
            finally:
                os.chdir(original_cwd)

            if torch.cuda.is_available() and os.environ.get("GARUDA_PROCESSING_ENGINE", "").lower() != "cpu":
                adaface_model = adaface_model.to("cuda")
            adaface_model.eval()
            logger.info("AdaFace model downloaded and loaded successfully.")
            adaface_load_error = None
    except Exception as e:
        # Format for syslog so it doesn't get split
        err_msg = str(e).replace('\n', ' | ')
        adaface_load_error = err_msg
        logger.error(f"Failed to load AdaFace model: {err_msg}", exc_info=True)
        adaface_model = None

# Initialize on module import
init_adaface_model()
init_face_aligner()

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
        aligned_112 = None

        # Prefer 5-point landmark similarity alignment (ArcFace/AdaFace canonical 112x112 template)
        if face_aligner_app is not None:
            try:
                from insightface.utils import face_align
                # Add border padding so RetinaFace (det_10g) detects landmarks even on tight face crops
                pad = 40 if max(h, w) < 300 else 0
                probe = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0, 0, 0)) if pad else img
                det_faces = face_aligner_app.get(probe)
                if det_faces:
                    best_face = max(det_faces, key=lambda x: x.det_score)
                    aligned_112 = face_align.norm_crop(probe, best_face.kps, image_size=112)
            except Exception as align_err:
                logger.debug(f"5-point alignment fallback: {align_err}")

        if aligned_112 is not None:
            img_resized = aligned_112
            face_size = f"{w}x{h} (5pt-aligned)"
            gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
            blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        else:
            # Fallback: if the image is large (e.g. a raw passport photo upload), run detection and crop first
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
        model_device = next(adaface_model.parameters()).device
        tensor = torch.tensor(img_tensor).unsqueeze(0).to(model_device)
        
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
