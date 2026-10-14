import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import AnalysisNav from '../components/AnalysisNav';
import { 
  Folder, File, FileCode, Cpu, Code, Search, 
  ChevronRight, ChevronDown, Sparkles
} from 'lucide-react';
import './ProjectAnalysis.css';

export default function AnalysisFiles() {
  const { projects, activeProject } = useContext(AppContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Default select first primary file
  useEffect(() => {
    if (activeProject && activeProject.importantFiles && activeProject.importantFiles.length > 0) {
      setSelectedFile(activeProject.importantFiles[0]);
    } else {
      setSelectedFile(null);
    }
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

  // Recursive Directory Tree Builder with click support
  const renderTree = (node, depth = 0) => {
    if (!node) return null;
    const isFile = node.type === 'file';
    const isMatch = searchFilter === '' || node.name.toLowerCase().includes(searchFilter.toLowerCase());

    // Check if this node matches an important file
    const matchedImportantFile = isFile && activeProject.importantFiles 
      ? activeProject.importantFiles.find(f => f.name.endsWith(node.name) || f.name === node.name)
      : null;

    const isSelected = isFile && selectedFile && (selectedFile.name.endsWith(node.name) || selectedFile.name === node.name);

    return (
      <div key={node.name} style={{ marginLeft: `${depth * 14}px` }}>
        <div 
          className={`tree-node-row ${isSelected ? 'active-tree-node' : ''}`}
          onClick={() => {
            if (isFile) {
              if (matchedImportantFile) {
                setSelectedFile(matchedImportantFile);
              } else {
                setSelectedFile({
                  name: node.name,
                  purpose: 'Project source file',
                  code: `// File: ${node.name}\n// Scanned within repository tree.\n\n// Full contents analyzed during project upload.`
                });
              }
            }
          }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.45rem', 
            cursor: 'pointer', 
            padding: '0.35rem 0.5rem', 
            borderRadius: '4px',
            background: isSelected ? 'rgba(109, 40, 217, 0.1)' : 'transparent',
            color: isSelected ? 'var(--accent-purple)' : isFile ? 'var(--text-secondary)' : 'var(--text-primary)',
            fontWeight: isSelected ? '700' : 'normal'
          }}
        >
          {isFile ? (
            <FileCode size={13} className={isSelected ? 'text-purple' : 'text-cyan'} />
          ) : (
            <Folder size={13} className="text-purple" />
          )}
          <span style={{ fontSize: '0.82rem', fontFamily: isFile ? 'var(--font-mono)' : 'inherit' }}>
            {node.name}
          </span>
        </div>
        {node.children && node.children.map(child => renderTree(child, depth + 1))}
      </div>
    );
  };

  const fileName = selectedFile?.name ? selectedFile.name.split('/').pop() : 'No file selected';

  return (
    <div className="analysis-page-container">
      <AnalysisNav 
        title="Project File Explorer & Inspector" 
        subtitle="Browse full repository file trees, inspect source codes with line numbers, and view AI file explanations."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', textAlign: 'left', alignItems: 'start' }}>
        
        {/* Left Column: File Explorer Tree & Quick Picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Quick Primary Files Picker */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={14} className="text-purple" /> Critical Entry Files
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '180px', overflowY: 'auto' }}>
              {activeProject.importantFiles?.map((file, idx) => {
                const isCur = selectedFile?.name === file.name;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedFile(file)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      background: isCur ? 'rgba(109, 40, 217, 0.15)' : 'var(--bg-card)', 
                      border: isCur ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)', 
                      padding: '0.45rem 0.65rem', 
                      borderRadius: '5px', 
                      textAlign: 'left', 
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: isCur ? 'var(--accent-purple)' : 'var(--text-primary)',
                      fontWeight: isCur ? '700' : '500'
                    }}
                  >
                    <FileCode size={13} className={isCur ? 'text-purple' : 'text-cyan'} />
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{file.name.split('/').pop()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Repository Directory Tree */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Folder size={14} className="text-purple" /> Full Repository Tree
            </h4>

            <div className="directory-scroller" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {renderTree(activeProject.folderStructure)}
            </div>
          </div>

        </div>

        {/* Right Column: Code Viewer & AI Script Explanation Drawer */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '640px' }}>
          
          {/* Header with Active File Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCode size={18} className="text-cyan" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '800' }}>
                  {fileName}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {selectedFile?.purpose || 'Scanned source script'}
                </span>
              </div>
            </div>

            <span className="node-mini-pill" style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              {selectedFile?.code ? selectedFile.code.split('\n').length : 0} Lines
            </span>
          </div>

          {/* Code Viewer Box */}
          <div className="editor-textarea-wrapper" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="editor-textarea-preview" style={{ flexGrow: 1, minHeight: '340px', background: '#0f172a', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <pre className="line-numbers-pre" style={{ margin: 0, padding: '1rem', overflowX: 'auto', maxHeight: '450px' }}>
                <code>
                  {selectedFile?.code ? (
                    selectedFile.code.split('\n').map((line, idx) => (
                      <div key={idx} className="code-line-row" style={{ display: 'flex', gap: '1rem', fontSize: '0.84rem', lineHeight: '1.6' }}>
                        <span className="line-num" style={{ color: '#64748b', minWidth: '28px', textAlign: 'right', userSelect: 'none' }}>{idx + 1}</span>
                        <span className="line-text" style={{ color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{line}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                      Select a file from the repository tree on the left to inspect code.
                    </div>
                  )}
                </code>
              </pre>
            </div>
          </div>

          {/* AI Script Explanation Drawer */}
          <div className="editor-ai-explanation-drawer" style={{ background: 'rgba(109, 40, 217, 0.04)', border: '1px solid rgba(109, 40, 217, 0.15)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Cpu size={16} className="text-purple" />
              <strong style={{ fontSize: '0.9rem', color: 'var(--accent-purple)' }}>AI Script Analysis & Responsibilities</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {selectedFile?.explanation || selectedFile?.purpose || "This file defines core components and routines for the project runtime. Select a primary file to view deep architectural explanations."}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
