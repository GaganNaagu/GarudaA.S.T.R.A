"""
Standalone AI Inspector GUI for Garuda A.S.T.R.A
------------------------------------------------
Visual desktop tool (Tkinter + Pillow) to inspect the AI pipeline directly
without FastAPI, PostgreSQL, or the web dashboard:
  - Left pane: Reference photo + live AdaFace 512-dim embedding generation & status
  - Right pane: Recorded video (or future RTSP stream) + live face crop comparison grid

Usage:
  python -m services.ai.test_ai_gui
"""

import os
import queue
import sys
import threading
import time
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk
from PIL import Image, ImageTk

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

BG_DARK = "#0b1120"
BG_CARD = "#131c31"
BG_INPUT = "#1b2640"
FG_TEXT = "#e2e8f0"
FG_MUTED = "#94a3b8"
ACCENT_GOLD = "#eab308"
ACCENT_GREEN = "#22c55e"
ACCENT_RED = "#ef4444"
BORDER_COLOR = "#263354"


def _format_confidence(similarity: float) -> float:
    pct = similarity * 100.0
    if pct < 40.0 and similarity > 0:
        pct = min(pct + 30.0, 100.0)
    return max(0.0, min(100.0, pct))


class AIInspectorApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("GARUDA A.S.T.R.A — Standalone AI Model Inspector")
        self.root.geometry("1220x780")
        self.root.configure(bg=BG_DARK)

        self.ui_queue: queue.Queue = queue.Queue()
        self.photo_path: str | None = None
        self.video_path: str | None = None
        self.ref_embedding: list | None = None
        self.ref_photo_tk = None
        self.crop_images_tk: list = []
        self.scored_results: list[dict] = []
        self.is_running = False

        self.threshold_var = tk.DoubleVar(value=0.30)
        self.source_mode_var = tk.StringVar(value="video")
        self.rtsp_url_var = tk.StringVar(value="rtsp://")
        self.max_frames_var = tk.IntVar(value=200)

        self._configure_styles()
        self._build_ui()
        self._poll_queue()

    def _configure_styles(self):
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TProgressbar", troughcolor=BG_INPUT, background=ACCENT_GOLD, bordercolor=BORDER_COLOR, lightcolor=ACCENT_GOLD, darkcolor=ACCENT_GOLD)

    def _build_ui(self):
        # Top Header
        header = tk.Frame(self.root, bg=BG_CARD, height=54, highlightbackground=BORDER_COLOR, highlightthickness=1)
        header.pack(fill=tk.X, side=tk.TOP)
        tk.Label(
            header,
            text="GARUDA A.S.T.R.A  //  STANDALONE AI MODEL INSPECTOR",
            bg=BG_CARD,
            fg=ACCENT_GOLD,
            font=("Consolas", 13, "bold"),
            padx=16,
            pady=12,
        ).pack(side=tk.LEFT)
        tk.Label(
            header,
            text="Direct YOLO + AdaFace Pipeline (No Backend / No DB Required)",
            bg=BG_CARD,
            fg=FG_MUTED,
            font=("Segoe UI", 10),
            padx=16,
        ).pack(side=tk.RIGHT)

        # Main 2-column body
        body = tk.Frame(self.root, bg=BG_DARK)
        body.pack(fill=tk.BOTH, expand=True, padx=14, pady=14)

        # ---------------- LEFT PANE: REFERENCE PHOTO & EMBEDDING ----------------
        left = tk.Frame(body, bg=BG_CARD, width=370, highlightbackground=BORDER_COLOR, highlightthickness=1)
        left.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 12))
        left.pack_propagate(False)

        tk.Label(left, text="1. REFERENCE MISSING PERSON", bg=BG_CARD, fg=ACCENT_GOLD, font=("Consolas", 11, "bold")).pack(anchor="w", padx=14, pady=(14, 8))

        tk.Button(
            left,
            text="Select Reference Photo...",
            command=self._pick_photo,
            bg=BG_INPUT,
            fg=FG_TEXT,
            activebackground=BORDER_COLOR,
            activeforeground=FG_TEXT,
            relief=tk.FLAT,
            font=("Segoe UI", 10, "bold"),
            pady=7,
            cursor="hand2",
        ).pack(fill=tk.X, padx=14)

        self.photo_name_lbl = tk.Label(left, text="No photo selected", bg=BG_CARD, fg=FG_MUTED, font=("Segoe UI", 9), wraplength=330)
        self.photo_name_lbl.pack(anchor="w", padx=14, pady=(6, 10))

        # Photo preview box
        preview_box = tk.Frame(left, bg=BG_DARK, width=250, height=250, highlightbackground=BORDER_COLOR, highlightthickness=1)
        preview_box.pack(padx=14, pady=4)
        preview_box.pack_propagate(False)
        self.photo_preview_lbl = tk.Label(preview_box, text="Reference Preview", bg=BG_DARK, fg=FG_MUTED, font=("Segoe UI", 10))
        self.photo_preview_lbl.pack(expand=True, fill=tk.BOTH)

        # Embedding status & progress
        tk.Label(left, text="REFERENCE EMBEDDING STATUS", bg=BG_CARD, fg=FG_MUTED, font=("Consolas", 9, "bold")).pack(anchor="w", padx=14, pady=(16, 4))

        self.emb_status_lbl = tk.Label(left, text="Waiting for reference photo...", bg=BG_CARD, fg=FG_MUTED, font=("Segoe UI", 10, "bold"))
        self.emb_status_lbl.pack(anchor="w", padx=14)

        self.emb_progress = ttk.Progressbar(left, mode="indeterminate", length=330)
        self.emb_progress.pack(fill=tk.X, padx=14, pady=(6, 10))

        self.emb_details_box = tk.Text(
            left,
            height=9,
            bg=BG_DARK,
            fg=FG_TEXT,
            font=("Consolas", 9),
            relief=tk.FLAT,
            highlightbackground=BORDER_COLOR,
            highlightthickness=1,
            padx=8,
            pady=8,
            state=tk.DISABLED,
        )
        self.emb_details_box.pack(fill=tk.BOTH, expand=True, padx=14, pady=(0, 14))

        # ---------------- RIGHT PANE: VIDEO / RTSP & LIVE CROP COMPARISON ----------------
        right = tk.Frame(body, bg=BG_CARD, highlightbackground=BORDER_COLOR, highlightthickness=1)
        right.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        top_ctrl = tk.Frame(right, bg=BG_CARD)
        top_ctrl.pack(fill=tk.X, padx=14, pady=(14, 8))

        tk.Label(top_ctrl, text="2. CCTV VIDEO / RTSP & LIVE CROP COMPARISON", bg=BG_CARD, fg=ACCENT_GOLD, font=("Consolas", 11, "bold")).pack(anchor="w")

        # Source selection row
        src_row = tk.Frame(right, bg=BG_CARD)
        src_row.pack(fill=tk.X, padx=14, pady=4)

        tk.Radiobutton(
            src_row, text="Recorded Video", variable=self.source_mode_var, value="video",
            command=self._toggle_source_mode, bg=BG_CARD, fg=FG_TEXT, selectcolor=BG_DARK,
            activebackground=BG_CARD, activeforeground=FG_TEXT, font=("Segoe UI", 9, "bold")
        ).pack(side=tk.LEFT)

        tk.Radiobutton(
            src_row, text="Live RTSP Stream", variable=self.source_mode_var, value="rtsp",
            command=self._toggle_source_mode, bg=BG_CARD, fg=FG_TEXT, selectcolor=BG_DARK,
            activebackground=BG_CARD, activeforeground=FG_TEXT, font=("Segoe UI", 9, "bold")
        ).pack(side=tk.LEFT, padx=(12, 16))

        self.video_btn = tk.Button(
            src_row, text="Select Video File...", command=self._pick_video,
            bg=BG_INPUT, fg=FG_TEXT, relief=tk.FLAT, padx=12, pady=5, cursor="hand2", font=("Segoe UI", 9, "bold")
        )
        self.video_btn.pack(side=tk.LEFT)

        self.video_name_lbl = tk.Label(src_row, text="No video selected", bg=BG_CARD, fg=FG_MUTED, font=("Segoe UI", 9))
        self.video_name_lbl.pack(side=tk.LEFT, padx=10)

        self.rtsp_entry = tk.Entry(src_row, textvariable=self.rtsp_url_var, bg=BG_INPUT, fg=FG_TEXT, insertbackground=FG_TEXT, relief=tk.FLAT, width=38, font=("Consolas", 9))

        # Action & Threshold row
        act_row = tk.Frame(right, bg=BG_CARD)
        act_row.pack(fill=tk.X, padx=14, pady=(6, 8))

        tk.Label(act_row, text="Match Threshold:", bg=BG_CARD, fg=FG_MUTED, font=("Segoe UI", 9)).pack(side=tk.LEFT)
        self.thresh_lbl = tk.Label(act_row, text="0.30", bg=BG_CARD, fg=ACCENT_GOLD, font=("Consolas", 10, "bold"), width=5)
        self.thresh_lbl.pack(side=tk.LEFT)

        tk.Scale(
            act_row, from_=0.10, to=0.90, resolution=0.05, orient=tk.HORIZONTAL,
            variable=self.threshold_var, command=self._on_threshold_change,
            bg=BG_CARD, fg=FG_TEXT, troughcolor=BG_INPUT, highlightthickness=0, showvalue=False, length=160
        ).pack(side=tk.LEFT, padx=(4, 16))

        self.run_btn = tk.Button(
            act_row,
            text="▶ Run AI Comparison",
            command=self._start_analysis,
            bg=ACCENT_GOLD,
            fg="#000000",
            activebackground="#ca8a04",
            relief=tk.FLAT,
            font=("Segoe UI", 10, "bold"),
            padx=16,
            pady=6,
            cursor="hand2",
        )
        self.run_btn.pack(side=tk.RIGHT)

        # Video Progress Bar
        prog_row = tk.Frame(right, bg=BG_CARD)
        prog_row.pack(fill=tk.X, padx=14, pady=(0, 8))

        self.video_status_lbl = tk.Label(prog_row, text="Idle — select reference photo and video to start.", bg=BG_CARD, fg=FG_MUTED, font=("Segoe UI", 9))
        self.video_status_lbl.pack(anchor="w")

        self.video_progress = ttk.Progressbar(prog_row, mode="determinate", maximum=100)
        self.video_progress.pack(fill=tk.X, pady=(4, 0))

        # Scrollable Crop Comparison Grid
        grid_container = tk.Frame(right, bg=BG_DARK, highlightbackground=BORDER_COLOR, highlightthickness=1)
        grid_container.pack(fill=tk.BOTH, expand=True, padx=14, pady=(4, 14))

        self.canvas = tk.Canvas(grid_container, bg=BG_DARK, highlightthickness=0)
        scrollbar = ttk.Scrollbar(grid_container, orient=tk.VERTICAL, command=self.canvas.yview)
        self.crops_frame = tk.Frame(self.canvas, bg=BG_DARK)

        self.crops_frame.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self.canvas.create_window((0, 0), window=self.crops_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=scrollbar.set)

        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

    def _toggle_source_mode(self):
        if self.source_mode_var.get() == "video":
            self.rtsp_entry.pack_forget()
            self.video_btn.pack(side=tk.LEFT)
            self.video_name_lbl.pack(side=tk.LEFT, padx=10)
        else:
            self.video_btn.pack_forget()
            self.video_name_lbl.pack_forget()
            self.rtsp_entry.pack(side=tk.LEFT, padx=4)

    def _pick_photo(self):
        path = filedialog.askopenfilename(
            title="Select Reference Missing Person Photo",
            filetypes=[("Image Files", "*.jpg *.jpeg *.png *.webp *.bmp"), ("All Files", "*.*")],
        )
        if not path:
            return
        self.photo_path = path
        self.photo_name_lbl.config(text=os.path.basename(path), fg=FG_TEXT)

        img = Image.open(path).convert("RGB")
        img.thumbnail((240, 240))
        self.ref_photo_tk = ImageTk.PhotoImage(img)
        self.photo_preview_lbl.config(image=self.ref_photo_tk, text="")

        # Automatically generate reference embedding in background so user sees it immediately
        self.ref_embedding = None
        self.emb_status_lbl.config(text="Generating 512-dim AdaFace embedding...", fg=ACCENT_GOLD)
        self.emb_progress.start(12)
        self._set_emb_details("Loading AdaFace / FaceDetector...\nPlease wait...")
        threading.Thread(target=self._worker_embed_photo, args=(path,), daemon=True).start()

    def _pick_video(self):
        path = filedialog.askopenfilename(
            title="Select Recorded CCTV Video",
            filetypes=[("Video Files", "*.mp4 *.avi *.mov *.mkv"), ("All Files", "*.*")],
        )
        if not path:
            return
        self.video_path = path
        self.video_name_lbl.config(text=os.path.basename(path), fg=FG_TEXT)

    def _on_threshold_change(self, _val):
        val = self.threshold_var.get()
        self.thresh_lbl.config(text=f"{val:.2f}")
        if self.scored_results and not self.is_running:
            self._render_crop_grid()

    def _set_emb_details(self, text: str):
        self.emb_details_box.config(state=tk.NORMAL)
        self.emb_details_box.delete("1.0", tk.END)
        self.emb_details_box.insert(tk.END, text)
        self.emb_details_box.config(state=tk.DISABLED)

    def _worker_embed_photo(self, path: str):
        t0 = time.time()
        try:
            photo_bytes = Path(path).read_bytes()
            emb = generate_embedding(photo_bytes)
            elapsed_ms = (time.time() - t0) * 1000.0
            self.ui_queue.put(("embed_done", emb, elapsed_ms, None))
        except Exception as e:
            self.ui_queue.put(("embed_done", None, 0.0, str(e)))

    def _start_analysis(self):
        if self.is_running:
            return
        if not self.ref_embedding:
            messagebox.showwarning("Reference Embedding Not Ready", "Please select a reference photo with a clear face first.")
            return
        mode = self.source_mode_var.get()
        if mode == "video" and not self.video_path:
            messagebox.showwarning("No Video Selected", "Please select a recorded CCTV video file.")
            return
        if mode == "rtsp" and not self.rtsp_url_var.get().strip().startswith("rtsp"):
            messagebox.showwarning("Invalid RTSP URL", "Please enter a valid rtsp:// stream URL.")
            return

        self.is_running = True
        self.run_btn.config(state=tk.DISABLED, text="Running...")
        self.scored_results = []
        self.crop_images_tk = []
        for w in self.crops_frame.winfo_children():
            w.destroy()
        self.video_progress["value"] = 0
        self.video_status_lbl.config(text="Starting AI video pipeline (detection + tracking + crops)...", fg=ACCENT_GOLD)

        if mode == "video":
            threading.Thread(target=self._worker_video, args=(self.video_path,), daemon=True).start()
        else:
            threading.Thread(target=self._worker_rtsp, args=(self.rtsp_url_var.get().strip(),), daemon=True).start()

    def _worker_video(self, video_path: str):
        crops_dir = os.path.join(REPO_ROOT, "tmp_ai_gui_crops")
        os.makedirs(crops_dir, exist_ok=True)
        try:
            results = run_analysis_pipeline(
                video_path=video_path,
                video_id="gui_test",
                crops_dir=crops_dir,
                progress_callback=lambda p: self.ui_queue.put(("video_progress", p)),
                save_crops=True,
            )
            self.ui_queue.put(("video_status", f"Comparing {len(results)} extracted face crops against reference embedding..."))
            scored = []
            for idx, res in enumerate(results, start=1):
                emb = res.get("embedding")
                if not emb:
                    continue
                sim = float(calculate_cosine_similarity(self.ref_embedding, emb))
                item = {
                    "idx": idx,
                    "frame_idx": res.get("frame_idx", 0),
                    "similarity": sim,
                    "confidence_pct": _format_confidence(sim),
                    "crop_path": res.get("crop_path", ""),
                }
                scored.append(item)
                self.ui_queue.put(("crop_compared", item))
            scored.sort(key=lambda r: r["similarity"], reverse=True)
            self.ui_queue.put(("analysis_done", scored, None))
        except Exception as e:
            self.ui_queue.put(("analysis_done", [], str(e)))

    def _worker_rtsp(self, rtsp_url: str):
        crops_dir = os.path.join(REPO_ROOT, "tmp_ai_gui_crops")
        os.makedirs(crops_dir, exist_ok=True)
        cap = cv2.VideoCapture(rtsp_url)
        if not cap.isOpened():
            self.ui_queue.put(("analysis_done", [], f"Could not open RTSP stream: {rtsp_url}"))
            return
        scored = []
        max_frames = self.max_frames_var.get()
        frame_idx = 0
        crop_counter = 0
        try:
            while frame_idx < max_frames:
                ok, frame = cap.read()
                if not ok or frame is None:
                    break
                if frame_idx % 10 == 0:
                    self.ui_queue.put(("video_progress", (frame_idx / max_frames) * 100.0))
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
                        sim = float(calculate_cosine_similarity(self.ref_embedding, emb))
                        item = {
                            "idx": crop_counter,
                            "frame_idx": frame_idx,
                            "similarity": sim,
                            "confidence_pct": _format_confidence(sim),
                            "crop_path": crop_path,
                        }
                        scored.append(item)
                        self.ui_queue.put(("crop_compared", item))
                frame_idx += 1
            scored.sort(key=lambda r: r["similarity"], reverse=True)
            self.ui_queue.put(("analysis_done", scored, None))
        except Exception as e:
            self.ui_queue.put(("analysis_done", scored, str(e)))
        finally:
            cap.release()

    def _poll_queue(self):
        try:
            while True:
                msg = self.ui_queue.get_nowait()
                kind = msg[0]
                if kind == "embed_done":
                    _, emb, elapsed_ms, err = msg
                    self.emb_progress.stop()
                    if err or not emb:
                        self.ref_embedding = None
                        self.emb_status_lbl.config(text="❌ Failed to embed face", fg=ACCENT_RED)
                        self._set_emb_details(f"Error: {err or 'No face detected in photo.'}")
                    else:
                        self.ref_embedding = emb
                        self.emb_status_lbl.config(text=f"✅ Embedding Ready ({len(emb)}-dim)", fg=ACCENT_GREEN)
                        preview_vals = ", ".join(f"{v:.4f}" for v in emb[:6])
                        self._set_emb_details(
                            f"Model: AdaFace IR50\n"
                            f"Dimensions: {len(emb)}\n"
                            f"Time: {elapsed_ms:.0f} ms\n"
                            f"Vector[0..5]:\n[{preview_vals}, ...]"
                        )
                elif kind == "video_progress":
                    pct = msg[1]
                    self.video_progress["value"] = pct
                    self.video_status_lbl.config(text=f"Extracting & tracking faces... {pct:.0f}%", fg=ACCENT_GOLD)
                elif kind == "video_status":
                    self.video_status_lbl.config(text=msg[1], fg=ACCENT_GOLD)
                elif kind == "crop_compared":
                    self.scored_results.append(msg[1])
                    self._append_crop_card(msg[1], len(self.scored_results) - 1)
                elif kind == "analysis_done":
                    _, scored, err = msg
                    self.is_running = False
                    self.run_btn.config(state=tk.NORMAL, text="▶ Run AI Comparison")
                    self.video_progress["value"] = 100
                    if err:
                        self.video_status_lbl.config(text=f"❌ Error: {err}", fg=ACCENT_RED)
                    else:
                        self.scored_results = scored
                        self._render_crop_grid()
        except queue.Empty:
            pass
        self.root.after(80, self._poll_queue)

    def _append_crop_card(self, item: dict, pos: int):
        thresh = self.threshold_var.get()
        is_match = item["similarity"] >= thresh
        border = ACCENT_GREEN if is_match else BORDER_COLOR
        card = tk.Frame(self.crops_frame, bg=BG_CARD, width=230, height=235, highlightbackground=border, highlightthickness=2 if is_match else 1)
        row, col = divmod(pos, 3)
        card.grid(row=row, column=col, padx=8, pady=8, sticky="nw")
        card.pack_propagate(False)

        crop_lbl = tk.Label(card, bg=BG_DARK, width=140, height=130)
        crop_lbl.pack(pady=(8, 4))
        if item["crop_path"] and os.path.exists(item["crop_path"]):
            im = Image.open(item["crop_path"]).convert("RGB")
            im.thumbnail((135, 125))
            tk_im = ImageTk.PhotoImage(im)
            self.crop_images_tk.append(tk_im)
            crop_lbl.config(image=tk_im)

        tk.Label(card, text=f"Frame #{item['frame_idx']}", bg=BG_CARD, fg=FG_MUTED, font=("Consolas", 9)).pack()
        tk.Label(
            card,
            text=f"Sim: {item['similarity']:.4f} ({item['confidence_pct']:.1f}%)",
            bg=BG_CARD,
            fg=ACCENT_GREEN if is_match else FG_TEXT,
            font=("Consolas", 9, "bold"),
        ).pack()
        tk.Label(
            card,
            text="● MATCH" if is_match else "○ NO MATCH",
            bg=BG_CARD,
            fg=ACCENT_GREEN if is_match else FG_MUTED,
            font=("Segoe UI", 9, "bold"),
        ).pack(pady=(2, 6))

    def _render_crop_grid(self):
        self.crop_images_tk = []
        for w in self.crops_frame.winfo_children():
            w.destroy()
        thresh = self.threshold_var.get()
        matches = sum(1 for r in self.scored_results if r["similarity"] >= thresh)
        self.video_status_lbl.config(
            text=f"✅ Done — {len(self.scored_results)} face crops compared | {matches} MATCH (>= {thresh:.2f})",
            fg=ACCENT_GREEN if matches > 0 else FG_TEXT,
        )
        for pos, item in enumerate(self.scored_results):
            self._append_crop_card(item, pos)


def main():
    root = tk.Tk()
    AIInspectorApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
