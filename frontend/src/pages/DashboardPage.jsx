/**
 * DashboardPage — wraps the main detection dashboard.
 * The original App.jsx content extracted into its own route.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WebcamView from '../components/WebcamView';
import ConcentrationGauge from '../components/ConcentrationGauge';
import MetricsPanel from '../components/MetricsPanel';
import TimelineChart from '../components/TimelineChart';
import SessionStats from '../components/SessionStats';
import SettingsPanel from '../components/SettingsPanel';
import { useConcentraSocket } from '../hooks/useConcentraSocket';
import { useWebcam } from '../hooks/useWebcam';
import { useAlerts, DEFAULT_SETTINGS } from '../hooks/useAlerts';

/** Save a completed session to localStorage */
function saveSession(history, data) {
    if (!history || history.length < 5) return; // Too short to save
    const sessions = JSON.parse(localStorage.getItem('concentra-sessions') || '[]');

    // Calculate state distribution
    const stateCounts = {};
    history.forEach((pt) => {
        stateCounts[pt.state] = (stateCounts[pt.state] || 0) + 1;
    });
    const total = history.length;
    const stateDistribution = {};
    Object.entries(stateCounts).forEach(([state, count]) => {
        stateDistribution[state] = (count / total) * 100;
    });

    const avgConcentration =
        history.reduce((sum, pt) => sum + pt.concentration, 0) / total;

    sessions.push({
        timestamp: Date.now(),
        duration: data?.session_duration || 0,
        avgConcentration,
        samples: total,
        stateDistribution,
        focusRate: stateDistribution['Focused'] || 0,
        blinkCount: data?.blink_count || 0,
    });

    localStorage.setItem('concentra-sessions', JSON.stringify(sessions));
}

export default function DashboardPage() {
    const [isDetecting, setIsDetecting] = useState(false);
    const [history, setHistory] = useState([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [alertSettings, setAlertSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('concentra-alert-settings');
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });
    const historyRef = useRef([]);

    const { isConnected, data, connect, disconnect, sendFrame, resetSession } =
        useConcentraSocket();
    const { videoRef, isActive, startCamera, stopCamera, startCapture, stopCapture } =
        useWebcam(5);
    const { checkAndAlert, resetCooldown } = useAlerts(alertSettings);

    useEffect(() => {
        localStorage.setItem('concentra-alert-settings', JSON.stringify(alertSettings));
    }, [alertSettings]);

    const lastHistoryTimeRef = useRef(0);
    const handleFrame = useCallback(
        (base64Image) => {
            sendFrame(base64Image);
        },
        [sendFrame]
    );

    const prevDataRef = useRef(null);
    if (data && data !== prevDataRef.current && data.session_duration) {
        prevDataRef.current = data;
        checkAndAlert(data);
        const now = data.session_duration;
        if (now - lastHistoryTimeRef.current >= 1.0) {
            lastHistoryTimeRef.current = now;
            const newPoint = {
                time: now,
                concentration: data.concentration,
                state: data.state,
            };
            historyRef.current = [...historyRef.current.slice(-119), newPoint];
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
        setTimeout(() => {
            startCapture(handleFrame);
            setIsDetecting(true);
        }, 500);
    };

    const handleStop = () => {
        // Save session before stopping
        if (historyRef.current.length >= 5) {
            saveSession(historyRef.current, prevDataRef.current);
        }
        stopCapture();
        stopCamera();
        disconnect();
        setIsDetecting(false);
    };

    const handleReset = () => {
        stopCapture();
        stopCamera();
        disconnect();
        setIsDetecting(false);
        resetSession();
        resetCooldown();
        setHistory([]);
        historyRef.current = [];
        lastHistoryTimeRef.current = 0;
        prevDataRef.current = null;
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-brand">
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="navbar-logo">C</div>
                        <span className="navbar-title">ConcentraAI</span>
                    </Link>
                </div>
                <div className="navbar-status">
                    <span className="session-timer">
                        {(() => {
                            const s = data?.session_duration ?? 0;
                            const h = Math.floor(s / 3600);
                            const m = Math.floor((s % 3600) / 60);
                            const sec = Math.floor(s % 60);
                            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
                        })()}
                    </span>
                    <Link to="/history" className="btn-settings" title="Session History" style={{ textDecoration: 'none' }}>
                        📋
                    </Link>
                    <div
                        className={`connection-dot ${isConnected ? 'connected' : ''}`}
                        title={isConnected ? 'Connected' : 'Disconnected'}
                    />
                    <button className="btn-settings" onClick={() => setSettingsOpen(true)} title="Alert Settings">
                        ⚙
                    </button>
                </div>
            </nav>

            <main className="app-container">
                <div className="dashboard-grid">
                    <WebcamView ref={videoRef} isActive={isActive} isDetecting={isDetecting} />
                    <div className="sidebar">
                        <ConcentrationGauge
                            concentration={data?.concentration ?? 0}
                            state={data?.state ?? 'Absent'}
                        />
                        <MetricsPanel data={data} />
                        <div className="controls-card glass-card" id="controls">
                            <div className="controls-row">
                                {!isDetecting ? (
                                    <button className="btn btn-primary" onClick={handleStart}>▶ Start Detection</button>
                                ) : (
                                    <button className="btn btn-danger" onClick={handleStop}>■ Stop</button>
                                )}
                                <button className="btn btn-outline" onClick={handleReset}>↻ Reset</button>
                            </div>
                        </div>
                    </div>
                </div>
                <TimelineChart history={history} />
                <SessionStats data={data} history={history} />
            </main>

            <SettingsPanel
                settings={alertSettings}
                onSettingsChange={setAlertSettings}
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </>
    );
}
