import { forwardRef } from 'react';

const WebcamView = forwardRef(({ isActive }, ref) => {
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
                    <div className="webcam-overlay" />
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
