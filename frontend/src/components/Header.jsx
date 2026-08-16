import React from 'react';
import { Cpu, Sparkles, Clock, Download, MessageSquare, BarChart2, LayoutGrid } from 'lucide-react';

export default function Header({ 
  timeframe, 
  setTimeframe, 
  onOpenInsightModal, 
  viewMode, 
  setViewMode 
}) {
  return (
    <header className="header-container">
      {/* Left: Brand & Mode Navigation Tabs */}
      <div className="header-left">
        {/* Brand Logo & Title Row */}
        <div className="header-brand-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1.05rem',
              boxShadow: '0 0 12px rgba(6, 182, 212, 0.35)',
              flexShrink: 0
            }}>
              M
            </div>
            <div>
              <h1 style={{ fontSize: '0.98rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#FFFFFF', margin: 0 }}>
                MFGX <span style={{ color: 'var(--accent-cyan)' }}>AI Factory Copilot</span>
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span className="pulse-emerald" />
                <span>1,350 Shift Records Loaded</span>
              </div>
            </div>
          </div>

          {/* Daily KPI Insight (Compact on mobile header row) */}
          <button 
            className="sc-btn sc-btn-glow sm:hidden"
            onClick={onOpenInsightModal}
            title="Generate auto-written daily operational report"
            style={{ padding: '6px 12px', fontSize: '0.74rem' }}
          >
            <Sparkles size={13} />
            <span>KPI Insight</span>
          </button>
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="sc-tabs-list">
          <button
            className={`sc-tab-btn ${viewMode === 'copilot' ? 'sc-tab-btn-active' : ''}`}
            onClick={() => setViewMode('copilot')}
          >
            <MessageSquare size={14} />
            <span>AI Copilot</span>
          </button>
          <button
            className={`sc-tab-btn ${viewMode === 'analytics' ? 'sc-tab-btn-active' : ''}`}
            onClick={() => setViewMode('analytics')}
          >
            <BarChart2 size={14} />
            <span>Telemetry</span>
          </button>
          <button
            className={`sc-tab-btn ${viewMode === 'split' ? 'sc-tab-btn-active' : ''}`}
            onClick={() => setViewMode('split')}
          >
            <LayoutGrid size={14} />
            <span>Split View</span>
          </button>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="header-actions">
        {/* Model Badge */}
        <span className="sc-badge sc-badge-cyan" style={{ padding: '5px 10px' }}>
          <Cpu size={13} color="var(--accent-cyan)" />
          <span>Gemini 3.1</span>
        </span>

        {/* Timeframe Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '5px 10px'
        }}>
          <Clock size={13} color="var(--text-muted)" />
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="this week" style={{ background: '#0F172A' }}>This Week</option>
            <option value="today" style={{ background: '#0F172A' }}>Today</option>
            <option value="last week" style={{ background: '#0F172A' }}>Last Week</option>
            <option value="last 30 days" style={{ background: '#0F172A' }}>Last 30 Days</option>
            <option value="all" style={{ background: '#0F172A' }}>All Time</option>
          </select>
        </div>

        {/* Export CSV Button */}
        <a 
          href={`/api/export-csv?timeframe=${encodeURIComponent(timeframe)}`}
          download
          className="sc-btn sc-btn-secondary"
          style={{ textDecoration: 'none', padding: '5px 12px', fontSize: '0.75rem' }}
          title="Export telemetry to CSV file"
        >
          <Download size={13} color="var(--accent-cyan)" />
          <span>Export</span>
        </a>

        {/* Daily KPI Insight Glow Button (Desktop) */}
        <button 
          className="sc-btn sc-btn-glow"
          onClick={onOpenInsightModal}
          title="Generate auto-written daily operational report"
          style={{ padding: '5px 14px', fontSize: '0.75rem' }}
        >
          <Sparkles size={13} />
          <span>Daily KPI Insight</span>
        </button>
      </div>
    </header>
  );
}
