import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TiltCard from '../components/TiltCard';
import AuthModal from '../components/AuthModal';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Animated stat counter
function AnimCounter({ target, suffix = '', prefix = '', color = 'var(--royal-bright)' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    const steps = 30, inc = target / steps;
    let cur = 0, i = 0;
    const t = setInterval(() => {
      cur = Math.min(target, cur + inc);
      setVal(typeof target === 'float' ? cur.toFixed(1) : Math.round(cur));
      if (++i >= steps) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [target]);
  return (
    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '2rem', color, lineHeight: 1 }}>
      {prefix}{val}{suffix}
    </span>
  );
}

// Badge component
function Badge({ icon, title, desc, earned }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px',
      background: earned ? 'var(--bg-elevated)' : 'var(--bg-base)',
      border: `1px solid ${earned ? 'var(--border-blue)' : 'var(--border)'}`,
      borderRadius: 'var(--r-md)', opacity: earned ? 1 : 0.4, transition: 'all 0.3s',
      filter: earned ? 'none' : 'grayscale(1)',
    }}>
      <div style={{ fontSize: '2rem' }}>{icon}</div>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>{title}</div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>{desc}</div>
      {earned && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--emerald)', background: 'rgba(24,185,129,0.12)', padding: '2px 8px', borderRadius: 10 }}>Earned</span>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [history,   setHistory]   = useState([]);
  const [histStats, setHistStats] = useState({});
  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState({ items: [], summary: {} });
  const [loading,   setLoading]   = useState(true);
  const [showAuth,  setShowAuth]  = useState(false);

  useEffect(() => {
    if (!user) return setLoading(false);
    Promise.all([
      axios.get(`${API}/history?limit=5&sort_by=created_at`).catch(() => ({ data: { results: [] } })),
      axios.get(`${API}/history/stats`).catch(() => ({ data: {} })),
      axios.get(`${API}/watchlist`).catch(() => ({ data: { watchlist: [] } })),
      axios.get(`${API}/portfolio`).catch(() => ({ data: { portfolio: [], summary: {} } })),
    ]).then(([h, hs, w, p]) => {
      setHistory(h.data.results || []);
      setHistStats(hs.data || {});
      setWatchlist(w.data.watchlist || []);
      setPortfolio({ items: p.data.portfolio || [], summary: p.data.summary || {} });
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div style={{ paddingTop: 88, minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <TiltCard intensity={5} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 56, textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>👤</div>
        <h2 style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)', marginBottom: 8, fontSize: '1.6rem' }}>My Dashboard</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Sign in to see your personalized IPO intelligence hub</p>
        <button className="btn btn-primary" onClick={() => setShowAuth(true)} style={{ width: '100%', fontSize: '1rem', padding: '13px' }}>Sign In to Continue</button>
      </TiltCard>
      {showAuth && <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />}
    </div>
  );

  const totalPredictions = histStats.total_count || 0;
  const avgReturn = histStats.avg_return;
  const positiveCount = histStats.positive_count || 0;
  const accuracyPct = totalPredictions > 0 ? Math.round(positiveCount / totalPredictions * 100) : 0;
  const portfolioGain = portfolio.summary.total_gain_pct;
  const portfolioCount = portfolio.summary.total_ipos || 0;
  const watchlistCount = watchlist.length;

  // Badges logic
  const badges = [
    { icon: '🚀', title: 'First Prediction', desc: 'Run your first IPO prediction', earned: totalPredictions >= 1 },
    { icon: '🎯', title: 'Sharpshooter', desc: 'Made 10+ predictions', earned: totalPredictions >= 10 },
    { icon: '📊', title: 'Market Analyst', desc: 'Made 50+ predictions', earned: totalPredictions >= 50 },
    { icon: '❤️', title: 'Watchlister', desc: 'Added 3+ IPOs to watchlist', earned: watchlistCount >= 3 },
    { icon: '💼', title: 'Portfolio Builder', desc: 'Added 5+ IPOs to portfolio', earned: portfolioCount >= 5 },
    { icon: '📈', title: 'Bull Run', desc: 'Portfolio gain > 20%', earned: portfolioGain != null && portfolioGain > 20 },
  ];

  return (
    <div style={{ paddingTop: 88, minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Welcome header */}
        <div style={{ marginBottom: 36, paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--royal) 0%, var(--emerald) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 900, color: '#fff', fontFamily: 'Space Grotesk',
              boxShadow: '0 4px 20px rgba(37,99,235,0.3)',
            }}>
              {user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 4 }}>
                Welcome back, {user.name.split(' ')[0]} 👋
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Here's your LaunchSignal intelligence summary</p>
            </div>
          </div>
        </div>

        {/* ── Stat tiles ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 36 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton-box" style={{ height: 120 }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 36 }}>
            {[
              { icon: '🎯', label: 'Predictions Run', value: totalPredictions, color: 'var(--royal-bright)', suffix: '' },
              { icon: '📈', label: 'Avg Predicted Return', value: avgReturn ?? 0, color: avgReturn >= 0 ? 'var(--emerald)' : 'var(--crimson)', suffix: '%' },
              { icon: '✅', label: 'Accuracy Rate', value: accuracyPct, color: 'var(--amber)', suffix: '%' },
              { icon: '❤️', label: 'Watchlist Items', value: watchlistCount, color: 'var(--royal-bright)', suffix: '' },
              { icon: '💰', label: 'Portfolio P&L', value: portfolioGain ?? 0, color: (portfolioGain ?? 0) >= 0 ? 'var(--emerald)' : 'var(--crimson)', suffix: '%', prefix: portfolioGain >= 0 ? '+' : '' },
            ].map(s => (
              <TiltCard key={s.label} intensity={5} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '22px 22px 18px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 12, right: 16, fontSize: '1.5rem', opacity: 0.18 }}>{s.icon}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>{s.label}</div>
                <AnimCounter target={typeof s.value === 'number' ? s.value : 0} suffix={s.suffix} prefix={s.prefix || ''} color={s.color} />
                <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 3, marginTop: 14, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, Math.abs(s.value))}%`, background: s.color, borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>
              </TiltCard>
            ))}
          </div>
        )}

        {/* ── Main grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px,1fr))', gap: 24, marginBottom: 36 }}>

          {/* Recent Predictions */}
          <TiltCard intensity={3} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>🎯 Recent Predictions</h3>
              <button onClick={() => navigate('/history')} style={{ fontSize: '0.75rem', color: 'var(--royal-bright)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View All →</button>
            </div>
            {loading ? [1,2,3].map(i => <div key={i} className="skeleton-box" style={{ height: 52, marginBottom: 8 }} />) :
              history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
                  No predictions yet. <button onClick={() => navigate('/')} style={{ color: 'var(--royal-bright)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Run your first →</button>
                </div>
              ) : history.map(h => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{h.company_name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{h.sector} · {h.created_at?.slice(0, 10)}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '0.95rem', color: h.predicted_return >= 0 ? 'var(--emerald)' : 'var(--crimson)' }}>
                      {h.predicted_return >= 0 ? '+' : ''}{h.predicted_return}%
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                      background: h.risk === 'Low' ? 'rgba(24,185,129,0.12)' : h.risk === 'High' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                      color: h.risk === 'Low' ? 'var(--emerald)' : h.risk === 'High' ? 'var(--crimson)' : 'var(--amber)',
                    }}>{h.risk}</span>
                  </div>
                </div>
              ))
            }
          </TiltCard>

          {/* Watchlist quick view */}
          <TiltCard intensity={3} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>❤️ Watchlist</h3>
              <button onClick={() => navigate('/watchlist')} style={{ fontSize: '0.75rem', color: 'var(--royal-bright)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Manage →</button>
            </div>
            {loading ? [1,2,3].map(i => <div key={i} className="skeleton-box" style={{ height: 52, marginBottom: 8 }} />) :
              watchlist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>❤️</div>
                  No IPOs watched yet. <button onClick={() => navigate('/watchlist')} style={{ color: 'var(--royal-bright)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Add some →</button>
                </div>
              ) : watchlist.slice(0, 5).map(w => (
                <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,var(--royal),var(--emerald))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#fff', flexShrink: 0, fontFamily: 'Space Grotesk' }}>
                    {w.company_name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.87rem' }}>{w.company_name}</div>
                    {w.sector && <span style={{ fontSize: '0.68rem', color: 'var(--royal-bright)', background: 'rgba(37,99,235,0.1)', padding: '1px 7px', borderRadius: 6 }}>{w.sector}</span>}
                  </div>
                </div>
              ))
            }
          </TiltCard>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 36 }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>⚡ Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            {[
              { icon: '🎯', label: 'New Prediction', desc: 'Predict an IPO', to: '/', color: '#2563EB' },
              { icon: '🕒', label: 'View History', desc: 'Past predictions', to: '/history', color: '#18B981' },
              { icon: '🔬', label: 'Backtesting', desc: 'Model accuracy', to: '/backtest', color: '#F59E0B' },
              { icon: '❤️', label: 'Watchlist', desc: 'Tracked IPOs', to: '/watchlist', color: '#8B5CF6' },
              { icon: '📋', label: 'Portfolio', desc: 'Your investments', to: '/portfolio', color: '#EC4899' },
            ].map(a => (
              <TiltCard key={a.to} intensity={6} onClick={() => navigate(a.to)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '18px 16px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = a.color + '60'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{a.icon}</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem', marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{a.desc}</div>
              </TiltCard>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>🏆 Achievements</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 12 }}>
            {badges.map(b => <Badge key={b.title} {...b} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
