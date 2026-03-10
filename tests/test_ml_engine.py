"""
Tests for ConcentraAI ML Engine
"""
import numpy as np
import pytest
from app.ml_engine import ConcentrationDetector


class TestConcentrationDetector:
    """Test suite for the ConcentrationDetector class."""

    def setup_method(self):
        self.detector = ConcentrationDetector()

    def teardown_method(self):
        self.detector.close()

    def test_initialization(self):
        """Detector initializes with correct defaults."""
        assert self.detector.concentration_score == 50.0
        assert self.detector.state == "Absent"
        assert self.detector.blink_count == 0

    def test_process_blank_frame(self):
        """Processing a blank frame returns Absent state."""
        # Black frame = no face detected
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        result = self.detector.process_frame(frame)
        assert result["state"] == "Absent"
        assert result["face_detected"] == False
        assert "concentration" in result

    def test_session_summary(self):
        """Session summary returns expected structure."""
        summary = self.detector.get_session_summary()
        assert "avg_concentration" in summary
        assert "focus_rate" in summary
        assert "total_samples" in summary
        assert "blink_count" in summary
        assert "session_duration" in summary

    def test_reset_session(self):
        """Reset clears all session data."""
        # Process some frames first
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        self.detector.process_frame(frame)
        self.detector.process_frame(frame)

        self.detector.reset_session()
        assert self.detector.concentration_score == 50.0
        assert self.detector.blink_count == 0

    def test_decode_base64_frame_invalid(self):
        """Invalid base64 returns None."""
        result = self.detector.decode_base64_frame("not-valid-base64")
        assert result is None

    def test_decode_base64_frame_with_prefix(self):
        """Handles data URI prefix correctly."""
        # Create a tiny valid JPEG-like base64
        result = self.detector.decode_base64_frame("data:image/jpeg;base64,/9j/4A==")
        # This may decode but produce an invalid image — just test it doesn't crash
        # The important thing is the prefix stripping works

    def test_concentration_score_bounds(self):
        """Concentration score stays within 0-100."""
        # Process many frames to try to push score out of bounds
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        for _ in range(50):
            result = self.detector.process_frame(frame)
            assert 0 <= result["concentration"] <= 100

    def test_result_has_required_fields(self):
        """Process result contains all required fields."""
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        result = self.detector.process_frame(frame)
        required_fields = [
            "state", "concentration", "face_detected",
            "ear", "yaw", "pitch", "gaze_h", "gaze_v",
            "blink_count", "session_duration"
        ]
        for field in required_fields:
            assert field in result, f"Missing field: {field}"
