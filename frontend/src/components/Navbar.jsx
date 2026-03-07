/**
 * Navbar component — top navigation bar with app title, session timer, and connection status.
 */
export default function Navbar({ sessionDuration, isConnected }) {
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <div className="navbar-logo">C</div>
                <span className="navbar-title">ConcentraAI</span>
            </div>
            <div className="navbar-status">
                <span className="session-timer">{formatTime(sessionDuration)}</span>
                <div
                    className={`connection-dot ${isConnected ? 'connected' : ''}`}
                    title={isConnected ? 'Connected' : 'Disconnected'}
                />
            </div>
        </nav>
    );
}
