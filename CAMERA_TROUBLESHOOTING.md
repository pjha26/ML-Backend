# Camera Not Opening - Troubleshooting Guide

## Quick Fix Steps

### Step 1: Close Camera-Using Applications
Close these applications if running:
- ✗ Zoom
- ✗ Microsoft Teams
- ✗ Skype
- ✗ Discord
- ✗ OBS Studio
- ✗ Any browser with camera access (check tabs)
- ✗ Windows Camera app
- ✗ Any other video conferencing apps

### Step 2: Check Windows Camera Privacy Settings

1. Press `Win + I` to open Settings
2. Go to **Privacy & Security** → **Camera**
3. Make sure these are **ON**:
   - ✓ Camera access
   - ✓ Let apps access your camera
   - ✓ Let desktop apps access your camera

### Step 3: Test Camera in Windows Camera App

1. Press `Win + S` and search for "Camera"
2. Open the **Camera** app
3. If it works there, close it completely
4. Try running `python main.py` again

### Step 4: Check Device Manager

1. Press `Win + X` → **Device Manager**
2. Expand **Cameras** or **Imaging devices**
3. Right-click your camera → **Enable** (if disabled)
4. If you see a yellow warning icon, update the driver

### Step 5: Run the Diagnostic Tool

```bash
python test_camera.py
```

This will show which camera index and backend works.

### Step 6: Restart Camera Service (Advanced)

Open PowerShell as Administrator and run:

```powershell
# Stop camera service
Get-Process | Where-Object {$_.ProcessName -like "*camera*"} | Stop-Process -Force

# Restart Windows Camera Frame Server
Restart-Service -Name "FrameServer" -Force
```

### Step 7: Last Resort - Restart Computer

Sometimes Windows locks the camera. A restart usually fixes it.

## Alternative: Use a Different Camera

If you have an external USB webcam:
1. Plug it in
2. Run `python test_camera.py` to find its index
3. The program will automatically detect it

## Still Not Working?

### Check if Python has camera permissions:

1. Go to Windows Settings → Privacy → Camera
2. Scroll down to "Choose which Microsoft Store apps can access your camera"
3. Also check "Let desktop apps access your camera" is ON

### Try running Python as Administrator:

```bash
# Right-click PowerShell → Run as Administrator
cd e:\webd\Edu\ML-Backend
python main.py
```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Could not open webcam" | Camera in use or disabled | Close all apps, check privacy settings |
| Camera opens but no frame | Driver issue | Update camera drivers |
| Black screen | Wrong camera index | Run test_camera.py to find correct index |

## Need More Help?

Run this command to get detailed camera info:

```bash
python -c "import cv2; print(cv2.getBuildInformation())"
```

This shows OpenCV build info and supported backends.
