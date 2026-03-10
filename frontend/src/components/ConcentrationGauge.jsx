/**
 * ConcentrationGauge — circular SVG gauge with neon glow effect
 * showing concentration score and animated state badge.
 */

function getGaugeColor(score) {
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#f97316';
    return '#ef4444';
}

function getGlowFilter(score) {
    if (score >= 70) return 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.4))';
    if (score >= 40) return 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.4))';
    return 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))';
}

export default function ConcentrationGauge({ concentration = 0, state = 'Absent' }) {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (concentration / 100) * circumference;
    const gaugeColor = getGaugeColor(concentration);

    return (
        <div className="gauge-card glass-card fade-in" id="concentration-gauge">
            <div className="gauge-wrapper">
                <svg className="gauge-svg" viewBox="0 0 190 190" style={{ filter: getGlowFilter(concentration) }}>
                    <circle className="gauge-bg" cx="95" cy="95" r={radius} />
                    <circle
                        className="gauge-fill"
                        cx="95"
                        cy="95"
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
