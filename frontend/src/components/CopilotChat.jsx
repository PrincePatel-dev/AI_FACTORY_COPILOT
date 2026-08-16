import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Sparkles, Copy, Check, Info, Cpu } from 'lucide-react';

export default function CopilotChat({ messages, onSendMessage, loading, onClearChat }) {
  const [input, setInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesContainerRef = useRef(null);

  const quickPrompts = [
    { label: "⚡ Worst downtime this week", query: "Which machine has the worst downtime this week?" },
    { label: "🛠️ Scrap cause on Weld-02", query: "What is causing most scrap on Weld-02?" },
    { label: "🌙 Night vs Morning shift", query: "Compare night shift vs morning shift performance" },
    { label: "📐 Weld-02 Scrap Std Dev (Sandbox)", query: "What is the standard deviation of scrap units on Weld-02?" },
    { label: "📊 Downtime vs Scrap Correlation (Sandbox)", query: "Calculate the exact correlation between downtime minutes and scrap units across the plant." }
  ];

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleChipClick = (query) => {
    if (loading) return;
    onSendMessage(query);
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="sc-card copilot-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      
      {/* Copilot Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-panel)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            padding: '5px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid var(--border-cyan)'
          }}>
            <Bot size={17} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>AI Factory Copilot</span>
              <span className="sc-badge sc-badge-emerald" style={{ padding: '1px 5px', fontSize: '0.62rem' }}>
                Ready
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              Natural language Q&A over downtime, OEE & scrap
            </div>
          </div>
        </div>

        {/* Action Info */}
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Info size={12} color="var(--text-muted)" />
            <span style={{ fontSize: '0.68rem' }}>Verified numbers</span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '3px 7px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.68rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Clear Chat
            </button>
          )}
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div style={{
        padding: '6px 12px',
        background: 'rgba(13, 21, 39, 0.5)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        flexShrink: 0
      }}>
        {quickPrompts.map((chip, idx) => (
          <button
            key={idx}
            className="sc-chip"
            onClick={() => handleChipClick(chip.query)}
            disabled={loading}
            style={{ padding: '4px 12px', fontSize: '0.72rem' }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={messagesContainerRef}
        style={{ flex: 1, minHeight: 0, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}
      >
        
        {/* Welcome Empty State Banner */}
        {messages.length === 0 && (
          <div style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                MFGX AI Copilot Ready
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Ask anything in <strong>English, Gujlish, or Hinglish</strong>. Or click any quick prompt above to calculate downtime, scrap, or sandbox formulas.
            </p>
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '12px',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: msg.role === 'user' ? 'var(--accent-blue)' : 'linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
            }}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Bubble Content */}
            <div style={{
              maxWidth: '88%',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)' : 'var(--bg-panel)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(59, 130, 246, 0.4)' : 'var(--border-subtle)'}`,
              borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
              padding: '10px 14px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}>
              {/* AI Header Tag */}
              {msg.role === 'assistant' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '6px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  paddingBottom: '4px'
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Cpu size={11} />
                    <span>{msg.model_used || "Gemini 3.1 Flash Lite"}</span>
                  </span>
                  <button
                    onClick={() => handleCopy(msg.content, idx)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                    title="Copy Answer"
                  >
                    {copiedIndex === idx ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                  </button>
                </div>
              )}

              {/* Message Text */}
              <div 
                style={{ fontSize: '0.84rem', lineHeight: 1.5, color: '#F1F5F9', wordBreak: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
              />

              {/* Timestamp */}
              <div style={{
                fontSize: '0.66rem',
                color: 'rgba(255,255,255,0.4)',
                textAlign: 'right',
                marginTop: '4px'
              }}>
                {msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Bot size={16} />
            </div>
            <div style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px 14px 14px 2px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span className="pulse-emerald" />
                <span className="pulse-emerald" style={{ animationDelay: '0.3s' }} />
                <span className="pulse-emerald" style={{ animationDelay: '0.6s' }} />
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Running analytics on 1,350 factory shift records...
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-panel)',
        display: 'flex',
        gap: '10px',
        flexShrink: 0
      }}>
        <input
          type="text"
          className="sc-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about downtime, OEE, scrap, standard deviations, or shifts..."
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          className={input.trim() && !loading ? "sc-btn sc-btn-glow" : "sc-btn sc-btn-secondary"}
          disabled={loading || !input.trim()}
          style={{ padding: '0 18px', flexShrink: 0 }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

function formatMarkdown(text) {
  if (!text) return '';
  let formatted = text
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #FFF; font-weight: 700;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color: var(--text-secondary);">$1</em>')
    .replace(/^# (.*$)/gim, '<h2 style="font-size:1.1rem; color:#FFF; margin-top:10px; margin-bottom:6px;">$1</h2>')
    .replace(/^## (.*$)/gim, '<h3 style="font-size:0.98rem; color:var(--accent-cyan); margin-top:10px; margin-bottom:6px;">$1</h3>')
    .replace(/^### (.*$)/gim, '<h4 style="font-size:0.88rem; color:var(--accent-amber); margin-top:8px; margin-bottom:4px;">$1</h4>')
    .replace(/^- (.*$)/gim, '<li style="margin-left: 1.2rem; list-style-type: disc; color: var(--text-secondary);">$1</li>')
    .replace(/🔍 \*\*AI Root Cause Analysis:\*\*(.*?)(?=<br\/><br\/>|$)/gs, '<div style="margin: 10px 0; border: 1px solid var(--border-cyan); background: rgba(6, 182, 212, 0.08); padding: 12px; border-radius: 10px; color: var(--text-primary);"><strong style="color: var(--accent-cyan); display: block; margin-bottom: 4px;">🔍 AI Root Cause Analysis:</strong>$1</div>');

  return formatted;
}
