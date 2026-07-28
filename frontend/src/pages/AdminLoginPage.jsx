import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShieldCheck, Sun, Moon } from 'lucide-react';

const AdminLoginPage = () => {
  const { loginAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      await loginAdmin(form.username, form.password);
      toast.success('Admin login successful!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <button className="theme-toggle" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }} onClick={toggleTheme}>
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="login-card">
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <div style={{ width: 64, height: 64, background: 'var(--gradient-gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 1rem' }}>🛡️</div>
          <h2>Super Admin Login</h2>
          <p style={{ fontSize: '0.875rem', marginTop: '0.375rem' }}>Restricted access – Authorized personnel only</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '999px', padding: '0.3rem 0.875rem', fontSize: '0.75rem', color: '#ef4444', marginTop: '0.75rem' }}>
            <ShieldCheck size={12} /> Secure Admin Access
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Username</label>
            <input className="form-input" type="text" placeholder="Enter admin username" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} autoComplete="username" />
          </div>
          <div className="form-group">
            <label className="form-label">Admin Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showPassword ? 'text' : 'password'} placeholder="Enter admin password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} style={{ paddingRight: '2.75rem' }} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '0.5rem' }} disabled={loading}>
            <ShieldCheck size={18} /> {loading ? 'Authenticating...' : 'Login to Admin Panel'}
          </button>
        </form>

        <div className="divider" />
        <div className="text-center" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--accent-teal)' }}>← Back to Citizen Portal</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
