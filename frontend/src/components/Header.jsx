import React from 'react';
import { Sparkles, Clock, Download, MessageSquare, BarChart2, LayoutGrid, Activity } from 'lucide-react';

export default function Header({ 
  timeframe, 
  setTimeframe, 
  onOpenInsightModal, 
  viewMode, 
  setViewMode 
}) {
  return (
    <header className="header-container">
      {/* Brand Identification */}
      <div className="header-brand-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.95rem',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
            flexShrink: 0
          }}>
            M
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.94rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                MFGX
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                / Factory Intelligence
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              <span className="pulse-emerald" />
              <span>1,350 plant telemetry records</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Segmented View Switcher */}
      <div className="header-tabs-wrapper">
        <div className="sc-tabs-list">
          <button
            className={`sc-tab-btn ${viewMode === 'copilot' ? 'sc-tab-btn-active' : ''}`}
            onClick={() => setViewMode('copilot')}
          >
            <MessageSquare size={13} />
            <span>AI Copilot</span>
          </button>
          <button
            className={`sc-tab-btn ${viewMode === 'analytics' ? 'sc-tab-btn-active' : ''}`}
            onClick={() => setViewMode('analytics')}
          >
            <BarChart2 size={13} />
            <span>Telemetry</span>
          </button>
          <button
            className={`sc-tab-btn ${viewMode === 'split' ? 'sc-tab-btn-active' : ''}`}
            onClick={() => setViewMode('split')}
          >
            <LayoutGrid size={13} />
            <span>Split View</span>
          </button>
        </div>
      </div>

      {/* Right Controls & Actions */}
      <div className="header-actions">
        {/* Timeframe Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '7px',
          padding: '4px 8px'
        }}>
          <Clock size={12} color="var(--text-muted)" />
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.74rem',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="this week" style={{ background: '#0E1526' }}>This Week</option>
            <option value="today" style={{ background: '#0E1526' }}>Today</option>
            <option value="last week" style={{ background: '#0E1526' }}>Last Week</option>
            <option value="last 30 days" style={{ background: '#0E1526' }}>Last 30 Days</option>
            <option value="all" style={{ background: '#0E1526' }}>All Time</option>
          </select>
        </div>

        {/* Export Telemetry */}
        <a 
          href={`/api/export-csv?timeframe=${encodeURIComponent(timeframe)}`}
          download
          className="sc-btn sc-btn-secondary"
          style={{ textDecoration: 'none' }}
          title="Export telemetry to CSV"
        >
          <Download size={13} color="var(--text-secondary)" />
          <span>Export</span>
        </a>

        {/* Executive Daily Report Button */}
        <button 
          className="sc-btn sc-btn-primary"
          onClick={onOpenInsightModal}
          title="Generate executive operational summary"
        >
          <Sparkles size={13} />
          <span>Insight Report</span>
        </button>
      </div>
    </header>
  );
}
