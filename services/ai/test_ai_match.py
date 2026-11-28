"""
Standalone AI Model Tester for Garuda A.S.T.R.A
-----------------------------------------------
Tests face detection, cropping, AdaFace embedding generation, and cosine similarity
directly against a reference photo and a recorded video (or live RTSP stream)
without requiring FastAPI, PostgreSQL, or the web dashboard.

Usage:
  python -m services.ai.test_ai_match --photo path/to/face.jpg --video path/to/video.mp4
  python -m services.ai.test_ai_match --photo path/to/face.jpg --rtsp rtsp://user:pass@ip:554/stream --max-frames 200
"""

import argparse
import os
import sys
from pathlib import Path

# Ensure repo root is on sys.path when invoked directly
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

import cv2
from services.ai.detection.face_cropper import FaceCropper
from services.ai.detection.face_detection import FaceDetector
from services.ai.detection.preprocessing import Preprocessor
from services.ai.pipeline import run_analysis_pipeline
from services.ai.recognition.embedding_service import generate_embedding
from services.ai.recognition.similarity_service import calculate_cosine_similarity


def _format_confidence(similarity: float) -> float:
    pct = similarity * 100.0
    if pct < 40.0 and similarity > 0:
        pct = min(pct + 30.0, 100.0)
    return max(0.0, min(100.0, pct))


def test_recorded_video(photo_emb: list, video_path: str, crops_dir: str, threshold: float) -> list[dict]:
    os.makedirs(crops_dir, exist_ok=True)
    print(f"\n[2/3] Running video pipeline on: {video_path}")
    results = run_analysis_pipeline(
        video_path=video_path,
        video_id="standalone_test",
        crops_dir=crops_dir,
        progress_callback=lambda p: print(f"  Progress: {p:.0f}%", end="\r", flush=True),
        save_crops=True,
    )
    print()

    scored = []
    for idx, res in enumerate(results, start=1):
        emb = res.get("embedding")
        if not emb:
            continue
        sim = float(calculate_cosine_similarity(photo_emb, emb))
        scored.append({
            "idx": idx,
            "frame_idx": res.get("frame_idx", 0),
            "similarity": sim,
            "confidence_pct": _format_confidence(sim),
            "matched": sim >= threshold,
            "crop_path": res.get("crop_path", ""),
        })
    scored.sort(key=lambda r: r["similarity"], reverse=True)
    return scored


def test_rtsp_stream(photo_emb: list, rtsp_url: str, crops_dir: str, threshold: float, max_frames: int, frame_step: int) -> list[dict]:
    os.makedirs(crops_dir, exist_ok=True)
    print(f"\n[2/3] Connecting to RTSP stream: {rtsp_url}")
    cap = cv2.VideoCapture(rtsp_url)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open RTSP stream: {rtsp_url}")

    scored = []
    frame_idx = 0
    crop_counter = 0
    try:
        while frame_idx < max_frames:
            ok, frame = cap.read()
            if not ok or frame is None:
                break
            if frame_idx % frame_step == 0:
                faces = FaceDetector.detect_faces(frame)
                for f_idx, face in enumerate(faces):
                    crop = FaceCropper.crop_face(frame, face["facial_area"])
                    if crop is None or crop.size == 0:
                        continue
                    pre_bytes = Preprocessor.preprocess_face(crop)
                    if not pre_bytes:
                        continue
                    emb = generate_embedding(pre_bytes)
                    if not emb:
                        continue
                    crop_counter += 1
                    crop_path = os.path.join(crops_dir, f"rtsp_frame_{frame_idx}_face_{f_idx}.jpg")
                    with open(crop_path, "wb") as out:
                        out.write(pre_bytes)
                    sim = float(calculate_cosine_similarity(photo_emb, emb))
                    item = {
                        "idx": crop_counter,
                        "frame_idx": frame_idx,
                        "similarity": sim,
                        "confidence_pct": _format_confidence(sim),
                        "matched": sim >= threshold,
                        "crop_path": crop_path,
                    }
                    scored.append(item)
                    status = "MATCH" if item["matched"] else "no-match"
                    print(f"  [Frame {frame_idx}] Face #{f_idx}: sim={sim:.4f} ({item['confidence_pct']:.1f}%) [{status}]")
            frame_idx += 1
    finally:
        cap.release()

    scored.sort(key=lambda r: r["similarity"], reverse=True)
    return scored


def main():
    parser = argparse.ArgumentParser(description="Standalone Garuda A.S.T.R.A AI Face Match Tester")
    parser.add_argument("--photo", required=True, help="Path to reference missing person photo")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--video", help="Path to recorded CCTV video file")
    group.add_argument("--rtsp", help="Live RTSP stream URL (for Phase 3+ live camera testing)")
    parser.add_argument("--threshold", type=float, default=0.30, help="Cosine similarity match threshold (default: 0.30)")
    parser.add_argument("--save-crops", default="tmp_ai_test_crops", help="Directory to save extracted face crops")
    parser.add_argument("--max-frames", type=int, default=300, help="Max frames to read in --rtsp mode (default: 300)")
    parser.add_argument("--frame-step", type=int, default=10, help="Process every Nth frame in --rtsp mode (default: 10)")
    args = parser.parse_args()

    if not os.path.exists(args.photo):
        print(f"ERROR: Reference photo not found: {args.photo}", file=sys.stderr)
        sys.exit(1)

    print(f"[1/3] Generating reference embedding from: {args.photo}")
    photo_bytes = Path(args.photo).read_bytes()
    photo_emb = generate_embedding(photo_bytes)
    if not photo_emb:
        print("ERROR: Could not detect/embed a face in the reference photo.", file=sys.stderr)
        sys.exit(1)
    print(f"  Reference embedding ready (dim={len(photo_emb)}).")

    if args.video:
        if not os.path.exists(args.video):
            print(f"ERROR: Video file not found: {args.video}", file=sys.stderr)
            sys.exit(1)
        scored = test_recorded_video(photo_emb, args.video, args.save_crops, args.threshold)
    else:
        scored = test_rtsp_stream(photo_emb, args.rtsp, args.save_crops, args.threshold, args.max_frames, args.frame_step)

    print(f"\n[3/3] Results (threshold = {args.threshold:.2f}, sorted by similarity):")
    print("-" * 92)
    print(f"{'Rank':<5} {'Frame':<8} {'Cosine Sim':<12} {'UI Score':<10} {'Status':<10} {'Crop Path'}")
    print("-" * 92)
    matches_count = 0
    for rank, r in enumerate(scored, start=1):
        status = "MATCH" if r["matched"] else "NO MATCH"
        if r["matched"]:
            matches_count += 1
        print(f"{rank:<5} {r['frame_idx']:<8} {r['similarity']:<12.4f} {r['confidence_pct']:<9.1f}% {status:<10} {r['crop_path']}")
    print("-" * 92)
    print(f"Total face crops evaluated: {len(scored)} | Matches (>= {args.threshold:.2f}): {matches_count}")


if __name__ == "__main__":
    main()
