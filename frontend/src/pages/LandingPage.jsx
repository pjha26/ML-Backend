/**
 * LandingPage — Neural Monitor aesthetic
 */
import { Link } from 'react-router-dom';
import '../landing.css';

const FEATURES = [
    {
        title: 'FACE MESH TRACKING',
        desc: 'MediaPipe Face Mesh with 478 landmarks tracks eyes, gaze, and head pose in real-time. No cloud upload.',
    },
    {
        title: 'LIVE CLASSIFICATION',
        desc: 'Dynamic 0-100% score updated every frame with intelligent state classification via ML engine.',
    },
    {
        title: 'SMART ALERT SYSTEM',
        desc: 'Browser notifications and configurable audio chimes triggered by sustained attention loss.',
    },
    {
        title: 'SESSION TELEMETRY',
        desc: 'Timeline charts, state distribution, and historical data modeling for every tracked session.',
    },
    {
        title: 'AI COACHING ENGINE',
        desc: 'Gemini-powered personalized study recommendations synthesized from your biometric patterns.',
    },
    {
        title: 'WEBSOCKET STREAM',
        desc: 'Low-latency processing at 5 FPS via WebSocket — no page reloads, sub-200ms roundtrip.',
    },
];

export default function LandingPage() {
    return (
        <div className="landing-wrapper">
            {/* Background Elements */}
            <div className="bg-ellipse" />

            {/* Nav */}
            <nav className="landing-nav">
                <div className="landing-nav-inner">
                    <div className="navbar-brand">
                        CONCENTRA_AI
                    </div>
                    <div className="landing-nav-links">
                        <a href="#telemetry">TELEMETRY</a>
                        <Link to="/classroom">CLASSROOM</Link>
                        <Link to="/app" className="btn-system btn-primary" style={{ padding: '8px 16px', fontSize: '11px' }}>
                            INITIATE
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero-container">
                {/* Left: Text */}
                <div className="hero-content">
                    <div className="hero-eyebrow">
                        Real-time focus intelligence
                    </div>
                    
                    {/* SVG EEG Line behind headline */}
                    <svg className="eeg-line" viewBox="0 0 500 120" preserveAspectRatio="none">
                        <path className="eeg-path" d="M0,60 L200,60 L220,20 L240,100 L260,40 L280,80 L300,60 L500,60" />
                    </svg>

                    <h1 className="hero-headline">
                        <span className="line-1">Your attention,</span>
                        <span className="line-2">finally measurable.</span>
                    </h1>
                    
                    <div className="hero-actions">
                        <Link to="/app" className="btn-system btn-primary">
                            START SESSION
                        </Link>
                        <Link to="/classroom" className="btn-system btn-secondary">
                            CLASSROOM MODE →
                        </Link>
                    </div>
                </div>

                {/* Right: Mock UI */}
                <div className="hero-mock">
                    <div className="mock-ui">
                        <div className="mock-header">
                            <span>SYS.TRACKING_ACTIVE</span>
                            <span>[REC]</span>
                        </div>
                        <div className="mock-body">
                            <div className="mock-target">
                                <div className="mock-face-point" />
                                <div className="mock-face-point" />
                                <div className="mock-face-point" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Band */}
            <div className="stats-band">
                <div className="stat-item">
                    <span className="stat-label">Landmarks Tracked</span>
                    <span className="stat-val">478</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Sampling Rate</span>
                    <span className="stat-val">5hz</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Classifications</span>
                    <span className="stat-val">4</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">System Latency</span>
                    <span className="stat-val">&lt;200ms</span>
                </div>
            </div>

            {/* Features/Telemetry */}
            <section className="landing-section" id="telemetry">
                <div className="section-header">
                    <div className="section-eyebrow">System Capabilities</div>
                    <h2 className="section-title">Telemetry & Insights</h2>
                    <p className="section-desc">
                        A complete suite of diagnostic tools designed to measure, analyze, and optimize your cognitive endurance over time.
                    </p>
                </div>
                
                <div className="clinical-grid">
                    {FEATURES.map((f, i) => (
                        <div key={i} className="clinical-card">
                            <h3 className="clinical-card-title">{f.title}</h3>
                            <p className="clinical-card-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="footer-cta">
                <h2>Deploy the system.</h2>
                <Link to="/app" className="btn-system btn-primary">
                    INITIALIZE TRACKER
                </Link>
            </section>

            {/* Footer */}
            <footer className="bottom-bar">
                <div>SYS.VER. 2026.1</div>
                <div>OPEN SOURCE EDUCATIONAL INSTRUMENT</div>
            </footer>
        </div>
    );
}
