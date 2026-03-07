/**
 * WebcamView — displays the live webcam feed with overlay labels.
 * The <video> element is ALWAYS rendered (hidden when inactive)
 * so the ref is available when startCamera() assigns srcObject.
 */
import { forwardRef } from 'react';

const WebcamView = forwardRef(({ isActive, isDetecting }, ref) => {
    return (
        <div className="webcam-section" id="webcam-view">
            {/* Video is always in the DOM so ref is never null */}
            <video
                ref={ref}
                className="webcam-video"
                autoPlay
                playsInline
                muted
                style={{ display: isActive ? 'block' : 'none' }}
            />

            {isActive && (
                <>
                    <div className="webcam-overlay" />
                    <div className="webcam-label">
                        <span className={`live-dot ${isDetecting ? 'active' : ''}`} />
                        {isDetecting ? 'DETECTING' : 'CAMERA READY'}
                    </div>
                </>
            )}

            {!isActive && (
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
