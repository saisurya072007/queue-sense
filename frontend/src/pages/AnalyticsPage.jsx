import React, { useState, useEffect } from 'react';
import { officesAPI, analyticsAPI } from '../services/api';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { TrendingUp, Users, Clock, Calendar, Zap, Award } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
      <div style={{ fontWeight: 700, marginBottom: '0.375rem', color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
};

const AnalyticsPage = () => {
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    officesAPI.getAll().then(res => setOffices(res.data.data));
  }, []);

  useEffect(() => {
    if (selectedOfficeId) {
      setLoading(true);
      analyticsAPI.getOfficeAnalytics(selectedOfficeId)
        .then(res => setAnalytics(res.data.data))
        .finally(() => setLoading(false));
    }
  }, [selectedOfficeId]);

  const chartData = analytics ? (period === '7d' ? analytics.last7Days : analytics.last30Days).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    Visitors: d.visitors,
    'Avg Wait (min)': d.avgWait,
  })) : [];

  const peakHoursData = analytics?.peakHours?.map(h => ({
    hour: `${h.hour}:00`,
    Visitors: h.avgVisitors,
    'Wait (min)': h.avgWait,
  })) || [];

  const CROWD_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#7c3aed', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <div className="hero-badge">📊 Deep Analytics</div>
          <h1 style={{ marginTop: '0.5rem' }}>Queue Analytics</h1>
          <p>Historical crowd data, peak hours, and performance insights for any office</p>
        </div>

        {/* Office Selector */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ maxWidth: 400 }}>
            <label className="form-label">Select Office to Analyze</label>
            <select className="form-select" value={selectedOfficeId} onChange={e => setSelectedOfficeId(e.target.value)}>
              <option value="">-- Choose an office --</option>
              <optgroup label="🏛️ Government">
                {offices.filter(o => o.type === 'government').map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </optgroup>
              <optgroup label="🏦 Banks">
                {offices.filter(o => o.type === 'bank').map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </optgroup>
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center" style={{ height: 300 }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
          </div>
        )}

        {analytics && !loading && (
          <>
            {/* Today's Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>👥</span>
                  <span className="badge badge-success">Today</span>
                </div>
                <div className="stat-value">{analytics.today.visitors}</div>
                <div className="stat-label">Visitors Today</div>
              </div>
              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>✅</span>
                  <span className="badge badge-teal">Served</span>
                </div>
                <div className="stat-value">{analytics.today.tokensServed}</div>
                <div className="stat-label">Tokens Served</div>
              </div>
              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>⏱</span>
                  <span className="badge badge-warning">Avg</span>
                </div>
                <div className="stat-value">{analytics.today.avgWait}m</div>
                <div className="stat-label">Avg Wait Time</div>
              </div>
              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🔥</span>
                  <span className="badge badge-danger">Peak</span>
                </div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{analytics.busiestDay?.day?.substring(0, 3) || '--'}</div>
                <div className="stat-label">Busiest Day</div>
              </div>
              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>⚡</span>
                  <span className="badge badge-purple">Least</span>
                </div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{analytics.fastestDay?.day?.substring(0, 3) || '--'}</div>
                <div className="stat-label">Least Crowded Day</div>
              </div>
              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🕐</span>
                  <span className="badge badge-info">Off-peak</span>
                </div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                  {analytics.leastCrowdedHour?.hour != null ? `${analytics.leastCrowdedHour.hour}:00` : '--'}
                </div>
                <div className="stat-label">Least Crowded Hour</div>
              </div>
            </div>

            {/* Visitor Trend */}
            <div className="chart-container" style={{ marginBottom: '1.5rem' }}>
              <div className="chart-header">
                <div className="chart-title">📈 Visitor Trend</div>
                <div className="chart-period-tabs">
                  <button className={`chart-period-tab ${period === '7d' ? 'active' : ''}`} onClick={() => setPeriod('7d')}>7 Days</button>
                  <button className={`chart-period-tab ${period === '30d' ? 'active' : ''}`} onClick={() => setPeriod('30d')}>30 Days</button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradWait" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  <Area type="monotone" dataKey="Visitors" stroke="#0d9488" strokeWidth={2} fill="url(#gradVisitors)" />
                  <Area type="monotone" dataKey="Avg Wait (min)" stroke="#f59e0b" strokeWidth={2} fill="url(#gradWait)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Peak Hours + Monthly */}
            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
              {/* Peak Hours Bar Chart */}
              <div className="chart-container">
                <div className="chart-title" style={{ marginBottom: '1rem' }}>🕐 Hourly Traffic Pattern</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={peakHoursData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="hour" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Visitors" radius={[4, 4, 0, 0]}>
                      {peakHoursData.map((_, i) => (
                        <Cell key={i} fill={
                          parseInt(peakHoursData[i]?.hour) >= 10 && parseInt(peakHoursData[i]?.hour) <= 12 ? '#ef4444' :
                          parseInt(peakHoursData[i]?.hour) >= 14 && parseInt(peakHoursData[i]?.hour) <= 16 ? '#f59e0b' : '#0d9488'
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-3" style={{ marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-danger">🔴 Peak hours</span>
                  <span className="badge badge-warning">🟡 Moderate</span>
                  <span className="badge badge-teal">🟢 Off-peak</span>
                </div>
              </div>

              {/* Monthly Trend */}
              <div className="chart-container">
                <div className="chart-title" style={{ marginBottom: '1rem' }}>📅 Monthly Analysis</div>
                {analytics.monthly?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={analytics.monthly.map(m => ({ month: m.month, Visitors: m.visitors, 'Avg Wait': m.avgWait }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                      <Line type="monotone" dataKey="Visitors" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                      <Line type="monotone" dataKey="Avg Wait" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Not enough historical data yet
                  </div>
                )}
              </div>
            </div>

            {/* Insights Cards */}
            <div className="card">
              <h3 style={{ marginBottom: '1.25rem' }}>💡 Smart Insights</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '0.5rem' }}>⭐ Best Time to Visit</div>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>Visit between 9:00 AM – 10:00 AM or after 4:00 PM for shortest waits. {analytics.fastestDay?.day} is typically the least crowded.</p>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '0.5rem' }}>⚠️ Avoid These Times</div>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>10:00 AM – 12:00 PM is peak rush hour. {analytics.busiestDay?.day} sees {analytics.busiestDay?.avgVisitors} avg. visitors.</p>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 700, color: '#3b82f6', marginBottom: '0.5rem' }}>📊 Average Performance</div>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>Average wait time today: {analytics.today.avgWait} minutes. {analytics.today.tokensServed} tokens served so far.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {!selectedOfficeId && (
          <div className="card text-center" style={{ padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
            <h2>Select an Office to View Analytics</h2>
            <p style={{ maxWidth: 400, margin: '0.75rem auto 0' }}>Choose any government office or bank above to see detailed crowd analytics, peak hours, and performance data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
