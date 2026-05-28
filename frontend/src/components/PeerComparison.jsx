import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  RadarChart, PolarGrid, PolarAngleAxis,
  Radar, Legend, ResponsiveContainer, Tooltip,
} from 'recharts';
import TiltCard from './TiltCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PEER_COLORS = ['var(--royal-bright)', 'var(--emerald)', 'var(--amber)', '#8B5CF6'];
const METRICS     = ['pe_ratio', 'revenue_growth_pct', 'profit_margin_pct', 'roe_pct', 'listing_gain_pct'];
const LABELS      = { pe_ratio: 'P/E', revenue_growth_pct: 'Rev Growth', profit_margin_pct: 'Margin', roe_pct: 'ROE', listing_gain_pct: 'IPO Gain' };

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

function colorCode(val, med) {
  if (val === undefined || val === null) return 'var(--text-muted)';
  return val >= med ? '#18B981' : '#EF4444';
}

function Skeleton() {
  return (
    <TiltCard intensity={4} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: 24,
    }}>
      <div className="skeleton-box" style={{ height: 24, width: '50%', marginBottom: 16 }} />
      <div className="skeleton-box" style={{ height: 36, borderRadius: 10, marginBottom: 14 }} />
      <div className="skeleton-box" style={{ height: 220, borderRadius: 10 }} />
    </TiltCard>
  );
}

/* ── Table Tab ── */
function MetricsTable({ peers, companyName, predictedReturn }) {
  if (!peers?.length) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: '0.85rem' }}>
      No peer data available for this sector yet.
    </div>
  );

  const allRows = [
    { name: companyName || 'This IPO', sector: peers[0]?.sector || '—',
      pe_ratio: null, revenue_growth_pct: null, profit_margin_pct: null,
      roe_pct: null, listing_gain_pct: predictedReturn, isThis: true },
    ...peers,
  ];

  const meds = {};
  METRICS.forEach(m => {
    const vals = peers.map(p => p[m]).filter(v => v !== null && v !== undefined);
    meds[m] = vals.length ? median(vals) : 0;
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr>
            {['Company', 'P/E', 'Rev Growth', 'Margin', 'ROE', 'IPO Gain'].map(h => (
              <th key={h} style={{
                textAlign: h === 'Company' ? 'left' : 'right',
                padding: '10px 12px', fontSize: '0.7rem', fontWeight: 700,
                color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px',
                borderBottom: '1px solid var(--border)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allRows.map((row, idx) => (
            <tr key={row.name} style={{
              background: row.isThis
                ? 'linear-gradient(90deg, rgba(37,99,235,0.12) 0%, rgba(37,99,235,0.04) 100%)'
                : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
              transition: 'background 0.2s',
            }}>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {row.isThis ? (
                    <span style={{
                      background: 'var(--royal-bright)', color: '#fff',
                      borderRadius: 6, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                    }}>YOU</span>
                  ) : (
                    <span style={{
                      background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
                      borderRadius: 6, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                    }}>#{idx}</span>
                  )}
                  <span style={{ fontWeight: row.isThis ? 700 : 500, color: row.isThis ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {row.name}
                  </span>
                </div>
              </td>
              {['pe_ratio', 'revenue_growth_pct', 'profit_margin_pct', 'roe_pct', 'listing_gain_pct'].map(m => {
                const v = row[m];
                const display = v !== null && v !== undefined ? `${v}${m !== 'pe_ratio' ? '%' : 'x'}` : '—';
                const col = v !== null && v !== undefined && !row.isThis
                  ? colorCode(v, meds[m])
                  : row.isThis && v !== null && v !== undefined
                  ? (v >= 0 ? '#18B981' : '#EF4444')
                  : 'var(--text-muted)';
                return (
                  <td key={m} style={{
                    textAlign: 'right', padding: '10px 12px',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 600, color: col, fontSize: '0.85rem',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Radar Tab ── */
function PeerRadar({ peers, companyName, predictedReturn }) {
  if (!peers?.length) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: '0.85rem' }}>
      No peer data to display on radar.
    </div>
  );

  const top3 = peers.slice(0, 3);

  // Normalize to 0-100 for radar
  const allCompanies = [
    { name: companyName || 'This IPO', listing_gain_pct: predictedReturn, ...peers[0] },
    ...top3,
  ];

  const normalizeAll = (metric) => {
    const vals = allCompanies.map(c => c[metric] ?? 0);
    const min  = Math.min(...vals);
    const max  = Math.max(...vals);
    const range = max - min || 1;
    return allCompanies.map(c => ({ name: c.name, val: Math.round(((c[metric] ?? 0) - min) / range * 100) }));
  };

  const radarData = ['pe_ratio', 'revenue_growth_pct', 'profit_margin_pct', 'roe_pct', 'listing_gain_pct'].map(m => {
    const row = { metric: LABELS[m] };
    normalizeAll(m).forEach(({ name, val }, i) => {
      row[name] = val;
    });
    return row;
  });

  const names = allCompanies.map(c => c.name);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        {names.map((name, i) => (
          <Radar
            key={name} name={name} dataKey={name}
            stroke={PEER_COLORS[i]} fill={PEER_COLORS[i]} fillOpacity={0.08}
            strokeWidth={i === 0 ? 2.5 : 1.5}
          />
        ))}
        <Tooltip
          contentStyle={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 10, fontSize: '0.8rem',
          }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: '0.75rem', paddingTop: 12 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export default function PeerComparison({ sector, companyName, predictedReturn }) {
  const [peers, setPeers]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('table');

  useEffect(() => {
    if (!sector) { setLoading(false); return; }
    setLoading(true);
    axios.get(`${API}/peers`, { params: { sector, company: companyName } })
      .then(res => setPeers(res.data || []))
      .catch(() => setPeers([]))
      .finally(() => setLoading(false));
  }, [sector, companyName]);

  if (loading) return <Skeleton />;

  return (
    <TiltCard intensity={4} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: 24,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>
          👥 Peer Comparison
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {sector} sector · {(peers?.length || 0)} peers
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 18,
        background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4,
      }}>
        {[{ id: 'table', label: '📊 Metrics Table' }, { id: 'radar', label: '🕸️ Radar Chart' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '7px 12px', borderRadius: 8, border: 'none',
            background: tab === t.id ? 'var(--royal-bright)' : 'transparent',
            color: tab === t.id ? '#fff' : 'var(--text-muted)',
            fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'table' && (
        <MetricsTable peers={peers} companyName={companyName} predictedReturn={predictedReturn} />
      )}
      {tab === 'radar' && (
        <PeerRadar peers={peers} companyName={companyName} predictedReturn={predictedReturn} />
      )}
    </TiltCard>
  );
}
