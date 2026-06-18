import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WebcamView from '../components/WebcamView';
import ConcentrationGauge from '../components/ConcentrationGauge';
import MetricsPanel from '../components/MetricsPanel';
import TimelineChart from '../components/TimelineChart';
import SessionStats from '../components/SessionStats';
import SettingsPanel from '../components/SettingsPanel';
import PomodoroTimer from '../components/PomodoroTimer';
import { SkeletonGauge, SkeletonMetrics, SkeletonTimeline, SkeletonStats } from '../components/SkeletonLoader';
import { useConcentraSocket } from '../hooks/useConcentraSocket';
import { useWebcam } from '../hooks/useWebcam';
import { useAlerts, DEFAULT_SETTINGS } from '../hooks/useAlerts';
import { usePomodoro } from '../hooks/usePomodoro';

function saveSession(history, data) {
    if (!history || history.length < 5) return;
    const sessions = JSON.parse(localStorage.getItem('concentra-sessions') || '[]');

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
    const [pomodoroPreset, setPomodoroPreset] = useState('classic');
    const historyRef = useRef([]);

    const { isConnected, data, connect, disconnect, sendFrame, resetSession } =
        useConcentraSocket();
    const { videoRef, isActive, startCamera, stopCamera, startCapture, stopCapture } =
        useWebcam(5);
    const { checkAndAlert, resetCooldown } = useAlerts(alertSettings);
    const pomodoro = usePomodoro(pomodoroPreset);

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
    useEffect(() => {
        if (data && data !== prevDataRef.current && data.session_duration) {
            prevDataRef.current = data;
            checkAndAlert(data);
            pomodoro.trackConcentration(data.concentration);
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
    }, [data, checkAndAlert, pomodoro, history.length]);

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
                <Link to="/" className="navbar-brand">
                    <div style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: 2 }} />
                    CONCENTRA_AI
                </Link>
                <div className="session-timer">
                    {(() => {
                        const s = data?.session_duration ?? 0;
                        const h = Math.floor(s / 3600);
                        const m = Math.floor((s % 3600) / 60);
                        const sec = Math.floor(s % 60);
                        return (
                            <>
                                {String(h).padStart(2, '0')}
                                <span className={isDetecting ? "colon" : ""}>:</span>
                                {String(m).padStart(2, '0')}
                                <span className={isDetecting ? "colon" : ""}>:</span>
                                {String(sec).padStart(2, '0')}
                            </>
                        );
                    })()}
                </div>
                <div className="navbar-status">
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
                    {/* Left 65% - Webcam View */}
                    <div className="webcam-wrapper">
                        <WebcamView ref={videoRef} isActive={isActive} isDetecting={isDetecting} />
                    </div>

                    {/* Right 35% - Sidebar */}
                    <div className="sidebar">
                        {data ? (
                            <>
                                <ConcentrationGauge
                                    concentration={data.concentration}
                                    state={data.state}
                                />
                                <MetricsPanel data={data} />
                            </>
                        ) : (
                            <>
                                <SkeletonGauge />
                                <SkeletonMetrics />
                            </>
                        )}
                        
                        <PomodoroTimer
                            phase={pomodoro.phase}
                            timeLeft={pomodoro.timeLeft}
                            totalTime={pomodoro.totalTime}
                            cycle={pomodoro.cycle}
                            isRunning={pomodoro.isRunning}
                            pomodoroLog={pomodoro.pomodoroLog}
                            onStart={pomodoro.start}
                            onPause={pomodoro.pause}
                            onReset={pomodoro.reset}
                            onSkip={pomodoro.skip}
                            preset={pomodoroPreset}
                            onPresetChange={setPomodoroPreset}
                        />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {!isDetecting ? (
                                <button className="btn-system btn-primary" onClick={handleStart}>START SESSION</button>
                            ) : (
                                <button className="btn-system btn-danger" onClick={handleStop}>STOP SESSION</button>
                            )}
                            <button className="btn-system btn-ghost" onClick={handleReset}>RESET DATA</button>
                        </div>
                    </div>
                </div>

                {data || history.length > 0 ? (
                    <>
                        <TimelineChart history={history} />
                        <SessionStats data={data} history={history} />
                    </>
                ) : (
                    <>
                        <SkeletonTimeline />
                        <SkeletonStats />
                    </>
                )}
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
