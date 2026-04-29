import { useState, useEffect } from 'react';
import axios from 'axios';
import { MarketIndexChart, SectorBarChart } from '../components/Charts';
import Loader from '../components/Loader';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const INDEX_META = {
  nifty50:    { label: 'Nifty 50',     icon: '🏆' },
  sensex:     { label: 'Sensex',       icon: '📈' },
  niftybank:  { label: 'Nifty Bank',   icon: '🏦' },
  niftymid50: { label: 'Nifty Mid 50', icon: '📊' },
};

const PERIODS = [
  { label: '1W', value: '1wk' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
];

export default function MarketAnalysisPage() {
  const [data, setData] = useState(null);
  const [sectorData, setSectorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('1mo');
  const [activeIndex, setActiveIndex] = useState('nifty50');
  const [error, setError] = useState(null);

  const fetchData = async (p = period) => {
    setLoading(true);
    setError(null);
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
    } catch (e) {
      setError('Failed to fetch market data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(period); }, [period]);

  const indices = data?.indices || {};
  const activeData = indices[activeIndex];

  return (
    <div className="page">
      {loading && <Loader message="Fetching live market data..." />}
      <div className="container">

        {/* Header */}
        <div className="page-header animate-fadeUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>📊 Live Market Analysis</h2>
            <p>Real-time Indian market intelligence — powered by Yahoo Finance &amp; LaunchSignal</p>
            {data?.last_updated && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Last updated: {new Date(data.last_updated).toLocaleTimeString('en-IN')}
              </p>
            )}
          </div>
          <button className="btn btn-ghost" onClick={() => fetchData(period)} style={{ flexShrink: 0 }} id="refresh-btn">
            🔄 Refresh
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 24, color: 'var(--accent-red)' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Sentiment Banner */}
        {data?.sentiment && (
          <div className="sentiment-banner animate-fadeUp">
            <span style={{ fontSize: '1.5rem' }}>🌡️</span>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 2 }}>Market Sentiment</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>{data.sentiment}</p>
            </div>
          </div>
        )}

        {/* Index Cards */}
        <div className="grid-4 animate-fadeUp" style={{ marginBottom: 28 }}>
          {Object.entries(INDEX_META).map(([key, meta]) => {
            const idx = indices[key];
            const isActive = activeIndex === key;
            const isUp = idx?.change_pct >= 0;
            return (
              <div
                key={key}
                className="index-card"
                id={`index-card-${key}`}
                style={{
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                  background: isActive ? 'rgba(59,130,246,0.07)' : 'var(--bg-card)',
                }}
                onClick={() => setActiveIndex(key)}
              >
                <p className="index-name">{meta.icon} {meta.label}</p>
                <p className="index-value">
                  {idx?.current ? idx.current.toLocaleString('en-IN') : '—'}
                </p>
                <p className={`index-change ${isUp ? 'up' : 'down'}`}>
                  {idx?.change_pct != null
                    ? `${isUp ? '▲' : '▼'} ${Math.abs(idx.change_pct)}%`
                    : 'Loading...'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Period Selector + Chart */}
        <div className="chart-wrapper animate-fadeUp" style={{ marginBottom: 28 }} id="market-chart">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p className="chart-title" style={{ margin: 0 }}>
              {INDEX_META[activeIndex]?.icon} {INDEX_META[activeIndex]?.label} · Price History
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  className={`btn btn-ghost`}
                  id={`period-${p.value}`}
                  style={{
                    padding: '5px 12px', fontSize: '0.78rem',
                    background: period === p.value ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: period === p.value ? 'var(--accent-blue)' : 'var(--text-muted)',
                    border: period === p.value ? '1px solid var(--border-accent)' : '1px solid var(--border-color)',
                  }}
                  onClick={() => setPeriod(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {activeData?.chart?.length ? (
            <MarketIndexChart data={activeData.chart} indexName={INDEX_META[activeIndex]?.label} />
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              {loading ? 'Loading chart...' : 'No chart data available'}
            </div>
          )}
        </div>

        {/* Sector Performance */}
        {sectorData.length > 0 && (
          <div className="chart-wrapper animate-fadeUp" id="sector-chart">
            <p className="chart-title">🏭 Sector Performance ({PERIODS.find(p2 => p2.value === period)?.label})</p>
            <SectorBarChart data={sectorData} />
          </div>
        )}

        {/* 52-week Stats */}
        {activeData && (
          <div className="grid-2 animate-fadeUp" style={{ marginTop: 28 }}>
            {[
              { label: `52W High – ${INDEX_META[activeIndex]?.label}`, value: activeData.high_52w?.toLocaleString('en-IN') || '—', color: 'var(--accent-green)' },
              { label: `52W Low – ${INDEX_META[activeIndex]?.label}`, value: activeData.low_52w?.toLocaleString('en-IN') || '—', color: 'var(--accent-red)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
