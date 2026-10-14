import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Terminal, Search, Award, Brain, Lock, Layers } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Header Navigation */}
      <header className="landing-header">
        <div className="landing-logo">
          <div className="logo-icon">IQ</div>
          <span className="logo-text">Project<span className="text-purple">IQ</span></span>
        </div>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <button className="btn-secondary" onClick={() => navigate('/login')}>Login</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Register</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-text-content">
          <div className="badge-glow-purple">AI-Powered Developer Readiness</div>
          <h1 className="hero-title">
            Understand Your Project.<br />
            <span className="text-gradient">Master Your Interview.</span>
          </h1>
          <p className="hero-subtitle">
            Upload your project, understand every module, learn what you built, and prepare for your next technical interview with AI.
          </p>
          <div className="hero-cta-group">
            <button className="btn-primary btn-large" onClick={() => navigate('/upload')}>
              Analyze My Project <ArrowRight size={18} />
            </button>
            <button className="btn-secondary btn-large" onClick={() => navigate('/dashboard')}>
              Explore ProjectIQ
            </button>
          </div>
        </div>

        {/* Hero Interactive Laptop Visual */}
        <div className="hero-visual-container">
          {/* Floating Technology Elements */}
          <div className="floating-tag tag-react animate-float-1">React</div>
          <div className="floating-tag tag-node animate-float-2">Node.js</div>
          <div className="floating-tag tag-mongo animate-float-3">MongoDB</div>
          <div className="floating-tag tag-api animate-float-4">REST API</div>
          <div className="floating-tag tag-ai animate-float-1">AI Analysis</div>
          <div className="floating-tag tag-arch animate-float-3">Architecture</div>

          {/* Premium Laptop Mockup */}
          <div className="laptop-mockup">
            <div className="laptop-lid">
              <div className="laptop-screen">
                <div className="screen-header">
                  <div className="window-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <div className="screen-title">projectiq.io/analysis/dashboard</div>
                </div>
                <div className="screen-content">
                  {/* Sidebar mockup */}
                  <div className="mock-sidebar">
                    <div className="mock-logo"></div>
                    <div className="mock-nav-item active"></div>
                    <div className="mock-nav-item"></div>
                    <div className="mock-nav-item"></div>
                  </div>
                  {/* Central Workspace Mockup */}
                  <div className="mock-workspace">
                    <div className="workspace-header">
                      <div className="mock-project-info">
                        <div className="mock-project-name">OmniCommerce Core</div>
                        <div className="mock-project-techs">
                          <span className="mock-badge cyan">Node.js</span>
                          <span className="mock-badge purple">Express</span>
                          <span className="mock-badge green">MongoDB</span>
                        </div>
                      </div>
                      <div className="mock-score-ring">
                        <svg width="40" height="40" viewBox="0 0 36 36">
                          <path className="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="ring-fill" strokeDasharray="87, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="ring-text">87%</div>
                      </div>
                    </div>
                    
                    <div className="mock-dashboard-grid">
                      {/* Left: Code Structure */}
                      <div className="mock-card code-view">
                        <div className="card-header"><Terminal size={12} /> authMiddleware.js</div>
                        <pre className="code-content">
                          <code>
                            {`const protect = async (req, res, next) => {
  const token = req.headers.authorization;
  if (token && token.startsWith('Bearer')) {
    const decoded = jwt.verify(token, SECRET);
    req.user = await User.findById(decoded.id);
    return next();
  }
  res.status(401).send('Unauthorized');
};`}
                          </code>
                        </pre>
                      </div>

                      {/* Right: AI Insights */}
                      <div className="mock-card ai-view">
                        <div className="card-header"><Brain size={12} className="text-purple" /> AI Analysis</div>
                        <div className="ai-insight-line">✓ JWT Authenticator detected in middleware/</div>
                        <div className="ai-insight-line">✓ Schema verification matches MongoDB standard</div>
                        <div className="ai-insight-line warning">⚠ Database connection missing error retry limit</div>
                        <div className="floating-insight glow-purple">
                          <Sparkles size={10} /> "JWT authentication relies on process.env.JWT_SECRET. Be prepared to explain signature decryption."
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="laptop-base"></div>
          </div>
        </div>
      </section>

      {/* Quick Features Section */}
      <section id="features" className="features-section">
        <h2 className="section-title">The Complete Developer Preparation Suite</h2>
        <div className="features-grid">
          <div className="glass-card purple-hover feature-card">
            <div className="icon-wrapper purple"><Search /></div>
            <h3>Code Intelligence</h3>
            <p>Upload any ZIP. We map dependencies, reconstruct folder routing structures, and isolate critical code scripts instantly.</p>
          </div>
          <div className="glass-card cyan-hover feature-card">
            <div className="icon-wrapper cyan"><Brain /></div>
            <h3>Interactive Roadmap</h3>
            <p>Convert your codebase folders into an structured step-by-step learning path. Review databases, authentication, and logic.</p>
          </div>
          <div className="glass-card green-hover feature-card">
            <div className="icon-wrapper green"><Award /></div>
            <h3>Mock Interviews</h3>
            <p>Conduct voice/text simulations asking project-specific interview questions. Receive granular scores and code improvements.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Sparkles Helper component for custom icons
function Sparkles({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z"/>
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/>
    </svg>
  );
}
