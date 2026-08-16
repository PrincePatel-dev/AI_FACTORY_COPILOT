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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '14px', flexShrink: 0 }}>
        
        {/* Chart 1: Shift Comparison */}
        <div className="sc-card" style={{ padding: '16px', height: '270px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '4px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={16} color="var(--accent-cyan)" />
              Shift Performance (OEE % vs Downtime Mins)
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Morning vs Afternoon vs Night</span>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="shift" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis yAxisId="left" stroke="#64748B" fontSize={10} domain={[0, 100]} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#EF4444" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.72rem', paddingTop: '4px' }} />
                <Bar yAxisId="left" dataKey="avg_oee" name="Avg OEE (%)" fill="#38BDF8" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="total_downtime_min" name="Total Downtime (min)" fill="#EF4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: OEE Timeline */}
        <div className="sc-card" style={{ padding: '16px', height: '270px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '4px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={16} color="var(--accent-emerald)" />
              Plant Daily OEE Timeline Trend
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Historical daily telemetry</span>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} domain={[50, 100]} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.72rem', paddingTop: '4px' }} />
                <Line type="monotone" dataKey="avg_oee" name="Daily Avg OEE (%)" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Machine Cells Telemetry Matrix Table */}
      <div className="sc-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TableIcon size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#FFFFFF' }}>
              Manufacturing Cells Telemetry Matrix
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              (10 tracked workcenters)
            </span>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '9px' }} />
            <input
              type="text"
              className="sc-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cell or issue..."
              style={{ paddingLeft: '32px', fontSize: '0.76rem', padding: '6px 10px 6px 30px' }}
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="responsive-table-container" style={{ flex: 1 }}>
          <table className="sc-table" style={{ minWidth: '640px' }}>
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('machine_id')}>
                  Machine Cell <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: '4px' }} />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('avg_oee')}>
                  Average OEE <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: '4px' }} />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('total_downtime_min')}>
                  Total Downtime <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: '4px' }} />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('total_scrap_units')}>
                  Scrap Units <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: '4px' }} />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('total_units_produced')}>
                  Total Output <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: '4px' }} />
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
                      background: isBottleneck ? 'rgba(239, 68, 68, 0.04)' : 'transparent'
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: isBottleneck ? 'var(--accent-amber)' : '#FFFFFF' }}>
                          {m.machine_id}
                        </span>
                        {isBottleneck && (
                          <span className="sc-badge sc-badge-red" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
                            Bottleneck
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>{m.avg_oee}%</td>
                    <td className="font-mono" style={{ color: 'var(--accent-red)', fontWeight: 500 }}>
                      {m.total_downtime_min}m ({Math.round(m.total_downtime_min/6)/10}h)
                    </td>
                    <td className="font-mono" style={{ color: 'var(--accent-amber)', fontWeight: 500 }}>{m.total_scrap_units}u</td>
                    <td className="font-mono" style={{ color: 'var(--text-secondary)' }}>{m.total_units_produced.toLocaleString()}</td>
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
