"""
Student Concentration Detection System
Uses MediaPipe Face Mesh and OpenCV to detect student focus states
States: Focused, Distracted, Sleepy, Absent
"""

import cv2
import mediapipe as mp
import numpy as np
import time
from collections import deque

# ==================== CONFIGURATION ====================
EYE_AR_THRESH = 0.25  # Eye aspect ratio threshold for closed eyes
EYE_AR_CONSEC_FRAMES = 2  # Consecutive frames for blink detection
SLEEPY_TIME_THRESHOLD = 2.0  # Seconds with eyes closed = sleepy
HEAD_POSE_THRESHOLD = 30  # Degrees for head turn detection
GAZE_THRESHOLD = 0.15  # Threshold for gaze direction detection

# Concentration score penalties
PENALTY_SLEEPY = 40
PENALTY_DISTRACTED = 30
PENALTY_ABSENT = 100  # Sets to 0

# ==================== MEDIAPIPE SETUP ====================
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Eye landmarks indices for MediaPipe Face Mesh
LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]

# Iris landmarks for gaze detection
LEFT_IRIS_INDICES = [468, 469, 470, 471, 472]
RIGHT_IRIS_INDICES = [473, 474, 475, 476, 477]


# ==================== HELPER FUNCTIONS ====================

def calculate_eye_aspect_ratio(eye_landmarks):
    """
    Calculate Eye Aspect Ratio (EAR) to detect eye closure
    EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
    """
    # Vertical distances
    A = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
    B = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
    
    # Horizontal distance
    C = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
    
    # EAR calculation
    ear = (A + B) / (2.0 * C)
    return ear


def get_eye_landmarks(face_landmarks, indices, frame_width, frame_height):
    """
    Extract eye landmark coordinates from face mesh
    """
    landmarks = []
    for idx in indices:
        landmark = face_landmarks.landmark[idx]
        x = int(landmark.x * frame_width)
        y = int(landmark.y * frame_height)
        landmarks.append(np.array([x, y]))
    return np.array(landmarks)


def calculate_head_pose(face_landmarks, frame_width, frame_height):
    """
    Calculate head pose angles (yaw, pitch, roll) using face landmarks
    Returns yaw angle (left-right rotation)
    """
    # Key face landmarks for pose estimation
    # Nose tip, chin, left eye corner, right eye corner, left mouth, right mouth
    indices = [1, 152, 33, 263, 61, 291]
    
    # 2D image points
    image_points = []
    for idx in indices:
        landmark = face_landmarks.landmark[idx]
        x = int(landmark.x * frame_width)
        y = int(landmark.y * frame_height)
        image_points.append([x, y])
    image_points = np.array(image_points, dtype=np.float64)
    
    # 3D model points (generic face model)
    model_points = np.array([
        (0.0, 0.0, 0.0),           # Nose tip
        (0.0, -330.0, -65.0),      # Chin
        (-225.0, 170.0, -135.0),   # Left eye corner
        (225.0, 170.0, -135.0),    # Right eye corner
        (-150.0, -150.0, -125.0),  # Left mouth corner
        (150.0, -150.0, -125.0)    # Right mouth corner
    ])
    
    # Camera internals
    focal_length = frame_width
    center = (frame_width / 2, frame_height / 2)
    camera_matrix = np.array([
        [focal_length, 0, center[0]],
        [0, focal_length, center[1]],
        [0, 0, 1]
    ], dtype=np.float64)
    
    dist_coeffs = np.zeros((4, 1))  # Assuming no lens distortion
    
    # Solve PnP
    success, rotation_vector, translation_vector = cv2.solvePnP(
        model_points, image_points, camera_matrix, dist_coeffs,
        flags=cv2.SOLVEPNP_ITERATIVE
    )
    
    # Convert rotation vector to rotation matrix
    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    
    # Calculate Euler angles
    pose_matrix = cv2.hconcat((rotation_matrix, translation_vector))
    _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_matrix)
    
    yaw = euler_angles[1, 0]  # Left-right rotation
    pitch = euler_angles[0, 0]  # Up-down rotation
    
    return yaw, pitch


def calculate_gaze_direction(face_landmarks, frame_width, frame_height):
    """
    Calculate gaze direction using iris position relative to eye corners
    Returns (horizontal_ratio, vertical_ratio)
    """
    # Get left eye corners and iris center
    left_eye_left = face_landmarks.landmark[33]
    left_eye_right = face_landmarks.landmark[133]
    left_iris_center = face_landmarks.landmark[468]
    
    # Calculate horizontal position (0 = left, 0.5 = center, 1 = right)
    eye_width = abs(left_eye_right.x - left_eye_left.x)
    iris_position = (left_iris_center.x - left_eye_left.x) / eye_width if eye_width > 0 else 0.5
    
    # Calculate vertical position using eye top and bottom
    left_eye_top = face_landmarks.landmark[159]
    left_eye_bottom = face_landmarks.landmark[145]
    eye_height = abs(left_eye_bottom.y - left_eye_top.y)
    iris_vertical = (left_iris_center.y - left_eye_top.y) / eye_height if eye_height > 0 else 0.5
    
    return iris_position, iris_vertical


def detect_concentration_state(ear, eyes_closed_time, yaw, gaze_h, face_detected):
    """
    Determine concentration state based on all metrics
    Priority: Absent > Sleepy > Distracted > Focused
    """
    if not face_detected:
        return "Absent"
    
    # Check if sleepy (eyes closed for too long)
    if eyes_closed_time > SLEEPY_TIME_THRESHOLD:
        return "Sleepy"
    
    # Check head pose (turned away)
    if abs(yaw) > HEAD_POSE_THRESHOLD:
        return "Distracted"
    
    # Check gaze direction (looking away)
    # Center gaze is around 0.4-0.6
    if gaze_h < (0.5 - GAZE_THRESHOLD) or gaze_h > (0.5 + GAZE_THRESHOLD):
        return "Distracted"
    
    return "Focused"


def calculate_concentration_score(state, current_score):
    """
    Calculate concentration score based on current state
    """
    if state == "Absent":
        return 0
    elif state == "Sleepy":
        return max(0, current_score - PENALTY_SLEEPY)
    elif state == "Distracted":
        return max(0, current_score - PENALTY_DISTRACTED)
    else:  # Focused
        return min(100, current_score + 1)  # Slowly recover when focused


def draw_ui(frame, state, concentration_score, ear, yaw, gaze_h):
    """
    Draw UI elements on the frame
    """
    height, width = frame.shape[:2]
    
    # State color coding
    state_colors = {
        "Focused": (0, 255, 0),      # Green
        "Distracted": (0, 165, 255),  # Orange
        "Sleepy": (0, 255, 255),      # Yellow
        "Absent": (0, 0, 255)         # Red
    }
    color = state_colors.get(state, (255, 255, 255))
    
    # Draw semi-transparent overlay for text background
    overlay = frame.copy()
    cv2.rectangle(overlay, (10, 10), (350, 120), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
    
    # State text (top left)
    cv2.putText(frame, f"State: {state}", (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)
    
    # Concentration score (below state)
    cv2.putText(frame, f"Concentration: {int(concentration_score)}%", (20, 75),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    
    # Debug info (smaller text)
    cv2.putText(frame, f"EAR: {ear:.2f} | Yaw: {yaw:.1f} | Gaze: {gaze_h:.2f}",
                (20, 105), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
    
    # Concentration bar at bottom
    bar_width = int((concentration_score / 100) * (width - 40))
    cv2.rectangle(frame, (20, height - 40), (width - 20, height - 20), (50, 50, 50), -1)
    cv2.rectangle(frame, (20, height - 40), (20 + bar_width, height - 20), color, -1)
    cv2.putText(frame, f"{int(concentration_score)}%", (width - 100, height - 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    return frame


def print_summary(session_data):
    """
    Print final session summary
    """
    total_duration = session_data['end_time'] - session_data['start_time']
    total_frames = len(session_data['history'])
    
    if total_frames == 0:
        print("\nNo data recorded.")
        return
    
    # Calculate percentages
    state_counts = {
        'Focused': 0,
        'Distracted': 0,
        'Sleepy': 0,
        'Absent': 0
    }
    
    total_concentration = 0
    for record in session_data['history']:
        state_counts[record['state']] += 1
        total_concentration += record['concentration']
    
    print("\n" + "="*50)
    print("SESSION SUMMARY")
    print("="*50)
    print(f"Total Duration: {total_duration:.2f} seconds")
    print(f"Total Samples: {total_frames}")
    print(f"\nState Distribution:")
    print(f"  Focused:     {state_counts['Focused']:4d} ({state_counts['Focused']/total_frames*100:5.1f}%)")
    print(f"  Distracted:  {state_counts['Distracted']:4d} ({state_counts['Distracted']/total_frames*100:5.1f}%)")
    print(f"  Sleepy:      {state_counts['Sleepy']:4d} ({state_counts['Sleepy']/total_frames*100:5.1f}%)")
    print(f"  Absent:      {state_counts['Absent']:4d} ({state_counts['Absent']/total_frames*100:5.1f}%)")
    print(f"\nAverage Concentration: {total_concentration/total_frames:.1f}%")
    print("="*50 + "\n")


# ==================== MAIN FUNCTION ====================

def main():
    """
    Main function to run the concentration detection system
    """
    # Initialize webcam with fallback options
    cap = None
    camera_indices = [0, 1, 2]  # Try multiple camera indices
    
    print("Attempting to open camera...")
    
    # Try Media Foundation backend first (best for Windows 10/11)
    for idx in camera_indices:
        print(f"  Trying camera index {idx} with Media Foundation...")
        cap = cv2.VideoCapture(idx, cv2.CAP_MSMF)
        if cap.isOpened():
            # Give camera time to initialize
            time.sleep(0.5)
            ret, _ = cap.read()
            if ret:
                print(f"✓ Camera opened successfully on index {idx}")
                break
        if cap:
            cap.release()
        cap = None
    
    # Try DirectShow backend if Media Foundation fails
    if cap is None:
        for idx in camera_indices:
            print(f"  Trying camera index {idx} with DirectShow...")
            cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
            if cap.isOpened():
                time.sleep(0.5)
                ret, _ = cap.read()
                if ret:
                    print(f"✓ Camera opened successfully on index {idx}")
                    break
            if cap:
                cap.release()
            cap = None
    
    # Try default backend as last resort
    if cap is None:
        for idx in camera_indices:
            print(f"  Trying camera index {idx} with default backend...")
            cap = cv2.VideoCapture(idx)
            if cap.isOpened():
                time.sleep(0.5)
                ret, _ = cap.read()
                if ret:
                    print(f"✓ Camera opened successfully on index {idx}")
                    break
            if cap:
                cap.release()
            cap = None
    
    # Final check
    if cap is None or not cap.isOpened():
        print("\n" + "="*60)
        print("❌ ERROR: Could not open webcam")
        print("="*60)
        print("\nTroubleshooting steps:")
        print("1. Close ALL apps using camera (Zoom, Teams, Skype, Discord)")
        print("2. Windows Settings > Privacy > Camera:")
        print("   - Enable 'Allow apps to access your camera'")
        print("   - Enable 'Allow desktop apps to access your camera'")
        print("3. Check Device Manager for camera driver issues")
        print("4. Try running: python test_camera.py")
        print("5. Restart your computer")
        print("="*60)
        return
    
    # Set camera properties for better performance
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)
    
    # Initialize MediaPipe Face Mesh
    face_mesh = mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,  # Enable iris landmarks
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    # State variables
    concentration_score = 100
    eyes_closed_start = None
    eyes_closed_time = 0
    blink_counter = 0
    
    # Session data
    session_data = {
        'start_time': time.time(),
        'end_time': None,
        'history': []
    }
    
    last_record_time = time.time()
    
    print("="*50)
    print("Student Concentration Detection System")
    print("="*50)
    print("Press 'Q' to quit and see summary")
    print("="*50 + "\n")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame")
            break
        
        # Flip frame horizontally for mirror view
        frame = cv2.flip(frame, 1)
        frame_height, frame_width = frame.shape[:2]
        
        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)
        
        # Default values
        face_detected = False
        ear = 1.0
        yaw = 0.0
        gaze_h = 0.5
        
        if results.multi_face_landmarks:
            face_detected = True
            face_landmarks = results.multi_face_landmarks[0]
            
            # Draw face mesh (optional, can comment out for performance)
            mp_drawing.draw_landmarks(
                image=frame,
                landmark_list=face_landmarks,
                connections=mp_face_mesh.FACEMESH_TESSELATION,
                landmark_drawing_spec=None,
                connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style()
            )
            
            # Extract eye landmarks
            left_eye = get_eye_landmarks(face_landmarks, LEFT_EYE_INDICES, frame_width, frame_height)
            right_eye = get_eye_landmarks(face_landmarks, RIGHT_EYE_INDICES, frame_width, frame_height)
            
            # Calculate EAR for both eyes
            left_ear = calculate_eye_aspect_ratio(left_eye)
            right_ear = calculate_eye_aspect_ratio(right_eye)
            ear = (left_ear + right_ear) / 2.0
            
            # Track eyes closed time
            if ear < EYE_AR_THRESH:
                if eyes_closed_start is None:
                    eyes_closed_start = time.time()
                eyes_closed_time = time.time() - eyes_closed_start
            else:
                if eyes_closed_start is not None:
                    blink_counter += 1
                eyes_closed_start = None
                eyes_closed_time = 0
            
            # Calculate head pose
            yaw, pitch = calculate_head_pose(face_landmarks, frame_width, frame_height)
            
            # Calculate gaze direction
            gaze_h, gaze_v = calculate_gaze_direction(face_landmarks, frame_width, frame_height)
            
            # Draw bounding box around face
            x_coords = [int(lm.x * frame_width) for lm in face_landmarks.landmark]
            y_coords = [int(lm.y * frame_height) for lm in face_landmarks.landmark]
            x_min, x_max = min(x_coords), max(x_coords)
            y_min, y_max = min(y_coords), max(y_coords)
            cv2.rectangle(frame, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)
        
        # Detect concentration state
        state = detect_concentration_state(ear, eyes_closed_time, yaw, gaze_h, face_detected)
        
        # Update concentration score
        concentration_score = calculate_concentration_score(state, concentration_score)
        
        # Record history every second
        current_time = time.time()
        if current_time - last_record_time >= 1.0:
            session_data['history'].append({
                'time': current_time - session_data['start_time'],
                'state': state,
                'concentration': concentration_score
            })
            last_record_time = current_time
        
        # Draw UI
        frame = draw_ui(frame, state, concentration_score, ear, yaw, gaze_h)
        
        # Display frame
        cv2.imshow('Student Concentration Detection', frame)
        
        # Check for quit
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == ord('Q'):
            break
    
    # Cleanup
    session_data['end_time'] = time.time()
    cap.release()
    cv2.destroyAllWindows()
    face_mesh.close()
    
    # Print summary
    print_summary(session_data)


if __name__ == "__main__":
    main()
