import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }) {
  const { login, register } = useAuth();
  const [tab,      setTab]      = useState(defaultTab);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showPw,   setShowPw]   = useState(false);

  const [loginForm,    setLoginForm]    = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirm: '' });

  useEffect(() => { setTab(defaultTab); setError(''); }, [defaultTab, isOpen]);

  if (!isOpen) return null;

  const handleLogin = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleRegister = async e => {
    e.preventDefault();
    setError('');
    if (registerForm.password !== registerForm.confirm) {
      return setError('Passwords do not match');
    }
    if (registerForm.password.length < 8) {
      return setError('Password must be at least 8 characters');
    }
    setLoading(true);
    try {
      await register(registerForm.name, registerForm.email, registerForm.password);
      await login(registerForm.email, registerForm.password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const initials = name => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(2,6,23,0.75)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      animation: 'fadeIn 0.2s ease',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        .auth-input { background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--r-xs); padding:11px 14px; color:var(--text-primary); font-size:0.9rem; font-family:var(--font-primary); outline:none; width:100%; transition:border-color 0.2s,box-shadow 0.2s; }
        .auth-input:focus { border-color:var(--royal-bright); box-shadow:0 0 0 3px rgba(37,99,235,0.18); }
        .auth-input::placeholder { color:var(--text-muted); }
      `}</style>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        width: '100%', maxWidth: 420,
        boxShadow: 'var(--shadow-lg), 0 0 60px rgba(37,99,235,0.15)',
        animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Gradient strip */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--royal) 0%, var(--royal-bright) 50%, var(--emerald) 100%)' }} />

        <div style={{ padding: '28px 32px 32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {tab === 'login' ? 'Welcome back' : 'Create account'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>
                {tab === 'login' ? 'Sign in to LaunchSignal' : 'Start predicting IPOs for free'}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '1rem', transition: 'all 0.2s',
            }}>✕</button>
          </div>

          {/* Tab switcher */}
          <div style={{
            display: 'flex', background: 'var(--bg-elevated)',
            borderRadius: 'var(--r-sm)', padding: 4, marginBottom: 24,
            border: '1px solid var(--border)',
          }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }} style={{
                flex: 1, padding: '8px', borderRadius: 'calc(var(--r-sm) - 2px)',
                border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                fontFamily: 'var(--font-primary)',
                background: tab === t ? 'linear-gradient(135deg, var(--royal) 0%, var(--royal-bright) 100%)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--text-secondary)',
                boxShadow: tab === t ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
                transition: 'all 0.2s',
              }}>
                {t === 'login' ? '🔑 Sign In' : '✨ Sign Up'}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '10px 14px',
              color: 'var(--crimson)', fontSize: '0.83rem', marginBottom: 16,
            }}>⚠️ {error}</div>
          )}

          {/* Login form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: 6 }}>Email</label>
                <input className="auth-input" type="email" placeholder="you@example.com" required
                  value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="auth-input" type={showPw ? 'text' : 'password'} placeholder="••••••••" required
                    style={{ paddingRight: 44 }}
                    value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem',
                  }}>{showPw ? '🙈' : '👁️'}</button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>
                {loading ? <span className="loader-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : '🚀 Sign In'}
              </button>
            </form>
          )}

          {/* Register form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: 6 }}>Full Name</label>
                <input className="auth-input" type="text" placeholder="Rahul Sharma" required
                  value={registerForm.name} onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: 6 }}>Email</label>
                <input className="auth-input" type="email" placeholder="you@example.com" required
                  value={registerForm.email} onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: 6 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="auth-input" type={showPw ? 'text' : 'password'} placeholder="Min 8 chars" required
                      style={{ paddingRight: 40 }}
                      value={registerForm.password} onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))} />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem',
                    }}>{showPw ? '🙈' : '👁️'}</button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: 6 }}>Confirm</label>
                  <input className="auth-input" type={showPw ? 'text' : 'password'} placeholder="Repeat" required
                    value={registerForm.confirm} onChange={e => setRegisterForm(f => ({ ...f, confirm: e.target.value }))} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>
                {loading ? <span className="loader-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : '✨ Create Account'}
              </button>
            </form>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Google (coming soon) */}
          <button disabled style={{
            width: '100%', padding: '11px', borderRadius: 'var(--r-xs)',
            border: '1px solid var(--border)', background: 'var(--bg-elevated)',
            color: 'var(--text-muted)', fontSize: '0.87rem', fontFamily: 'var(--font-primary)',
            cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span>🌐</span> Google Sign-in — Coming Soon
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 20 }}>
            By signing in you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
