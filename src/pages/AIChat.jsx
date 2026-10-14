import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { handleApiResponse, getNetworkErrorMessage } from '../utils/apiHelper';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import './AIChat.css';

export default function AIChat() {
  const { activeProject, API_BASE } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const suggestedPrompts = [
    'Explain my project architecture',
    'Why are some files marked critical?',
    'Explain the authentication flow',
    'How does database connection work?',
    'What code improvements do you suggest?'
  ];

  // Load chat history from backend on boot (Phase 11 integration)
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!activeProject) return;
      
      const token = localStorage.getItem('projectiq_token');
      const projectId = activeProject._id || activeProject.id;
      
      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/chat`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            // Map saved messages to view formats
            const mapped = data.messages.map((m, idx) => ({
              id: `msg-hist-${idx}`,
              sender: m.sender,
              text: m.text,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
            }));
            setMessages(mapped);
          } else {
            // Fallback to default greeting
            setMessages([
              {
                id: 'welcome-msg',
                sender: 'bot',
                text: `I analyzed your project structure for **${activeProject.name}**. I mapped the files, identified a **${activeProject.techStack.join(' + ')}** tech stack, and analyzed security patterns. Ask me anything about your implementation!`,
                timestamp: new Date()
              }
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    loadChatHistory();
  }, [activeProject]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('projectiq_token');
      const projectId = activeProject._id || activeProject.id;
      
      const res = await fetch(`${API_BASE}/projects/${projectId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: text })
      });

      const data = await handleApiResponse(res, 'The AI Mentor could not process your query at this time.');
      
      const botMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: data.text || 'I could not compile a response.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('[AI Chat Error]:', err);
      const friendlyError = getNetworkErrorMessage(err, 'The AI Mentor service is temporarily unavailable. Please try again in a moment.');
      setMessages(prev => [...prev, {
        id: `msg-err-${Date.now()}`,
        sender: 'bot',
        text: `⚠️ ${friendlyError}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-page-container">
      <div className="chat-view-header">
        <div className="header-text">
          <h1>AI Code Mentor</h1>
          <p>Ask technical questions about files, architecture patterns, and optimization recommendations.</p>
        </div>
      </div>

      <div className="chat-workspace-grid glass-card">
        <div className="chat-messages-scroller">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message-bubble ${msg.sender}-style`}>
              <div className="bubble-avatar">
                {msg.sender === 'bot' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="bubble-content-text">
                <div className="sender-meta-row">
                  <span className="sender-name">{msg.sender === 'bot' ? 'IQ Mentor' : 'You'}</span>
                  <span className="msg-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="parsed-markdown-content">
                  {msg.text.split('\n\n').map((paragraph, pIdx) => {
                    if (paragraph.startsWith('*') || paragraph.startsWith('1.')) {
                      return (
                        <ul key={pIdx} className="markdown-list">
                          {paragraph.split('\n').map((item, iIdx) => (
                            <li key={iIdx}>
                              {item.replace(/^\*?\s*/, '').replace(/^\d+\.\s*/, '')}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p key={pIdx} dangerouslySetInnerHTML={{
                        __html: paragraph
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/`(.*?)`/g, '<code>$1</code>')
                      }} />
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-message-bubble bot-style typing-indicator-bubble">
              <div className="bubble-avatar">
                <Bot size={16} />
              </div>
              <div className="typing-dots-animation">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef}></div>
        </div>

        <div className="chat-controls-footer">
          {messages.length === 1 && (
            <div className="suggested-chips-container">
              <div className="chips-title"><Sparkles size={12} className="text-purple" /> Suggested Prompts:</div>
              <div className="chips-flex-row">
                {suggestedPrompts.map((prompt, idx) => (
                  <button 
                    key={idx} 
                    className="suggested-prompt-chip"
                    onClick={() => handleSendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form 
            className="chat-input-form-row" 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
          >
            <input 
              type="text" 
              className="form-input chat-text-input" 
              placeholder="Ask your mentor about dependencies, files, schemas..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
            />
            <button type="submit" className="btn-primary chat-submit-btn" disabled={isTyping || !inputValue.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
