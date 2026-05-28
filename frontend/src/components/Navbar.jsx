import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { isDark, toggle }        = useTheme();
  const { user, logout }          = useAuth();
  const [showAuth, setShowAuth]   = useState(false);
  const [showDrop, setShowDrop]   = useState(false);
  const dropRef                   = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = name => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <>
      <nav className="navbar">
        {/* Brand */}
        <NavLink to="/" className="navbar-brand">
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 14l5-5 4 4 5-9" />
            </svg>
          </div>
          <div className="brand-name-container">
            <span className="brand-name">Launch<span>Signal</span></span>
            <span className="brand-subtitle">IPO Performance Prediction</span>
          </div>
        </NavLink>

        {/* Nav Links */}
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} id="nav-predictor">
            🎯 Predictor
          </NavLink>
          <NavLink to="/market" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} id="nav-market">
            📊 Market <span className="navbar-badge">Live</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} id="nav-history">
            🕒 History
          </NavLink>
          <NavLink to="/backtest" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} id="nav-backtest">
            🔬 Backtest
          </NavLink>
          <NavLink to="/community" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} id="nav-community">
            🌐 Community
          </NavLink>

          {/* Theme Toggle */}
          <button
            onClick={toggle}
            id="theme-toggle"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              marginLeft: 4, padding: '7px 14px',
              borderRadius: 'var(--r-sm, 10px)',
              border: '1px solid var(--border)',
              background: 'var(--bg-glass)',
              color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              backdropFilter: 'blur(8px)', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-blue)'; e.currentTarget.style.background = isDark ? 'rgba(245,158,11,0.1)' : 'rgba(30,73,175,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-glass)'; }}
          >
            <div style={{ width: 36, height: 20, borderRadius: 10, background: isDark ? 'linear-gradient(135deg,#1e293b,#334155)' : 'linear-gradient(135deg,#dbeafe,#bfdbfe)', border: isDark ? '1px solid #334155' : '1px solid #93c5fd', position: 'relative', transition: 'all 0.3s ease', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 2, left: isDark ? 2 : 16, width: 14, height: 14, borderRadius: '50%', background: isDark ? 'linear-gradient(135deg,#f1f5f9,#e2e8f0)' : 'linear-gradient(135deg,#f59e0b,#fbbf24)', boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.5)' : '0 1px 4px rgba(245,158,11,0.5)', transition: 'left 0.3s cubic-bezier(0.34,1.56,0.64,1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>
                {isDark ? '🌙' : '☀️'}
              </div>
            </div>
            <span style={{ color: 'var(--text-primary)' }}>{isDark ? 'Dark' : 'Light'}</span>
          </button>

          {/* Auth area */}
          {user ? (
            <div ref={dropRef} style={{ position: 'relative', marginLeft: 4 }}>
              <button
                onClick={() => setShowDrop(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 12px 5px 6px',
                  borderRadius: 'var(--r-sm)', border: '1px solid var(--border)',
                  background: 'var(--bg-glass)', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {/* Avatar circle */}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--royal) 0%, var(--emerald) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>
                  {initials(user.name)}
                </div>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name.split(' ')[0]}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{showDrop ? '▲' : '▼'}</span>
              </button>

              {/* Dropdown */}
              {showDrop && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)',
                  minWidth: 180, overflow: 'hidden', zIndex: 1000,
                  animation: 'slideUp 0.15s ease',
                }}>
                  <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`}</style>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</div>
                  </div>
                  {[['👤', 'My Dashboard', '/dashboard'], ['📋', 'Portfolio', '/portfolio'], ['❤️', 'Watchlist', '/watchlist']].map(([icon, label, to]) => (
                    <NavLink key={to} to={to} onClick={() => setShowDrop(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 16px', color: 'var(--text-secondary)',
                      fontSize: '0.85rem', textDecoration: 'none', transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                      <span>{icon}</span>{label}
                    </NavLink>
                  ))}
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  <button onClick={() => { logout(); setShowDrop(false); }} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', width: '100%',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--crimson)', fontSize: '0.85rem', fontFamily: 'var(--font-primary)',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              id="nav-signin"
              style={{
                marginLeft: 4, padding: '7px 16px',
                borderRadius: 'var(--r-xs)',
                background: 'linear-gradient(135deg, var(--royal) 0%, var(--royal-bright) 100%)',
                border: 'none', color: '#fff', fontWeight: 700,
                fontSize: '0.83rem', fontFamily: 'var(--font-display)',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 2px 10px rgba(37,99,235,0.35)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(37,99,235,0.35)'; }}
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {showAuth && <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />}
    </>
  );
}
