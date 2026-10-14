import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Settings, Cpu, Shield, User, Bell, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user, setUser, API_BASE } = useContext(AppContext);
  const [aiModel, setAiModel] = useState('gemini-3.5-flash-lite');
  const [aiTemperature, setAiTemperature] = useState(0.2);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [xpNotifications, setXpNotifications] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync settings when user context is loaded
  useEffect(() => {
    if (user) {
      if (user.aiModel) setAiModel(user.aiModel);
      if (typeof user.aiTemperature === 'number') setAiTemperature(user.aiTemperature);
      if (user.emailNotifications !== undefined) setEmailNotifications(user.emailNotifications);
      if (user.xpNotifications !== undefined) setXpNotifications(user.xpNotifications);
    }
  }, [user]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    const token = localStorage.getItem('projectiq_token');

    try {
      const res = await fetch(`${API_BASE}/auth/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          aiModel,
          aiTemperature,
          emailNotifications,
          xpNotifications
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Update local user context state
        setUser(prev => ({
          ...prev,
          ...data.settings
        }));
        
        let confirmText = 'Preferences saved.';
        if (user.aiModel !== aiModel) {
          confirmText = 'AI model updated successfully.';
        }
        setSuccessMessage(confirmText);
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        console.error('Failed to update settings');
      }
    } catch (err) {
      console.error('Error saving settings settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-page-container" style={{ textAlign: 'left', paddingBottom: '3rem' }}>
      <div className="settings-view-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>System Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure active model endpoints, user alerts, and sync parameters.</p>
      </div>

      {successMessage && (
        <div className="alert alert-success" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid var(--accent-green)',
          color: 'var(--accent-green-light)',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1.5rem',
          maxWidth: '640px'
        }}>
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '640px' }}>
        {/* Card 1 */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <Cpu size={16} className="text-purple" /> AI Engine Configuration
          </h3>
          <div className="form-group">
            <label className="form-label">Active Core Model</label>
            <select 
              className="form-input" 
              style={{ width: '100%', background: 'var(--bg-input)' }} 
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
            >
              <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Recommended) — Fast & Free</option>
              <option value="gemini-flash-latest">Gemini 1.5 Flash (Legacy) — Standard</option>
              <option value="gemini-pro-latest">Gemini 1.5 Pro (Heavy reasoning)</option>
            </select>
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Temperature (Creativity): {aiTemperature}</label>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              className="form-input" 
              style={{ width: '100%' }} 
              value={aiTemperature}
              onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Low temperature ensures precise code syntax explanation constraints.</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <Bell size={16} className="text-cyan" /> Notifications & Activity Reminders
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input 
                type="checkbox" 
                checked={emailNotifications} 
                onChange={(e) => setEmailNotifications(e.target.checked)}
                style={{ accentColor: 'var(--accent-purple)', width: '16px', height: '16px' }} 
              />
              <span>Email notifications for daily study reminders and preparation goals</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input 
                type="checkbox" 
                checked={xpNotifications} 
                onChange={(e) => setXpNotifications(e.target.checked)}
                style={{ accentColor: 'var(--accent-purple)', width: '16px', height: '16px' }} 
              />
              <span>Show floating XP notifications on dashboard completion</span>
            </label>
          </div>
        </div>

        <button 
          className="btn btn-purple" 
          onClick={handleSaveSettings}
          disabled={isSaving}
          style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold' }}
        >
          {isSaving ? 'Saving preferences...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
