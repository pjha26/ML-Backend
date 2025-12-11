"""
Camera Diagnostic Tool
Tests different camera indices and backends to find working camera
"""

import cv2
import sys

print("="*60)
print("CAMERA DIAGNOSTIC TOOL")
print("="*60)

def test_camera(index, backend=None, backend_name="Default"):
    """Test if camera opens with given index and backend"""
    try:
        if backend is not None:
            cap = cv2.VideoCapture(index, backend)
        else:
            cap = cv2.VideoCapture(index)
        
        if cap.isOpened():
            ret, frame = cap.read()
            if ret and frame is not None:
                height, width = frame.shape[:2]
                cap.release()
                return True, f"{width}x{height}"
            cap.release()
            return False, "Opened but no frame"
        return False, "Failed to open"
    except Exception as e:
        return False, str(e)

# Test different backends
backends = [
    (cv2.CAP_DSHOW, "DirectShow (Windows)"),
    (cv2.CAP_MSMF, "Media Foundation (Windows)"),
    (None, "Default Backend"),
]

print("\nTesting camera indices 0-4 with different backends...\n")

working_cameras = []

for backend, backend_name in backends:
    print(f"\n--- Testing with {backend_name} ---")
    for idx in range(5):
        success, info = test_camera(idx, backend, backend_name)
        status = "✓ WORKING" if success else "✗ Failed"
        print(f"  Camera {idx}: {status} - {info}")
        
        if success:
            working_cameras.append((idx, backend, backend_name))

print("\n" + "="*60)
if working_cameras:
    print("✓ WORKING CAMERAS FOUND:")
    for idx, backend, backend_name in working_cameras:
        print(f"  - Index {idx} with {backend_name}")
    
    # Use the first working camera
    idx, backend, backend_name = working_cameras[0]
    print(f"\n✓ Recommended: Use index {idx} with {backend_name}")
    
    if backend == cv2.CAP_DSHOW:
        print(f"\nIn main.py, use: cv2.VideoCapture({idx}, cv2.CAP_DSHOW)")
    elif backend == cv2.CAP_MSMF:
        print(f"\nIn main.py, use: cv2.VideoCapture({idx}, cv2.CAP_MSMF)")
    else:
        print(f"\nIn main.py, use: cv2.VideoCapture({idx})")
else:
    print("✗ NO WORKING CAMERAS FOUND")
    print("\nPossible issues:")
    print("1. Camera is being used by another application")
    print("2. Camera drivers are not installed")
    print("3. Camera is disabled in Windows Settings")
    print("4. Camera permissions not granted to Python")
    print("\nTroubleshooting steps:")
    print("1. Close all apps that might use camera (Zoom, Teams, Skype)")
    print("2. Go to Windows Settings > Privacy > Camera")
    print("3. Enable 'Allow apps to access your camera'")
    print("4. Enable 'Allow desktop apps to access your camera'")
    print("5. Check Device Manager for camera driver issues")

print("="*60)
