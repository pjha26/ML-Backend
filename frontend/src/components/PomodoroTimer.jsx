/**
 * PomodoroTimer
 */
import { POMODORO_PRESETS } from '../hooks/usePomodoro';

const PHASE_CONFIG = {
    idle: { label: 'IDLE', color: 'rgba(255,255,255,0.2)' },
    work: { label: 'FOCUS', color: '#4F46E5' },
    shortBreak: { label: 'SHORT_BREAK', color: '#4F46E5' },
    longBreak: { label: 'LONG_BREAK', color: '#4F46E5' },
};

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function PomodoroTimer({
    phase, timeLeft, totalTime, cycle, isRunning,
    onStart, onPause, onSkip,
    preset, onPresetChange,
}) {
    const cfg = PHASE_CONFIG[phase] || PHASE_CONFIG.idle;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const progress = phase === 'idle' ? 0 : 1 - (timeLeft / totalTime);
    const offset = circumference - progress * circumference;

    return (
        <div style={{ 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border-main)', 
            borderRadius: '12px', 
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>SYS.TIMER</div>
                <select
                    value={preset}
                    onChange={(e) => onPresetChange(e.target.value)}
                    disabled={isRunning}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--border-main)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '4px'
                    }}
                >
                    {Object.entries(POMODORO_PRESETS).map(([key, val]) => (
                        <option key={key} value={key} style={{ background: 'var(--bg-surface)' }}>{val.label}</option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                    <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                        <circle
                            cx="60" cy="60" r={radius}
                            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"
                        />
                        <circle
                            cx="60" cy="60" r={radius}
                            fill="none" stroke={cfg.color} strokeWidth="4" strokeLinecap="round"
                            strokeDasharray={circumference} strokeDashoffset={offset}
                            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                        />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: 'var(--text-primary)' }}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: cfg.color }}>
                        [{cfg.label}]
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {[1, 2, 3, 4].map((i) => {
                            const active = i <= (cycle - 1) % 4 + (phase !== 'idle' ? 1 : 0);
                            return (
                                <div
                                    key={i}
                                    style={{
                                        width: '6px', height: '6px', borderRadius: '50%',
                                        background: active ? 'var(--accent)' : 'rgba(255,255,255,0.1)'
                                    }}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {!isRunning ? (
                    <button className="btn-system btn-ghost" onClick={onStart} style={{ border: '1px solid var(--border-main)' }}>
                        {phase === 'idle' ? 'START' : 'RESUME'}
                    </button>
                ) : (
                    <button className="btn-system btn-ghost" onClick={onPause} style={{ border: '1px solid var(--border-main)' }}>
                        PAUSE
                    </button>
                )}
                {phase !== 'idle' && (
                    <button className="btn-system btn-ghost" onClick={onSkip} style={{ flex: 0, padding: '14px', border: '1px solid var(--border-main)' }}>
                        ⏭
                    </button>
                )}
            </div>
        </div>
    );
}
