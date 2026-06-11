import unittest

import os
import tempfile
import cv2

from services.ai.detection.video_service import VideoService

class TestVideoService(unittest.TestCase):
    def setUp(self):
        # Create a temporary empty video file for testing FileNotFoundError
        self.temp_dir = tempfile.TemporaryDirectory()
        self.non_existent_file = os.path.join(self.temp_dir.name, "does_not_exist.mp4")
        
        # Create a dummy valid video file for testing
        self.valid_video_path = os.path.join(self.temp_dir.name, "test_video.avi")
        # Write a short video using cv2.VideoWriter
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        out = cv2.VideoWriter(self.valid_video_path, fourcc, 20.0, (640, 480))
        # Write 10 blank frames
        import numpy as np
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        for _ in range(10):
            out.write(frame)
        out.release()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_get_video_properties_not_found(self):
        with self.assertRaises(FileNotFoundError):
            VideoService.get_video_properties(self.non_existent_file)

    def test_get_video_properties_valid(self):
        props = VideoService.get_video_properties(self.valid_video_path)
        self.assertIsNotNone(props)
        self.assertEqual(props["width"], 640)
        self.assertEqual(props["height"], 480)
        self.assertEqual(props["frame_count"], 10)
        self.assertEqual(props["fps"], 20.0)
        self.assertEqual(props["duration"], 10 / 20.0)

from services.ai.detection.frame_extractor import FrameExtractor

class TestFrameExtractor(unittest.TestCase):
    def setUp(self):
        # Create a dummy valid video file for testing
        self.temp_dir = tempfile.TemporaryDirectory()
        self.valid_video_path = os.path.join(self.temp_dir.name, "test_frames.avi")
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        out = cv2.VideoWriter(self.valid_video_path, fourcc, 20.0, (640, 480))
        # Write 20 frames, changing color slightly to differentiate
        import numpy as np
        for i in range(20):
            frame = np.full((480, 640, 3), i * 10, dtype=np.uint8)
            out.write(frame)
        out.release()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_extract_frames_skip_5(self):
        frames = list(FrameExtractor.extract_frames(self.valid_video_path, skip_interval=5))
        # Should yield frames 0, 5, 10, 15
        self.assertEqual(len(frames), 4)
        indices = [idx for _, idx in frames]
        self.assertEqual(indices, [0, 5, 10, 15])
        
    def test_extract_frames_skip_1(self):
        frames = list(FrameExtractor.extract_frames(self.valid_video_path, skip_interval=1))
        # Should yield all 20 frames
        self.assertEqual(len(frames), 20)
        indices = [idx for _, idx in frames]
        self.assertEqual(indices, list(range(20)))

class TestFaceDetection(unittest.TestCase):
    def test_detect_faces_stub(self):
        self.assertTrue(True)

class TestFaceCropper(unittest.TestCase):
    def test_crop_faces_stub(self):
        self.assertTrue(True)

class TestPreprocessing(unittest.TestCase):
    def test_preprocess_crop_stub(self):
        self.assertTrue(True)

if __name__ == '__main__':
    unittest.main()
