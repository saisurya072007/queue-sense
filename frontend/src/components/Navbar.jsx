import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, LayoutDashboard, LogOut, Menu, X, Building2, ChevronRight } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <div className="logo-icon">🏛️</div>
          <div>
            <div className="logo-text">SmartGov AI</div>
            <div className="logo-sub">Kakinada, Andhra Pradesh</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav>
          <ul className={`nav-links ${mobileOpen ? 'open' : ''}`}>
            <li><NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} end onClick={() => setMobileOpen(false)}>🏠 Home</NavLink></li>
            <li><NavLink to="/queue" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>🎫 Queue Status</NavLink></li>
            <li><NavLink to="/services" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>📋 Service Guide</NavLink></li>
            <li><NavLink to="/analytics" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>📊 Analytics</NavLink></li>
            {!user && <li><NavLink to="/employee/login" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>👤 Employee</NavLink></li>}
          </ul>
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleTheme} title={isDark ? 'Light Mode' : 'Dark Mode'}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user?.type === 'employee' && (
            <div className="flex items-center gap-2">
              <Link to="/employee/dashboard" className="btn btn-secondary btn-sm">
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <button onClick={logout} className="btn btn-outline btn-sm"><LogOut size={15} /></button>
            </div>
          )}

          {user?.type === 'admin' && (
            <div className="flex items-center gap-2">
              <Link to="/admin" className="btn btn-primary btn-sm">
                <Building2 size={15} /> Admin Panel
              </Link>
              <button onClick={logout} className="btn btn-outline btn-sm"><LogOut size={15} /></button>
            </div>
          )}

          {!user && (
            <Link to="/admin/login" className="btn btn-outline btn-sm">Admin</Link>
          )}

          <button className="hamburger" onClick={() => setMobileOpen(prev => !prev)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
