import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { 
  Flame, BookOpen, ArrowRight, Brain, Zap, Clock, 
  Sparkles, CheckCircle2, Circle, Play, Layers, FileCode
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { user, activeProject, roadmap, API_BASE } = useContext(AppContext);
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    understanding: 85,
    readiness: 0,
    confidence: 0,
    quizAvg: 0,
    vivaAvg: 0,
    progress: 0,
    weakAreas: [],
    recommendations: [],
    strengths: []
  });

  // Fetch dynamic, database-calculated readiness metrics on active project change
  useEffect(() => {
    const fetchReadinessMetrics = async () => {
      if (!activeProject) return;
      const token = localStorage.getItem('projectiq_token');
      const projectId = activeProject._id || activeProject.id;
      
      try {
        const res = await fetch(`${API_BASE}/prepare/${projectId}/readiness`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMetrics({
            understanding: activeProject.understanding || 85,
            readiness: data.readinessIndex || 0,
            confidence: data.interviewAvg || 0,
            quizAvg: data.quizAvg || 0,
            vivaAvg: data.vivaAvg || 0,
            progress: data.progressPct || 0,
            weakAreas: data.weakAreas || [],
            recommendations: data.recommendations || [],
            strengths: data.strengths || []
          });
        }
      } catch (err) {
        console.error('Failed to load readiness metrics:', err);
      }
    };

    fetchReadinessMetrics();
  }, [activeProject]);

  // Helper component to render circular progress metrics
  const RadialMetric = ({ score, label, colorClass, borderGlow }) => {
    const strokeDash = (score / 100) * 100;
    return (
      <div className={`metric-circular-card glass-card ${borderGlow}`}>
        <div className="radial-svg-wrapper">
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path className="circle-bg-track" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className={`circle-progress-fill ${colorClass}`} strokeDasharray={`${strokeDash}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="radial-inner-value">{score}%</div>
        </div>
        <div className="radial-label-text">{label}</div>
      </div>
    );
  };

  if (!activeProject) {
    return (
      <div className="dashboard-page-container">
        {/* Welcome Header */}
        <div className="dashboard-welcome-header">
          <div className="welcome-text-side">
            <div className="date-badge">{getFormattedDate()}</div>
            <h1>System Command Center</h1>
            <p>Analyzing codebases, refining vocabulary, and generating interview scenarios.</p>
          </div>
          <div className="welcome-stats-row">
            <div className="quick-stat-box glass-card border-purple">
              <Flame className="streak-icon-flame" size={20} />
              <div className="stat-num">{user.streak || 0} {user.streak === 1 ? 'Day' : 'Days'}</div>
              <div className="stat-label">Active Days</div>
            </div>
            <div className="quick-stat-box glass-card border-green">
              <Zap className="xp-icon-green" size={20} />
              <div className="stat-num">{user.xp || 0}</div>
              <div className="stat-label">Total XP</div>
            </div>
          </div>
        </div>

        {/* Empty Workspace CTA */}
        <div className="glass-card upload-cta-card glow-purple" style={{ padding: '3.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', marginTop: '2rem' }}>
          <Brain size={48} className="text-purple animate-pulse" />
          <h2>Welcome to ProjectIQ, {user.name}!</h2>
          <p style={{ maxWidth: '500px', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.5' }}>
            No codebase is currently loaded in your session. Please upload a project ZIP file containing your source code scripts to run static scanners, generate roadmaps, and initiate AI mock evaluations.
          </p>
          <button className="btn-primary" onClick={() => navigate('/upload')} style={{ marginTop: '0.5rem' }}>
            Upload Project ZIP <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page-container">
      {/* Welcome Header */}
      <div className="dashboard-welcome-header">
        <div className="welcome-text-side">
          <div className="date-badge">{getFormattedDate()}</div>
          <h1>System Command Center</h1>
          <p>Analyzing codebases, refining vocabulary, and generating interview scenarios.</p>
        </div>
        <div className="welcome-stats-row">
          <div className="quick-stat-box glass-card border-purple">
            <Flame className="streak-icon-flame" size={20} />
            <div className="stat-num">{user.streak} {user.streak === 1 ? 'Day' : 'Days'}</div>
            <div className="stat-label">Active Days</div>
          </div>
          <div className="quick-stat-box glass-card border-green">
            <Zap className="xp-icon-green" size={20} />
            <div className="stat-num">{user.xp}</div>
            <div className="stat-label">Total XP</div>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="dashboard-grid">
        {/* Current Project Info */}
        <div className="col-8 active-project-panel">
          <div className="glass-card full-height current-project-card glow-purple">
            <div className="card-top-header">
              <span className="panel-badge-purple">Active Core Project</span>
              <span className="status-label-glow green">✓ Analyzed</span>
            </div>
            
            <div className="project-main-details">
              <h2>{activeProject?.name || "No Project Active"}</h2>
              <p className="project-desc">{activeProject?.description}</p>
              
              <div className="tech-stack-row">
                {activeProject?.techStack?.map((tech, idx) => (
                  <span key={idx} className="tech-chip">{tech}</span>
                ))}
              </div>
            </div>

            <div className="project-action-bar">
              <div className="understanding-score-meter">
                <span className="score-label">Overall Comprehension</span>
                <div className="score-value-row">
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill purple" 
                      style={{ width: `${activeProject?.understanding || 87}%` }}
                    ></div>
                  </div>
                  <span className="score-pct">{activeProject?.understanding || 87}%</span>
                </div>
              </div>
              <button className="btn-primary" onClick={() => navigate('/analysis')}>
                Continue Analysis <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Developer Level & Quick Specs */}
        <div className="col-4 gamification-panel">
          <div className="glass-card full-height gamified-stats-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="card-top-header" style={{ marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', fontWeight: '700' }}>
                Developer Profile
              </h3>
            </div>
            
            <div className="profile-level-display">
              <div className="badge-wrapper">
                <div className="level-hexagon">Lvl {user.level}</div>
              </div>
              <div className="level-detail-text">
                <h4>{user.levelName}</h4>
                <p>{user.xp % 600} / 600 XP to Level {user.level + 1}</p>
              </div>
            </div>

            <div className="progress-bar-bg" style={{ height: '6px', margin: '0.25rem 0' }}>
              <div 
                className="progress-bar-fill purple" 
                style={{ width: `${((user.xp % 600) / 600) * 100}%` }}
              ></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Files</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{activeProject?.metrics?.totalFiles || 0}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Endpoints</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)' }}>{activeProject?.metrics?.apiEndpointsCount || 0}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Lines</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--accent-purple-light)' }}>{activeProject?.metrics?.linesOfCode || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic AI Intelligence Scores (Radial Metrics) */}
        <div className="col-12 metrics-row-layout">
          <div className="metrics-cards-grid">
            <RadialMetric 
              score={metrics.readiness} 
              label="Interview Readiness" 
              colorClass="green" 
              borderGlow="green-hover"
            />
            <RadialMetric 
              score={metrics.quizAvg} 
              label="MCQ Quiz Performance" 
              colorClass="purple" 
              borderGlow="purple-hover"
            />
            <RadialMetric 
              score={metrics.vivaAvg || metrics.confidence} 
              label="Oral Viva Score" 
              colorClass="cyan" 
              borderGlow="cyan-hover"
            />
            <RadialMetric 
              score={metrics.progress} 
              label="Learning Path Progress" 
              colorClass="purple" 
              borderGlow="purple-hover"
            />
          </div>
        </div>

        {/* Left: Roadmaps & Learning Path Progress */}
        <div className="col-8 roadmap-preview-panel">
          <div className="glass-card roadmap-summary-card">
            <div className="card-top-header">
              <h3>Active Learning Path</h3>
              <button className="btn-secondary btn-small" onClick={() => navigate('/learning-path')}>
                Manage Path <ArrowRight size={14} />
              </button>
            </div>

            <div className="roadmap-preview-list">
              {roadmap && roadmap.length > 0 ? (
                roadmap.slice(0, 4).map((node) => (
                  <div key={node.id} className={`roadmap-step-row ${node.status}`}>
                    <div className="step-bullet-icon">
                      {node.status === 'completed' ? (
                        <CheckCircle2 size={16} className="text-green" />
                      ) : node.status === 'in-progress' ? (
                        <div className="in-progress-bullet-pulse"></div>
                      ) : (
                        <Circle size={16} className="text-muted" />
                      )}
                    </div>
                    <div className="step-detail-info">
                      <span className="step-name">{node.name}</span>
                      <span className="step-time"><Clock size={12} /> {node.duration}</span>
                    </div>
                    <div className="step-badge-block">
                      <span className="xp-badge">+{node.xp} XP</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  No learning roadmap loaded yet. Upload a project archive to start your curriculum.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: AI Mentor Card */}
        <div className="col-4 ai-mentor-panel">
          <div className="glass-card ai-mentor-insight-card glow-cyan">
            <div className="mentor-header">
              <div className="mentor-avatar">
                <Brain size={18} />
              </div>
              <div className="mentor-title">
                <h4>AI Code Mentor</h4>
                <p>Real-time recommendation</p>
              </div>
            </div>

            <div className="mentor-bubble-content">
              <Sparkles size={16} className="text-cyan animate-pulse spark-icon" />
              <p>
                {metrics.weakAreas && metrics.weakAreas.length > 0 ? (
                  `Based on your code assessments, your core weakness is "${metrics.weakAreas[0]}". I highly recommend reviewing "${metrics.recommendations[0] || 'middleware validation rules'}" next before your viva session.`
                ) : (
                  `Your project routes depend heavily on validation structures. I suggest revising Mongoose schema model scopes and JWT token decryption sequences next.`
                )}
              </p>
            </div>

            <button className="btn-cyan full-width-btn" onClick={() => navigate('/quiz')}>
              <Play size={14} /> Initiate Assessment Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
