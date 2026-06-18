/**
 * LandingPage — premium marketing page for ConcentraAI (2026 AI Aesthetic)
 */
import { Link } from 'react-router-dom';
import '../landing.css';

const FEATURES = [
    {
        title: 'AI Face Analysis',
        desc: 'MediaPipe Face Mesh with 478 landmarks tracks eyes, gaze, and head pose in real-time.',
    },
    {
        title: 'Live Concentration Score',
        desc: 'Dynamic 0-100% score updated every frame with intelligent state classification.',
    },
    {
        title: 'Smart Alerts',
        desc: 'Browser notifications and audio chimes when you lose focus — fully customizable.',
    },
    {
        title: 'Session Analytics',
        desc: 'Timeline charts, state distribution, and historical trends for every study session.',
    },
    {
        title: 'AI Study Coach',
        desc: 'Gemini-powered personalized study recommendations based on your focus patterns.',
    },
    {
        title: 'Real-time WebSocket',
        desc: 'Low-latency processing at 5 FPS via WebSocket — no page reloads, instant feedback.',
    },
    {
        title: 'Classroom Mode',
        desc: 'Teachers create rooms, students join — live grid shows every student\'s focus in real-time.',
    },
];

const TECH_STACK = [
    { name: 'Python' },
    { name: 'FastAPI' },
    { name: 'MediaPipe' },
    { name: 'OpenCV' },
    { name: 'React' },
    { name: 'WebSocket' },
    { name: 'Vite' },
    { name: 'Gemini AI' },
];

export default function LandingPage() {
    return (
        <div className="landing-wrapper">
            {/* Nav */}
            <nav className="landing-nav">
                <div className="landing-nav-inner">
                    <div className="navbar-brand">
                        <div className="navbar-logo">C</div>
                        <span className="navbar-title">ConcentraAI</span>
                    </div>
                    <div className="landing-nav-links">
                        <a href="#features">Features</a>
                        <a href="#tech">Tech Stack</a>
                        <a href="#how">How It Works</a>
                        <Link to="/classroom">Classroom</Link>
                        <Link to="/app" className="landing-btn landing-btn-primary">
                            Launch App →
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-glow" />
                <div className="hero-content">
                    <div className="hero-badge">
                        <div className="status-dot" />
                        LIVE AI-POWERED CONCENTRATION DETECTION
                    </div>
                    <h1 className="hero-title">
                        <span className="line-1">STAY <span className="text-gradient">FOCUSED.</span></span>
                        <span className="line-2">STUDY SMARTER.</span>
                    </h1>
                    <p className="hero-subtitle">
                        ConcentraAI uses computer vision and AI to track your concentration
                        in real-time, alert you when you lose focus, and give personalized
                        study recommendations.
                    </p>
                    <div className="hero-actions">
                        <Link to="/app" className="landing-btn landing-btn-primary landing-btn-lg">
                            Start Free Session
                        </Link>
                        <Link to="/classroom" className="landing-btn landing-btn-ghost landing-btn-lg">
                            Classroom Mode
                        </Link>
                    </div>
                    
                    {/* Stats Row Below Hero */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <span className="stat-value">478</span>
                            <span className="stat-label">Face Landmarks</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">5 FPS</span>
                            <span className="stat-label">Real-time Processing</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">4</span>
                            <span className="stat-label">Focus States</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">&lt;200ms</span>
                            <span className="stat-label">Latency</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="landing-section" id="features">
                <h2 className="section-title">Features</h2>
                <p className="section-subtitle">Everything you need to optimize your study sessions</p>
                <div className="features-grid">
                    {FEATURES.map((f, i) => (
                        <div key={i} className="feature-glass-card">
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="landing-section" id="how">
                <h2 className="section-title">How It Works</h2>
                <p className="section-subtitle">Three simple steps to better focus</p>
                <div className="steps-row">
                    <div className="step-glass-card">
                        <div className="step-number">01</div>
                        <h3>Open & Allow Camera</h3>
                        <p>Launch the app and grant camera permission. Your webcam feed stays in the browser — never uploaded.</p>
                    </div>
                    <div className="step-connector">→</div>
                    <div className="step-glass-card">
                        <div className="step-number">02</div>
                        <h3>AI Analyzes Your Focus</h3>
                        <p>MediaPipe detects your face, eyes, gaze direction, and head pose. The ML engine classifies your state every frame.</p>
                    </div>
                    <div className="step-connector">→</div>
                    <div className="step-glass-card">
                        <div className="step-number">03</div>
                        <h3>Get Insights & Alerts</h3>
                        <p>See your concentration score live, get alerts when distracted, and review AI-generated study recommendations.</p>
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="landing-section" id="tech">
                <h2 className="section-title">Built With</h2>
                <p className="section-subtitle">Modern, production-grade technology stack</p>
                <div className="tech-grid">
                    {TECH_STACK.map((t, i) => (
                        <div key={i} className="tech-glass-pill">
                            {t.name}
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="landing-section">
                <div className="landing-cta-inner">
                    <h2>Ready to study smarter?</h2>
                    <p>Start your first concentration tracking session — it's free, no signup required.</p>
                    <Link to="/app" className="landing-btn landing-btn-primary landing-btn-lg">
                        Launch ConcentraAI
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p>Built with ❤️ using React, FastAPI, MediaPipe & Gemini AI</p>
                <p style={{ marginTop: '4px', fontSize: '12px', opacity: 0.5 }}>© 2026 ConcentraAI — Open Source for Education</p>
            </footer>
        </div>
    );
}
