import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import AnalysisNav from '../components/AnalysisNav';
import { 
  Share2, ZoomIn, ZoomOut, RotateCcw, Layers, ArrowRight, Activity, GitFork
} from 'lucide-react';
import './ProjectAnalysis.css';

export default function AnalysisArchitecture() {
  const { projects, activeProject } = useContext(AppContext);

  // Zoom & Pan states for the Import Graph SVG
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  }, [activeProject]);

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

  // Zoom & Pan handlers
  const handleZoomIn = () => setScale(prev => Math.min(2.5, prev + 0.15));
  const handleZoomOut = () => setScale(prev => Math.max(0.4, prev - 0.15));
  const handleResetZoom = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - translateX, y: e.clientY - translateY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setTranslateX(e.clientX - dragStart.x);
    setTranslateY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => setIsDragging(false);

  // Dynamic Dependency Imports Graph Builder
  const renderDynamicImportGraph = () => {
    const graph = activeProject.dependencyGraph || [];
    if (graph.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No file dependency imports detected in codebase scripts.
        </div>
      );
    }

    const distinctNodes = Array.from(new Set(graph.flatMap(edge => [edge.from, edge.to])));
    const colWidth = 280;
    const rowHeight = 80;
    const numCols = Math.min(3, Math.max(2, Math.ceil(distinctNodes.length / 5)));
    const nodeCoords = {};

    distinctNodes.forEach((node, idx) => {
      const col = idx % numCols;
      const row = Math.floor(idx / numCols);
      nodeCoords[node] = {
        x: col * colWidth + 60,
        y: row * rowHeight + 40
      };
    });

    const canvasWidth = numCols * colWidth + 120;
    const canvasHeight = Math.ceil(distinctNodes.length / numCols) * rowHeight + 80;

    return (
      <div 
        className="graph-canvas-container" 
        style={{ 
          border: '1px solid var(--border-color)', 
          background: '#0d1117', 
          borderRadius: '8px', 
          overflow: 'hidden', 
          position: 'relative', 
          height: '450px',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Controls Overlay */}
        <div style={{ position: 'absolute', right: '12px', top: '12px', display: 'flex', gap: '0.4rem', zIndex: 10 }}>
          <button className="btn btn-secondary" onClick={handleZoomIn} style={{ padding: '0.4rem' }} title="Zoom In"><ZoomIn size={15} /></button>
          <button className="btn btn-secondary" onClick={handleZoomOut} style={{ padding: '0.4rem' }} title="Zoom Out"><ZoomOut size={15} /></button>
          <button className="btn btn-secondary" onClick={handleResetZoom} style={{ padding: '0.4rem' }} title="Reset View"><RotateCcw size={15} /></button>
        </div>

        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          style={{ userSelect: 'none' }}
        >
          <defs>
            <marker id="arrow-marker" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#a78bfa" />
            </marker>
          </defs>

          <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>
            {graph.map((edge, i) => {
              const fromCoord = nodeCoords[edge.from];
              const toCoord = nodeCoords[edge.to];
              if (!fromCoord || !toCoord) return null;

              return (
                <line 
                  key={`line-${i}`}
                  x1={fromCoord.x + 80} 
                  y1={fromCoord.y + 18}
                  x2={toCoord.x} 
                  y2={toCoord.y + 18}
                  stroke="var(--accent-purple)"
                  strokeWidth="1.5"
                  markerEnd="url(#arrow-marker)"
                  strokeDasharray="4,2"
                />
              );
            })}

            {distinctNodes.map((node) => {
              const coord = nodeCoords[node];
              const fileName = node.split('/').pop();
              return (
                <g key={node} className="arch-node-group">
                  <rect 
                    x={coord.x} 
                    y={coord.y} 
                    width="160" 
                    height="36" 
                    rx="6" 
                    fill="#161b22" 
                    stroke="var(--accent-purple-light)" 
                    strokeWidth="1.2" 
                  />
                  <text 
                    x={coord.x + 80} 
                    y={coord.y + 22} 
                    textAnchor="middle" 
                    fill="#f0f6fc" 
                    fontSize="11" 
                    fontWeight="600"
                    title={node}
                  >
                    {fileName.length > 20 ? fileName.slice(0, 17) + '...' : fileName}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    );
  };

  // Render System Flow Diagram
  const renderDynamicArchitecture = () => {
    const flow = activeProject.architectureFlow || [];
    if (flow.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          No system architecture data flow generated.
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="svg-flow-diagram-container" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#0d1117' }}>
          <svg viewBox="0 0 360 270" style={{ width: '100%', maxHeight: '300px' }}>
            <defs>
              <filter id="glow-green" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {flow.map((edge, idx) => {
              const rowHeight = 70;
              const yStart = idx * rowHeight + 35;
              const yEnd = (idx + 1) * rowHeight + 10;
              return (
                <g key={idx}>
                  <line x1="180" y1={yStart} x2="180" y2={yEnd} stroke="var(--accent-cyan)" strokeWidth="2" strokeDasharray="4,3" />
                  <polygon points={`180,${yEnd} 175,${yEnd - 7} 185,${yEnd - 7}`} fill="var(--accent-cyan)" />
                  <text x="190" y={(yStart + yEnd) / 2 + 4} fill="#94a3b8" fontSize="10" fontFamily="var(--font-mono)">
                    {edge.relationType}
                  </text>
                  
                  <g className="arch-node-group">
                    <rect x="50" y={yStart - 30} width="260" height="32" rx="6" fill="#161b22" stroke="var(--accent-purple)" strokeWidth="1.2" />
                    <text x="180" y={yStart - 10} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      {edge.from.toUpperCase()}
                    </text>
                  </g>

                  {idx === flow.length - 1 && (
                    <g className="arch-node-group">
                      <rect x="50" y={yEnd} width="260" height="32" rx="6" fill="#161b22" stroke="var(--accent-green)" strokeWidth="1.2" />
                      <text x="180" y={yEnd + 20} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                        {edge.to.toUpperCase()}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: '700' }}>
            Mapped Architecture Evidence:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {flow.map((edge, i) => (
              <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.6rem', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.5rem 0.85rem', borderRadius: '6px' }}>
                <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>{edge.from}</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>──[{edge.relationType}]──&gt;</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{edge.to}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="analysis-page-container">
      <AnalysisNav 
        title="System Architecture & Flow Analysis" 
        subtitle="Visual map of data flow pipelines and inter-file dependency import graphs."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
        
        {/* 2-Column Grid: System Data Flow & Dependency Import Graph */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 1.5fr', gap: '1.5rem' }}>
          
          {/* Column 1: System Data Flow */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} className="text-cyan" /> End-to-End System Data Flow
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Sequential runtime boundaries from incoming client requests down to the database persistence layer.
            </p>
            {renderDynamicArchitecture()}
          </div>

          {/* Column 2: Interactive Dependency Imports Graph */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GitFork size={16} className="text-purple" /> Inter-File Dependency Imports Graph
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {activeProject.dependencyGraph?.length || 0} Connections
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Interactive pan/zoom graph depicting import linkages between codebase scripts.
            </p>
            {renderDynamicImportGraph()}
          </div>

        </div>

      </div>
    </div>
  );
}
