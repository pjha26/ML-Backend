/**
 * MetricsPanel — displays real-time metrics: EAR, Yaw, Gaze, Blinks
 */
export default function MetricsPanel({ data }) {
    const ear = data?.ear ?? '—';
    const yaw = data?.yaw ?? '—';
    const gazeH = data?.gaze_h ?? '—';
    const blinks = data?.blink_count ?? 0;

    return (
        <div className="metrics-card glass-card fade-in" id="metrics-panel">
            <h3>Real-time Metrics</h3>
            <div className="metrics-grid">
                <div className="metric-item">
                    <div className="metric-label">Eye Aspect Ratio</div>
                    <div className="metric-value cyan">
                        {typeof ear === 'number' ? ear.toFixed(3) : ear}
                    </div>
                </div>
                <div className="metric-item">
                    <div className="metric-label">Head Yaw</div>
                    <div className="metric-value purple">
                        {typeof yaw === 'number' ? `${yaw.toFixed(1)}°` : yaw}
                    </div>
                </div>
                <div className="metric-item">
                    <div className="metric-label">Gaze Position</div>
                    <div className="metric-value green">
                        {typeof gazeH === 'number' ? gazeH.toFixed(3) : gazeH}
                    </div>
                </div>
                <div className="metric-item">
                    <div className="metric-label">Blink Count</div>
                    <div className="metric-value orange">{blinks}</div>
                </div>
            </div>
        </div>
    );
}
