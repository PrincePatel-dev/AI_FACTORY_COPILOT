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
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div 
        className="sc-card modal-card"
        onClick={(e) => e.stopPropagation()} 
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          border: '1px solid var(--border-cyan)'
        }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-panel)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              padding: '8px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)',
              color: '#FFFFFF',
              boxShadow: '0 0 12px rgba(6, 182, 212, 0.3)',
              flexShrink: 0
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Executive Daily KPI Insight Report
              </h2>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Auto-generated operational summary covering OEE, Downtime, & Bottlenecks
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
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
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Synthesizing 1,350 shift records and diagnosing root causes with Gemini 3.1 Flash Lite...
              </p>
            </div>
          ) : (
            <div 
              style={{ fontSize: '0.84rem', lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: formatReportMarkdown(reportData?.report) }} 
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{
          padding: '14px 20px',
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
            <button className="sc-btn sc-btn-secondary" onClick={handleCopy} style={{ padding: '6px 12px', fontSize: '0.76rem' }}>
              {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button className="sc-btn sc-btn-glow" onClick={onClose} style={{ padding: '6px 14px', fontSize: '0.76rem' }}>
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
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#FFF; font-weight:700;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:var(--text-secondary);">$1</em>')
    .replace(/^# (.*$)/gim, '<h2 style="font-size:1.1rem; color:#FFF; margin-top:12px; margin-bottom:6px; border-bottom:1px solid var(--border-subtle); padding-bottom:4px;">$1</h2>')
    .replace(/^## (.*$)/gim, '<h3 style="font-size:0.98rem; color:var(--accent-cyan); margin-top:10px; margin-bottom:4px;">$1</h3>')
    .replace(/^### (.*$)/gim, '<h4 style="font-size:0.88rem; color:var(--accent-amber); margin-top:8px; margin-bottom:4px;">$1</h4>')
    .replace(/^- (.*$)/gim, '<li style="margin-left: 1.2rem; list-style-type: disc; color: var(--text-secondary);">$1</li>')
    .replace(/^([0-9]+\.) (.*$)/gim, '<li style="margin-left: 1.2rem; list-style-type: decimal; color: var(--text-secondary);">$2</li>')
    .replace(/⚠️ SINGLE BIGGEST CONCERN OF THE DAY/g, '<div style="margin:12px 0; border:1px solid var(--border-red); background:rgba(239, 68, 68, 0.08); padding:12px; border-radius:10px;"><strong style="color:var(--accent-red); font-weight:700; display:block; margin-bottom:4px;">⚠️ SINGLE BIGGEST CONCERN OF THE DAY</strong>')
    .replace(/💡 Key Actionable Takeaways:/g, '</div><div style="margin:12px 0; border:1px solid var(--border-emerald); background:rgba(16, 185, 129, 0.08); padding:12px; border-radius:10px;"><strong style="color:var(--accent-emerald); font-weight:700; display:block; margin-bottom:4px;">💡 Key Actionable Takeaways:</strong>')
    + '</div>';

  return formatted;
}
