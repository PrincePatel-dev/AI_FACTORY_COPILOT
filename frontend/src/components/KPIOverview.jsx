import React from 'react';
import { Gauge, Clock, AlertTriangle, AlertOctagon, TrendingUp, TrendingDown } from 'lucide-react';

export default function KPIOverview({ kpiData, loading }) {
  if (loading || !kpiData) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', padding: '6px 20px 6px 20px', flexShrink: 0 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="sc-card" style={{ height: '58px', opacity: 0.5, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  const oee = kpiData.avg_oee_percent || 0;
  const oeeStatus = oee >= 80 ? 'good' : oee >= 70 ? 'warning' : 'critical';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', padding: '6px 20px 6px 20px', flexShrink: 0 }}>
      
      {/* 1. Plant Avg OEE */}
      <div className="sc-card sc-card-cyan-glow" style={{ padding: '8px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Plant Avg OEE
          </span>
          <Gauge size={14} color={oeeStatus === 'good' ? 'var(--accent-emerald)' : 'var(--accent-amber)'} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
            {oee}%
          </span>
          <span className={`sc-badge ${oeeStatus === 'good' ? 'sc-badge-emerald' : 'sc-badge-amber'}`} style={{ padding: '1px 5px', fontSize: '0.62rem' }}>
            {oee >= 75 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            Target: 85%
          </span>
        </div>
      </div>

      {/* 2. Total Downtime */}
      <div className="sc-card sc-card-red-glow" style={{ padding: '8px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Total Downtime
          </span>
          <Clock size={14} color="var(--accent-red)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              {kpiData.total_downtime_hours || 0}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>hrs</span>
          </div>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
            Top: <strong style={{ color: 'var(--accent-amber)' }}>{kpiData.top_downtime_reason || 'Tool Change'}</strong>
          </span>
        </div>
      </div>

      {/* 3. Scrap Volume */}
      <div className="sc-card" style={{ padding: '8px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Scrap Volume
          </span>
          <AlertTriangle size={14} color="var(--accent-amber)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              {(kpiData.total_scrap_units || 0).toLocaleString()}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>units</span>
          </div>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
            Worst: <strong style={{ color: 'var(--accent-amber)' }}>{kpiData.worst_scrap_machine || 'Press-01'}</strong>
          </span>
        </div>
      </div>

      {/* 4. Critical Bottleneck */}
      <div className="sc-card" style={{ padding: '8px 14px', borderLeft: '3px solid var(--accent-red)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Critical Bottleneck
          </span>
          <AlertOctagon size={14} color="var(--accent-red)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-red)', lineHeight: 1.1 }}>
            {kpiData.worst_downtime_machine || 'Weld-02'}
          </span>
          <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {kpiData.worst_downtime_min || 0}m lost
          </span>
        </div>
      </div>

    </div>
  );
}
