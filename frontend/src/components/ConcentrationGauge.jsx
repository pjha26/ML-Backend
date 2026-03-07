/**
 * ConcentrationGauge — circular SVG gauge showing concentration score
 * with gradient arc and state badge.
 */

const STATE_CONFIG = {
    Focused: { color: '#10b981' },
    Distracted: { color: '#f59e0b' },
    Sleepy: { color: '#eab308' },
    Absent: { color: '#ef4444' },
};

function getGaugeColor(score) {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
}

export default function ConcentrationGauge({ concentration = 0, state = 'Absent' }) {
    const radius = 75;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (concentration / 100) * circumference;
    const gaugeColor = getGaugeColor(concentration);
    const stateColor = STATE_CONFIG[state]?.color || '#ef4444';

    return (
        <div className="gauge-card glass-card fade-in" id="concentration-gauge">
            <div className="gauge-wrapper">
                <svg className="gauge-svg" viewBox="0 0 180 180">
                    <circle
                        className="gauge-bg"
                        cx="90"
                        cy="90"
                        r={radius}
                    />
                    <circle
                        className="gauge-fill"
                        cx="90"
                        cy="90"
                        r={radius}
                        stroke={gaugeColor}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                </svg>
                <div className="gauge-score">
                    <div className="gauge-score-value" style={{ color: gaugeColor }}>
                        {Math.round(concentration)}
                    </div>
                    <div className="gauge-score-label">Concentration</div>
                </div>
            </div>
            <div className={`state-badge state-${state}`}>
                <span className="state-dot" />
                {state}
            </div>
        </div>
    );
}
