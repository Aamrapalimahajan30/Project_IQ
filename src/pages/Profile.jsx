import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Award, Flame, Mail, Cpu, ClipboardCheck, Mic, Calendar, ChevronRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

export default function Profile() {
  const { user, projects, activeProject, API_BASE } = useContext(AppContext);
  const navigate = useNavigate();
  
  const [profileMetrics, setProfileMetrics] = useState({
    quizAvg: 0,
    vivaAvg: 0,
    interviewAvg: 0,
    progressPct: 0,
    readinessIndex: 0,
    weakAreas: [],
    recommendations: [],
    strengths: []
  });

  // Fetch dynamic profile score performance from database (Phase 16/17)
  useEffect(() => {
    const fetchProfileMetrics = async () => {
      if (!activeProject) return;
      const token = localStorage.getItem('projectiq_token');
      const projectId = activeProject._id || activeProject.id;
      
      try {
        const res = await fetch(`${API_BASE}/prepare/${projectId}/readiness`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfileMetrics(data);
        }
      } catch (err) {
        console.error('Failed to load profile metrics:', err);
      }
    };
    fetchProfileMetrics();
  }, [activeProject]);

  const handleStartPractice = (category) => {
    navigate('/quiz-viva', { state: { startPracticeMode: true, practiceCategory: category } });
  };

  return (
    <div className="profile-page-container">
      {/* Header Profile card */}
      <div className="profile-hero-card glass-card glow-purple">
        <div className="profile-main-meta">
          <div className="profile-avatar-large">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="profile-credentials">
            <h2>{user.name}</h2>
            <p className="email-meta"><Mail size={12} /> {user.email}</p>
            <span className="level-label-glow">Lvl {user.level} — {user.levelName}</span>
          </div>
        </div>

        <div className="profile-metrics-row">
          <div className="metric-box">
            <Flame className="streak-icon-flame" size={24} />
            <div className="val">{user.streak} Days</div>
            <p>Active Days</p>
          </div>
          <div className="metric-box">
            <Award className="xp-icon-green" size={24} />
            <div className="val">{user.xp}</div>
            <p>Accumulated XP</p>
          </div>
          <div className="metric-box">
            <Cpu size={24} className="text-cyan" />
            <div className="val">{projects.length}</div>
            <p>Projects Scanned</p>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left column: Reworked Progress Tracking */}
        <div className="col-7 profile-column-group">
          {/* Reworked Preparation Progress (Section 17) */}
          <div className="glass-card calendar-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card-top-header">
              <h3><ClipboardCheck size={16} className="text-purple" /> Project Preparation Progress</h3>
              <span className="streak-current-badge">Active Project: {activeProject?.name || 'None'}</span>
            </div>
            <p className="calendar-explanation-text" style={{ marginBottom: '0.5rem' }}>
              Real-time progress derived dynamically from your stored codebase analysis and assessment scorecard submissions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              {/* Metric 1 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                  <span>Project Analysis</span>
                  <strong>{activeProject ? '100%' : '0%'}</strong>
                </div>
                <div className="readiness-progress-bar-bg" style={{ height: '8px' }}>
                  <div className="readiness-progress-fill purple" style={{ width: activeProject ? '100%' : '0%', height: '100%' }}></div>
                </div>
              </div>

              {/* Metric 2 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                  <span>Learning Path</span>
                  <strong>{profileMetrics.progressPct}%</strong>
                </div>
                <div className="readiness-progress-bar-bg" style={{ height: '8px' }}>
                  <div className="readiness-progress-fill cyan" style={{ width: `${profileMetrics.progressPct}%`, height: '100%' }}></div>
                </div>
              </div>

              {/* Metric 3 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                  <span>Quiz (MCQ Average)</span>
                  <strong>{profileMetrics.quizAvg}%</strong>
                </div>
                <div className="readiness-progress-bar-bg" style={{ height: '8px' }}>
                  <div className="readiness-progress-fill green" style={{ width: `${profileMetrics.quizAvg}%`, height: '100%' }}></div>
                </div>
              </div>

              {/* Metric 4 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                  <span>Oral Viva</span>
                  <strong>{profileMetrics.vivaAvg}%</strong>
                </div>
                <div className="readiness-progress-bar-bg" style={{ height: '8px' }}>
                  <div className="readiness-progress-fill purple" style={{ width: `${profileMetrics.vivaAvg}%`, height: '100%' }}></div>
                </div>
              </div>

              {/* Metric 5 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                  <span>Mock Interview</span>
                  <strong>{profileMetrics.interviewAvg}%</strong>
                </div>
                <div className="readiness-progress-bar-bg" style={{ height: '8px' }}>
                  <div className="readiness-progress-fill cyan" style={{ width: `${profileMetrics.interviewAvg}%`, height: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Weak Areas & Dynamic Revision checks */}
          <div className="glass-card profile-weak-areas-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>Weak Areas & Targeted Revision</h3>
            <p className="calendar-explanation-text" style={{ margin: 0 }}>
              AI detected weak topics based on assessment reviews. Trigger unlimited targeted practice sessions below.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              {profileMetrics.weakAreas.map((area, idx) => (
                <div key={idx} className="weak-area-item-row border-purple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ClipboardCheck size={18} className="text-purple" />
                    <div>
                      <h5 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Weak Area: {area}</h5>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Practice more questions to bridge this gap.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleStartPractice(area)}
                    className="btn btn-purple" 
                    style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Play size={10} fill="white" /> Practice 10 More
                  </button>
                </div>
              ))}
            </div>

            {profileMetrics.recommendations.length > 0 && (
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <h5 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Next Recommended Actions:</h5>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {profileMetrics.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Analytics Performance summaries */}
        <div className="col-5 profile-column-group">
          <div className="glass-card performance-summary-card">
            <h3>Assessment Performance</h3>
            
            <div className="performance-stat-listing">
              <div className="performance-row">
                <div className="stat-label-with-icon">
                  <ClipboardCheck size={16} className="text-purple" />
                  <div>
                    <span>MCQ Average</span>
                    <p>Dynamic quiz logs average</p>
                  </div>
                </div>
                <div className="performance-score-pills green">{profileMetrics.quizAvg}% AVG</div>
              </div>

              <div className="performance-row">
                <div className="stat-label-with-icon">
                  <ClipboardCheck size={16} className="text-purple" />
                  <div>
                    <span>Viva Average</span>
                    <p>Oral answer scores average</p>
                  </div>
                </div>
                <div className="performance-score-pills purple">{profileMetrics.vivaAvg}% AVG</div>
              </div>

              <div className="performance-row">
                <div className="stat-label-with-icon">
                  <Mic size={16} className="text-cyan" />
                  <div>
                    <span>Mock Interview Score</span>
                    <p>AI mock scorecard reviews</p>
                  </div>
                </div>
                <div className="performance-score-pills cyan">{profileMetrics.interviewAvg}% AVG</div>
              </div>
            </div>

            <div className="viva-readiness-scale">
              <div className="scale-label-row">
                <span>Developer Readiness Index</span>
                <strong>{profileMetrics.readinessIndex}%</strong>
              </div>
              <div className="readiness-progress-bar-bg">
                <div className="readiness-progress-fill cyan" style={{ width: `${profileMetrics.readinessIndex}%` }}></div>
              </div>
              <p className="readiness-tips-text">
                {profileMetrics.readinessIndex >= 70 
                  ? "Your structural comprehension is outstanding! You are ready to present this codebase in viva panels."
                  : "Practice timed mock interviews and revise database queries schemas to increase readiness indexes."}
              </p>
            </div>
          </div>

          <div className="glass-card scanned-projects-card">
            <h3>Analyzed Projects</h3>
            <div className="scanned-projects-list">
              {projects.map((proj) => (
                <div key={proj.id || proj._id} className="scanned-project-row">
                  <div className="project-bullet-detail">
                    <strong>{proj.name}</strong>
                    <div className="project-chips-mini">
                      {proj.techStack.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="tech-chip-mini">{t}</span>
                      ))}
                    </div>
                  </div>
                  <span className="scanned-proj-score">{proj.understanding}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
