/**
 * ConcentrationGauge
 */
function getGaugeColor(score) {
    if (score >= 70) return '#22C55E';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
}

function hexToRgba(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ConcentrationGauge({ concentration = 0, state = 'Absent' }) {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (concentration / 100) * circumference;
    const color = getGaugeColor(concentration);

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                <svg viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    <circle 
                        cx="100" cy="100" r={radius} 
                        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" 
                    />
                    <circle 
                        cx="100" cy="100" r={radius} 
                        fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
                    />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '56px', color: 'white', lineHeight: 1 }}>
                        {Math.round(concentration)}
                    </span>
                </div>
            </div>
            
            <div style={{ 
                marginTop: '16px', 
                background: hexToRgba(color, 0.15), 
                color: color, 
                padding: '6px 16px', 
                borderRadius: '999px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                textTransform: 'uppercase',
                fontWeight: 700,
                border: `1px solid ${hexToRgba(color, 0.3)}`
            }}>
                {state}
            </div>
        </div>
    );
}
