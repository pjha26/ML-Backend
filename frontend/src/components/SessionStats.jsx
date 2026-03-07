/**
 * SessionStats — bottom stats row showing session summary cards
 */
export default function SessionStats({ data, history = [] }) {
    const avgConcentration =
        history.length > 0
            ? Math.round(history.reduce((sum, d) => sum + d.concentration, 0) / history.length)
            : 0;

    const focusedCount = history.filter((d) => d.state === 'Focused').length;
    const focusRate = history.length > 0 ? Math.round((focusedCount / history.length) * 100) : 0;

    return (
        <div className="session-stats" id="session-stats">
            <div className="stat-card glass-card fade-in">
                <div className="stat-value" style={{ color: 'var(--cyan)' }}>
                    {avgConcentration}%
                </div>
                <div className="stat-label">Avg Concentration</div>
            </div>
            <div className="stat-card glass-card fade-in">
                <div className="stat-value" style={{ color: 'var(--green)' }}>
                    {focusRate}%
                </div>
                <div className="stat-label">Focus Rate</div>
            </div>
            <div className="stat-card glass-card fade-in">
                <div className="stat-value" style={{ color: 'var(--purple)' }}>
                    {data?.blink_count ?? 0}
                </div>
                <div className="stat-label">Total Blinks</div>
            </div>
            <div className="stat-card glass-card fade-in">
                <div className="stat-value" style={{ color: 'var(--orange)' }}>
                    {history.length}
                </div>
                <div className="stat-label">Samples</div>
            </div>
        </div>
    );
}
