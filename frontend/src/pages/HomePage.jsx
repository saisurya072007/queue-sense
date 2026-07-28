import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { officesAPI } from '../services/api';
import { ArrowRight, Clock, Users, Brain, CheckCircle, Zap, Shield, Globe } from 'lucide-react';

const FEATURES = [
  { icon: '🤖', title: 'AI Predictions', desc: 'Machine learning predicts your wait time accurately', color: 'var(--accent-teal)' },
  { icon: '📊', title: 'Live Analytics', desc: 'Real-time crowd levels and queue statistics', color: 'var(--accent-blue)' },
  { icon: '💬', title: 'Bilingual Chatbot', desc: 'Ask in English or Telugu — get instant answers', color: 'var(--accent-gold)' },
  { icon: '🔔', title: 'Smart Notifications', desc: 'Get alerted when your token is about to be called', color: 'var(--accent-purple)' },
  { icon: '🏛️', title: '15+ Offices & Banks', desc: 'All major government offices and banks in Kakinada', color: 'var(--accent-pink)' },
  { icon: '📱', title: 'Mobile Friendly', desc: 'Works perfectly on any device — phone, tablet, desktop', color: 'var(--success)' },
];

const STATS = [
  { value: '15+', label: 'Offices & Banks' },
  { value: '50+', label: 'Services Listed' },
  { value: '< 30s', label: 'Wait Prediction Time' },
  { value: '24/7', label: 'AI Available' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [offices, setOffices] = useState([]);
  const [selectedType, setSelectedType] = useState('government');
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    officesAPI.getAll().then(res => {
      setOffices(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredOffices = offices.filter(o => o.type === selectedType);

  const officeIcons = {
    'MeeSeva': '🏦', 'RTO Office': '🚗', 'Collectorate': '🏛️',
    'Municipal Corporation': '🏢', 'Registration Office': '📝', 'Tahsildar Office': '📜',
    'Passport Office': '✈️', 'SBI': '🏦', 'Union Bank': '🏦', 'Canara Bank': '🏦',
    'Indian Bank': '🏦', 'Andhra Bank': '🏦', 'HDFC Bank': '💳', 'ICICI Bank': '💳', 'Axis Bank': '💳',
  };

  const handleCheckQueue = () => {
    if (selectedOffice) {
      sessionStorage.setItem('selectedOfficeId', selectedOffice.id);
      sessionStorage.setItem('selectedOfficeName', selectedOffice.name);
      navigate('/queue');
    }
  };

  return (
    <div>
      {/* ====== HERO ====== */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            {/* Left: Text */}
            <div>
              <div className="hero-badge">
                <span className="live-dot" />
                AI-Powered Government Services
              </div>
              <h1 className="hero-title">
                Skip the Queue.<br />
                <span className="gradient-text">Save Your Time.</span>
              </h1>
              <p className="hero-description">
                SmartGov AI helps Kakinada citizens check live queue status, predict waiting times using AI,
                and find the best time to visit government offices and banks.
              </p>
              <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-lg" onClick={() => document.getElementById('office-selector').scrollIntoView({ behavior: 'smooth' })}>
                  Check Queue Status <ArrowRight size={18} />
                </button>
                <button className="btn btn-outline btn-lg" onClick={() => navigate('/services')}>
                  Service Guide
                </button>
              </div>

              {/* Hero Stats */}
              <div className="hero-stats">
                {STATS.map((s, i) => (
                  <div key={i} className="hero-stat">
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', background: 'var(--gradient-teal)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Office Selector */}
            <div id="office-selector">
              <div className="office-selector-card">
                <h3 style={{ marginBottom: '0.5rem' }}>🏛️ Select Office / Bank</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Choose to check live queue & AI predictions</p>

                <div className="office-type-tabs">
                  <button className={`office-type-tab ${selectedType === 'government' ? 'active' : ''}`} onClick={() => setSelectedType('government')}>
                    🏛️ Government
                  </button>
                  <button className={`office-type-tab ${selectedType === 'bank' ? 'active' : ''}`} onClick={() => setSelectedType('bank')}>
                    🏦 Banks
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center" style={{ height: 200 }}>
                    <div className="loading-spinner" />
                  </div>
                ) : (
                  <div className="office-grid">
                    {filteredOffices.map(office => (
                      <button
                        key={office.id}
                        className={`office-btn ${selectedOffice?.id === office.id ? 'selected' : ''}`}
                        onClick={() => setSelectedOffice(office)}
                      >
                        <div className="office-btn-icon">{officeIcons[office.name] || '🏢'}</div>
                        <div>
                          <div className="office-btn-name">{office.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{office.city}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedOffice && (
                  <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>✅ {selectedOffice.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedOffice.address?.substring(0, 50) || 'Kakinada, AP'}</div>
                      </div>
                      <button className="btn btn-secondary" onClick={handleCheckQueue}>
                        Check Queue <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section className="page" style={{ background: 'var(--bg-secondary)', paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3rem' }}>
            <div className="hero-badge" style={{ justifyContent: 'center', margin: '0 auto 1rem' }}>Features</div>
            <h2>Everything You Need</h2>
            <p style={{ maxWidth: 500, margin: '0.75rem auto 0', fontSize: '1rem' }}>
              Built specifically for Kakinada citizens to navigate government offices effortlessly.
            </p>
          </div>
          <div className="grid-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="glass-card" style={{ padding: '1.75rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: f.color }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="page">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3rem' }}>
            <h2>How It Works</h2>
            <p style={{ maxWidth: 400, margin: '0.75rem auto 0' }}>Three simple steps to skip the queue</p>
          </div>
          <div className="grid-3" style={{ maxWidth: 900, margin: '0 auto' }}>
            {[
              { step: '01', icon: '🏛️', title: 'Select Office', desc: 'Choose your government office or bank from our list of 15+ locations in Kakinada' },
              { step: '02', icon: '🎫', title: 'Enter Token', desc: 'Enter your token number to get instant AI-powered wait time prediction' },
              { step: '03', icon: '⏰', title: 'Visit Smart', desc: 'Get real-time updates, best time suggestions, and notifications when your turn is near' },
            ].map((item, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                <div style={{ width: 60, height: 60, background: 'var(--gradient-teal)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 1rem' }}>{item.icon}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-teal)', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>STEP {item.step}</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>{item.title}</h3>
                <p style={{ fontSize: '0.875rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section style={{ background: 'var(--bg-secondary)', padding: '4rem 0' }}>
        <div className="container text-center">
          <h2 style={{ marginBottom: '1rem' }}>Ready to Skip the Queue?</h2>
          <p style={{ maxWidth: 500, margin: '0 auto 2rem', fontSize: '1rem' }}>
            Join thousands of Kakinada citizens saving hours every day with SmartGov AI.
          </p>
          <div className="flex gap-3 justify-center" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/queue')}>
              <Zap size={18} /> Check Queue Now
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/analytics')}>
              <Globe size={18} /> View Analytics
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
