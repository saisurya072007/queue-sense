import React, { useState, useEffect, useCallback } from 'react';
import { officesAPI, queueAPI } from '../services/api';
import { RefreshCw, MapPin, Phone, AlertTriangle, CheckCircle, Clock, Users, Brain, TrendingUp, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const OFFICE_ICONS = {
  'MeeSeva': '🏦', 'RTO Office': '🚗', 'Collectorate': '🏛️',
  'Municipal Corporation': '🏢', 'Registration Office': '📝', 'Tahsildar Office': '📜',
  'Passport Office': '✈️', 'SBI': '🏦', 'Union Bank': '🏦', 'Canara Bank': '🏦',
  'Indian Bank': '🏦', 'Andhra Bank': '🏦', 'HDFC Bank': '💳', 'ICICI Bank': '💳', 'Axis Bank': '💳',
};

const CrowdGauge = ({ level, count }) => {
  const config = {
    low: { pct: 25, color: '#10b981', label: 'Low Crowd', emoji: '🟢' },
    medium: { pct: 55, color: '#f59e0b', label: 'Moderate', emoji: '🟡' },
    high: { pct: 80, color: '#ef4444', label: 'High Crowd', emoji: '🔴' },
    very_high: { pct: 95, color: '#7c3aed', label: 'Very High', emoji: '🔴' },
  };
  const c = config[level] || config.low;
  const r = 54, circ = 2 * Math.PI * r;
  const offset = circ - (c.pct / 100) * circ;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="65" cy="65" r={r} fill="none" stroke="var(--bg-primary)" strokeWidth="10" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={c.color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ marginTop: '-3.5rem', paddingBottom: '1rem', lineHeight: 1.3 }}>
        <div style={{ fontSize: '1.75rem' }}>{c.emoji}</div>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: c.color }}>{c.label}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{count} waiting</div>
      </div>
    </div>
  );
};

const QueueStatusPage = () => {
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState(sessionStorage.getItem('selectedOfficeId') || '');
  const [queueData, setQueueData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    officesAPI.getAll().then(res => setOffices(res.data.data));
  }, []);

  const fetchQueue = useCallback(async (officeId) => {
    if (!officeId) return;
    setLoadingQueue(true);
    try {
      const res = await queueAPI.getStatus(officeId);
      setQueueData(res.data.data);
      setLastUpdated(new Date());
    } catch (err) {
      toast.error('Failed to fetch queue status');
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    if (selectedOfficeId) {
      fetchQueue(selectedOfficeId);
      const interval = setInterval(() => fetchQueue(selectedOfficeId), 30000); // refresh every 30s
      return () => clearInterval(interval);
    }
  }, [selectedOfficeId, fetchQueue]);

  const handlePredict = async () => {
    if (!tokenInput || !selectedOfficeId) {
      toast.error('Please select an office and enter your token number');
      return;
    }
    setLoadingPrediction(true);
    try {
      const res = await queueAPI.predict(selectedOfficeId, tokenInput);
      setPrediction(res.data.data);
      toast.success('AI prediction ready!');
    } catch {
      toast.error('Failed to get prediction');
    } finally {
      setLoadingPrediction(false);
    }
  };


  const selectedOffice = offices.find(o => o.id === selectedOfficeId);
  const { queue, waitingCount, crowd, avgServiceMinutes, announcements } = queueData || {};

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div className="hero-badge">🎫 Live Queue Monitor</div>
            <h1 style={{ marginTop: '0.5rem' }}>Queue Status</h1>
            <p>Real-time queue tracking with AI-powered predictions</p>
          </div>
          {lastUpdated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={14} />
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Office Selector */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="grid-2" style={{ gap: '1rem', alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Select Office / Bank</label>
              <select className="form-select" value={selectedOfficeId} onChange={e => { setSelectedOfficeId(e.target.value); setQueueData(null); setPrediction(null); }}>
                <option value="">-- Choose an office --</option>
                <optgroup label="🏛️ Government Offices">
                  {offices.filter(o => o.type === 'government').map(o => <option key={o.id} value={o.id}>{OFFICE_ICONS[o.name] || '🏢'} {o.name}</option>)}
                </optgroup>
                <optgroup label="🏦 Banks">
                  {offices.filter(o => o.type === 'bank').map(o => <option key={o.id} value={o.id}>{OFFICE_ICONS[o.name] || '🏦'} {o.name}</option>)}
                </optgroup>
              </select>
            </div>
            {selectedOffice && (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span className="flex items-center gap-1"><MapPin size={13} /> {selectedOffice.address?.substring(0, 60)}</span>
                <span className="flex items-center gap-1"><Phone size={13} /> {selectedOffice.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Announcements */}
        {announcements?.length > 0 && announcements.map((a, i) => (
          <div key={i} className={`announcement-banner announcement-${a.type}`}>
            <AlertTriangle size={18} />
            <div><strong>{a.title}:</strong> {a.message}</div>
          </div>
        ))}

        {/* Queue Paused Banner */}
        {queue?.isPaused && (
          <div className="queue-paused-banner" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle size={20} />
            <div>
              <strong>Queue Paused</strong> – {queue.pauseReason || 'The queue is temporarily paused by staff.'}
            </div>
          </div>
        )}

        {/* Main Status Panel */}
        {loadingQueue && !queueData ? (
          <div className="flex items-center justify-center" style={{ height: 300 }}>
            <div style={{ textAlign: 'center' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
              <p>Fetching live queue data...</p>
            </div>
          </div>
        ) : queueData ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Current Token */}
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="flex items-center gap-2 justify-center" style={{ marginBottom: '1rem' }}>
                <div className="live-indicator"><div className="live-dot" />LIVE</div>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NOW SERVING TOKEN</div>
              <div className="token-display">{queue?.currentToken || '--'}</div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <span className="badge badge-info"><Clock size={12} />{avgServiceMinutes}min avg service</span>
                <span className={`badge ${queue?.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {queue?.status === 'active' ? '✅ Active' : queue?.status === 'paused' ? '⏸ Paused' : queue?.status}
                </span>
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Total tokens issued today: <strong style={{ color: 'var(--text-primary)' }}>{queue?.totalTokensIssued || 0}</strong>
              </div>
            </div>

            {/* Crowd Gauge */}
            <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Current Crowd Level</h3>
              <CrowdGauge level={crowd?.level || 'low'} count={waitingCount || 0} />
              <div style={{ marginTop: '0.5rem', width: '100%' }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${Math.min(100, ((waitingCount || 0) / 50) * 100)}%`,
                    background: crowd?.level === 'high' || crowd?.level === 'very_high' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                      crowd?.level === 'medium' ? 'var(--gradient-gold)' : 'var(--gradient-teal)'
                  }} />
                </div>
              </div>
            </div>
          </div>
        ) : selectedOfficeId && (
          <div className="card text-center" style={{ padding: '3rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
            <h3>No queue data today</h3>
            <p>This office hasn't started the queue today, or data is unavailable.</p>
            <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => fetchQueue(selectedOfficeId)}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        )}

        {/* AI Prediction */}
        {selectedOfficeId && (
          <div className="prediction-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.25rem' }}>🤖 AI Wait Time Predictor</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Enter your token number to get AI-powered wait time and best visit time</p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label className="form-label">Your Token Number</label>
                <input className="form-input" type="number" min="1" placeholder="e.g. 45" value={tokenInput} onChange={e => setTokenInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePredict()} />
              </div>
              <button className="btn btn-secondary" onClick={handlePredict} disabled={loadingPrediction || !tokenInput}>
                <Brain size={16} /> {loadingPrediction ? 'Predicting...' : 'Predict'}
              </button>
            </div>

            {prediction && (
              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <div className="stat-card">
                  <div className="stat-value">{prediction.estimatedWaitMinutes}m</div>
                  <div className="stat-label">⏱ Estimated Wait</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">#{prediction.position}</div>
                  <div className="stat-label">📍 Your Position</div>
                </div>
                <div className="stat-card">
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-teal)' }}>
                    {prediction.expectedCallTime ? new Date(prediction.expectedCallTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </div>
                  <div className="stat-label">🕐 Expected Call Time</div>
                </div>
                <div className="stat-card">
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-gold)', lineHeight: 1.3 }}>
                    {prediction.bestTimeToVisit}
                  </div>
                  <div className="stat-label">⭐ Best Time to Visit</div>
                </div>
                <div className="stat-card">
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: prediction.aiPowered ? '#10b981' : '#f59e0b' }}>
                    {prediction.confidence}%
                  </div>
                  <div className="stat-label">{prediction.aiPowered ? '🤖 AI Confidence' : '📊 Rule-based Est.'}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {!selectedOfficeId && (
          <div className="card text-center" style={{ padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎫</div>
            <h2>Select an Office to Get Started</h2>
            <p style={{ maxWidth: 400, margin: '0.75rem auto 0' }}>Choose a government office or bank from the dropdown above to see live queue status, crowd levels, and AI predictions.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueStatusPage;
