import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { BarChart2, Table as TableIcon, Search, ArrowUpDown } from 'lucide-react';

export default function AnalyticsView({ trendData, shiftData, machineSummaries }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('total_downtime_min');
  const [sortOrder, setSortOrder] = useState('desc');

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          padding: '10px 14px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          fontSize: '0.8rem'
        }}>
          <p style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '2px 0' }}>
              {entry.name}: <strong className="font-mono" style={{ color: '#FFF' }}>{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredMachines = machineSummaries
    .filter(m => m.machine_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 m.top_downtime_reason.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '20px', minHeight: '100%' }}>
      
      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px', flexShrink: 0 }}>
        
        {/* Chart 1: Shift Comparison */}
        <div className="sc-card" style={{ padding: '16px', height: '280px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={16} color="var(--accent-cyan)" />
              Shift Performance (OEE % vs Downtime Mins)
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Morning vs Afternoon vs Night</span>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="shift" stroke="#94A3B8" fontSize={11} />
                <YAxis yAxisId="left" stroke="#94A3B8" fontSize={11} domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" stroke="#EF4444" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '6px' }} />
                <Bar yAxisId="left" dataKey="avg_oee" name="Avg OEE (%)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="total_downtime_min" name="Total Downtime (min)" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: OEE Timeline */}
        <div className="sc-card" style={{ padding: '16px', height: '280px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={16} color="var(--accent-emerald)" />
              Plant Daily OEE Timeline Trend
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Historical daily telemetry</span>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={11} domain={[50, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '6px' }} />
                <Line type="monotone" dataKey="avg_oee" name="Daily Avg OEE (%)" stroke="#10B981" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Machine Cells Telemetry Matrix Table */}
      <div className="sc-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TableIcon size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>
              Manufacturing Cells Telemetry Matrix (All 10 Machines)
            </h3>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              className="sc-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search machine or downtime reason..."
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Table Body */}
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table className="sc-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('machine_id')}>
                  Machine Cell <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('avg_oee')}>
                  Average OEE <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('total_downtime_min')}>
                  Total Downtime <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('total_scrap_units')}>
                  Scrap Units <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('total_units_produced')}>
                  Total Output <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                </th>
                <th>Top Downtime Driver</th>
                <th>Top Scrap Cause</th>
              </tr>
            </thead>
            <tbody>
              {filteredMachines.map((m, idx) => {
                const isBottleneck = m.machine_id === 'Weld-02' || m.machine_id === 'Press-01';
                return (
                  <tr 
                    key={idx} 
                    style={{
                      background: isBottleneck ? 'rgba(239, 68, 68, 0.08)' : 'transparent'
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: isBottleneck ? 'var(--accent-red)' : '#FFFFFF' }}>
                          {m.machine_id}
                        </span>
                        {isBottleneck && (
                          <span className="sc-badge sc-badge-red" style={{ fontSize: '0.66rem', padding: '2px 6px' }}>
                            Bottleneck
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 700 }}>{m.avg_oee}%</td>
                    <td className="font-mono" style={{ color: 'var(--accent-red)', fontWeight: 600 }}>
                      {m.total_downtime_min} mins ({Math.round(m.total_downtime_min/6)/10} hrs)
                    </td>
                    <td className="font-mono" style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{m.total_scrap_units} units</td>
                    <td className="font-mono">{m.total_units_produced.toLocaleString()}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{m.top_downtime_reason}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{m.top_scrap_reason}</td>
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
