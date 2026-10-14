import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { FileText, Printer, ShieldCheck, Sparkles, Award, CheckCircle } from 'lucide-react';
import './PDFReport.css';

export default function PDFReport() {
  const { user, activeProject, API_BASE } = useContext(AppContext);
  
  const [reportMetrics, setReportMetrics] = useState({
    quizAvg: 0,
    vivaAvg: 0,
    interviewAvg: 0,
    progressPct: 0,
    readinessIndex: 0,
    weakAreas: [],
    recommendations: [],
    strengths: []
  });
  
  const [loading, setLoading] = useState(false);

  // Load database readiness calculations on load (Phase 19)
  useEffect(() => {
    const fetchReportMetrics = async () => {
      if (!activeProject) return;
      setLoading(true);
      const token = localStorage.getItem('projectiq_token');
      const projectId = activeProject._id || activeProject.id;
      
      try {
        const res = await fetch(`${API_BASE}/prepare/${projectId}/readiness`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReportMetrics(data);
        }
      } catch (err) {
        console.error('Failed to load PDF report metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportMetrics();
  }, [activeProject]);

  const handlePrint = () => {
    window.print();
  };

  // Date format standardizer (30 Aug 2026)
  const getStandardizedDate = () => {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  if (!activeProject) {
    return (
      <div className="report-page-container" style={{ padding: '2rem' }}>
        <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <h3>No active project found</h3>
          <p>Please upload a ZIP file first before exporting performance summaries.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page-container" style={{ textAlign: 'left' }}>
      {/* Action Header bar (hidden in prints) */}
      <div className="report-view-header print-hidden" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Performance PDF Export</h1>
          <p>Review clean diagnostic scorecards for presentation to professors or team leads.</p>
        </div>
        <button className="btn-primary print-trigger-btn" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={16} /> Print Report
        </button>
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div className="typing-dots-animation" style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', marginBottom: '1rem' }}>
            <span className="dot animate-pulse"></span>
            <span className="dot animate-pulse" style={{ animationDelay: '0.2s' }}></span>
            <span className="dot animate-pulse" style={{ animationDelay: '0.4s' }}></span>
          </div>
          <p>Compiling database scorecard reports...</p>
        </div>
      ) : (
        /* Printable Sheet */
        <div className="printable-report-sheet" style={{ padding: '2.5rem', background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          
          {/* Document Header */}
          <div className="report-document-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>
            <div className="report-branding-side">
              <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                PROJECT ANALYSIS & INTERVIEW READINESS REPORT
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                ProjectIQ Dynamic Assessment & Code Diagnostics
              </p>
            </div>
            <div className="report-branding-date" style={{ textAlign: 'right', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Date:</span>
              <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-primary)' }}>{getStandardizedDate()}</p>
            </div>
          </div>

          {/* Section 1: Candidate Specifications */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              1. Candidate Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              <div><strong>Name:</strong> {user.name}</div>
              <div><strong>Email:</strong> {user.email || 'N/A'}</div>
              <div><strong>XP Accumulated:</strong> {user.xp} XP</div>
              <div><strong>Rank Profile:</strong> Level {user.level} ({user.levelName})</div>
            </div>
          </div>

          {/* Section 2: Project Overview */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              2. Scanned Project Overview
            </h3>
            <p style={{ fontSize: '0.88rem', margin: '0.5rem 0', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {activeProject.description}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.85rem', marginTop: '0.75rem', background: 'var(--bg-deep)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '6px' }}>
              <div>Total Code Files: <strong>{activeProject.metrics?.totalFiles || 0}</strong></div>
              <div>Lines of Code: <strong>{activeProject.metrics?.linesOfCode || 0} LoC</strong></div>
              <div>Scanned Endpoints: <strong>{activeProject.metrics?.apiEndpointsCount || 0} API Path(s)</strong></div>
            </div>
          </div>

          {/* Section 3: Detected Technologies */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              3. Detected Technologies
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {activeProject.techStack.map((tech, idx) => (
                <span key={idx} style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid var(--border-color)', fontWeight: 'bold' }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Section 4: Architecture */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              4. System Architecture
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {activeProject.architectureFlow?.map((edge, i) => (
                <div key={i}>
                  📁 <strong>{edge.from}</strong> ──[{edge.relationType}]──&gt; 📁 <strong>{edge.to}</strong>
                </div>
              ))}
              {(!activeProject.architectureFlow || activeProject.architectureFlow.length === 0) && (
                <span style={{ color: 'var(--text-muted)' }}>No custom architecture mapped.</span>
              )}
            </div>
          </div>

          {/* Section 5: Data Flow */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              5. Data Flow & Imports Relations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {activeProject.dependencyGraph?.map((edge, i) => (
                <div key={i}>
                  📄 {edge.from.split('/').pop()} ──[imports]──&gt; 📄 {edge.to.split('/').pop()}
                </div>
              ))}
              {(!activeProject.dependencyGraph || activeProject.dependencyGraph.length === 0) && (
                <span style={{ color: '#9ca3af' }}>No import dependencies detected.</span>
              )}
            </div>
          </div>

          {/* Section 6: Modules */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              6. Modular Boundaries Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              {activeProject.modules?.map((mod, idx) => (
                <div key={idx} style={{ border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)' }}>📦 {mod.name}</div>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{mod.purpose}</p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Files: {mod.files.map(f => f.split('/').pop()).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7: Important Files */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              7. Important Code Files Indexed
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              {activeProject.importantFiles?.map((file, i) => (
                <div key={i} style={{ color: 'var(--text-secondary)' }}>
                  📄 <strong>{file.name.split('/').pop()}</strong>: {file.purpose}
                </div>
              ))}
            </div>
          </div>

          {/* Section 8: Routes & Endpoints */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              8. Scanned Routes & Endpoints
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.8rem', fontFamily: 'monospace' }}>
              {activeProject.endpointRoutes?.slice(0, 10).map((route, i) => (
                <div key={i} style={{ color: 'var(--accent-cyan)' }}>
                  [{route.method}] {route.path} ({route.type})
                </div>
              ))}
              {(!activeProject.endpointRoutes || activeProject.endpointRoutes.length === 0) && (
                <span style={{ color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>No active route definitions found.</span>
              )}
            </div>
          </div>

          {/* Section 9: Database Info */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              9. Scanned Database Configurations
            </h3>
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div>Database Type: <strong>{activeProject.databaseInfo?.dbType || 'None detected'}</strong></div>
              {activeProject.databaseInfo?.dbType !== 'None detected' && (
                <>
                  <div>Connection references file: <strong>{activeProject.databaseInfo?.connectionStringFile || 'N/A'}</strong></div>
                  <div>Schemas/Collections found: <strong>{activeProject.databaseInfo?.detectedTablesOrCollections?.join(', ') || 'N/A'}</strong></div>
                </>
              )}
            </div>
          </div>

          {/* Section 10: Code Quality Findings */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              10. Code Quality Findings
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
              Note: Issues are parsed by structural programmatic checks.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
              {activeProject.codeIssues?.length === 0 ? (
                <div style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>
                  ✓ 0 issues detected by the current static analysis checks.
                </div>
              ) : (
                activeProject.codeIssues.slice(0, 5).map((issue, i) => (
                  <div key={i} style={{ color: issue.severity === 'High' ? '#dc2626' : '#d97706' }}>
                    ⚠ [{issue.issueType}] in {issue.filePath.split('/').pop()} line {issue.line}: {issue.message}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 11: Learning Progress */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              11. Learning Roadmap Accomplishments
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ width: '100%', background: 'var(--bg-card-subtle)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${reportMetrics.progressPct}%`, background: 'var(--accent-purple)', height: '100%' }}></div>
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 'bold' }}>{reportMetrics.progressPct}%</span>
            </div>
          </div>

          {/* Section 12-13-14: Assessment averages */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              12. Technical Assessment Performance Indexes
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '0.5rem', textAlign: 'center' }}>
              <div style={{ border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MCQ Quiz Avg</div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{reportMetrics.quizAvg}%</strong>
              </div>
              <div style={{ border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Oral Viva Avg</div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{reportMetrics.vivaAvg}%</strong>
              </div>
              <div style={{ border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mock Interview Avg</div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{reportMetrics.interviewAvg}%</strong>
              </div>
              <div style={{ border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-card-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Readiness Score</div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--accent-purple)' }}>{reportMetrics.readinessIndex}%</strong>
              </div>
            </div>
          </div>

          {/* Section 15-16: Strengths & Weaknesses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ border: '1px solid #10b981', padding: '0.75rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.04)' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-green)', fontSize: '0.9rem' }}>Strengths Identified</h5>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {reportMetrics.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                {reportMetrics.strengths?.length === 0 && <li>Scanned codebase features look healthy.</li>}
              </ul>
            </div>
            <div style={{ border: '1px solid #ef4444', padding: '0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.04)' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#dc2626', fontSize: '0.9rem' }}>Weak Areas Flagged</h5>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {reportMetrics.weakAreas?.map((w, i) => <li key={i}>{w}</li>)}
                {reportMetrics.weakAreas?.length === 0 && <li>No specific weaknesses flagged.</li>}
              </ul>
            </div>
          </div>

          {/* Section 17-18: Revision Recommendations & Next Steps */}
          <div>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              13. Directed Revisions & Checklist
            </h3>
            <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {reportMetrics.recommendations?.map((rec, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>{rec}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                <span>➔</span>
                <span>Next Step: Practice 10 more targeted questions in weak areas under your profile dashboard.</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
