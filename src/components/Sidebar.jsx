import React, { useContext, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { 
  LayoutDashboard, Folder, UploadCloud, GitBranch, 
  ClipboardCheck, Mic, FileSearch, MessageSquareCode, 
  Award, FileText, User, Settings, LogOut, ChevronLeft, ChevronRight, Flame, Sparkles, Sun, Moon
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout, xpAnimation, theme, toggleTheme } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar-container ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container" onClick={() => navigate('/')}>
          <div className="logo-icon">IQ</div>
          {!collapsed && <span className="logo-text">Project<span className="text-purple">IQ</span></span>}
        </div>
        <button 
          className="collapse-toggle" 
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle Sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Gamified User Status */}
      <div className="sidebar-profile-widget">
        <div className="avatar-section">
          <div className="user-avatar">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          {!collapsed && (
            <div className="user-info-text">
              <div className="user-name">{user.name}</div>
              <div className="user-level-badge">Lvl {user.level} — {user.levelName}</div>
            </div>
          )}
        </div>
        
        {!collapsed && (
          <div className="xp-bar-container">
            <div className="xp-text-row">
              <span>XP: {user.xp}</span>
              <span className="streak-indicator">
                <Flame size={14} className="streak-flame" /> {user.streak} {user.streak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <div className="xp-progress-bg">
              <div 
                className="xp-progress-fill" 
                style={{ width: `${(user.xp % 600) / 600 * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {/* Workspace Category */}
        <div className="nav-category">
          {!collapsed && <span className="category-label">Workspace</span>}
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
          <NavLink to="/upload" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <UploadCloud size={18} />
            {!collapsed && <span>Upload Project</span>}
          </NavLink>
        </div>

        {/* Learn Category */}
        <div className="nav-category">
          {!collapsed && <span className="category-label">Learn</span>}
          <NavLink to="/learning-path" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <GitBranch size={18} />
            {!collapsed && <span>Learning Path</span>}
          </NavLink>
          <NavLink to="/quiz" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ClipboardCheck size={18} />
            {!collapsed && <span>Quiz & Viva</span>}
          </NavLink>
          <NavLink to="/mock-interview" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Mic size={18} />
            {!collapsed && <span>Mock Interview</span>}
          </NavLink>
        </div>

        {/* AI Intelligence Category */}
        <div className="nav-category">
          {!collapsed && <span className="category-label">AI Insights</span>}
          <NavLink 
            to="/analysis/overview" 
            className={`nav-item ${location.pathname.startsWith('/analysis') ? 'active' : ''}`}
          >
            <FileSearch size={18} />
            {!collapsed && <span>Project Analysis</span>}
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <MessageSquareCode size={18} />
            {!collapsed && <span>AI Project Chat</span>}
          </NavLink>
        </div>

        {/* Reports & Metrics */}
        <div className="nav-category">
          {!collapsed && <span className="category-label">Performance</span>}
          <NavLink to="/report" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={18} />
            {!collapsed && <span>Reports & PDF</span>}
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <User size={18} />
            {!collapsed && <span>My Profile</span>}
          </NavLink>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <NavLink to="/settings" className={({ isActive }) => `nav-item footer-item ${isActive ? 'active' : ''}`}>
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button className="nav-item footer-item theme-toggle-btn" onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          {!collapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>
        <button className="nav-item footer-item logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Floating XP Gain Indicator */}
      {xpAnimation && (
        <div className="floating-xp-alert">
          <Sparkles size={16} className="text-green animate-pulse" />
          <div className="xp-alert-content">
            <span className="xp-alert-amount">+{xpAnimation.amount} XP</span>
            <span className="xp-alert-text">{xpAnimation.text}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
