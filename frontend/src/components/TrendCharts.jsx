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
          background: 'rgba(11, 19, 43, 0.95)',
          border: '1px solid var(--border-cyan)',
          padding: '10px 14px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          fontSize: '0.78rem'
        }}>
          <p style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '2px 0', fontSize: '0.74rem' }}>
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
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-panel)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            padding: '6px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid var(--border-cyan)'
          }}>
            <BarChart2 size={16} color="var(--accent-cyan)" />
          </div>
          <div>
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FFFFFF' }}>
              Plant Telemetry & Charts
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="sc-tabs-list">
          <button
            className={`sc-tab-btn ${activeTab === 'shift' ? 'sc-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('shift')}
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
          >
            Shifts
          </button>
          <button
            className={`sc-tab-btn ${activeTab === 'machines' ? 'sc-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('machines')}
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
          >
            Downtime
          </button>
          <button
            className={`sc-tab-btn ${activeTab === 'trend' ? 'sc-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('trend')}
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
          >
            OEE Trend
          </button>
        </div>
      </div>

      {/* Top Half: Chart Area */}
      <div style={{ height: '160px', padding: '10px 14px 2px 14px', flexShrink: 0, width: '100%' }}>
        {activeTab === 'shift' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shiftData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="shift" stroke="#94A3B8" fontSize={10} />
              <YAxis yAxisId="left" stroke="#94A3B8" fontSize={10} domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" stroke="#EF4444" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.68rem', paddingTop: '2px' }} />
              <Bar yAxisId="left" dataKey="avg_oee" name="Avg OEE (%)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="total_downtime_min" name="Downtime (min)" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'machines' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={machineSummaries} margin={{ top: 5, right: 10, left: -20, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="machine_id" stroke="#94A3B8" fontSize={9} angle={-25} textAnchor="end" />
              <YAxis stroke="#94A3B8" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.68rem', paddingTop: '2px' }} />
              <Bar dataKey="total_downtime_min" name="Downtime (min)" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total_scrap_units" name="Scrap (units)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'trend' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={9} />
              <YAxis stroke="#94A3B8" fontSize={10} domain={[50, 100]} />
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
        background: 'rgba(7, 11, 20, 0.4)'
      }}>
        {/* Table Header Bar with Search */}
        <div style={{
          padding: '8px 14px',
          background: 'var(--bg-panel)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <TableIcon size={13} color="var(--accent-cyan)" />
            <span>Cell Telemetry ({filteredMachines.length} Cells)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '2px 8px', width: '130px' }}>
            <Search size={11} color="var(--text-muted)" style={{ marginRight: '4px' }} />
            <input
              type="text"
              placeholder="Search..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '0.7rem', outline: 'none', width: '100%' }}
            />
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="responsive-table-container" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600 }}>
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
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.15s ease',
                      background: isWorst ? 'rgba(239, 68, 68, 0.04)' : 'transparent'
                    }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: isWorst ? 'var(--accent-amber)' : '#FFFFFF' }}>
                      {m.machine_id}
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <span className={`sc-badge ${m.avg_oee >= 75 ? 'sc-badge-emerald' : 'sc-badge-amber'}`} style={{ padding: '1px 6px', fontSize: '0.66rem' }}>
                        {m.avg_oee}%
                      </span>
                    </td>
                    <td className="font-mono" style={{ padding: '6px 8px', color: 'var(--accent-red)', fontWeight: 600 }}>
                      {m.total_downtime_min}m
                    </td>
                    <td className="font-mono" style={{ padding: '6px 8px', color: 'var(--accent-amber)', fontWeight: 600 }}>
                      {m.total_scrap_units}u
                    </td>
                    <td style={{ padding: '6px 8px', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
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
