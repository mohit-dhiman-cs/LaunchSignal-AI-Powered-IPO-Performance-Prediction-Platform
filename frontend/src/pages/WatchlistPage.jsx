import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TiltCard from '../components/TiltCard';
import AuthModal from '../components/AuthModal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SECTORS = ['IT','Fintech','Consumer Tech','Pharma','Healthcare','EV / Clean Energy',
  'Banking','Finance','Insurance','Logistics','Manufacturing','Retail','FMCG','EdTech','E-Commerce'];

export default function WatchlistPage() {
  const { user } = useAuth();
  const [list,     setList]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [form,     setForm]     = useState({ company_name: '', sector: '' });
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');

  const fetchList = () => {
    if (!user) return setLoading(false);
    setLoading(true);
    axios.get(`${API}/watchlist`)
      .then(r => setList(r.data.watchlist || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, [user]);

  const handleAdd = async e => {
    e.preventDefault();
    if (!form.company_name.trim()) return;
    setSaving(true);
    try {
      await axios.post(`${API}/watchlist`, form);
      setMsg('Added to watchlist!');
      setShowAdd(false);
      setForm({ company_name: '', sector: '' });
      fetchList();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to add');
    } finally { setSaving(false); setTimeout(() => setMsg(''), 3000); }
  };

  const handleRemove = async id => {
    await axios.delete(`${API}/watchlist/${id}`);
    setList(l => l.filter(i => i.id !== id));
  };

  if (!user) return (
    <div style={{ paddingTop: 88, minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 540, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
        <TiltCard intensity={5} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 48 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>❤️</div>
          <h2 style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)', marginBottom: 8 }}>Your Watchlist</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Sign in to save and track IPOs you're interested in</p>
          <button className="btn btn-primary" onClick={() => setShowAuth(true)} style={{ width: '100%' }}>Sign In to Continue</button>
        </TiltCard>
      </div>
      {showAuth && <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />}
    </div>
  );

  return (
    <div style={{ paddingTop: 88, minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              ❤️ My Watchlist
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{list.length} IPO{list.length !== 1 ? 's' : ''} tracked</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(v => !v)} style={{ padding: '10px 22px' }}>
            {showAdd ? '✕ Cancel' : '+ Add IPO'}
          </button>
        </div>

        {/* Feedback msg */}
        {msg && (
          <div style={{ background: 'rgba(24,185,129,0.1)', border: '1px solid rgba(24,185,129,0.3)', color: 'var(--emerald)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.88rem' }}>
            ✓ {msg}
          </div>
        )}

        {/* Add form */}
        {showAdd && (
          <TiltCard intensity={3} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-blue)', borderRadius: 'var(--r-md)', padding: 24, marginBottom: 24 }}>
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 2, minWidth: 200 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Company Name</label>
                <input className="form-input" placeholder="e.g. Swiggy" value={form.company_name}
                  onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} required />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Sector</label>
                <select className="form-select" value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}>
                  <option value="">Select Sector</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '11px 24px', whiteSpace: 'nowrap' }}>
                {saving ? '...' : '❤️ Watch'}
              </button>
            </form>
          </TiltCard>
        )}

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton-box" style={{ height: 80, borderRadius: 'var(--r-md)' }} />)}
          </div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No IPOs in watchlist</h3>
            <p>Click "+ Add IPO" to start tracking companies you're interested in</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {list.map(item => (
              <TiltCard key={item.id} intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, var(--royal) 0%, var(--emerald) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color: '#fff', flexShrink: 0, fontFamily: 'Space Grotesk' }}>
                    {item.company_name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.98rem' }}>{item.company_name}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                      {item.sector && <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--royal-bright)', background: 'rgba(37,99,235,0.1)', padding: '2px 8px', borderRadius: 8 }}>{item.sector}</span>}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Added {item.added_at?.slice(0, 10)}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleRemove(item.id)} title="Remove from watchlist" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--crimson)', fontSize: '0.8rem', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
                  🗑️
                </button>
              </TiltCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
