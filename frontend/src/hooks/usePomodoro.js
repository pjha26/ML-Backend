import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Pomodoro timer hook — manages work/break cycles.
 *
 * Default: 25 min work, 5 min short break, 15 min long break (every 4 cycles).
 */

export const POMODORO_PRESETS = {
    classic: { work: 25, shortBreak: 5, longBreak: 15, label: 'Classic (25/5)' },
    short: { work: 15, shortBreak: 3, longBreak: 10, label: 'Short (15/3)' },
    long: { work: 50, shortBreak: 10, longBreak: 20, label: 'Long (50/10)' },
};

export function usePomodoro(preset = 'classic') {
    const config = POMODORO_PRESETS[preset] || POMODORO_PRESETS.classic;

    const [phase, setPhase] = useState('idle'); // idle | work | shortBreak | longBreak
    const [timeLeft, setTimeLeft] = useState(config.work * 60);
    const [totalTime, setTotalTime] = useState(config.work * 60);
    const [cycle, setCycle] = useState(1);
    const [isRunning, setIsRunning] = useState(false);
    const [pomodoroLog, setPomodoroLog] = useState([]); // { cycle, phase, avgConcentration }
    const intervalRef = useRef(null);
    const concentrationSumRef = useRef(0);
    const concentrationCountRef = useRef(0);

    // Track concentration data during work intervals
    const trackConcentration = useCallback((score) => {
        if (phase === 'work' && isRunning) {
            concentrationSumRef.current += score;
            concentrationCountRef.current += 1;
        }
    }, [phase, isRunning]);

    // Tick every second
    useEffect(() => {
        if (!isRunning) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Phase complete
                    clearInterval(intervalRef.current);
                    handlePhaseComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [isRunning, phase, cycle]);

    const handlePhaseComplete = useCallback(() => {
        // Log the completed phase
        if (phase === 'work') {
            const avg = concentrationCountRef.current > 0
                ? concentrationSumRef.current / concentrationCountRef.current
                : 0;
            setPomodoroLog((prev) => [...prev, {
                cycle,
                phase: 'work',
                avgConcentration: Math.round(avg),
                duration: totalTime,
            }]);
            concentrationSumRef.current = 0;
            concentrationCountRef.current = 0;
        }

        // Determine next phase
        if (phase === 'work') {
            if (cycle % 4 === 0) {
                setPhase('longBreak');
                const breakTime = config.longBreak * 60;
                setTimeLeft(breakTime);
                setTotalTime(breakTime);
            } else {
                setPhase('shortBreak');
                const breakTime = config.shortBreak * 60;
                setTimeLeft(breakTime);
                setTotalTime(breakTime);
            }
        } else {
            // Break finished → next work cycle
            setPhase('work');
            setCycle((c) => c + 1);
            const workTime = config.work * 60;
            setTimeLeft(workTime);
            setTotalTime(workTime);
        }

        setIsRunning(false);

        // Play notification sound
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;
            [523, 659, 784].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, now + i * 0.2);
                gain.gain.linearRampToValueAtTime(0.15, now + i * 0.2 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.2);
                osc.stop(now + (i + 1) * 0.2 + 0.1);
            });
            setTimeout(() => ctx.close(), 1000);
        } catch (e) { /* ignore */ }
    }, [phase, cycle, config, totalTime]);

    const start = useCallback(() => {
        if (phase === 'idle') {
            setPhase('work');
            const workTime = config.work * 60;
            setTimeLeft(workTime);
            setTotalTime(workTime);
        }
        setIsRunning(true);
    }, [phase, config]);

    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    const reset = useCallback(() => {
        setIsRunning(false);
        setPhase('idle');
        setTimeLeft(config.work * 60);
        setTotalTime(config.work * 60);
        setCycle(1);
        setPomodoroLog([]);
        concentrationSumRef.current = 0;
        concentrationCountRef.current = 0;
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, [config]);

    const skip = useCallback(() => {
        setIsRunning(false);
        handlePhaseComplete();
    }, [handlePhaseComplete]);

    return {
        phase,
        timeLeft,
        totalTime,
        cycle,
        isRunning,
        pomodoroLog,
        start,
        pause,
        reset,
        skip,
        trackConcentration,
    };
}
