import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, FileText } from 'lucide-react';

export default function DailyInsightModal({ isOpen, onClose, reportData, loading }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (reportData?.report) {
      navigator.clipboard.writeText(reportData.report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(4, 6, 12, 0.8)',
        backdropFilter: 'blur(6px)'
      }}
      onClick={onClose}
    >
      <div 
        className="sc-card modal-card"
        onClick={(e) => e.stopPropagation()} 
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          border: '1px solid var(--border-light)'
        }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-panel)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              flexShrink: 0
            }}>
              <Sparkles size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.96rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                Executive Daily KPI Insight Report
              </h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Auto-generated operational summary covering OEE, Downtime, & Bottlenecks
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-body" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '16px' }}>
                <span className="pulse-emerald" />
                <span className="pulse-emerald" style={{ animationDelay: '0.3s' }} />
                <span className="pulse-emerald" style={{ animationDelay: '0.6s' }} />
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Synthesizing 1,350 shift records and diagnosing root causes with Gemini 3.1 Flash Lite...
              </p>
            </div>
          ) : (
            <div 
              style={{ fontSize: '0.82rem', lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: formatReportMarkdown(reportData?.report) }} 
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-panel)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={13} color="var(--accent-cyan)" /> 1,350 plant telemetry records
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="sc-btn sc-btn-secondary" onClick={handleCopy} style={{ padding: '5px 12px', fontSize: '0.75rem' }}>
              {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button className="sc-btn sc-btn-primary" onClick={onClose} style={{ padding: '5px 14px', fontSize: '0.75rem' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatReportMarkdown(text) {
  if (!text) return '';
  let formatted = text
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#FFF; font-weight:600;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:var(--text-secondary);">$1</em>')
    .replace(/^# (.*$)/gim, '<h2 style="font-size:1.05rem; color:#FFF; margin-top:10px; margin-bottom:6px; border-bottom:1px solid var(--border-subtle); padding-bottom:4px;">$1</h2>')
    .replace(/^## (.*$)/gim, '<h3 style="font-size:0.92rem; color:var(--accent-cyan); margin-top:8px; margin-bottom:4px;">$1</h3>')
    .replace(/^### (.*$)/gim, '<h4 style="font-size:0.84rem; color:var(--accent-amber); margin-top:6px; margin-bottom:2px;">$1</h4>')
    .replace(/^- (.*$)/gim, '<li style="margin-left: 1.1rem; list-style-type: disc; color: var(--text-secondary);">$1</li>')
    .replace(/^([0-9]+\.) (.*$)/gim, '<li style="margin-left: 1.1rem; list-style-type: decimal; color: var(--text-secondary);">$2</li>')
    .replace(/⚠️ SINGLE BIGGEST CONCERN OF THE DAY/g, '<div style="margin:10px 0; border:1px solid var(--border-red); background:rgba(239, 68, 68, 0.05); padding:10px; border-radius:8px;"><strong style="color:var(--accent-red); font-weight:600; display:block; margin-bottom:2px;">⚠️ SINGLE BIGGEST CONCERN OF THE DAY</strong>')
    .replace(/💡 Key Actionable Takeaways:/g, '</div><div style="margin:10px 0; border:1px solid var(--border-emerald); background:rgba(16, 185, 129, 0.05); padding:10px; border-radius:8px;"><strong style="color:var(--accent-emerald); font-weight:600; display:block; margin-bottom:2px;">💡 Key Actionable Takeaways:</strong>')
    + '</div>';

  return formatted;
}
