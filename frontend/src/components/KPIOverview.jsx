import React from 'react';
import { Gauge, Clock, AlertTriangle, AlertOctagon, TrendingUp, TrendingDown } from 'lucide-react';

export default function KPIOverview({ kpiData, loading }) {
  if (loading || !kpiData) {
    return (
      <div className="metrics-strip">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="metric-cell" style={{ height: '64px', opacity: 0.4 }}>
            <div style={{ width: '60px', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '8px' }} />
            <div style={{ width: '90px', height: '18px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    );
  }

  const oee = kpiData.avg_oee_percent || 0;
  const oeeStatus = oee >= 80 ? 'good' : oee >= 70 ? 'warning' : 'critical';

  return (
    <div className="metrics-strip">
      
      {/* 1. Plant Avg OEE */}
      <div className="metric-cell">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ fontSize: '0.64rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Plant Avg OEE
          </span>
          <Gauge size={13} color={oeeStatus === 'good' ? 'var(--accent-emerald)' : 'var(--accent-amber)'} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
          <span className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
            {oee}%
          </span>
          <span className={`sc-badge ${oeeStatus === 'good' ? 'sc-badge-emerald' : 'sc-badge-amber'}`}>
            {oee >= 75 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            Target 85%
          </span>
        </div>
      </div>

      {/* 2. Total Downtime */}
      <div className="metric-cell">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ fontSize: '0.64rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Downtime
          </span>
          <Clock size={13} color="var(--text-muted)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
              {kpiData.total_downtime_hours || 0}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>hrs</span>
          </div>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
            Top: <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{kpiData.top_downtime_reason || 'Tool Change'}</strong>
          </span>
        </div>
      </div>

      {/* 3. Scrap Volume */}
      <div className="metric-cell">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ fontSize: '0.64rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Scrap Volume
          </span>
          <AlertTriangle size={13} color="var(--accent-amber)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
              {(kpiData.total_scrap_units || 0).toLocaleString()}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>units</span>
          </div>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
            Worst: <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{kpiData.worst_scrap_machine || 'Press-01'}</strong>
          </span>
        </div>
      </div>

      {/* 4. Critical Bottleneck */}
      <div className="metric-cell">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ fontSize: '0.64rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Critical Bottleneck
          </span>
          <AlertOctagon size={13} color="var(--accent-red)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
          <span className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-red)', lineHeight: 1 }}>
            {kpiData.worst_downtime_machine || 'Weld-02'}
          </span>
          <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {kpiData.worst_downtime_min || 0}m lost
          </span>
        </div>
      </div>

    </div>
  );
}
