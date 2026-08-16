import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Sparkles, Copy, Check, Terminal } from 'lucide-react';

export default function CopilotChat({ messages, onSendMessage, loading, onClearChat }) {
  const [input, setInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesContainerRef = useRef(null);

  const quickPrompts = [
    { label: "Worst downtime this week", query: "Which machine has the worst downtime this week?" },
    { label: "Scrap cause on Weld-02", query: "What is causing most scrap on Weld-02?" },
    { label: "Night vs Morning shift", query: "Compare night shift vs morning shift performance" },
    { label: "Weld-02 Scrap Std Dev (Sandbox)", query: "What is the standard deviation of scrap units on Weld-02?" },
    { label: "Downtime vs Scrap Correlation (Sandbox)", query: "Calculate the exact correlation between downtime minutes and scrap units across the plant." }
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
      
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-panel)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF' }}>
            AI Factory Copilot
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            · Natural language analytics
          </span>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '3px 8px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.7rem',
              transition: 'color 0.15s ease'
            }}
          >
            Clear conversation
          </button>
        )}
      </div>

      {/* Quick Prompts Carousel Bar */}
      <div style={{
        padding: '6px 14px',
        background: 'rgba(255, 255, 255, 0.015)',
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
        
        {/* Clean Empty State */}
        {messages.length === 0 && (
          <div style={{
            margin: 'auto 0',
            textAlign: 'center',
            padding: '32px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              marginBottom: '4px'
            }}>
              <Sparkles size={20} />
            </div>
            <h3 style={{ fontSize: '0.94rem', fontWeight: 600, color: '#FFFFFF' }}>
              How can I assist your plant operations today?
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '440px', lineHeight: 1.5 }}>
              Ask anything in English, Hinglish, or Gujlish. The assistant writes and executes secure Python formulas directly over 1,350 plant telemetry records.
            </p>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '10px',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: msg.role === 'user' ? '#1E293B' : 'rgba(56, 189, 248, 0.1)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(56, 189, 248, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: msg.role === 'user' ? '#94A3B8' : '#38BDF8',
              flexShrink: 0
            }}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>

            {/* Bubble Content */}
            <div style={{
              maxWidth: '88%',
              background: msg.role === 'user' ? '#1E293B' : 'var(--bg-panel)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(255, 255, 255, 0.1)' : 'var(--border-subtle)'}`,
              borderRadius: '10px',
              padding: '10px 14px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              position: 'relative'
            }}>
              {/* Top Tag for Assistant */}
              {msg.role === 'assistant' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '6px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  paddingBottom: '4px'
                }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Terminal size={11} color="var(--accent-cyan)" />
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

              {/* Message Content */}
              <div 
                style={{ fontSize: '0.82rem', lineHeight: 1.55, color: '#F1F5F9', wordBreak: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
              />

              {/* Timestamp */}
              <div style={{
                fontSize: '0.64rem',
                color: 'var(--text-muted)',
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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8'
            }}>
              <Bot size={14} />
            </div>
            <div style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span className="pulse-emerald" />
                <span className="pulse-emerald" style={{ animationDelay: '0.3s' }} />
                <span className="pulse-emerald" style={{ animationDelay: '0.6s' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Analyzing plant telemetry records...
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} style={{
        padding: '10px 14px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-panel)',
        display: 'flex',
        gap: '8px',
        flexShrink: 0
      }}>
        <input
          type="text"
          className="sc-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about machine downtime, OEE, scrap, or shifts..."
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          className={input.trim() && !loading ? "sc-btn sc-btn-primary" : "sc-btn sc-btn-secondary"}
          disabled={loading || !input.trim()}
          style={{ padding: '0 16px', flexShrink: 0 }}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

function formatMarkdown(text) {
  if (!text) return '';
  let formatted = text
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #FFF; font-weight: 600;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color: var(--text-secondary);">$1</em>')
    .replace(/^# (.*$)/gim, '<h2 style="font-size:1.05rem; color:#FFF; margin-top:8px; margin-bottom:4px;">$1</h2>')
    .replace(/^## (.*$)/gim, '<h3 style="font-size:0.94rem; color:var(--accent-cyan); margin-top:8px; margin-bottom:4px;">$1</h3>')
    .replace(/^### (.*$)/gim, '<h4 style="font-size:0.84rem; color:var(--accent-amber); margin-top:6px; margin-bottom:2px;">$1</h4>')
    .replace(/^- (.*$)/gim, '<li style="margin-left: 1rem; list-style-type: disc; color: var(--text-secondary);">$1</li>')
    .replace(/🔍 \*\*AI Root Cause Analysis:\*\*(.*?)(?=<br\/><br\/>|$)/gs, '<div style="margin: 8px 0; border: 1px solid var(--border-subtle); background: rgba(56, 189, 248, 0.05); padding: 10px; border-radius: 8px; color: var(--text-primary);"><strong style="color: var(--accent-cyan); display: block; margin-bottom: 2px;">🔍 AI Root Cause Analysis:</strong>$1</div>');

  return formatted;
}
