/**
 * HistoryPage — session history with saved session data
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function getStateColor(state) {
    const colors = { Focused: '#22c55e', Distracted: '#f97316', Sleepy: '#facc15', Absent: '#ef4444' };
    return colors[state] || '#94a3b8';
}

export default function HistoryPage() {
    const [sessions, setSessions] = useState([]);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('concentra-sessions') || '[]');
        setSessions(saved.reverse()); // newest first
    }, []);

    const clearHistory = () => {
        if (confirm('Clear all session history?')) {
            localStorage.removeItem('concentra-sessions');
            setSessions([]);
            setSelected(null);
        }
    };

    return (
        <div className="history-page">
            {/* Nav */}
            <nav className="navbar">
                <div className="navbar-brand">
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="navbar-logo">C</div>
                        <span className="navbar-title">ConcentraAI</span>
                    </Link>
                </div>
                <div className="navbar-status">
                    <Link to="/app" className="btn btn-primary" style={{ flex: 'none', padding: '10px 20px', fontSize: '13px' }}>
                        ▶ New Session
                    </Link>
                </div>
            </nav>

            <div className="app-container">
                <div className="history-header">
                    <div>
                        <h1 className="history-title">Session History</h1>
                        <p className="history-subtitle">{sessions.length} sessions recorded</p>
                    </div>
                    {sessions.length > 0 && (
                        <button className="btn btn-outline" style={{ flex: 'none', padding: '10px 18px', fontSize: '13px' }} onClick={clearHistory}>
                            🗑 Clear All
                        </button>
                    )}
                </div>

                {sessions.length === 0 ? (
                    <div className="history-empty glass-card">
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                        <h3>No sessions yet</h3>
                        <p>Start a concentration tracking session to see your history here.</p>
                        <Link to="/app" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block', padding: '12px 28px' }}>
                            Start First Session
                        </Link>
                    </div>
                ) : (
                    <div className="history-grid">
                        {sessions.map((session, i) => {
                            const topState = Object.entries(session.stateDistribution || {})
                                .sort((a, b) => b[1] - a[1])[0];

                            return (
                                <div
                                    key={i}
                                    className={`history-card glass-card ${selected === i ? 'selected' : ''}`}
                                    onClick={() => setSelected(selected === i ? null : i)}
                                >
                                    <div className="history-card-header">
                                        <span className="history-date">{formatDate(session.timestamp)}</span>
                                        <span
                                            className="history-score"
                                            style={{ color: session.avgConcentration >= 60 ? '#22c55e' : session.avgConcentration >= 30 ? '#f97316' : '#ef4444' }}
                                        >
                                            {Math.round(session.avgConcentration)}%
                                        </span>
                                    </div>
                                    <div className="history-card-body">
                                        <div className="history-meta">
                                            <span>⏱ {formatDuration(session.duration)}</span>
                                            <span>📊 {session.samples} samples</span>
                                        </div>
                                        {/* State distribution bar */}
                                        <div className="history-bar">
                                            {Object.entries(session.stateDistribution || {}).map(([state, pct]) => (
                                                pct > 0 && (
                                                    <div
                                                        key={state}
                                                        className="history-bar-seg"
                                                        style={{ width: `${pct}%`, background: getStateColor(state) }}
                                                        title={`${state}: ${Math.round(pct)}%`}
                                                    />
                                                )
                                            ))}
                                        </div>
                                        <div className="history-states">
                                            {Object.entries(session.stateDistribution || {}).map(([state, pct]) => (
                                                <span key={state} className="history-state-tag" style={{ color: getStateColor(state) }}>
                                                    {state}: {Math.round(pct)}%
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {selected === i && session.aiInsight && (
                                        <div className="history-insight">
                                            <div className="history-insight-label">🤖 AI Insight</div>
                                            <p>{session.aiInsight}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
