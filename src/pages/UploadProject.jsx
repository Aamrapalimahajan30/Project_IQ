import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { getNetworkErrorMessage } from '../utils/apiHelper';
import { Upload, FileCode, CheckCircle, AlertTriangle, Cpu, Terminal, Loader2, ArrowRight } from 'lucide-react';
import './UploadProject.css';

const PIPELINE_STAGES = [
  { id: 'upload', name: 'Uploading Project', desc: 'Securely transferring archive to backend' },
  { id: 'scan', name: 'Scanning Files', desc: 'Validating archive entries and extracting project tree' },
  { id: 'tech', name: 'Detecting Technologies', desc: 'Identifying languages, frameworks, and manifests' },
  { id: 'structure', name: 'Analyzing Project Structure', desc: 'Mapping directory hierarchy and source components' },
  { id: 'architecture', name: 'Analyzing Architecture', desc: 'Evaluating routes, dependencies, and database schemas' },
  { id: 'modules_issues', name: 'Detecting Modules & Issues', desc: 'Segmenting modules and assessing code safety risks' },
  { id: 'ai', name: 'Generating AI Insights', desc: 'Synthesizing technical overview and interview questions' },
  { id: 'complete', name: 'Analysis Complete', desc: 'Project blueprint and assessment caches ready' }
];

export default function UploadProject() {
  const { addProject, API_BASE } = useContext(AppContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const terminalBottomRef = useRef(null);
  const stepTimersRef = useRef([]);
  const activeXhrRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadBytesInfo, setUploadBytesInfo] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [scanLogs, setScanLogs] = useState([]);

  // Auto-scroll terminal on new log lines
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scanLogs]);

  // Clean up timers and in-flight request if unmounting
  useEffect(() => {
    return () => {
      stepTimersRef.current.forEach(t => clearTimeout(t));
      if (activeXhrRef.current) {
        activeXhrRef.current.abort();
      }
    };
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.toLowerCase().endsWith('.zip')) {
        showError('Unsupported file type. Please upload a valid ZIP archive (.zip).');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        showError('File size exceeds the 50MB limit. Please upload a smaller project archive.');
        return;
      }
      uploadAndAnalyze(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.zip')) {
        showError('Unsupported file type. Please upload a valid ZIP archive (.zip).');
        e.target.value = '';
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        showError('File size exceeds the 50MB limit. Please upload a smaller project archive.');
        e.target.value = '';
        return;
      }
      uploadAndAnalyze(file);
      e.target.value = '';
    }
  };

  const showError = (msg) => {
    stepTimersRef.current.forEach(t => clearTimeout(t));
    stepTimersRef.current = [];
    if (activeXhrRef.current) {
      activeXhrRef.current = null;
    }
    setErrorMessage(msg);
    setStatus('error');
  };

  const addLog = (log) => {
    setScanLogs(prev => [...prev, log]);
  };

  const uploadAndAnalyze = (file) => {
    // Clear any previous state or timers
    stepTimersRef.current.forEach(t => clearTimeout(t));
    stepTimersRef.current = [];
    setErrorMessage('');
    setCurrentStep(0);
    setUploadProgress(0);
    setUploadBytesInfo('');
    setStatus('processing');
    setScanLogs([
      `[Initiated] Connecting to analysis pipeline...`,
      `[File] Archive: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`
    ]);

    const token = localStorage.getItem('projectiq_token');
    if (!token) {
      showError('Not authenticated. Please log in to upload and analyze projects.');
      return;
    }

    try {
      const xhr = new XMLHttpRequest();
      activeXhrRef.current = xhr;

      xhr.open('POST', `${API_BASE}/projects/upload`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      // Track genuine browser byte upload progress
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) {
          const pct = Math.min(100, Math.round((e.loaded / e.total) * 100));
          setUploadProgress(pct);
          const loadedMb = (e.loaded / (1024 * 1024)).toFixed(1);
          const totalMb = (e.total / (1024 * 1024)).toFixed(1);
          setUploadBytesInfo(`${loadedMb} MB / ${totalMb} MB (${pct}%)`);
        }
      };

      let uploadFinished = false;
      const onUploadFinished = () => {
        if (uploadFinished) return;
        uploadFinished = true;
        setUploadProgress(100);
        addLog('[Upload] 100% of archive transmitted. Server-side analysis started.');

        // Stage 1: Scanning Files
        setCurrentStep(1);
        addLog('[Scanning] Reading file signatures and expanding directory tree...');

        // Realistic sequential progression through server processing stages
        // Stage 2: Detecting Technologies
        const t1 = setTimeout(() => {
          setCurrentStep(2);
          addLog('[Technologies] Detecting programming languages, package manifests, and frameworks...');
        }, 1300);

        // Stage 3: Analyzing Project Structure
        const t2 = setTimeout(() => {
          setCurrentStep(3);
          addLog('[Structure] Mapping directory hierarchy, components, and entry points...');
        }, 2600);

        // Stage 4: Analyzing Architecture
        const t3 = setTimeout(() => {
          setCurrentStep(4);
          addLog('[Architecture] Evaluating REST routes, database schemas, and dependencies...');
        }, 3900);

        // Stage 5: Detecting Modules & Issues
        const t4 = setTimeout(() => {
          setCurrentStep(5);
          addLog('[Modules & Issues] Segmenting application modules and checking code safety patterns...');
        }, 5200);

        // Stage 6: Generating AI Insights (stays active with spinner until server finishes!)
        const t5 = setTimeout(() => {
          setCurrentStep(6);
          addLog('[AI Insights] Querying Gemini AI model for code explanation and interview synthesis...');
        }, 6500);

        stepTimersRef.current.push(t1, t2, t3, t4, t5);
      };

      xhr.upload.onload = onUploadFinished;

      xhr.onload = () => {
        activeXhrRef.current = null;
        stepTimersRef.current.forEach(t => clearTimeout(t));
        stepTimersRef.current = [];

        let data;
        try {
          data = JSON.parse(xhr.responseText);
        } catch (parseErr) {
          if (xhr.status === 413) {
            showError('Uploaded file exceeds the maximum allowed size of 50MB. Please upload a smaller project archive.');
          } else if (xhr.status === 503) {
            showError('The AI analysis service is temporarily busy or unavailable. Please try again shortly.');
          } else {
            showError('An unexpected response was received from the server. Please try again.');
          }
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          // Success: Activate Stage 7 (Analysis Complete) only after server actually finishes
          setCurrentStep(7);
          addLog('[Complete] Project analysis successfully completed!');
          addProject(data);

          const finalTimer = setTimeout(() => {
            setStatus('success');
          }, 700);
          stepTimersRef.current.push(finalTimer);
        } else {
          showError(data.message || 'Analysis failed on the server. Please check your project archive.');
        }
      };

      xhr.onerror = () => {
        activeXhrRef.current = null;
        stepTimersRef.current.forEach(t => clearTimeout(t));
        stepTimersRef.current = [];
        showError('Unable to connect to the backend server. Please check your network connection and ensure the server is active.');
      };

      xhr.ontimeout = () => {
        activeXhrRef.current = null;
        stepTimersRef.current.forEach(t => clearTimeout(t));
        stepTimersRef.current = [];
        showError('Analysis request timed out. The project took longer than expected to analyze.');
      };

      xhr.timeout = 180000; // 3 minutes timeout

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    } catch (err) {
      console.error('[Upload & Analysis Error]:', err);
      showError(getNetworkErrorMessage(err, 'An error occurred during codebase scanning. Please try again.'));
    }
  };

  const triggerUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="upload-page-container">
      <div className="upload-header">
        <h1>Source Code Upload</h1>
        <p>Drop your project archive (.zip) to extract architecture, modules, dependencies, and interview prep guides.</p>
      </div>

      <div className="upload-content-box">
        {status === 'idle' && (
          <div 
            className={`drag-drop-zone glass-card purple-hover ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerUploadClick}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden-file-input" 
              accept=".zip" 
              onChange={handleFileSelect}
            />
            <div className="upload-zone-graphics">
              <Upload size={48} className="upload-icon-pulse" />
            </div>
            <h3>Drop your project ZIP here</h3>
            <p>or click to browse your desktop directories</p>
            <div className="supported-stacks-badge-row">
              <span className="tech-chip">React</span>
              <span className="tech-chip">Node.js</span>
              <span className="tech-chip">Python</span>
              <span className="tech-chip">Go</span>
              <span className="tech-chip">Java</span>
              <span className="tech-chip">Django</span>
            </div>
            <div className="upload-limits-note">
              Supports project archives up to 50MB. Make sure to omit node_modules or venv inside the ZIP to speed up loading times.
            </div>
          </div>
        )}

        {status === 'processing' && (
          <div className="glass-card pipeline-processing-card">
            <div style={{
              padding: '1.25rem 2rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(109, 40, 217, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {currentStep === 7 ? (
                  <CheckCircle size={20} className="text-green" />
                ) : (
                  <Loader2 size={20} className="text-purple animate-spin" />
                )}
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                  {currentStep === 7 ? 'Analysis Complete' : `Current Stage: ${PIPELINE_STAGES[currentStep]?.name}`}
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                Stage {currentStep + 1} of {PIPELINE_STAGES.length}
              </span>
            </div>

            <div className="pipeline-flex-layout">
              <div className="pipeline-steps-status-col">
                <h3>Analysis Pipeline</h3>
                <div className="pipeline-steps-list">
                  {PIPELINE_STAGES.map((stage, idx) => {
                    const isDone = idx < currentStep || currentStep === 7;
                    const isActive = idx === currentStep && currentStep < 7;
                    const isPending = idx > currentStep;

                    return (
                      <div 
                        key={stage.id} 
                        className={`pipeline-step-item ${isDone ? 'done' : isActive ? 'active' : 'pending'}`}
                      >
                        <div className="step-state-bullet">
                          {isDone ? (
                            <div className="step-complete-dot">✓</div>
                          ) : isActive ? (
                            <Loader2 size={12} className="text-purple animate-spin" />
                          ) : (
                            <div className="step-idle-dot"></div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--accent-purple)' : isDone ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {stage.name}
                            {idx === 0 && isActive && uploadBytesInfo ? ` — ${uploadBytesInfo}` : ''}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {stage.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pipeline-terminal-col">
                <div className="terminal-header">
                  <Terminal size={14} /> 
                  <span>Live Analysis Logs</span>
                  <div className="terminal-header-glow-orb"></div>
                </div>
                <div className="terminal-lines-display">
                  {scanLogs.map((log, idx) => (
                    <div key={idx} className="terminal-line-row">
                      <span className="terminal-prompt">&gt;</span>
                      <span className="terminal-text">{log}</span>
                    </div>
                  ))}
                  <div ref={terminalBottomRef}></div>
                  <div className="terminal-active-cursor"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="glass-card upload-success-card glow-green">
            <CheckCircle size={48} className="text-green success-scale-icon" />
            <h2>Project Analyzed Successfully</h2>
            <p>
              ProjectIQ has mapped your module interfaces, generated interview questions, and instantiated your learning roadmap.
            </p>
            <div className="success-action-group">
              <button className="btn-primary" onClick={() => navigate('/analysis')}>
                View Architecture Workspace
              </button>
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="glass-card upload-error-card">
            <AlertTriangle size={48} className="text-red" />
            <h2>Upload Analysis Failed</h2>
            <p>{errorMessage}</p>
            <button className="btn-primary" onClick={() => setStatus('idle')}>
              Retry Upload
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
