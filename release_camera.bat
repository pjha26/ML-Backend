@echo off
echo ============================================
echo Camera Release Utility
echo ============================================
echo.
echo This will close common applications that use the camera
echo.
pause

echo Closing camera-using applications...

taskkill /F /IM Zoom.exe 2>nul
taskkill /F /IM Teams.exe 2>nul
taskkill /F /IM Skype.exe 2>nul
taskkill /F /IM Discord.exe 2>nul
taskkill /F /IM obs64.exe 2>nul
taskkill /F /IM obs32.exe 2>nul
taskkill /F /IM WindowsCamera.exe 2>nul

echo.
echo Done! Applications closed.
echo.
echo Now try running: python main.py
echo.
pause
