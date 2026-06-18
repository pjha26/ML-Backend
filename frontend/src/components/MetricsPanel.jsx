/**
 * MetricsPanel
 */
export default function MetricsPanel({ data }) {
    const ear = data?.ear ?? '—';
    const yaw = data?.yaw ?? '—';
    const gazeH = data?.gaze_h ?? '—';
    const blinks = data?.blink_count ?? 0;

    // A simple heuristic for "healthy" metrics just to trigger the subtle glow
    const isHealthy = data && data.state !== 'Absent' && data.state !== 'Sleepy';

    return (
        <div className="metrics-grid fade-in">
            <div className={`metric-item ${isHealthy ? 'healthy' : ''}`}>
                <div className="metric-label">EAR</div>
                <div className="metric-value">
                    {typeof ear === 'number' ? ear.toFixed(3) : ear}
                </div>
            </div>
            <div className={`metric-item ${isHealthy ? 'healthy' : ''}`}>
                <div className="metric-label">Yaw</div>
                <div className="metric-value">
                    {typeof yaw === 'number' ? yaw.toFixed(1) : yaw}
                </div>
            </div>
            <div className={`metric-item ${isHealthy ? 'healthy' : ''}`}>
                <div className="metric-label">Gaze H</div>
                <div className="metric-value">
                    {typeof gazeH === 'number' ? gazeH.toFixed(3) : gazeH}
                </div>
            </div>
            <div className={`metric-item ${isHealthy ? 'healthy' : ''}`}>
                <div className="metric-label">Blinks</div>
                <div className="metric-value">{blinks}</div>
            </div>
        </div>
    );
}
