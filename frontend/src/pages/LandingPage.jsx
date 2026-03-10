/**
 * LandingPage — premium marketing page for ConcentraAI
 */
import { Link } from 'react-router-dom';

const FEATURES = [
    {
        icon: '🧠',
        title: 'AI Face Analysis',
        desc: 'MediaPipe Face Mesh with 478 landmarks tracks eyes, gaze, and head pose in real-time.',
    },
    {
        icon: '📊',
        title: 'Live Concentration Score',
        desc: 'Dynamic 0-100% score updated every frame with intelligent state classification.',
    },
    {
        icon: '🔔',
        title: 'Smart Alerts',
        desc: 'Browser notifications and audio chimes when you lose focus — fully customizable.',
    },
    {
        icon: '📈',
        title: 'Session Analytics',
        desc: 'Timeline charts, state distribution, and historical trends for every study session.',
    },
    {
        icon: '🤖',
        title: 'AI Study Coach',
        desc: 'Gemini-powered personalized study recommendations based on your focus patterns.',
    },
    {
        icon: '⚡',
        title: 'Real-time WebSocket',
        desc: 'Low-latency processing at 5 FPS via WebSocket — no page reloads, instant feedback.',
    },
];

const TECH_STACK = [
    { name: 'Python', color: '#3776ab' },
    { name: 'FastAPI', color: '#009688' },
    { name: 'MediaPipe', color: '#0097a7' },
    { name: 'OpenCV', color: '#5c3ee8' },
    { name: 'React', color: '#61dafb' },
    { name: 'WebSocket', color: '#f97316' },
    { name: 'Vite', color: '#646cff' },
    { name: 'Gemini AI', color: '#8b5cf6' },
];

export default function LandingPage() {
    return (
        <div className="landing">
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
                        <Link to="/app" className="btn btn-primary" style={{ flex: 'none', padding: '10px 24px' }}>
                            Launch App →
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-glow" />
                <div className="hero-content">
                    <div className="hero-badge">🧠 AI-Powered Concentration Detection</div>
                    <h1 className="hero-title">
                        Stay <span className="hero-highlight">Focused</span>,<br />
                        Study <span className="hero-highlight-2">Smarter</span>
                    </h1>
                    <p className="hero-subtitle">
                        ConcentraAI uses computer vision and AI to track your concentration
                        in real-time, alert you when you lose focus, and give personalized
                        study recommendations.
                    </p>
                    <div className="hero-actions">
                        <Link to="/app" className="btn btn-primary btn-lg">
                            ▶ Start Free Session
                        </Link>
                        <a href="#how" className="btn btn-outline btn-lg">
                            See How It Works
                        </a>
                    </div>
                    <div className="hero-stats">
                        <div className="hero-stat">
                            <span className="hero-stat-value">478</span>
                            <span className="hero-stat-label">Face Landmarks</span>
                        </div>
                        <div className="hero-stat">
                            <span className="hero-stat-value">5 FPS</span>
                            <span className="hero-stat-label">Real-time Processing</span>
                        </div>
                        <div className="hero-stat">
                            <span className="hero-stat-value">4</span>
                            <span className="hero-stat-label">Focus States</span>
                        </div>
                        <div className="hero-stat">
                            <span className="hero-stat-value">&lt;200ms</span>
                            <span className="hero-stat-label">Latency</span>
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
                        <div key={i} className="feature-card glass-card">
                            <div className="feature-icon">{f.icon}</div>
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
                    <div className="step-card glass-card">
                        <div className="step-number">01</div>
                        <h3>Open & Allow Camera</h3>
                        <p>Launch the app and grant camera permission. Your webcam feed stays in the browser — never uploaded.</p>
                    </div>
                    <div className="step-connector">→</div>
                    <div className="step-card glass-card">
                        <div className="step-number">02</div>
                        <h3>AI Analyzes Your Focus</h3>
                        <p>MediaPipe detects your face, eyes, gaze direction, and head pose. The ML engine classifies your state every frame.</p>
                    </div>
                    <div className="step-connector">→</div>
                    <div className="step-card glass-card">
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
                        <div key={i} className="tech-pill" style={{ borderColor: t.color + '30', color: t.color }}>
                            {t.name}
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="landing-cta">
                <div className="landing-cta-inner glass-card">
                    <h2>Ready to study smarter?</h2>
                    <p>Start your first concentration tracking session — it's free, no signup required.</p>
                    <Link to="/app" className="btn btn-primary btn-lg">
                        Launch ConcentraAI →
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p>Built with ❤️ using React, FastAPI, MediaPipe & Gemini AI</p>
                <p style={{ marginTop: '4px', fontSize: '12px' }}>© 2026 ConcentraAI — Open Source for Education</p>
            </footer>
        </div>
    );
}
