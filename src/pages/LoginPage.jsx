import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Mail, Lock, Shield, Award, Terminal, Activity } from 'lucide-react';
import './Auth.css';

export default function LoginPage() {
  const { login } = useContext(AppContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert('Please enter all fields');
    
    setIsLoading(true);
    setErrorMsg('');
    
    const res = await login(email, password);
    setIsLoading(false);
    
    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(res.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const res = await login('alex.carter@gmail.com', 'google-auth');
    setIsLoading(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg('Google login failed.');
    }
  };

  return (
    <div className="auth-split-screen">
      {/* Form Side */}
      <div className="auth-form-side">
        <div className="auth-brand" onClick={() => navigate('/')}>
          <div className="logo-icon">IQ</div>
          <span className="logo-text">Project<span className="text-purple">IQ</span></span>
        </div>

        <div className="form-container-box">
          <div className="auth-welcome-text">
            <h2>Welcome Back, Architect</h2>
            <p>Continue mastering your project codebase and acing your technical interviews.</p>
          </div>

          {errorMsg && (
            <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'left' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-actual-form">
            <div className="form-group">
              <label className="form-label">Developer Email</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="alex@projectiq.io" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-meta-row">
              <label className="remember-checkbox">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Session</span>
              </label>
              <a href="#forgot" className="forgot-password-link">Forgot?</a>
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Authenticate Account'}
            </button>
          </form>

          <div className="auth-separator">
            <span>OR CONTINUE WITH</span>
          </div>

          <button className="btn-secondary google-auth-btn" onClick={handleGoogleLogin} disabled={isLoading}>
            <svg viewBox="0 0 24 24" width="18" height="18" className="google-icon-svg">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.02 0 12 0 7.35 0 3.4 2.67 1.5 6.57l3.79 2.93C6.18 6.58 8.87 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58v2.96h3.87c2.26-2.09 3.56-5.16 3.56-8.69z" />
              <path fill="#FBBC05" d="M5.29 14.78c-.25-.72-.39-1.5-.39-2.3s.14-1.58.39-2.3L1.5 7.25C.54 9.17 0 11.31 0 13.5s.54 4.33 1.5 6.25l3.79-2.97z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-2.96c-1.08.72-2.45 1.15-4.09 1.15-3.13 0-5.82-1.54-6.79-4.46L1.42 17.8C3.3 21.65 7.3 24 12 24z" />
            </svg>
            Sign in with Google
          </button>

          <p className="auth-footer-redirect">
            New to ProjectIQ? <Link to="/register" className="auth-link">Create Developer Profile</Link>
          </p>
        </div>
      </div>

      {/* Visual Side */}
      <div className="auth-visual-side">
        <div className="glowing-background-orb purple"></div>
        <div className="glowing-background-orb cyan"></div>
        
        {/* Laptop/Code analysis representation */}
        <div className="auth-interactive-showcase">
          {/* Floating UI Badges */}
          <div className="auth-floating-badge badge-1 animate-float-1">
            <Activity size={14} className="text-cyan animate-pulse" />
            <span>AI Analysis Active</span>
          </div>
          <div className="auth-floating-badge badge-2 animate-float-2">
            <Award size={14} className="text-green" />
            <span>87% Code Understanding</span>
          </div>
          <div className="auth-floating-badge badge-3 animate-float-3">
            <Terminal size={14} className="text-purple" />
            <span>React + Node.js</span>
          </div>
          <div className="auth-floating-badge badge-4 animate-float-4">
            <Shield size={14} className="text-cyan" />
            <span>Architecture Mapping</span>
          </div>

          <div className="auth-laptop-wrapper">
            <div className="showcase-laptop-lid">
              <div className="showcase-laptop-screen">
                <div className="screen-radar-grid">
                  <div className="radar-circle circle-1"></div>
                  <div className="radar-circle circle-2"></div>
                  <div className="radar-circle circle-3"></div>
                  <div className="radar-sweep-line"></div>
                </div>
                <div className="screen-scan-text">
                  <div className="scan-row">SCANNING SOURCE CODE TREE...</div>
                  <div className="scan-row dim">SUCCESS: 48 modules read</div>
                  <div className="scan-row dim text-cyan">DETECTED: REST API Architecture</div>
                  <div className="scan-row dim text-purple">EXTRACTED: Express routers</div>
                </div>
              </div>
            </div>
            <div className="showcase-laptop-base"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
