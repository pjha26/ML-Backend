import { useState, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import WebcamView from './components/WebcamView';
import ConcentrationGauge from './components/ConcentrationGauge';
import MetricsPanel from './components/MetricsPanel';
import TimelineChart from './components/TimelineChart';
import SessionStats from './components/SessionStats';
import { useConcentraSocket } from './hooks/useConcentraSocket';
import { useWebcam } from './hooks/useWebcam';

export default function App() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [history, setHistory] = useState([]);
  const historyRef = useRef([]);

  const { isConnected, data, connect, disconnect, sendFrame, resetSession } =
    useConcentraSocket();
  const { videoRef, isActive, startCamera, stopCamera, startCapture, stopCapture } =
    useWebcam(5); // 5 FPS

  // Track history from ML data
  const lastHistoryTimeRef = useRef(0);
  const handleFrame = useCallback(
    (base64Image) => {
      sendFrame(base64Image);
    },
    [sendFrame]
  );

  // Update history when data changes
  const prevDataRef = useRef(null);
  if (data && data !== prevDataRef.current && data.session_duration) {
    prevDataRef.current = data;
    const now = data.session_duration;
    if (now - lastHistoryTimeRef.current >= 1.0) {
      lastHistoryTimeRef.current = now;
      const newPoint = {
        time: now,
        concentration: data.concentration,
        state: data.state,
      };
      historyRef.current = [...historyRef.current.slice(-119), newPoint];
      // We use a ref + state pattern to avoid stale closures
      if (historyRef.current.length !== history.length) {
        setHistory([...historyRef.current]);
      }
    }
  }

  const handleStart = async () => {
    const cameraOk = await startCamera();
    if (!cameraOk) {
      alert('Could not access webcam. Please check camera permissions.');
      return;
    }
    connect();
    // Wait briefly for WebSocket to connect, then start capture
    setTimeout(() => {
      startCapture(handleFrame);
      setIsDetecting(true);
    }, 500);
  };

  const handleStop = () => {
    stopCapture();
    stopCamera();
    disconnect();
    setIsDetecting(false);
  };

  const handleReset = () => {
    handleStop();
    resetSession();
    setHistory([]);
    historyRef.current = [];
    lastHistoryTimeRef.current = 0;
    prevDataRef.current = null;
  };

  return (
    <>
      <Navbar
        sessionDuration={data?.session_duration ?? 0}
        isConnected={isConnected}
      />

      <main className="app-container">
        <div className="dashboard-grid">
          {/* Left — Webcam */}
          <WebcamView
            ref={videoRef}
            isActive={isActive}
            isDetecting={isDetecting}
          />

          {/* Right — Sidebar */}
          <div className="sidebar">
            <ConcentrationGauge
              concentration={data?.concentration ?? 0}
              state={data?.state ?? 'Absent'}
            />

            <MetricsPanel data={data} />

            <div className="controls-card glass-card" id="controls">
              <div className="controls-row">
                {!isDetecting ? (
                  <button className="btn btn-primary" onClick={handleStart}>
                    ▶ Start Detection
                  </button>
                ) : (
                  <button className="btn btn-danger" onClick={handleStop}>
                    ■ Stop
                  </button>
                )}
                <button className="btn btn-outline" onClick={handleReset}>
                  ↻ Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        <TimelineChart history={history} />

        {/* Session Stats */}
        <SessionStats data={data} history={history} />
      </main>
    </>
  );
}
