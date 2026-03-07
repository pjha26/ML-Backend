"""
ConcentraAI - ML Engine
Extracted from main.py: All ML logic for concentration detection
Uses MediaPipe Face Mesh and OpenCV to detect student focus states
States: Focused, Distracted, Sleepy, Absent
"""

import cv2
import mediapipe as mp
import numpy as np
import time
import base64
from collections import deque

# ==================== CONFIGURATION ====================
EYE_AR_THRESH = 0.25
EYE_AR_CONSEC_FRAMES = 2
SLEEPY_TIME_THRESHOLD = 2.0
HEAD_POSE_THRESHOLD = 30
GAZE_THRESHOLD = 0.15

PENALTY_SLEEPY = 40
PENALTY_DISTRACTED = 30
PENALTY_ABSENT = 100

# ==================== MEDIAPIPE LANDMARK INDICES ====================
LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
LEFT_IRIS_INDICES = [468, 469, 470, 471, 472]
RIGHT_IRIS_INDICES = [473, 474, 475, 476, 477]


# ==================== HELPER FUNCTIONS ====================

def calculate_eye_aspect_ratio(eye_landmarks):
    """Calculate Eye Aspect Ratio (EAR) to detect eye closure."""
    A = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
    B = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
    C = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
    ear = (A + B) / (2.0 * C)
    return ear


def get_eye_landmarks(face_landmarks, indices, frame_width, frame_height):
    """Extract eye landmark coordinates from face mesh."""
    landmarks = []
    for idx in indices:
        landmark = face_landmarks.landmark[idx]
        x = int(landmark.x * frame_width)
        y = int(landmark.y * frame_height)
        landmarks.append(np.array([x, y]))
    return np.array(landmarks)


def calculate_head_pose(face_landmarks, frame_width, frame_height):
    """Calculate head pose yaw and pitch angles."""
    indices = [1, 152, 33, 263, 61, 291]
    image_points = []
    for idx in indices:
        landmark = face_landmarks.landmark[idx]
        x = int(landmark.x * frame_width)
        y = int(landmark.y * frame_height)
        image_points.append([x, y])
    image_points = np.array(image_points, dtype=np.float64)

    model_points = np.array([
        (0.0, 0.0, 0.0),
        (0.0, -330.0, -65.0),
        (-225.0, 170.0, -135.0),
        (225.0, 170.0, -135.0),
        (-150.0, -150.0, -125.0),
        (150.0, -150.0, -125.0)
    ])

    focal_length = frame_width
    center = (frame_width / 2, frame_height / 2)
    camera_matrix = np.array([
        [focal_length, 0, center[0]],
        [0, focal_length, center[1]],
        [0, 0, 1]
    ], dtype=np.float64)

    dist_coeffs = np.zeros((4, 1))
    success, rotation_vector, translation_vector = cv2.solvePnP(
        model_points, image_points, camera_matrix, dist_coeffs,
        flags=cv2.SOLVEPNP_ITERATIVE
    )

    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    pose_matrix = cv2.hconcat((rotation_matrix, translation_vector))
    _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_matrix)

    yaw = euler_angles[1, 0]
    pitch = euler_angles[0, 0]
    return yaw, pitch


def calculate_gaze_direction(face_landmarks, frame_width, frame_height):
    """Calculate gaze direction using iris position relative to eye corners."""
    left_eye_left = face_landmarks.landmark[33]
    left_eye_right = face_landmarks.landmark[133]
    left_iris_center = face_landmarks.landmark[468]

    eye_width = abs(left_eye_right.x - left_eye_left.x)
    iris_position = (left_iris_center.x - left_eye_left.x) / eye_width if eye_width > 0 else 0.5

    left_eye_top = face_landmarks.landmark[159]
    left_eye_bottom = face_landmarks.landmark[145]
    eye_height = abs(left_eye_bottom.y - left_eye_top.y)
    iris_vertical = (left_iris_center.y - left_eye_top.y) / eye_height if eye_height > 0 else 0.5

    return iris_position, iris_vertical


def detect_concentration_state(ear, eyes_closed_time, yaw, gaze_h, face_detected):
    """Determine concentration state based on all metrics."""
    if not face_detected:
        return "Absent"
    if eyes_closed_time > SLEEPY_TIME_THRESHOLD:
        return "Sleepy"
    if abs(yaw) > HEAD_POSE_THRESHOLD:
        return "Distracted"
    if gaze_h < (0.5 - GAZE_THRESHOLD) or gaze_h > (0.5 + GAZE_THRESHOLD):
        return "Distracted"
    return "Focused"


def calculate_concentration_score(state, current_score):
    """Calculate concentration score based on current state."""
    if state == "Absent":
        return 0
    elif state == "Sleepy":
        return max(0, current_score - PENALTY_SLEEPY)
    elif state == "Distracted":
        return max(0, current_score - PENALTY_DISTRACTED)
    else:
        return min(100, current_score + 1)


# ==================== CONCENTRATION DETECTOR CLASS ====================

class ConcentrationDetector:
    """
    Encapsulates all ML logic for concentration detection.
    Accepts decoded frames; returns JSON-serializable results.
    """

    def __init__(self):
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.concentration_score = 100.0
        self.eyes_closed_start = None
        self.eyes_closed_time = 0.0
        self.blink_counter = 0
        self.session_start = None
        self.history = []
        self.last_record_time = 0.0

    def reset_session(self):
        """Reset session data."""
        self.concentration_score = 100.0
        self.eyes_closed_start = None
        self.eyes_closed_time = 0.0
        self.blink_counter = 0
        self.session_start = None
        self.history = []
        self.last_record_time = 0.0

    def process_frame(self, frame: np.ndarray) -> dict:
        """
        Process a single frame and return concentration data.
        Args:
            frame: BGR numpy array (decoded image)
        Returns:
            dict with state, concentration, metrics, etc.
        """
        if self.session_start is None:
            self.session_start = time.time()
            self.last_record_time = time.time()

        frame_height, frame_width = frame.shape[:2]
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)

        face_detected = False
        ear = 1.0
        yaw = 0.0
        pitch = 0.0
        gaze_h = 0.5
        gaze_v = 0.5

        if results.multi_face_landmarks:
            face_detected = True
            face_landmarks = results.multi_face_landmarks[0]

            # Eye aspect ratio
            left_eye = get_eye_landmarks(face_landmarks, LEFT_EYE_INDICES, frame_width, frame_height)
            right_eye = get_eye_landmarks(face_landmarks, RIGHT_EYE_INDICES, frame_width, frame_height)
            left_ear = calculate_eye_aspect_ratio(left_eye)
            right_ear = calculate_eye_aspect_ratio(right_eye)
            ear = (left_ear + right_ear) / 2.0

            # Track eyes closed time
            if ear < EYE_AR_THRESH:
                if self.eyes_closed_start is None:
                    self.eyes_closed_start = time.time()
                self.eyes_closed_time = time.time() - self.eyes_closed_start
            else:
                if self.eyes_closed_start is not None:
                    self.blink_counter += 1
                self.eyes_closed_start = None
                self.eyes_closed_time = 0

            # Head pose
            yaw, pitch = calculate_head_pose(face_landmarks, frame_width, frame_height)

            # Gaze direction
            gaze_h, gaze_v = calculate_gaze_direction(face_landmarks, frame_width, frame_height)

        # Detect state
        state = detect_concentration_state(ear, self.eyes_closed_time, yaw, gaze_h, face_detected)

        # Update concentration score
        self.concentration_score = calculate_concentration_score(state, self.concentration_score)

        # Record history every second
        current_time = time.time()
        if current_time - self.last_record_time >= 1.0:
            self.history.append({
                "time": round(current_time - self.session_start, 1),
                "state": state,
                "concentration": round(self.concentration_score, 1)
            })
            self.last_record_time = current_time

        return {
            "state": state,
            "concentration": round(self.concentration_score, 1),
            "face_detected": face_detected,
            "ear": round(ear, 3),
            "yaw": round(yaw, 1),
            "pitch": round(pitch, 1),
            "gaze_h": round(gaze_h, 3),
            "gaze_v": round(gaze_v, 3),
            "blink_count": self.blink_counter,
            "session_duration": round(current_time - self.session_start, 1) if self.session_start else 0,
        }

    def get_session_summary(self) -> dict:
        """Return session analytics."""
        if not self.history:
            return {
                "duration": 0,
                "total_samples": 0,
                "average_concentration": 0,
                "state_distribution": {"Focused": 0, "Distracted": 0, "Sleepy": 0, "Absent": 0},
                "history": [],
            }

        state_counts = {"Focused": 0, "Distracted": 0, "Sleepy": 0, "Absent": 0}
        total_concentration = 0
        for record in self.history:
            state_counts[record["state"]] += 1
            total_concentration += record["concentration"]

        total = len(self.history)
        return {
            "duration": round(time.time() - self.session_start, 1) if self.session_start else 0,
            "total_samples": total,
            "average_concentration": round(total_concentration / total, 1),
            "state_distribution": {
                k: {"count": v, "percentage": round(v / total * 100, 1)}
                for k, v in state_counts.items()
            },
            "history": self.history[-60:],  # last 60 data points
        }

    def decode_base64_frame(self, base64_str: str) -> np.ndarray:
        """Decode a base64-encoded image to a numpy array."""
        # Handle data URI prefix if present
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]

        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame

    def close(self):
        """Release MediaPipe resources."""
        self.face_mesh.close()
