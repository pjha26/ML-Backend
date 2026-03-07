/**
 * WebcamView — displays the live webcam feed with overlay labels
 */
import { forwardRef } from 'react';

const WebcamView = forwardRef(({ isActive, isDetecting }, ref) => {
    return (
        <div className="webcam-section" id="webcam-view">
            {isActive ? (
                <>
                    <video
                        ref={ref}
                        className="webcam-video"
                        autoPlay
                        playsInline
                        muted
                    />
                    <div className="webcam-overlay" />
                    <div className="webcam-label">
                        <span className={`live-dot ${isDetecting ? 'active' : ''}`} />
                        {isDetecting ? 'DETECTING' : 'CAMERA READY'}
                    </div>
                </>
            ) : (
                <div className="webcam-placeholder">
                    <div className="webcam-placeholder-icon">📷</div>
                    <p>Click <strong>Start Detection</strong> to begin</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Browser will request camera permission
                    </p>
                </div>
            )}
        </div>
    );
});

WebcamView.displayName = 'WebcamView';
export default WebcamView;
