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
    <div className="app-container text-slate-100 font-sans">
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
      <main className="main-workspace">
        
        {/* Mode 1: AI Copilot Focused View */}
        {viewMode === 'copilot' && (
          <div style={{ width: '100%', maxWidth: '980px', margin: '0 auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          <div style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflowY: 'auto', paddingRight: '2px' }}>
            <AnalyticsView 
              trendData={dashboardData?.trend_series || []}
              shiftData={dashboardData?.shift_comparison || []}
              machineSummaries={dashboardData?.machine_summaries || []}
            />

            {/* Quick Floating Chat Trigger */}
            <button
              onClick={() => setViewMode('copilot')}
              className="sc-btn sc-btn-glow"
              style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 50,
                borderRadius: '50px',
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(6, 182, 212, 0.4)'
              }}
            >
              <MessageSquare size={15} />
              <span>Ask AI</span>
            </button>
          </div>
        )}

        {/* Mode 3: Split View (Side-by-side on desktop, stacked on mobile) */}
        {viewMode === 'split' && (
          <div className="split-view-grid">
            <div className="split-view-col">
              <TrendCharts 
                trendData={dashboardData?.trend_series || []}
                shiftData={dashboardData?.shift_comparison || []}
                machineSummaries={dashboardData?.machine_summaries || []}
              />
            </div>
            <div className="split-view-col">
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
