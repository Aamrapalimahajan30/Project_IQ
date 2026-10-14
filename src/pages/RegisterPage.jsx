import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { User as UserIcon, Mail, Lock, Sparkles, Code, Server, Database } from 'lucide-react';
import './Auth.css';

export default function RegisterPage() {
  const { register } = useContext(AppContext);
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirmPassword) return alert('Please fill in all fields');
    if (password !== confirmPassword) return alert('Passwords do not match');
    
    setIsLoading(true);
    setErrorMsg('');
    
    const res = await register(name.trim(), email.trim(), password);
    setIsLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(res.message || 'Registration failed. Try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const res = await register('Alex Carter', 'alex.carter@gmail.com', 'google-auth');
    setIsLoading(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg('Google registration failed.');
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
            <h2>Start Understanding What You Build</h2>
            <p>Accelerate your comprehension, track learning streaks, and prepare for mock technical interviews.</p>
          </div>

          {errorMsg && (
            <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'left' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-actual-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-with-icon">
                <UserIcon size={16} className="input-icon" />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter your full name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Developer Email</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="Enter your developer email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Create Password</label>
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

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Developer Account'}
            </button>
          </form>

          <div className="auth-separator">
            <span>OR REGISTER WITH</span>
          </div>

          <button className="btn-secondary google-auth-btn" onClick={handleGoogleLogin} disabled={isLoading}>
            <svg viewBox="0 0 24 24" width="18" height="18" className="google-icon-svg">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.02 0 12 0 7.35 0 3.4 2.67 1.5 6.57l3.79 2.93C6.18 6.58 8.87 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58v2.96h3.87c2.26-2.09 3.56-5.16 3.56-8.69z" />
              <path fill="#FBBC05" d="M5.29 14.78c-.25-.72-.39-1.5-.39-2.3s.14-1.58.39-2.3L1.5 7.25C.54 9.17 0 11.31 0 13.5s.54 4.33 1.5 6.25l3.79-2.97z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-2.96c-1.08.72-2.45 1.15-4.09 1.15-3.13 0-5.82-1.54-6.79-4.46L1.42 17.8C3.3 21.65 7.3 24 12 24z" />
            </svg>
            Sign up with Google
          </button>

          <p className="auth-footer-redirect">
            Already have an account? <Link to="/login" className="auth-link">Authenticate Profile</Link>
          </p>
        </div>
      </div>

      {/* Visual Side */}
      <div className="auth-visual-side">
        <div className="glowing-background-orb purple"></div>
        <div className="glowing-background-orb cyan"></div>
        
        <div className="auth-interactive-showcase">
          {/* Floating elements */}
          <div className="auth-floating-badge badge-1 animate-float-3">
            <Sparkles size={14} className="text-purple animate-pulse" />
            <span>AI Mentor Profile Assigned</span>
          </div>
          <div className="auth-floating-badge badge-2 animate-float-1">
            <Code size={14} className="text-cyan" />
            <span>Frontend Parsing Ready</span>
          </div>
          <div className="auth-floating-badge badge-3 animate-float-4">
            <Server size={14} className="text-green" />
            <span>Backend Logic Maps</span>
          </div>
          <div className="auth-floating-badge badge-4 animate-float-2">
            <Database size={14} className="text-purple" />
            <span>Database Integrity Verified</span>
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
                  <div className="scan-row">INITIALIZING LEARNING ENGINE...</div>
                  <div className="scan-row dim">Progress Tracker: Active</div>
                  <div className="scan-row dim text-green">Level Thresholds: Ready</div>
                  <div className="scan-row dim text-cyan">Learning Activity: Active</div>
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
