/**
 * SettingsPanel — slide-out panel for configuring alert thresholds.
 */
import { useState } from 'react';

export default function SettingsPanel({ settings, onSettingsChange, isOpen, onClose }) {
    const update = (key, value) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && <div className="settings-backdrop" onClick={onClose} />}

            {/* Panel */}
            <div className={`settings-panel glass-card ${isOpen ? 'open' : ''}`}>
                <div className="settings-header">
                    <h2>⚙️ Alert Settings</h2>
                    <button className="settings-close" onClick={onClose}>✕</button>
                </div>

                <div className="settings-body">
                    {/* Master Toggle */}
                    <div className="setting-group">
                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label">Enable Alerts</span>
                                <span className="setting-desc">Master toggle for all alerts</span>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.alertsEnabled}
                                    onChange={(e) => update('alertsEnabled', e.target.checked)}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                    </div>

                    {/* Notification Types */}
                    <div className="setting-group">
                        <h3 className="setting-group-title">Notification Types</h3>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label">🔔 Browser Notifications</span>
                                <span className="setting-desc">Desktop popup notifications</span>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.browserNotifications}
                                    onChange={(e) => update('browserNotifications', e.target.checked)}
                                    disabled={!settings.alertsEnabled}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label">🔊 Audio Alerts</span>
                                <span className="setting-desc">Gentle chime sounds</span>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.audioAlerts}
                                    onChange={(e) => update('audioAlerts', e.target.checked)}
                                    disabled={!settings.alertsEnabled}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        {settings.audioAlerts && settings.alertsEnabled && (
                            <div className="setting-row slider-row">
                                <div className="setting-info">
                                    <span className="setting-label">Volume</span>
                                    <span className="setting-value">{Math.round(settings.audioVolume * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={settings.audioVolume}
                                    onChange={(e) => update('audioVolume', parseFloat(e.target.value))}
                                    className="range-slider"
                                />
                            </div>
                        )}
                    </div>

                    {/* Alert Triggers */}
                    <div className="setting-group">
                        <h3 className="setting-group-title">Alert Triggers</h3>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label">😴 Sleepy Detection</span>
                                <span className="setting-desc">Alert when eyes closed too long</span>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.sleepyAlertEnabled}
                                    onChange={(e) => update('sleepyAlertEnabled', e.target.checked)}
                                    disabled={!settings.alertsEnabled}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label">🎯 Distraction Alert</span>
                                <span className="setting-desc">Alert when looking away</span>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.distractedAlertEnabled}
                                    onChange={(e) => update('distractedAlertEnabled', e.target.checked)}
                                    disabled={!settings.alertsEnabled}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label">👋 Absent Alert</span>
                                <span className="setting-desc">Alert when no face detected</span>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.absentAlertEnabled}
                                    onChange={(e) => update('absentAlertEnabled', e.target.checked)}
                                    disabled={!settings.alertsEnabled}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                    </div>

                    {/* Thresholds */}
                    <div className="setting-group">
                        <h3 className="setting-group-title">Thresholds</h3>

                        <div className="setting-row slider-row">
                            <div className="setting-info">
                                <span className="setting-label">Concentration Threshold</span>
                                <span className="setting-desc">Alert when score drops below</span>
                            </div>
                            <div className="slider-with-value">
                                <input
                                    type="range"
                                    min="10"
                                    max="80"
                                    step="5"
                                    value={settings.concentrationThreshold}
                                    onChange={(e) => update('concentrationThreshold', parseInt(e.target.value))}
                                    className="range-slider"
                                    disabled={!settings.alertsEnabled}
                                />
                                <span className="setting-value">{settings.concentrationThreshold}%</span>
                            </div>
                        </div>

                        <div className="setting-row slider-row">
                            <div className="setting-info">
                                <span className="setting-label">Alert Cooldown</span>
                                <span className="setting-desc">Min seconds between alerts</span>
                            </div>
                            <div className="slider-with-value">
                                <input
                                    type="range"
                                    min="5"
                                    max="60"
                                    step="5"
                                    value={settings.cooldownSeconds}
                                    onChange={(e) => update('cooldownSeconds', parseInt(e.target.value))}
                                    className="range-slider"
                                    disabled={!settings.alertsEnabled}
                                />
                                <span className="setting-value">{settings.cooldownSeconds}s</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
