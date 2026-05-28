import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TiltCard from '../components/TiltCard';
import AuthModal from '../components/AuthModal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function PLBadge({ pct }) {
  if (pct == null) return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>;
  const pos = pct >= 0;
  return (
    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '0.95rem', color: pos ? 'var(--emerald)' : 'var(--crimson)' }}>
      {pos ? '+' : ''}{pct}%
    </span>
  );
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const [items,    setItems]    = useState([]);
  const [summary,  setSummary]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState({ company_name:'', lots_applied:'', allotted:'0', issue_price:'', listing_price:'', applied_at:'' });
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');

  const fetchPortfolio = () => {
    if (!user) return setLoading(false);
    setLoading(true);
    axios.get(`${API}/portfolio`)
      .then(r => { setItems(r.data.portfolio || []); setSummary(r.data.summary || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPortfolio(); }, [user]);

  const handleAdd = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        company_name: form.company_name.trim(),
        lots_applied: parseInt(form.lots_applied) || 0,
        allotted: parseInt(form.allotted) || 0,
        issue_price: parseFloat(form.issue_price) || null,
        listing_price: form.listing_price ? parseFloat(form.listing_price) : null,
        listing_gain_pct: form.listing_price && form.issue_price
          ? parseFloat(((parseFloat(form.listing_price) - parseFloat(form.issue_price)) / parseFloat(form.issue_price) * 100).toFixed(2))
          : null,
        applied_at: form.applied_at || null,
      };
      if (editing) {
        await axios.patch(`${API}/portfolio/${editing}`, payload);
        setMsg('Updated!');
      } else {
        await axios.post(`${API}/portfolio`, payload);
        setMsg('Added to portfolio!');
      }
      setShowAdd(false); setEditing(null);
      setForm({ company_name:'', lots_applied:'', allotted:'0', issue_price:'', listing_price:'', applied_at:'' });
      fetchPortfolio();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); setTimeout(() => setMsg(''), 3000); }
  };

  const startEdit = item => {
    setEditing(item.id);
    setForm({
      company_name: item.company_name, lots_applied: item.lots_applied || '',
      allotted: item.allotted || '0', issue_price: item.issue_price || '',
      listing_price: item.listing_price || '', applied_at: item.applied_at?.slice(0,10) || '',
    });
    setShowAdd(true);
  };

  const handleRemove = async id => {
    await axios.delete(`${API}/portfolio/${id}`);
    setItems(l => l.filter(i => i.id !== id));
  };

  if (!user) return (
    <div style={{ paddingTop: 88, minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 540, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
        <TiltCard intensity={5} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 48 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>📋</div>
          <h2 style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)', marginBottom: 8 }}>IPO Portfolio Tracker</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Sign in to track every IPO you applied for and monitor your gains</p>
          <button className="btn btn-primary" onClick={() => setShowAuth(true)} style={{ width: '100%' }}>Sign In to Continue</button>
        </TiltCard>
      </div>
      {showAuth && <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />}
    </div>
  );

  return (
    <div style={{ paddingTop: 88, minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              📋 IPO Portfolio
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{summary.total_ipos || 0} IPOs tracked</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowAdd(v => !v); setEditing(null); setForm({ company_name:'', lots_applied:'', allotted:'0', issue_price:'', listing_price:'', applied_at:'' }); }} style={{ padding: '10px 22px' }}>
            {showAdd && !editing ? '✕ Cancel' : '+ Add IPO'}
          </button>
        </div>

        {/* Feedback */}
        {msg && <div style={{ background: 'rgba(24,185,129,0.1)', border: '1px solid rgba(24,185,129,0.3)', color: 'var(--emerald)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.88rem' }}>✓ {msg}</div>}

        {/* Summary tiles */}
        {!loading && items.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Total IPOs', value: summary.total_ipos, color: 'var(--royal-bright)', icon: '📊' },
              { label: 'Allotted', value: summary.allotted_count, color: 'var(--emerald)', icon: '✅' },
              { label: 'Total P&L', value: summary.total_gain_pct != null ? `${summary.total_gain_pct >= 0 ? '+' : ''}${summary.total_gain_pct}%` : '—', color: summary.total_gain_pct >= 0 ? 'var(--emerald)' : 'var(--crimson)', icon: '💰' },
            ].map(t => (
              <TiltCard key={t.label} intensity={5} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '16px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{t.icon}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.6rem', fontWeight: 800, color: t.color }}>{t.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 4 }}>{t.label}</div>
              </TiltCard>
            ))}
          </div>
        )}

        {/* Add / Edit Form */}
        {showAdd && (
          <TiltCard intensity={3} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-blue)', borderRadius: 'var(--r-md)', padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>
              {editing ? '✏️ Edit Entry' : '+ Add IPO to Portfolio'}
            </h3>
            <form onSubmit={handleAdd}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 16 }}>
                {[
                  { key: 'company_name', label: 'Company Name', placeholder: 'e.g. Swiggy', type: 'text', required: true },
                  { key: 'lots_applied', label: 'Lots Applied', placeholder: '1', type: 'number' },
                  { key: 'allotted',     label: 'Lots Allotted', placeholder: '0', type: 'number' },
                  { key: 'issue_price',  label: 'Issue Price ₹', placeholder: '540', type: 'number' },
                  { key: 'listing_price',label: 'Listing Price ₹', placeholder: '620', type: 'number' },
                  { key: 'applied_at',   label: 'Applied Date', placeholder: '', type: 'date' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>{f.label}</label>
                    <input className="form-input" type={f.type} placeholder={f.placeholder} required={f.required}
                      value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '9px 18px' }} onClick={() => { setShowAdd(false); setEditing(null); }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '9px 22px' }}>
                  {saving ? '...' : editing ? 'Save Changes' : 'Add'}
                </button>
              </div>
            </form>
          </TiltCard>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton-box" style={{ height: 72, borderRadius: 'var(--r-md)' }} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No IPOs in portfolio</h3>
            <p>Add every IPO you apply for and track your allotment and listing gains</p>
          </div>
        ) : (
          <TiltCard intensity={2} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)' }}>
                    {['Company','Lots Applied','Allotted','Issue ₹','Listing ₹','Gain/Loss','Date','Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--royal),var(--emerald))', display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:800,color:'#fff',flexShrink:0 }}>
                            {item.company_name[0]}
                          </div>
                          {item.company_name}
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{item.lots_applied || '—'}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ color: item.allotted > 0 ? 'var(--emerald)' : 'var(--text-muted)', fontWeight: item.allotted > 0 ? 700 : 400, fontSize: '0.88rem' }}>
                          {item.allotted > 0 ? `✅ ${item.allotted}` : '❌ 0'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', fontFamily: 'Space Grotesk', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{item.issue_price ? `₹${item.issue_price}` : '—'}</td>
                      <td style={{ padding: '13px 16px', fontFamily: 'Space Grotesk', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{item.listing_price ? `₹${item.listing_price}` : '—'}</td>
                      <td style={{ padding: '13px 16px' }}><PLBadge pct={item.listing_gain_pct} /></td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{item.applied_at?.slice(0, 10) || '—'}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => startEdit(item)} title="Edit" style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: 'var(--royal-bright)', fontSize: '0.78rem' }}>✏️</button>
                          <button onClick={() => handleRemove(item.id)} title="Remove" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: 'var(--crimson)', fontSize: '0.78rem' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TiltCard>
        )}
      </div>
    </div>
  );
}
