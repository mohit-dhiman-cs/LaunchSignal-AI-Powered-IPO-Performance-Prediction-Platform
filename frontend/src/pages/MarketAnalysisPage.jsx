import { useState, useEffect } from 'react';
import axios from 'axios';
import { MarketIndexChart, SectorBarChart } from '../components/Charts';
import Loader from '../components/Loader';
import TiltCard from '../components/TiltCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const INDEX_META = {
  nifty50:    { label: 'Nifty 50',     icon: '🏆' },
  sensex:     { label: 'Sensex',       icon: '📈' },
  niftybank:  { label: 'Nifty Bank',   icon: '🏦' },
  niftymid50: { label: 'Nifty Mid 50', icon: '📊' },
};

const COMMODITY_META = {
  gold:   { label: 'Gold (1g)',   icon: '🥇' },
  silver: { label: 'Silver (1g)', icon: '🥈' },
};

const ALL_META = { ...INDEX_META, ...COMMODITY_META };

const PERIODS = [
  { label: '1W', value: '1wk' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
];

/* Sentiment pill colours */
const SENTIMENT_COLOR = {
  'Strongly Bullish': '#18B981',
  'Bullish':          '#18B981',
  'Mildly Bullish':   '#F59E0B',
  'Neutral':          '#64748b',
  'Mildly Bearish':   '#F59E0B',
  'Bearish':          '#EF4444',
  'Strongly Bearish': '#EF4444',
};

/* Single index / commodity card */
function IndexCard({ metaKey, meta, value, active, onClick }) {
  const isUp  = value?.change_pct >= 0;
  const color = isUp ? '#18B981' : '#EF4444';
  const glow  = isUp ? 'rgba(24,185,129,0.25)' : 'rgba(239,68,68,0.25)';

  return (
    <TiltCard
      intensity={7}
      id={`index-card-${metaKey}`}
      onClick={onClick}
      style={{
        background: active ? 'rgba(37,99,235,0.1)' : 'var(--bg-card)',
        border: active
          ? '1px solid rgba(37,99,235,0.5)'
          : '1px solid var(--border)',
        borderRadius: 18,
        padding: '20px 22px',
        cursor: 'pointer',
        boxShadow: active
          ? `0 8px 32px rgba(37,99,235,0.2), 0 0 0 1px rgba(37,99,235,0.12)`
          : 'var(--shadow-sm)',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative', overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Active indicator strip */}
      {active && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: 'linear-gradient(180deg, #2563EB 0%, #18B981 100%)',
          borderRadius: '18px 0 0 18px',
        }} />
      )}

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem',
          }}>{meta.icon}</div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            {meta.label}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: `${color}18`,
          border: `1px solid ${color}35`,
          borderRadius: 8, padding: '3px 8px',
          fontSize: '0.7rem', fontWeight: 800, color,
        }}>
          {value?.change_pct != null ? `${isUp ? '▲' : '▼'} ${Math.abs(value.change_pct)}%` : '—'}
        </div>
      </div>

      {/* Value */}
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '1.6rem', fontWeight: 800,
        color: 'var(--text-primary)', letterSpacing: '-0.5px',
        textShadow: `0 0 20px ${glow}`,
      }}>
        {value?.current != null
          ? (metaKey === 'gold' || metaKey === 'silver'
              ? `₹${value.current.toLocaleString('en-IN')}`
              : value.current.toLocaleString('en-IN'))
          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
      </div>
    </TiltCard>
  );
}

export default function MarketAnalysisPage() {
  const [data, setData]           = useState(null);
  const [sectorData, setSectorData] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [period, setPeriod]       = useState('1mo');
  const [activeIndex, setActiveIndex] = useState('nifty50');
  const [error, setError]         = useState(null);

  const fetchData = async (p = period) => {
    setLoading(true); setError(null);
    try {
      const [market, sectors] = await Promise.all([
        axios.get(`${API}/market/analysis?period=${p}`),
        axios.get(`${API}/market/sector-performance?period=${p}`),
      ]);
      setData(market.data);
      const sArr = Object.entries(sectors.data)
        .filter(([, v]) => v.return_pct !== undefined)
        .map(([sector, v]) => ({ sector, return_pct: v.return_pct }))
        .sort((a, b) => b.return_pct - a.return_pct);
      setSectorData(sArr);
    } catch {
      setError('Failed to fetch market data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(period); }, [period]);

  const indices    = data?.indices    || {};
  const commodities = data?.commodities || {};
  const allData    = { ...indices, ...commodities };
  const activeData = allData[activeIndex];
  const sentColor  = SENTIMENT_COLOR[data?.sentiment] || '#64748b';

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64, paddingBottom: 80, position: 'relative' }}>
      {loading && <Loader message="Fetching live market data..." />}

      {/* Ambient glows */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '45vw', height: '45vw', maxWidth: 560, background: 'radial-gradient(circle, rgba(30,73,175,0.14) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-8%', left: '-8%', width: '40vw', height: '40vw', maxWidth: 500, background: 'radial-gradient(circle, rgba(24,185,129,0.09) 0%, transparent 65%)', borderRadius: '50%' }} />
      </div>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '48px 28px 0', position: 'relative', zIndex: 1 }}>

        {/* ── PAGE HEADER ─────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="badge-live" style={{ marginBottom: 14 }}>
              <span className="live-dot" />
              Yahoo Finance · Real-time
            </div>
            <h2 style={{ margin: '0 0 8px', letterSpacing: '-1px' }}>
              Live Market <span className="gradient-text">Intelligence</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
              Real-time Indian market data — indices, commodities &amp; sector performance
            </p>
            {data?.last_updated && (
              <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: 6 }}>
                Last updated: {new Date(data.last_updated).toLocaleTimeString('en-IN')}
              </p>
            )}
          </div>

          <button
            id="refresh-btn"
            onClick={() => fetchData(period)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(37,99,235,0.12)',
              border: '1px solid rgba(37,99,235,0.25)',
              borderRadius: 10, padding: '10px 20px',
              color: '#93c5fd', fontWeight: 700, fontSize: '0.875rem',
              cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,99,235,0.12)'}
          >
            🔄 Refresh
          </button>
        </div>

        {/* ── ERROR ─────────────────────────────────────────── */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 12, padding: '14px 20px', marginBottom: 28,
            color: '#fca5a5', fontSize: '0.875rem',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── SENTIMENT BANNER ──────────────────────────────── */}
        {data?.sentiment && (
          <TiltCard intensity={3} style={{
            background: 'linear-gradient(135deg, #1E2937 0%, #1a2540 100%)',
            border: `1px solid ${sentColor}30`,
            borderRadius: 18, padding: '20px 28px',
            marginBottom: 36,
            display: 'flex', alignItems: 'center', gap: 20,
            boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${sentColor}15`,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `${sentColor}18`,
              border: `1px solid ${sentColor}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', flexShrink: 0,
            }}>
              {data.sentiment.includes('Bullish') ? '🐂' : data.sentiment.includes('Bearish') ? '🐻' : '😐'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.9px', fontWeight: 700, marginBottom: 4 }}>
                Market Sentiment
              </p>
              <p style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '1.4rem', fontWeight: 800,
                color: sentColor,
                textShadow: `0 0 20px ${sentColor}50`,
                margin: 0,
              }}>
                {data.sentiment}
              </p>
            </div>
            <div style={{
              padding: '6px 16px', borderRadius: 100,
              background: `${sentColor}15`,
              border: `1px solid ${sentColor}30`,
              fontSize: '0.75rem', fontWeight: 700,
              color: sentColor, letterSpacing: '0.5px',
            }}>
              LIVE
            </div>
          </TiltCard>
        )}

        {/* ── INDIAN MARKET INDICES ─────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: 16 }}>
            🇮🇳 Indian Markets
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }} className="index-grid">
            {Object.entries(INDEX_META).map(([key, meta]) => (
              <IndexCard
                key={key}
                metaKey={key}
                meta={meta}
                value={indices[key]}
                active={activeIndex === key}
                onClick={() => setActiveIndex(key)}
              />
            ))}
          </div>
        </div>

        {/* ── COMMODITIES ───────────────────────────────────── */}
        <div style={{ marginBottom: 36 }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: 16 }}>
            🌐 Global Commodities
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="commodity-grid">
            {Object.entries(COMMODITY_META).map(([key, meta]) => (
              <IndexCard
                key={key}
                metaKey={key}
                meta={meta}
                value={commodities[key]}
                active={activeIndex === key}
                onClick={() => setActiveIndex(key)}
              />
            ))}
          </div>
        </div>

        {/* ── PRICE CHART ───────────────────────────────────── */}
        <TiltCard intensity={2} style={{
          background: 'linear-gradient(145deg, #1E2937 0%, #1a2540 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 22, padding: 28,
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          marginBottom: 28, position: 'relative', overflow: 'hidden',
        }} id="market-chart">
          {/* Top glow strip */}
          <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.5), transparent)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.9px', fontWeight: 700, marginBottom: 4 }}>Price History</p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                {ALL_META[activeIndex]?.icon} {ALL_META[activeIndex]?.label}
              </p>
            </div>
            {/* Period selector */}
            <div style={{ display: 'flex', gap: 6 }}>
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  id={`period-${p.value}`}
                  onClick={() => setPeriod(p.value)}
                  style={{
                    padding: '6px 14px', borderRadius: 8,
                    fontSize: '0.78rem', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    border: period === p.value ? '1px solid rgba(37,99,235,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    background: period === p.value ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.04)',
                    color: period === p.value ? '#93c5fd' : '#64748b',
                    boxShadow: period === p.value ? '0 4px 12px rgba(37,99,235,0.2)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {activeData?.chart?.length ? (
            <MarketIndexChart data={activeData.chart} indexName={ALL_META[activeIndex]?.label} />
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: '2rem' }}>📉</div>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>{loading ? 'Loading chart data...' : 'No chart data available'}</p>
            </div>
          )}
        </TiltCard>

        {/* ── 52W STATS ─────────────────────────────────────── */}
        {activeData && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }} className="stats-grid">
            {[
              { label: `52W High — ${ALL_META[activeIndex]?.label}`, value: activeData.high_52w?.toLocaleString('en-IN') || '—', color: '#18B981', icon: '📈' },
              { label: `52W Low  — ${ALL_META[activeIndex]?.label}`, value: activeData.low_52w?.toLocaleString('en-IN') || '—',  color: '#EF4444', icon: '📉' },
            ].map(s => (
              <TiltCard key={s.label} intensity={6} style={{
                background: 'linear-gradient(145deg, #1E2937 0%, #1a2540 100%)',
                border: `1px solid ${s.color}20`,
                borderRadius: 18, padding: '22px 24px', textAlign: 'center',
                boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${s.color}10`,
              }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{s.icon}</div>
                <p style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.9px', fontWeight: 700, marginBottom: 10 }}>{s.label}</p>
                <p style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '1.9rem', fontWeight: 800,
                  color: s.color, margin: 0,
                  textShadow: `0 0 20px ${s.color}50`,
                }}>{s.value}</p>
              </TiltCard>
            ))}
          </div>
        )}

        {/* ── SECTOR PERFORMANCE ────────────────────────────── */}
        {sectorData.length > 0 && (
          <TiltCard intensity={2} style={{
            background: 'linear-gradient(145deg, #1E2937 0%, #1a2540 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 22, padding: 28,
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
            marginBottom: 40, position: 'relative', overflow: 'hidden',
          }} id="sector-chart">
            <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(24,185,129,0.5), transparent)' }} />
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.9px', fontWeight: 700, marginBottom: 4 }}>Sector Returns</p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                🏭 Sector Performance ({PERIODS.find(p2 => p2.value === period)?.label})
              </p>
            </div>
            <SectorBarChart data={sectorData} />
          </TiltCard>
        )}

      </div>

      {/* Responsive */}
      <style>{`
        @media(max-width:900px){ .index-grid { grid-template-columns: 1fr 1fr !important; } }
        @media(max-width:540px){
          .index-grid     { grid-template-columns: 1fr !important; }
          .commodity-grid { grid-template-columns: 1fr !important; }
          .stats-grid     { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
