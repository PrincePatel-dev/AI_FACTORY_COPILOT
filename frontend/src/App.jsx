import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KPIOverview from './components/KPIOverview';
import TrendCharts from './components/TrendCharts';
import CopilotChat from './components/CopilotChat';
import AnalyticsView from './components/AnalyticsView';
import DailyInsightModal from './components/DailyInsightModal';
import { MessageSquare } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export default function App() {
  const [timeframe, setTimeframe] = useState('this week');
  const [viewMode, setViewMode] = useState('copilot'); // 'copilot', 'analytics', 'split'
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);

  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    fetchDashboardData(timeframe);
  }, [timeframe]);

  const fetchDashboardData = async (tf) => {
    setLoadingDashboard(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard-data?timeframe=${encodeURIComponent(tf)}`);
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard telemetry:", err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleSendMessage = async (userQuery) => {
    const userMsg = {
      role: 'user',
      content: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoadingChat(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userQuery, timeframe })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg = {
          role: 'assistant',
          content: data.answer,
          model_used: data.model_used,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const aiErrorMsg = {
          role: 'assistant',
          content: '⚠️ Server error. Please check your query or connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiErrorMsg]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const aiErrorMsg = {
        role: 'assistant',
        content: '⚠️ Network error communicating with MFGX AI Copilot backend.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiErrorMsg]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleGenerateInsight = async () => {
    setIsInsightOpen(true);
    setLoadingReport(true);
    try {
      const res = await fetch(`${API_BASE}/kpi-insight`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeframe })
      });

      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error("Insight report error:", err);
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div style={{ height: '100vh', maxHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-dark)' }} className="text-slate-100 font-sans">
      {/* Header Bar with Mode Switcher */}
      <Header 
        timeframe={timeframe} 
        setTimeframe={setTimeframe} 
        onOpenInsightModal={handleGenerateInsight}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* KPI Overview Ribbon */}
      <KPIOverview 
        kpiData={dashboardData?.kpi_overview} 
        loading={loadingDashboard} 
      />

      {/* Dynamic View Workspace */}
      <main style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 20px 14px 20px', width: '100%' }}>
        
        {/* Mode 1: AI Copilot Focused View */}
        {viewMode === 'copilot' && (
          <div style={{ width: '100%', maxWidth: '980px', margin: '0 auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <CopilotChat 
              messages={messages} 
              onSendMessage={handleSendMessage} 
              loading={loadingChat}
              onClearChat={() => setMessages([])}
            />
          </div>
        )}

        {/* Mode 2: Telemetry & Analytics Dashboard View */}
        {viewMode === 'analytics' && (
          <div style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflowY: 'auto', paddingRight: '4px' }}>
            <AnalyticsView 
              trendData={dashboardData?.trend_series || []}
              shiftData={dashboardData?.shift_comparison || []}
              machineSummaries={dashboardData?.machine_summaries || []}
            />

            {/* Quick Floating Chat Trigger */}
            <button
              onClick={() => setViewMode('copilot')}
              className="sc-btn"
              style={{
                position: 'fixed',
                bottom: '24px',
                right: '28px',
                zIndex: 50,
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--accent-cyan)',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              <MessageSquare size={16} />
              <span>Ask AI Copilot</span>
            </button>
          </div>
        )}

        {/* Mode 3: Split View (Side-by-side) */}
        {viewMode === 'split' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '14px', width: '100%', height: '100%', minHeight: 0, overflow: 'hidden' }}>
            <div style={{ height: '100%', minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <TrendCharts 
                trendData={dashboardData?.trend_series || []}
                shiftData={dashboardData?.shift_comparison || []}
                machineSummaries={dashboardData?.machine_summaries || []}
              />
            </div>
            <div style={{ height: '100%', minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <CopilotChat 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                loading={loadingChat} 
                onClearChat={() => setMessages([])}
              />
            </div>
          </div>
        )}

      </main>

      {/* Executive Daily KPI Insight Modal */}
      <DailyInsightModal 
        isOpen={isInsightOpen} 
        onClose={() => setIsInsightOpen(false)} 
        reportData={reportData} 
        loading={loadingReport} 
      />
    </div>
  );
}
