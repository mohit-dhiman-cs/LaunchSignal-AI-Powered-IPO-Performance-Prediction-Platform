import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import TiltCard from '../components/TiltCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const COLORS = { Low: '#18B981', Medium: '#F59E0B', High: '#EF4444' };
const CONF_COLORS = { 'High (>80%)': '#18B981', 'Medium (60-80%)': '#F59E0B', 'Low (<60%)': '#EF4444' };

function StatTile({ icon, label, value, sub, color }) {
  return (
    <TiltCard intensity={5} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '20px 22px' }}>
      <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', fontWeight: 800, color: color || 'var(--royal-bright)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </TiltCard>
  );
}

function SkeletonBox({ h = 200 }) {
  return <div className="skeleton-box" style={{ height: h, borderRadius: 'var(--r-md)' }} />;
}

export default function BacktestPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [year,    setYear]    = useState('');
  const [sector,  setSector]  = useState('');
  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    axios.get(`${API}/sectors`).then(r => setSectors(r.data.sectors || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (year)   params.append('year', year);
    if (sector) params.append('sector', sector);
    axios.get(`${API}/backtest?${params}`)
      .then(r => { setData(r.data); setError(''); })
      .catch(() => setError('Could not load backtest data. Make sure the backend is running.'))
      .finally(() => setLoading(false));
  }, [year, sector]);

  const m = data?.metrics || {};

  const riskPieData = data ? Object.entries(data.risk_distribution || {}).map(([name, value]) => ({ name, value })) : [];
  const sectorBarData = data ? Object.entries(data.sector_distribution || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([sector, count]) => ({ sector: sector.length > 14 ? sector.slice(0, 14) + '…' : sector, count })) : [];
  const confBarData = data ? Object.entries(data.confidence_buckets || {}).map(([name, value]) => ({ name, value })) : [];

  return (
    <div style={{ paddingTop: 88, minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px', marginBottom: 6 }}>
                🔬 AI Model Backtesting
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                How has LaunchSignal performed on historical IPO predictions?
              </p>
            </div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select value={year} onChange={e => setYear(e.target.value)} className="form-select" style={{ width: 120 }}>
                <option value="">All Years</option>
                {[2025, 2024, 2023, 2022, 2021].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={sector} onChange={e => setSector(e.target.value)} className="form-select" style={{ width: 160 }}>
                <option value="">All Sectors</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {(year || sector) && (
                <button onClick={() => { setYear(''); setSector(''); }} className="btn" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '8px 14px' }}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--r-md)', padding: '16px 20px', color: 'var(--crimson)', marginBottom: 24 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Stats Bar */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
            {[1,2,3,4].map(i => <SkeletonBox key={i} h={120} />)}
          </div>
        ) : data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
            <StatTile icon="📊" label="Total Predictions" value={data.total} color="var(--royal-bright)" />
            <StatTile icon="📈" label="Avg Predicted Return" value={`${m.avg_predicted_return ?? 0}%`} color={m.avg_predicted_return >= 0 ? 'var(--emerald)' : 'var(--crimson)'} sub={`Median: ${m.median_predicted_return ?? 0}%`} />
            <StatTile icon="🎯" label="Avg Confidence" value={`${Math.round((m.avg_confidence ?? 0) * 100)}%`} color="var(--amber)" />
            <StatTile icon="✅" label="Positive Returns" value={`${m.positive_return_pct ?? 0}%`} color="var(--emerald)" sub={`${m.positive_return_count ?? 0} of ${data.total}`} />
          </div>
        )}

        {/* Charts row */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <SkeletonBox h={280} />
            <SkeletonBox h={280} />
          </div>
        ) : data && data.total > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20, marginBottom: 24 }}>
            {/* Risk Distribution Pie */}
            <TiltCard intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 24 }}>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: 20, color: 'var(--text-primary)' }}>Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={riskPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={3}>
                    {riskPieData.map(entry => <Cell key={entry.name} fill={COLORS[entry.name] || '#888'} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </TiltCard>

            {/* Confidence Buckets */}
            <TiltCard intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 24 }}>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: 20, color: 'var(--text-primary)' }}>Confidence Buckets</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={confBarData} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {confBarData.map(entry => <Cell key={entry.name} fill={CONF_COLORS[entry.name] || '#888'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TiltCard>

            {/* Sector Distribution */}
            {sectorBarData.length > 0 && (
              <TiltCard intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 24, gridColumn: '1 / -1' }}>
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: 20, color: 'var(--text-primary)' }}>Predictions by Sector</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sectorBarData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="sector" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#2563EB" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </TiltCard>
            )}
          </div>
        ) : !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No predictions yet</h3>
            <p>Run some IPO predictions first to see backtesting metrics here.</p>
          </div>
        )}

        {/* Top Predictions Table */}
        {!loading && data?.top_predictions?.length > 0 && (
          <TiltCard intensity={3} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: 20, color: 'var(--text-primary)' }}>🏆 Top Predicted Returns</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['#', 'Company', 'Sector', 'Predicted Return', 'Risk', 'Confidence', 'Date'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.top_predictions.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{i + 1}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{p.company}</td>
                      <td style={{ padding: '10px 12px', fontSize: '0.8rem' }}><span style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--royal-bright)', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>{p.sector}</span></td>
                      <td style={{ padding: '10px 12px', fontFamily: 'Space Grotesk', fontWeight: 800, color: p.predicted_return >= 0 ? 'var(--emerald)' : 'var(--crimson)' }}>{p.predicted_return >= 0 ? '+' : ''}{p.predicted_return}%</td>
                      <td style={{ padding: '10px 12px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: p.risk === 'Low' ? 'rgba(24,185,129,0.12)' : p.risk === 'High' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: p.risk === 'Low' ? 'var(--emerald)' : p.risk === 'High' ? 'var(--crimson)' : 'var(--amber)' }}>{p.risk}</span></td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{Math.round((p.confidence || 0) * 100)}%</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TiltCard>
        )}

        {/* Disclaimer */}
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--r-md)', padding: '16px 20px', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--amber)' }}>⚠️ Disclaimer:</strong> Backtesting metrics shown here are based on LaunchSignal's historical prediction inputs and model outputs. Actual post-listing price comparison requires verified NSE/BSE data. These metrics reflect model consistency and confidence, not guaranteed accuracy.
        </div>
      </div>
    </div>
  );
}
