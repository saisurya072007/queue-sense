import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: '2rem' }}>
    <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🏛️</div>
    <h1 style={{ fontSize: '4rem', fontWeight: 900, background: 'var(--gradient-teal)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem' }}>404</h1>
    <h2 style={{ marginBottom: '1rem' }}>Page Not Found</h2>
    <p style={{ color: 'var(--text-muted)', maxWidth: 400, marginBottom: '2rem' }}>The page you're looking for doesn't exist. It may have been moved or the URL may be incorrect.</p>
    <Link to="/" className="btn btn-secondary btn-lg">← Back to Home</Link>
  </div>
);

export default NotFoundPage;
