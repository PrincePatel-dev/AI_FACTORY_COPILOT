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
    <header style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      zIndex: 30
    }}>
      {/* Left: Brand & Mode Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '1.1rem',
            boxShadow: '0 0 12px rgba(6, 182, 212, 0.35)'
          }}>
            M
          </div>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#FFFFFF', margin: 0 }}>
              MFGX <span style={{ color: 'var(--accent-cyan)' }}>AI Factory Copilot</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              <span className="pulse-emerald" />
              <span>1,350 Shift Records Loaded</span>
            </div>
          </div>
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="sc-tabs-list">
          <button
            className={`sc-tab-btn ${viewMode === 'copilot' ? 'sc-tab-btn-active' : ''}`}
            onClick={() => setViewMode('copilot')}
          >
            <MessageSquare size={15} />
            <span>AI Copilot</span>
          </button>
          <button
            className={`sc-tab-btn ${viewMode === 'analytics' ? 'sc-tab-btn-active' : ''}`}
            onClick={() => setViewMode('analytics')}
          >
            <BarChart2 size={15} />
            <span>Telemetry & Charts</span>
          </button>
          <button
            className={`sc-tab-btn ${viewMode === 'split' ? 'sc-tab-btn-active' : ''}`}
            onClick={() => setViewMode('split')}
          >
            <LayoutGrid size={15} />
            <span>Split View</span>
          </button>
        </div>
      </div>

      {/* Right Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Model Badge */}
        <span className="sc-badge sc-badge-cyan" style={{ padding: '6px 12px' }}>
          <Cpu size={14} color="var(--accent-cyan)" />
          <span>Gemini 3.5 Flash Lite</span>
        </span>

        {/* Timeframe Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '6px 12px'
        }}>
          <Clock size={14} color="var(--text-muted)" />
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="this week" style={{ background: '#0F172A' }}>This Week</option>
            <option value="today" style={{ background: '#0F172A' }}>Today</option>
            <option value="last week" style={{ background: '#0F172A' }}>Last Week</option>
            <option value="last 30 days" style={{ background: '#0F172A' }}>Last 30 Days</option>
            <option value="all" style={{ background: '#0F172A' }}>All Time (45 Days)</option>
          </select>
        </div>

        {/* Export CSV Button */}
        <a 
          href={`/api/export-csv?timeframe=${encodeURIComponent(timeframe)}`}
          download
          className="sc-btn sc-btn-secondary"
          style={{ textDecoration: 'none' }}
          title="Export telemetry to CSV file"
        >
          <Download size={14} color="var(--accent-cyan)" />
          <span>Export CSV</span>
        </a>

        {/* Daily KPI Insight Glow Button */}
        <button 
          className="sc-btn sc-btn-glow"
          onClick={onOpenInsightModal}
          title="Generate auto-written daily operational report"
        >
          <Sparkles size={14} />
          <span>Daily KPI Insight</span>
        </button>
      </div>
    </header>
  );
}
