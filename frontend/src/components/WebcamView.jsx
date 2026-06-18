import { forwardRef } from 'react';

const WebcamView = forwardRef(({ isActive, isDetecting }, ref) => {
    return (
        <div className="webcam-section fade-in">
            {isActive ? (
                <>
                    <video
                        ref={ref}
                        autoPlay
                        playsInline
                        muted
                        className="webcam-video"
                    />
                    <div className="webcam-overlay" style={{
                        position: 'absolute', inset: 0,
                        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.8)',
                        pointerEvents: 'none'
                    }}>
                        {/* Viewfinder Corners */}
                        <div style={{ position: 'absolute', top: 20, left: 20, width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.3)', borderLeft: '2px solid rgba(255,255,255,0.3)' }} />
                        <div style={{ position: 'absolute', top: 20, right: 20, width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.3)', borderRight: '2px solid rgba(255,255,255,0.3)' }} />
                        <div style={{ position: 'absolute', bottom: 20, left: 20, width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.3)', borderLeft: '2px solid rgba(255,255,255,0.3)' }} />
                        <div style={{ position: 'absolute', bottom: 20, right: 20, width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.3)', borderRight: '2px solid rgba(255,255,255,0.3)' }} />
                        
                        {/* Center Crosshair */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255,255,255,0.1)', fontFamily: 'var(--font-mono)' }}>
                            +
                        </div>

                        {/* Status Label */}
                        <div style={{
                            position: 'absolute',
                            top: 16,
                            left: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(4px)',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            color: isDetecting ? 'var(--success)' : 'var(--warning)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            letterSpacing: '0.05em'
                        }}>
                            <div style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: 'currentColor',
                                boxShadow: `0 0 8px currentColor`,
                                animation: isDetecting ? 'pulse-colon 1s infinite' : 'none'
                            }} />
                            {isDetecting ? 'SYS.TRACKING' : 'CAMERA READY'}
                        </div>
                    </div>
                </>
            ) : (
                <div className="webcam-placeholder">
                    {/* SVG Face Mesh Wireframe Icon */}
                    <svg className="face-mesh-icon" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <ellipse cx="100" cy="100" rx="60" ry="80" strokeDasharray="4 4"/>
                        <path d="M60 80 Q100 120 140 80" />
                        <path d="M75 70 A 5 5 0 0 1 85 70" />
                        <path d="M115 70 A 5 5 0 0 1 125 70" />
                        <path d="M100 100 L100 130" />
                        <path d="M80 150 Q100 160 120 150" />
                        <path d="M40 100 L160 100" strokeDasharray="2 6"/>
                        <path d="M100 20 L100 180" strokeDasharray="2 6"/>
                    </svg>
                    <p>Start detection to begin monitoring</p>
                </div>
            )}
        </div>
    );
});

WebcamView.displayName = 'WebcamView';
export default WebcamView;
