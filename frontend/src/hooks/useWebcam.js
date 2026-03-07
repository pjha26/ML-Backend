import { useRef, useEffect, useCallback, useState } from 'react';

/**
 * Custom hook for webcam capture using getUserMedia.
 * Captures frames at specified FPS and returns base64 images.
 */
export function useWebcam(fps = 5) {
    const videoRef = useRef(null);
    const canvasRef = useRef(document.createElement('canvas'));
    const streamRef = useRef(null);
    const intervalRef = useRef(null);
    const [isActive, setIsActive] = useState(false);
    const onFrameRef = useRef(null);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: false,
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setIsActive(true);
            return true;
        } catch (err) {
            console.error('[Webcam] Error accessing camera:', err);
            setIsActive(false);
            return false;
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsActive(false);
    }, []);

    const startCapture = useCallback((onFrame) => {
        onFrameRef.current = onFrame;

        if (intervalRef.current) clearInterval(intervalRef.current);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        intervalRef.current = setInterval(() => {
            const video = videoRef.current;
            if (!video || video.readyState < 2) return;

            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const base64 = canvas.toDataURL('image/jpeg', 0.7);
            onFrameRef.current?.(base64);
        }, 1000 / fps);
    }, [fps]);

    const stopCapture = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            stopCapture();
            stopCamera();
        };
    }, [stopCapture, stopCamera]);

    return {
        videoRef,
        isActive,
        startCamera,
        stopCamera,
        startCapture,
        stopCapture,
    };
}
