import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import TiltCard from './TiltCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { gmp, issue_price, recorded_at } = payload[0]?.payload || {};
  const pct = issue_price && issue_price > 0 ? ((gmp / issue_price) * 100).toFixed(1) : null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-blue)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: '0.82rem',
    }}>
      <div style={{ fontWeight: 800, color: gmp >= 0 ? 'var(--emerald)' : 'var(--crimson)', fontSize: '1rem', marginBottom: 3 }}>
        {gmp >= 0 ? '+' : ''}₹{gmp}
      </div>
      {pct && <div style={{ color: 'var(--amber)', fontWeight: 600, marginBottom: 3 }}>{pct}% premium</div>}
      <div style={{ color: 'var(--text-muted)' }}>{formatDate(recorded_at)}</div>
    </div>
  );
}

export default function GMPTrendChart({ companyName, gmpNow, issuePrice }) {
  const [history, setHistory] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!companyName) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    axios.get(`${API}/gmp-history/${encodeURIComponent(companyName)}`)
      .then(res => {
        // res.data = { company_name, count, history: [...] }
        const pts = res.data?.history || [];
        setHistory(pts);
      })
      .catch(() => setError('Could not load GMP history'))
      .finally(() => setLoading(false));
  }, [companyName]);

  // Compute trend direction
  const first = history[0]?.gmp ?? 0;
  const last  = history[history.length - 1]?.gmp ?? 0;
  const rising = last >= first;
  const lineColor = rising ? '#10b981' : '#ef4444';
  const gradStart = rising ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)';
  const gradEnd   = 'rgba(0,0,0,0)';

  // Latest GMP stats
  const latestGMP = history.length > 0 ? history[history.length - 1]?.gmp : gmpNow;
  const premiumPct = issuePrice && issuePrice > 0 && latestGMP != null
    ? ((latestGMP / issuePrice) * 100).toFixed(1) : null;

  // Change vs 7 days ago
  const weekAgo = history.length >= 7 ? history[history.length - 7]?.gmp : history[0]?.gmp;
  const change7d = weekAgo != null && latestGMP != null ? (latestGMP - weekAgo).toFixed(1) : null;

  if (loading) {
    return (
      <TiltCard intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 24 }}>
        <div className="skeleton-box" style={{ height: 22, width: '55%', marginBottom: 18 }} />
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton-box" style={{ height: 52, flex: 1, borderRadius: 10 }} />)}
        </div>
        <div className="skeleton-box" style={{ height: 180, borderRadius: 10 }} />
      </TiltCard>
    );
  }

  return (
    <TiltCard intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <span style={{ fontSize: '1.2rem' }}>📈</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            GMP Trend — {companyName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>Grey Market Premium · {history.length}-day history</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: '0.62rem', fontWeight: 800, color: '#10b981',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 4, padding: '1px 6px',
            }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Live Feed
            </span>
          </div>
        </div>
        {history.length > 0 && (
          <div style={{
            background: `${lineColor}18`, border: `1px solid ${lineColor}40`,
            borderRadius: 20, padding: '4px 14px',
            fontSize: '0.75rem', fontWeight: 700, color: lineColor,
          }}>
            {rising ? '▲ Rising' : '▼ Falling'}
          </div>
        )}
      </div>

      {/* ── Stat Pills ── */}
      {latestGMP != null && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 90, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 4 }}>Current GMP</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: latestGMP >= 0 ? 'var(--emerald)' : 'var(--crimson)', fontFamily: 'Space Grotesk' }}>
              {latestGMP >= 0 ? '+' : ''}₹{latestGMP}
            </div>
          </div>
          {premiumPct && (
            <div style={{ flex: 1, minWidth: 90, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 4 }}>Premium</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--amber)', fontFamily: 'Space Grotesk' }}>
                {premiumPct}%
              </div>
            </div>
          )}
          {change7d != null && (
            <div style={{ flex: 1, minWidth: 90, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 4 }}>7-day Δ</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: parseFloat(change7d) >= 0 ? 'var(--emerald)' : 'var(--crimson)', fontFamily: 'Space Grotesk' }}>
                {parseFloat(change7d) >= 0 ? '+' : ''}₹{change7d}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Chart or empty state ── */}
      {error && (
        <div style={{ textAlign: 'center', color: 'var(--crimson)', fontSize: '0.85rem', padding: '40px 0' }}>⚠️ {error}</div>
      )}

      {!error && history.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '40px 16px', lineHeight: 1.8 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📊</div>
          <strong style={{ color: 'var(--text-primary)' }}>No GMP history yet</strong><br />
          Run a prediction for <em>{companyName}</em> to start tracking GMP over time.
        </div>
      )}

      {!error && history.length >= 1 && (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gmpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={gradStart} />
                  <stop offset="95%" stopColor={gradEnd} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="recorded_at"
                tickFormatter={formatDate}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false} tickLine={false}
                interval={Math.floor(history.length / 5)}
              />
              <YAxis
                tickFormatter={v => `₹${v}`}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false} tickLine={false}
                width={56}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Zero reference line */}
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="gmp"
                stroke={lineColor}
                strokeWidth={2.5}
                fill="url(#gmpGrad)"
                dot={history.length <= 20 ? { fill: lineColor, r: 3.5, strokeWidth: 0 } : false}
                activeDot={{ r: 6, fill: lineColor, stroke: 'var(--bg-base)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Caption */}
          <div style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 10 }}>
            GMP data is sourced from grey market tracking · Not an official exchange price
          </div>
        </>
      )}
    </TiltCard>
  );
}
