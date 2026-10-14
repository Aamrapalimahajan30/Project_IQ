import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import AnalysisNav from '../components/AnalysisNav';
import { 
  FileCode, Layers, ArrowRight, Share2, AlertTriangle, 
  Server, Database, Code2, CheckCircle2, ShieldCheck, Cpu
} from 'lucide-react';
import './ProjectAnalysis.css';

export default function AnalysisOverview() {
  const { projects, activeProject } = useContext(AppContext);
  const navigate = useNavigate();

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

  const metrics = activeProject.metrics || {};
  const issuesCount = activeProject.codeIssues?.length || 0;

  return (
    <div className="analysis-page-container">
      <AnalysisNav 
        title="Project Overview & Telemetry" 
        subtitle="High-level structural breakdown, detected languages, metrics, and core entry points."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
        
        {/* Main Overview Card */}
        <div className="glass-card glow-purple" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  {activeProject.name}
                </h2>
                <span className="status-label-glow green">✓ Analyzed</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0.4rem 0 0 0', lineHeight: '1.5', maxWidth: '800px' }}>
                {activeProject.description || 'Static analysis and structural dependencies successfully scanned.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/analysis/architecture')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                <Share2 size={14} /> Architecture Flow
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/analysis/files')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                <FileCode size={14} /> File Inspector
              </button>
            </div>
          </div>

          {/* Programmatic Metrics 4-Grid */}
          <div className="programmatic-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="p-metric-card" style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: 'var(--soft-shadow)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>Total Files</span>
              <strong style={{ fontSize: '1.6rem', color: 'var(--text-primary)', display: 'block', margin: '0.2rem 0' }}>{metrics.totalFiles || 0}</strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Scanned Assets</span>
            </div>

            <div className="p-metric-card" style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: 'var(--soft-shadow)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>Lines of Code</span>
              <strong style={{ fontSize: '1.6rem', color: 'var(--accent-purple)', display: 'block', margin: '0.2rem 0' }}>{metrics.linesOfCode || 0}</strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Source Volume</span>
            </div>

            <div className="p-metric-card" style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: 'var(--soft-shadow)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>Scanned Endpoints</span>
              <strong style={{ fontSize: '1.6rem', color: 'var(--accent-cyan)', display: 'block', margin: '0.2rem 0' }}>{metrics.apiEndpointsCount || 0}</strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>API Paths</span>
            </div>

            <div className="p-metric-card" style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: 'var(--soft-shadow)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>Static Issues</span>
              <strong style={{ fontSize: '1.6rem', color: issuesCount > 0 ? '#ef4444' : 'var(--accent-green)', display: 'block', margin: '0.2rem 0' }}>
                {issuesCount}
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Quality Warnings</span>
            </div>
          </div>
        </div>

        {/* 2-Column Split: Tech Stacks & Key Entry Points */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          {/* Tech Stacks Card */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Code2 size={16} className="text-purple" /> Detected Languages & Stacks
            </h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {activeProject.techStack?.map((tech, idx) => (
                <span key={idx} className="tech-chip" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                  {tech}
                </span>
              ))}
            </div>

            {/* Database Summary Section */}
            {activeProject.databaseInfo && activeProject.databaseInfo.dbType && activeProject.databaseInfo.dbType !== 'None detected' && (
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Database size={14} className="text-cyan" /> Database Configuration:
                </h4>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div>Engine: <strong>{activeProject.databaseInfo.dbType}</strong></div>
                  {activeProject.databaseInfo.connectionStringFile && (
                    <div>Config File: <code>{activeProject.databaseInfo.connectionStringFile}</code></div>
                  )}
                  {activeProject.databaseInfo.detectedTablesOrCollections?.length > 0 && (
                    <div>Models/Tables: {activeProject.databaseInfo.detectedTablesOrCollections.join(', ')}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Critical Files (Primary Nodes) */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCode size={16} className="text-cyan" /> Critical Entry Points & Primary Files
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '250px', overflowY: 'auto' }}>
              {activeProject.importantFiles?.map((file, idx) => (
                <div 
                  key={idx} 
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.65rem 0.85rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                  onClick={() => navigate('/analysis/files')}
                  title="Click to inspect this file"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <FileCode size={16} className="text-purple" style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block' }}>
                        {file.name.split('/').pop()}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {file.purpose || 'Core execution module'}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API Routing Paths Table (if detected) */}
        {activeProject.endpointRoutes?.length > 0 && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={16} className="text-cyan" /> Scanned API Endpoints & Routes ({activeProject.endpointRoutes.length})
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {activeProject.endpointRoutes.map((route, idx) => (
                <div key={idx} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.65rem 0.85rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: '700', color: 'var(--accent-purple)' }}>
                    [{route.method}] <span style={{ color: 'var(--text-primary)' }}>{route.path}</span>
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-deep)', border: '1px solid var(--border-color)', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>
                    {route.type || 'REST'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
