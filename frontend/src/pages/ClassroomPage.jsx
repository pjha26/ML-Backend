/**
 * ClassroomPage — Teacher creates a room and sees a live grid of students.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

function getApiBase() {
    if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
    return '';
}

function getWsBase() {
    const api = getApiBase();
    if (api) return api.replace('https://', 'wss://').replace('http://', 'ws://');
    return `ws://${window.location.hostname}:8000`;
}

function getStateColor(state) {
    return { Focused: '#22c55e', Distracted: '#f97316', Sleepy: '#facc15', Absent: '#ef4444' }[state] || '#94a3b8';
}

function getStateEmoji(state) {
    return { Focused: '🟢', Distracted: '🟠', Sleepy: '😴', Absent: '👋' }[state] || '⚪';
}

export default function ClassroomPage() {
    const [step, setStep] = useState('create'); // create | lobby
    const [teacherName, setTeacherName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [roomData, setRoomData] = useState(null);
    const [error, setError] = useState('');
    const wsRef = useRef(null);

    const createRoom = async () => {
        if (!teacherName.trim()) {
            setError('Please enter your name');
            return;
        }
        setError('');
        try {
            const resp = await fetch(`${getApiBase()}/api/classroom/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacherName: teacherName.trim() }),
            });
            const data = await resp.json();
            setRoomCode(data.code);
            setStep('lobby');
            connectWs(data.code);
        } catch (e) {
            setError('Failed to create room. Is the backend running?');
        }
    };

    const connectWs = useCallback((code) => {
        const ws = new WebSocket(`${getWsBase()}/ws/classroom/${code}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (!data.error) setRoomData(data);
            } catch (e) { /* ignore */ }
        };

        ws.onclose = () => {
            // Attempt reconnect after 3s
            setTimeout(() => {
                if (step === 'lobby') connectWs(code);
            }, 3000);
        };
    }, [step]);

    const closeRoom = () => {
        if (wsRef.current) wsRef.current.close();
        setStep('create');
        setRoomCode('');
        setRoomData(null);
    };

    useEffect(() => {
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    // Calculate class averages
    const students = roomData?.students || [];
    const avgConcentration = students.length > 0
        ? students.reduce((s, st) => s + st.concentration, 0) / students.length
        : 0;
    const focusedCount = students.filter(s => s.state === 'Focused').length;

    return (
        <div className="classroom-page">
            <nav className="navbar">
                <div className="navbar-brand">
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="navbar-logo">C</div>
                        <span className="navbar-title">ConcentraAI</span>
                    </Link>
                </div>
                <div className="navbar-status">
                    {step === 'lobby' && (
                        <div className="classroom-code-badge">
                            Room: <strong>{roomCode}</strong>
                        </div>
                    )}
                    <Link to="/app" className="btn btn-outline" style={{ flex: 'none', padding: '10px 16px', fontSize: '13px' }}>
                        Dashboard
                    </Link>
                </div>
            </nav>

            <div className="app-container">
                {step === 'create' ? (
                    <div className="classroom-create">
                        <div className="classroom-hero glass-card">
                            <div className="classroom-hero-icon">🧑‍🏫</div>
                            <h1>Classroom Mode</h1>
                            <p>Create a room and monitor your students' focus in real-time.</p>

                            <div className="classroom-form">
                                <input
                                    type="text"
                                    className="classroom-input"
                                    placeholder="Your name (e.g., Prof. Smith)"
                                    value={teacherName}
                                    onChange={(e) => setTeacherName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && createRoom()}
                                    maxLength={30}
                                />
                                <button className="btn btn-primary" onClick={createRoom} style={{ width: '100%' }}>
                                    🚀 Create Room
                                </button>
                            </div>
                            {error && <p className="classroom-error">{error}</p>}

                            <div className="classroom-or">
                                <span>or</span>
                            </div>
                            <Link to="/join" className="btn btn-outline" style={{ width: '100%', maxWidth: '340px' }}>
                                🎓 Join as Student
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="classroom-lobby">
                        {/* Stats bar */}
                        <div className="classroom-stats">
                            <div className="classroom-stat glass-card">
                                <div className="classroom-stat-value">{students.length}</div>
                                <div className="classroom-stat-label">Students</div>
                            </div>
                            <div className="classroom-stat glass-card">
                                <div className="classroom-stat-value" style={{ color: avgConcentration >= 60 ? '#22c55e' : avgConcentration >= 30 ? '#f97316' : '#ef4444' }}>
                                    {Math.round(avgConcentration)}%
                                </div>
                                <div className="classroom-stat-label">Avg. Focus</div>
                            </div>
                            <div className="classroom-stat glass-card">
                                <div className="classroom-stat-value" style={{ color: '#22c55e' }}>
                                    {focusedCount}
                                </div>
                                <div className="classroom-stat-label">Focused</div>
                            </div>
                            <div className="classroom-stat glass-card">
                                <div className="classroom-stat-value" style={{ color: '#ef4444' }}>
                                    {students.length - focusedCount}
                                </div>
                                <div className="classroom-stat-label">Unfocused</div>
                            </div>
                        </div>

                        {/* Join instructions */}
                        <div className="classroom-join-info glass-card">
                            <p>Share this code with your students:</p>
                            <div className="classroom-code-display">
                                {roomCode.split('').map((c, i) => (
                                    <span key={i} className="classroom-code-char">{c}</span>
                                ))}
                            </div>
                            <p className="classroom-join-url">
                                or visit: <strong>{window.location.origin}/join/{roomCode}</strong>
                            </p>
                            <button className="btn btn-outline" style={{ fontSize: '12px', padding: '8px 16px' }} onClick={closeRoom}>
                                ✕ Close Room
                            </button>
                        </div>

                        {/* Student grid */}
                        {students.length === 0 ? (
                            <div className="classroom-empty glass-card">
                                <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
                                <h3>Waiting for students...</h3>
                                <p>Share the room code above with your students.</p>
                            </div>
                        ) : (
                            <div className="classroom-grid">
                                {students.map((student) => (
                                    <div key={student.clientId} className="classroom-student glass-card">
                                        <div className="classroom-student-header">
                                            <span className="classroom-student-name">{student.name}</span>
                                            <span style={{ fontSize: '14px' }}>
                                                {getStateEmoji(student.state)}
                                            </span>
                                        </div>
                                        <div className="classroom-student-score" style={{
                                            color: student.concentration >= 60 ? '#22c55e' :
                                                student.concentration >= 30 ? '#f97316' : '#ef4444'
                                        }}>
                                            {Math.round(student.concentration)}%
                                        </div>
                                        <div className="classroom-student-state" style={{ color: getStateColor(student.state) }}>
                                            {student.state}
                                        </div>
                                        {/* Mini focus bar */}
                                        <div className="classroom-student-bar">
                                            <div className="classroom-student-bar-fill" style={{
                                                width: `${student.concentration}%`,
                                                background: getStateColor(student.state),
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
