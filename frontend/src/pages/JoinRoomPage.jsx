/**
 * JoinRoomPage — Student joins a classroom room and runs detection.
 * The student's concentration updates are broadcast to the teacher via WebSocket roomCode.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import WebcamView from '../components/WebcamView';
import ConcentrationGauge from '../components/ConcentrationGauge';
import { useConcentraSocket } from '../hooks/useConcentraSocket';
import { useWebcam } from '../hooks/useWebcam';

function getApiBase() {
    if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
    return '';
}

export default function JoinRoomPage() {
    const { code: urlCode } = useParams();
    const navigate = useNavigate();

    const [step, setStep] = useState('join'); // join | active
    const [roomCode, setRoomCode] = useState(urlCode || '');
    const [studentName, setStudentName] = useState('');
    const [teacherName, setTeacherName] = useState('');
    const [error, setError] = useState('');
    const [isDetecting, setIsDetecting] = useState(false);

    const clientId = useRef(`student-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);

    const { isConnected, data, connect, disconnect, sendFrame } = useConcentraSocket();
    const { videoRef, isActive, startCamera, stopCamera, startCapture, stopCapture } = useWebcam(5);

    const joinRoom = async () => {
        if (!studentName.trim()) { setError('Enter your name'); return; }
        if (!roomCode.trim()) { setError('Enter room code'); return; }
        setError('');

        try {
            const resp = await fetch(`${getApiBase()}/api/classroom/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: roomCode.trim().toUpperCase(),
                    studentName: studentName.trim(),
                    clientId: clientId.current,
                }),
            });
            if (!resp.ok) {
                const err = await resp.json();
                setError(err.error || 'Room not found');
                return;
            }
            const result = await resp.json();
            setTeacherName(result.teacherName);
            setRoomCode(result.code);
            setStep('active');
        } catch (e) {
            setError('Failed to join. Is the backend running?');
        }
    };

    // Send frames with roomCode attached so backend forwards to teacher
    const handleFrame = useCallback(
        (base64Image) => {
            sendFrame(base64Image, roomCode.toUpperCase());
        },
        [sendFrame, roomCode]
    );

    const handleStart = async () => {
        const cameraOk = await startCamera();
        if (!cameraOk) { alert('Could not access webcam.'); return; }
        connect();
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

    const leaveRoom = async () => {
        handleStop();
        try {
            await fetch(`${getApiBase()}/api/classroom/${roomCode}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: clientId.current }),
            });
        } catch (e) { /* ignore */ }
        navigate('/classroom');
    };

    useEffect(() => {
        return () => {
            handleStop();
        };
    }, []);

    return (
        <div className="join-page">
            <nav className="navbar">
                <div className="navbar-brand">
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="navbar-logo">C</div>
                        <span className="navbar-title">ConcentraAI</span>
                    </Link>
                </div>
                <div className="navbar-status">
                    {step === 'active' && (
                        <div className="classroom-code-badge">
                            Room: <strong>{roomCode}</strong> · {teacherName}
                        </div>
                    )}
                </div>
            </nav>

            <div className="app-container">
                {step === 'join' ? (
                    <div className="classroom-create">
                        <div className="classroom-hero glass-card">
                            <div className="classroom-hero-icon">🎓</div>
                            <h1>Join Classroom</h1>
                            <p>Enter the room code from your teacher to start.</p>

                            <div className="classroom-form">
                                <input
                                    type="text"
                                    className="classroom-input"
                                    placeholder="Your name"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    maxLength={30}
                                />
                                <input
                                    type="text"
                                    className="classroom-input"
                                    placeholder="Room code (e.g., ABC123)"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                                    maxLength={6}
                                    style={{ textAlign: 'center', letterSpacing: '4px', fontWeight: 700 }}
                                />
                                <button className="btn btn-primary" onClick={joinRoom} style={{ width: '100%' }}>
                                    🎓 Join Room
                                </button>
                            </div>
                            {error && <p className="classroom-error">{error}</p>}

                            <div className="classroom-or"><span>or</span></div>
                            <Link to="/classroom" className="btn btn-outline" style={{ width: '100%', maxWidth: '340px' }}>
                                🧑‍🏫 Create a Room
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="join-active">
                        <div className="join-active-info glass-card">
                            <span>Connected to <strong>{teacherName}'s</strong> room</span>
                            <button className="btn btn-outline" onClick={leaveRoom} style={{ fontSize: '12px', padding: '8px 14px' }}>
                                Leave Room
                            </button>
                        </div>
                        <div className="join-grid">
                            <WebcamView ref={videoRef} isActive={isActive} isDetecting={isDetecting} />
                            <div className="sidebar">
                                <ConcentrationGauge
                                    concentration={data?.concentration ?? 0}
                                    state={data?.state ?? 'Absent'}
                                />
                                <div className="controls-card glass-card" id="controls">
                                    <div className="controls-row">
                                        {!isDetecting ? (
                                            <button className="btn btn-primary" onClick={handleStart}>▶ Start</button>
                                        ) : (
                                            <button className="btn btn-danger" onClick={handleStop}>■ Stop</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
