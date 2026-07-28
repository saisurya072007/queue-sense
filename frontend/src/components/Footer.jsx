import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <div className="flex items-center gap-3">
        <div className="logo-icon" style={{ width: 32, height: 32, background: 'var(--gradient-teal)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🏛️</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>SmartGov AI – Kakinada</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI-Powered Citizen Services</div>
        </div>
      </div>
      <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
        <Link to="/" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Home</Link>
        <Link to="/queue" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Queue Status</Link>
        <Link to="/services" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Services</Link>
        <Link to="/analytics" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Analytics</Link>
        <Link to="/employee/login" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Employee Login</Link>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
        <div>© 2025 SmartGov AI – Kakinada</div>
        <div>Government of Andhra Pradesh</div>
      </div>
    </div>
  </footer>
);

export default Footer;
