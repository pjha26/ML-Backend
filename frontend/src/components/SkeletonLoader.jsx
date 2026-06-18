import React from 'react';

export function SkeletonBlock({ width, height, className = '' }) {
    return (
        <div 
            className={`skeleton ${className}`} 
            style={{ width: width || '100%', height: height || '100%' }}
        />
    );
}

export function SkeletonGauge() {
    return (
        <div className="gauge-card neo-card" style={{ background: 'var(--bg-surface)' }}>
            <div className="skeleton skeleton-gauge"></div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <div className="skeleton" style={{ width: '120px', height: '44px' }}></div>
            </div>
        </div>
    );
}

export function SkeletonMetrics() {
    return (
        <div className="metrics-card neo-card">
            <div className="skeleton-title"></div>
            <div className="metrics-grid">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="metric-item">
                        <div className="skeleton-text" style={{ width: '50%' }}></div>
                        <div className="skeleton-text" style={{ height: '36px', width: '80%' }}></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function SkeletonTimeline() {
    return (
        <div className="chart-section">
            <div className="chart-card neo-card">
                <div className="chart-header">
                    <div className="skeleton-title" style={{ margin: 0, width: '200px' }}></div>
                </div>
                <div className="skeleton" style={{ height: '240px' }}></div>
            </div>
        </div>
    );
}

export function SkeletonStats() {
    return (
        <div className="session-stats">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="stat-card neo-card">
                    <div className="skeleton-text" style={{ height: '48px', margin: '0 auto 12px', width: '60%' }}></div>
                    <div className="skeleton-text" style={{ height: '16px', margin: '0 auto', width: '80%' }}></div>
                </div>
            ))}
        </div>
    );
}
