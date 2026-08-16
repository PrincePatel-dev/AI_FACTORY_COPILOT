import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { BarChart2, Table as TableIcon, Search } from 'lucide-react';

export default function TrendCharts({ trendData, shiftData, machineSummaries = [] }) {
  const [activeTab, setActiveTab] = useState('shift'); // 'shift', 'machines', 'trend'
  const [filterText, setFilterText] = useState('');

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#0B101E',
          border: '1px solid var(--border-light)',
          padding: '8px 12px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          fontSize: '0.75rem'
        }}>
          <p style={{ fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '2px 0', fontSize: '0.72rem' }}>
              {entry.name}: <strong className="font-mono" style={{ color: '#FFFFFF' }}>{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const filteredMachines = (machineSummaries || []).filter(m => 
    m.machine_id.toLowerCase().includes(filterText.toLowerCase()) ||
    (m.top_downtime_reason && m.top_downtime_reason.toLowerCase().includes(filterText.toLowerCase()))
  );

  return (
    <div className="sc-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      
      {/* Header & Tabs Bar */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-panel)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF' }}>
            Plant Telemetry & Charts
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="sc-tabs-list">
          <button
            className={`sc-tab-btn ${activeTab === 'shift' ? 'sc-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('shift')}
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
          >
            Shifts
          </button>
          <button
            className={`sc-tab-btn ${activeTab === 'machines' ? 'sc-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('machines')}
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
          >
            Downtime
          </button>
          <button
            className={`sc-tab-btn ${activeTab === 'trend' ? 'sc-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('trend')}
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
          >
            OEE Trend
          </button>
        </div>
      </div>

      {/* Top Half: Chart Area */}
      <div style={{ height: '160px', padding: '10px 12px 2px 12px', flexShrink: 0, width: '100%' }}>
        {activeTab === 'shift' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shiftData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="shift" stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis yAxisId="left" stroke="#64748B" fontSize={10} domain={[0, 100]} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#EF4444" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.68rem', paddingTop: '2px' }} />
              <Bar yAxisId="left" dataKey="avg_oee" name="Avg OEE (%)" fill="#38BDF8" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="total_downtime_min" name="Downtime (min)" fill="#EF4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'machines' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={machineSummaries} margin={{ top: 5, right: 10, left: -20, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="machine_id" stroke="#64748B" fontSize={9} angle={-25} textAnchor="end" tickLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.68rem', paddingTop: '2px' }} />
              <Bar dataKey="total_downtime_min" name="Downtime (min)" fill="#EF4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="total_scrap_units" name="Scrap (units)" fill="#F59E0B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'trend' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={9} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={10} domain={[50, 100]} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.68rem', paddingTop: '2px' }} />
              <Line type="monotone" dataKey="avg_oee" name="Daily OEE (%)" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom Half: Machine Telemetry Summary Table */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(255, 255, 255, 0.01)'
      }}>
        {/* Table Header Bar with Search */}
        <div style={{
          padding: '6px 12px',
          background: 'var(--bg-panel)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <TableIcon size={12} color="var(--accent-cyan)" />
            <span>Cell Telemetry ({filteredMachines.length} Cells)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '2px 6px', width: '120px' }}>
            <Search size={10} color="var(--text-muted)" style={{ marginRight: '4px' }} />
            <input
              type="text"
              placeholder="Search..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '0.68rem', outline: 'none', width: '100%' }}
            />
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="responsive-table-container" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '2px 8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.66rem', fontWeight: 600 }}>
                <th style={{ padding: '6px 8px' }}>Cell</th>
                <th style={{ padding: '6px 8px' }}>OEE</th>
                <th style={{ padding: '6px 8px' }}>Downtime</th>
                <th style={{ padding: '6px 8px' }}>Scrap</th>
                <th style={{ padding: '6px 8px' }}>Top Issue</th>
              </tr>
            </thead>
            <tbody>
              {filteredMachines.map((m, i) => {
                const isWorst = m.machine_id.includes('Weld-02') || m.machine_id.includes('Press-01');
                return (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      transition: 'background 0.15s ease',
                      background: isWorst ? 'rgba(239, 68, 68, 0.03)' : 'transparent'
                    }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '6px 8px', fontWeight: 600, color: isWorst ? 'var(--accent-amber)' : '#FFFFFF' }}>
                      {m.machine_id}
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <span className={`sc-badge ${m.avg_oee >= 75 ? 'sc-badge-emerald' : 'sc-badge-amber'}`}>
                        {m.avg_oee}%
                      </span>
                    </td>
                    <td className="font-mono" style={{ padding: '6px 8px', color: 'var(--accent-red)', fontWeight: 600 }}>
                      {m.total_downtime_min}m
                    </td>
                    <td className="font-mono" style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>
                      {m.total_scrap_units}u
                    </td>
                    <td style={{ padding: '6px 8px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {m.top_downtime_reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
