# Student Concentration Detection System

A real-time student concentration monitoring system using OpenCV and MediaPipe Face Mesh. Detects and classifies student states as **Focused**, **Distracted**, **Sleepy**, or **Absent** based on facial landmarks, eye tracking, gaze direction, and head pose.

## Features

✅ **Real-time Detection**
- Face detection using MediaPipe Face Mesh
- Eye aspect ratio calculation for blink and sleepiness detection
- Gaze direction tracking using iris landmarks
- Head pose estimation (yaw/pitch angles)

✅ **State Classification**
- **Focused**: Student is attentive and looking forward
- **Distracted**: Gaze or head turned away (>30° or gaze off-center)
- **Sleepy**: Eyes closed for more than 2 seconds
- **Absent**: No face detected in frame

✅ **Concentration Scoring**
- Dynamic score (0-100%) updated in real-time
- Penalties: Sleepy (-40), Distracted (-30), Absent (0)
- Gradual recovery when focused

✅ **Session Analytics**
- Live concentration percentage display
- Historical tracking (1-second intervals)
- Final summary with state distribution and average concentration

## Installation

### Prerequisites
- Python 3.8 or higher
- Webcam

### Setup

1. **Clone or navigate to the project directory**
```bash
cd e:\webd\Edu\ML-Backend
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

## Usage

### Run the program
```bash
python main.py
```

### Controls
- **Q**: Quit and display session summary

### What You'll See

**Live Window Display:**
- Webcam feed with face mesh overlay
- Green bounding box around detected face
- State indicator (top-left): Current concentration state
- Concentration score (below state): Real-time percentage
- Debug metrics: EAR, Yaw angle, Gaze position
- Concentration bar (bottom): Visual progress bar

**After Pressing Q:**
```
==================================================
SESSION SUMMARY
==================================================
Total Duration: 45.32 seconds
Total Samples: 45

State Distribution:
  Focused:       30 ( 66.7%)
  Distracted:    10 ( 22.2%)
  Sleepy:         3 (  6.7%)
  Absent:         2 (  4.4%)

Average Concentration: 78.5%
==================================================
```

## How It Works

### 1. **Eye Tracking**
- Calculates Eye Aspect Ratio (EAR) using 6 landmarks per eye
- EAR < 0.25 = eyes closed
- Eyes closed > 2 seconds = **Sleepy**

### 2. **Gaze Detection**
- Uses iris landmarks (468-477) to track eye position
- Calculates horizontal/vertical iris position relative to eye corners
- Off-center gaze (>15% deviation) = **Distracted**

### 3. **Head Pose Estimation**
- Uses PnP algorithm with 6 facial landmarks
- Calculates yaw (left-right) and pitch (up-down) angles
- Head turn > 30° = **Distracted**

### 4. **State Priority**
```
Absent > Sleepy > Distracted > Focused
```

### 5. **Concentration Score**
- Starts at 100%
- Decreases based on state penalties
- Slowly recovers (+1/frame) when focused
- Minimum: 0%, Maximum: 100%

## Code Structure

```
main.py
├── Configuration constants
├── MediaPipe setup
├── Helper functions
│   ├── calculate_eye_aspect_ratio()    # EAR calculation
│   ├── get_eye_landmarks()             # Extract eye coordinates
│   ├── calculate_head_pose()           # Yaw/pitch estimation
│   ├── calculate_gaze_direction()      # Iris tracking
│   ├── detect_concentration_state()    # State classification
│   ├── calculate_concentration_score() # Score updates
│   ├── draw_ui()                       # UI rendering
│   └── print_summary()                 # Final report
└── main()                              # Main loop
```

## Customization

### Adjust Thresholds
Edit these constants in `main.py`:

```python
EYE_AR_THRESH = 0.25              # Eye closure threshold
SLEEPY_TIME_THRESHOLD = 2.0       # Seconds for sleepy state
HEAD_POSE_THRESHOLD = 30          # Degrees for head turn
GAZE_THRESHOLD = 0.15             # Gaze deviation threshold

PENALTY_SLEEPY = 40               # Score penalty for sleepy
PENALTY_DISTRACTED = 30           # Score penalty for distracted
```

### Camera Settings
```python
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)   # Resolution
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_FPS, 30)            # Frame rate
```

## Performance

- **Fast**: Optimized for real-time processing (30 FPS)
- **Offline**: No external API calls, runs completely locally
- **Lightweight**: Minimal dependencies (OpenCV, MediaPipe, NumPy)

## Troubleshooting

**Webcam not opening:**
- Check if another application is using the camera
- Try changing camera index: `cv2.VideoCapture(1)` or `cv2.VideoCapture(2)`

**Low FPS:**
- Reduce camera resolution
- Comment out face mesh drawing for better performance
- Close other applications

**Inaccurate detection:**
- Ensure good lighting
- Position face clearly in frame
- Adjust threshold values

## Technical Details

- **MediaPipe Face Mesh**: 478 facial landmarks
- **Eye Landmarks**: 6 points per eye (33, 160, 158, 133, 153, 144 for left)
- **Iris Landmarks**: 5 points per iris (468-472 for left, 473-477 for right)
- **Head Pose**: PnP algorithm with 6 key facial points
- **EAR Formula**: `(||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)`

## License

Free to use for educational purposes.

## Author

Built with ❤️ using OpenCV and MediaPipe
