import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import AnalysisNav from '../components/AnalysisNav';
import { 
  AlertTriangle, AlertOctagon, CheckCircle2, ShieldCheck, 
  FileCode, Filter, AlertCircle
} from 'lucide-react';
import './ProjectAnalysis.css';

export default function AnalysisIssues() {
  const { projects, activeProject } = useContext(AppContext);
  const [filterSeverity, setFilterSeverity] = useState('ALL'); // ALL, High, Medium, Low

  if (projects.length === 0 || !activeProject) {
    return (
      <div className="analysis-page-container" style={{ padding: '2rem' }}>
        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <h3>No scanned project assets found</h3>
          <p>Go to the Upload page to import and scan your project directories ZIP file.</p>
        </div>
      </div>
    );
  }

  const issues = activeProject.codeIssues || [];
  const highCount = issues.filter(i => i.severity === 'High').length;
  const medCount = issues.filter(i => i.severity === 'Medium').length;
  const lowCount = issues.filter(i => i.severity === 'Low').length;

  const filteredIssues = filterSeverity === 'ALL' 
    ? issues 
    : issues.filter(i => i.severity?.toUpperCase() === filterSeverity.toUpperCase());

  return (
    <div className="analysis-page-container">
      <AnalysisNav 
        title="Static Code Diagnostics & Issues" 
        subtitle="Vulnerability audit, code quality warnings, and potential runtime defects flagged across files."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
        
        {/* Severity Metrics Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div 
            className={`glass-card ${filterSeverity === 'ALL' ? 'glow-purple' : ''}`}
            onClick={() => setFilterSeverity('ALL')}
            style={{ padding: '1.25rem', textAlign: 'center', cursor: 'pointer', border: filterSeverity === 'ALL' ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)' }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Total Flagged</span>
            <strong style={{ fontSize: '1.8rem', color: 'var(--text-primary)', display: 'block', margin: '0.2rem 0' }}>{issues.length}</strong>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>All Diagnostic Rules</span>
          </div>

          <div 
            className={`glass-card ${filterSeverity === 'High' ? 'glow-purple' : ''}`}
            onClick={() => setFilterSeverity('High')}
            style={{ padding: '1.25rem', textAlign: 'center', cursor: 'pointer', border: filterSeverity === 'High' ? '2px solid #ef4444' : '1px solid var(--border-color)' }}
          >
            <span style={{ fontSize: '0.75rem', color: '#ef4444', textTransform: 'uppercase', fontWeight: '700' }}>High Severity</span>
            <strong style={{ fontSize: '1.8rem', color: '#ef4444', display: 'block', margin: '0.2rem 0' }}>{highCount}</strong>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Urgent Fixes</span>
          </div>

          <div 
            className={`glass-card ${filterSeverity === 'Medium' ? 'glow-purple' : ''}`}
            onClick={() => setFilterSeverity('Medium')}
            style={{ padding: '1.25rem', textAlign: 'center', cursor: 'pointer', border: filterSeverity === 'Medium' ? '2px solid #f59e0b' : '1px solid var(--border-color)' }}
          >
            <span style={{ fontSize: '0.75rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: '700' }}>Medium Severity</span>
            <strong style={{ fontSize: '1.8rem', color: '#f59e0b', display: 'block', margin: '0.2rem 0' }}>{medCount}</strong>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Code Quality Warnings</span>
          </div>

          <div 
            className={`glass-card ${filterSeverity === 'Low' ? 'glow-purple' : ''}`}
            onClick={() => setFilterSeverity('Low')}
            style={{ padding: '1.25rem', textAlign: 'center', cursor: 'pointer', border: filterSeverity === 'Low' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)' }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: '700' }}>Low Severity</span>
            <strong style={{ fontSize: '1.8rem', color: 'var(--accent-cyan)', display: 'block', margin: '0.2rem 0' }}>{lowCount}</strong>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Style / Minor Hints</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} className="text-purple" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Filter by Severity:</span>
            {['ALL', 'High', 'Medium', 'Low'].map(s => (
              <button
                key={s}
                onClick={() => setFilterSeverity(s)}
                className={`btn btn-secondary ${filterSeverity === s ? 'active' : ''}`}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', background: filterSeverity === s ? 'var(--accent-purple)' : 'var(--bg-card)', color: filterSeverity === s ? '#ffffff' : 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
              >
                {s}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing {filteredIssues.length} of {issues.length} diagnostic items
          </span>
        </div>

        {/* Issues List or Clean Banner */}
        {issues.length === 0 ? (
          <div className="glass-card" style={{ border: '1px solid var(--accent-green)', background: 'rgba(5, 150, 105, 0.04)', padding: '3.5rem 2rem', textAlign: 'center', borderRadius: '10px' }}>
            <CheckCircle2 size={36} className="text-green" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-green)' }}>0 Issues Detected</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Your scanned codebase passes all static analysis, syntax verification, and quality diagnostics without warnings.
            </p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No issues found matching the "{filterSeverity}" severity filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredIssues.map((issue, idx) => {
              const isHigh = issue.severity === 'High';
              const isMed = issue.severity === 'Medium';
              const color = isHigh ? '#ef4444' : isMed ? '#f59e0b' : 'var(--accent-cyan)';
              const bg = isHigh ? 'rgba(239, 68, 68, 0.04)' : isMed ? 'rgba(245, 158, 11, 0.04)' : 'rgba(8, 145, 178, 0.04)';
              
              return (
                <div 
                  key={idx} 
                  className="glass-card" 
                  style={{ borderLeft: `4px solid ${color}`, background: 'var(--bg-card)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.3rem', background: bg, padding: '0.2rem 0.5rem', borderRadius: '4px', border: `1px solid ${color}` }}>
                        {isHigh ? <AlertOctagon size={12} /> : <AlertTriangle size={12} />}
                        {issue.severity || 'Warning'} • {issue.issueType || 'General'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <FileCode size={13} className="text-purple" />
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {issue.filePath.split('/').pop()}
                      </span>
                      <span style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
                        Line {issue.line || 1}
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                    {issue.message}
                  </p>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Path: {issue.filePath}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
