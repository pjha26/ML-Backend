import { useRef, useCallback, useEffect } from 'react';

/**
 * Default alert settings.
 */
export const DEFAULT_SETTINGS = {
    alertsEnabled: true,
    browserNotifications: true,
    audioAlerts: true,
    concentrationThreshold: 30,     // Alert when score drops below this
    sleepyAlertEnabled: true,
    distractedAlertEnabled: true,
    absentAlertEnabled: true,
    cooldownSeconds: 15,            // Min seconds between alerts
    audioVolume: 0.5,
};

/**
 * Generate a gentle chime sound using Web Audio API.
 */
function playChime(type = 'distracted', volume = 0.5) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;

        // Different tones for different states
        const tones = {
            distracted: [523.25, 659.25],       // C5, E5 — gentle two-note chime
            sleepy: [392.00, 493.88, 392.00], // G4, B4, G4 — slow descending
            absent: [440.00, 349.23],         // A4, F4 — attention-grab
        };

        const notes = tones[type] || tones.distracted;
        const noteLength = type === 'sleepy' ? 0.4 : 0.25;

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            // Smooth envelope
            gain.gain.setValueAtTime(0, now + i * noteLength);
            gain.gain.linearRampToValueAtTime(volume * 0.3, now + i * noteLength + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * noteLength);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + i * noteLength);
            osc.stop(now + (i + 1) * noteLength + 0.1);
        });

        // Close context after sounds finish
        setTimeout(() => ctx.close(), (notes.length * noteLength + 0.5) * 1000);
    } catch (e) {
        console.warn('[Alerts] Audio playback failed:', e);
    }
}

/**
 * Request browser notification permission.
 */
async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
}

/**
 * Show a browser notification.
 */
function showNotification(title, body, tag) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
        const notification = new Notification(title, {
            body,
            icon: '/vite.svg',
            tag,  // Prevents duplicate notifications
            silent: true,
            requireInteraction: false,
        });
        setTimeout(() => notification.close(), 5000);
    } catch (e) {
        console.warn('[Alerts] Notification failed:', e);
    }
}

/**
 * Custom hook for managing smart distraction alerts.
 */
export function useAlerts(settings) {
    const lastAlertTimeRef = useRef(0);
    const permissionRequestedRef = useRef(false);

    // Request notification permission on first enable
    useEffect(() => {
        if (settings.browserNotifications && !permissionRequestedRef.current) {
            permissionRequestedRef.current = true;
            requestNotificationPermission();
        }
    }, [settings.browserNotifications]);

    const checkAndAlert = useCallback((data) => {
        if (!settings.alertsEnabled || !data) return;

        const now = Date.now();
        const cooldown = settings.cooldownSeconds * 1000;

        // Don't spam alerts
        if (now - lastAlertTimeRef.current < cooldown) return;

        const { state, concentration } = data;
        let shouldAlert = false;
        let alertType = 'distracted';
        let title = '';
        let body = '';

        // Check sleepy state
        if (state === 'Sleepy' && settings.sleepyAlertEnabled) {
            shouldAlert = true;
            alertType = 'sleepy';
            title = '😴 Feeling Sleepy?';
            body = 'Your eyes have been closed for a while. Take a short break or splash some water!';
        }
        // Check absent state
        else if (state === 'Absent' && settings.absentAlertEnabled) {
            shouldAlert = true;
            alertType = 'absent';
            title = '👋 Are you there?';
            body = 'No face detected. Come back to continue your study session!';
        }
        // Check distracted state + low concentration
        else if (state === 'Distracted' && settings.distractedAlertEnabled) {
            if (concentration <= settings.concentrationThreshold) {
                shouldAlert = true;
                alertType = 'distracted';
                title = '🎯 Stay Focused!';
                body = `Your concentration dropped to ${Math.round(concentration)}%. Look back at your screen.`;
            }
        }
        // Check concentration threshold regardless of state
        else if (concentration <= settings.concentrationThreshold && concentration > 0) {
            shouldAlert = true;
            alertType = 'distracted';
            title = '⚠️ Low Concentration';
            body = `Score: ${Math.round(concentration)}%. Try to refocus on your work.`;
        }

        if (!shouldAlert) return;

        lastAlertTimeRef.current = now;

        // Browser notification
        if (settings.browserNotifications) {
            showNotification(title, body, `concentra-${alertType}`);
        }

        // Audio alert
        if (settings.audioAlerts) {
            playChime(alertType, settings.audioVolume);
        }
    }, [settings]);

    const resetCooldown = useCallback(() => {
        lastAlertTimeRef.current = 0;
    }, []);

    return { checkAndAlert, resetCooldown };
}
