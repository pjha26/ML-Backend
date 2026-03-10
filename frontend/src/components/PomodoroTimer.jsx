/**
 * PomodoroTimer — visual circular countdown timer with cycle info.
 */
import { POMODORO_PRESETS } from '../hooks/usePomodoro';

const PHASE_CONFIG = {
    idle: { label: 'Ready', color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.08)' },
    work: { label: 'Focus', color: '#00e5ff', bgColor: 'rgba(0, 229, 255, 0.08)' },
    shortBreak: { label: 'Short Break', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.08)' },
    longBreak: { label: 'Long Break', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.08)' },
};

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function PomodoroTimer({
    phase, timeLeft, totalTime, cycle, isRunning,
    pomodoroLog, onStart, onPause, onReset, onSkip,
    preset, onPresetChange,
}) {
    const cfg = PHASE_CONFIG[phase] || PHASE_CONFIG.idle;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const progress = phase === 'idle' ? 0 : 1 - timeLeft / totalTime;
    const offset = circumference - progress * circumference;

    return (
        <div className="pomodoro-card glass-card" id="pomodoro">
            {/* Header */}
            <div className="pomodoro-header">
                <h3>🍅 Pomodoro</h3>
                <select
                    className="pomodoro-preset"
                    value={preset}
                    onChange={(e) => onPresetChange(e.target.value)}
                    disabled={isRunning}
                >
                    {Object.entries(POMODORO_PRESETS).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                    ))}
                </select>
            </div>

            {/* Timer Ring */}
            <div className="pomodoro-ring-wrapper">
                <svg className="pomodoro-ring" viewBox="0 0 160 160">
                    <circle
                        cx="80" cy="80" r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.04)"
                        strokeWidth="6"
                    />
                    <circle
                        cx="80" cy="80" r={radius}
                        fill="none"
                        stroke={cfg.color}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{
                            transform: 'rotate(-90deg)',
                            transformOrigin: '80px 80px',
                            transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
                            filter: `drop-shadow(0 0 6px ${cfg.color}40)`,
                        }}
                    />
                </svg>
                <div className="pomodoro-time-display">
                    <div className="pomodoro-time" style={{ color: cfg.color }}>
                        {formatTime(timeLeft)}
                    </div>
                    <div className="pomodoro-phase-label" style={{ color: cfg.color }}>
                        {cfg.label}
                    </div>
                </div>
            </div>

            {/* Cycle info */}
            <div className="pomodoro-cycle">
                <span>Cycle {cycle}</span>
                <span className="pomodoro-dots">
                    {[1, 2, 3, 4].map((i) => (
                        <span
                            key={i}
                            className="pomodoro-dot"
                            style={{
                                background: i <= (cycle - 1) % 4 + (phase !== 'idle' ? 1 : 0)
                                    ? cfg.color : 'rgba(255,255,255,0.08)',
                                boxShadow: i <= (cycle - 1) % 4 + (phase !== 'idle' ? 1 : 0)
                                    ? `0 0 6px ${cfg.color}50` : 'none',
                            }}
                        />
                    ))}
                </span>
            </div>

            {/* Controls */}
            <div className="pomodoro-controls">
                {!isRunning ? (
                    <button className="btn btn-primary" onClick={onStart} style={{ flex: 1 }}>
                        {phase === 'idle' ? '▶ Start' : '▶ Resume'}
                    </button>
                ) : (
                    <button className="btn btn-outline" onClick={onPause} style={{ flex: 1 }}>
                        ⏸ Pause
                    </button>
                )}
                {phase !== 'idle' && (
                    <button className="btn btn-outline" onClick={onSkip} style={{ flex: 'none', padding: '12px 16px' }}>
                        ⏭
                    </button>
                )}
                <button className="btn btn-outline" onClick={onReset} style={{ flex: 'none', padding: '12px 16px' }}>
                    ↻
                </button>
            </div>

            {/* Mini log */}
            {pomodoroLog.length > 0 && (
                <div className="pomodoro-log">
                    {pomodoroLog.map((entry, i) => (
                        <div key={i} className="pomodoro-log-item">
                            <span>#{entry.cycle}</span>
                            <span
                                className="pomodoro-log-score"
                                style={{
                                    color: entry.avgConcentration >= 60 ? '#22c55e' :
                                        entry.avgConcentration >= 30 ? '#f97316' : '#ef4444'
                                }}
                            >
                                {entry.avgConcentration}%
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
