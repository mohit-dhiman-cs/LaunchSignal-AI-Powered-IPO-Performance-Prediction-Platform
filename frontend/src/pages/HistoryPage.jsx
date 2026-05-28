import { useState, useEffect, Component } from 'react';
import axios from 'axios';
import { HistoryReturnChart } from '../components/Charts';
import Loader from '../components/Loader';
import TiltCard from '../components/TiltCard';

// ── Error Boundary — prevents full-app crash ───────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Something went wrong loading History</div>
          <div style={{ fontSize: '0.8rem', marginBottom: 20, color: 'var(--crimson)' }}>{this.state.error?.message}</div>
          <button className="btn btn-primary" onClick={() => this.setState({ error: null })}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const YEARS = ['All', '2020', '2021', '2022', '2023', '2024', '2025'];
const RISK_OPTS = ['All', 'Low', 'Medium', 'High'];
const SORT_OPTS = [
  { label: 'Latest',       value: 'latest' },
  { label: 'Best Return',  value: 'best' },
  { label: 'Worst Return', value: 'worst' },
];
const RETURN_OPTS = [
  { label: 'All',          value: 'all' },
  { label: 'Gainers Only', value: 'gainers' },
  { label: 'Losers Only',  value: 'losers' },
];

function StatTile({ label, value, color, icon }) {
  return (
    <TiltCard intensity={5} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: '18px 20px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{icon}</div>
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.7rem',
        fontWeight: 800, color, marginBottom: 5,
      }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
        {label}
      </div>
    </TiltCard>
  );
}

function RiskBadge({ risk }) {
  const map = { Low: { bg: 'rgba(24,185,129,0.12)', border: 'rgba(24,185,129,0.3)', color: '#18B981' }, Medium: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#F59E0B' }, High: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: '#EF4444' } };
  const s = map[risk] || map.Medium;
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
      {risk || '—'}
    </span>
  );
}

function SectorChip({ sector }) {
  return (
    <span style={{
      background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)',
      color: 'var(--royal-bright)', borderRadius: 20, padding: '2px 10px',
      fontSize: '0.7rem', fontWeight: 600,
    }}>{sector || '—'}</span>
  );
}

function ExpandedRow({ record }) {
  return (
    <tr>
      <td colSpan={7} style={{ padding: '0 16px 16px', background: 'rgba(37,99,235,0.04)' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12, padding: '14px 0',
        }}>
          {[
            { label: 'Confidence',  value: record.confidence !== undefined ? `${Math.round((record.confidence ?? 0) * 100)}%` : '—' },
            { label: 'IPO Score',   value: record.score ?? '—' },
            { label: 'GMP',         value: record.gmp        != null ? `₹${record.gmp}` : '—' },
            { label: 'Retail Sub',  value: record.retail_sub != null ? `${record.retail_sub}x` : '—' },
            { label: 'QIB Sub',     value: record.qib_sub    != null ? `${record.qib_sub}x` : '—' },
            { label: 'Issue Size',  value: record.issue_size != null ? `₹${record.issue_size}Cr` : '—' },
          ].map(it => (
            <div key={it.label} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{it.label}</div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{it.value}</div>
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}

/* ── Filter Bar ── */
function FilterBar({ filters, setFilters, sectors, onClear }) {
  const btnBase = (active) => ({
    padding: '5px 12px', borderRadius: 20, border: `1px solid ${active ? 'var(--royal-bright)' : 'rgba(255,255,255,0.1)'}`,
    background: active ? 'rgba(37,99,235,0.15)' : 'transparent',
    color: active ? 'var(--royal-bright)' : 'var(--text-muted)',
    cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s',
  });

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: '18px 20px', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>

        {/* Sector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 700 }}>Sector</span>
          <select
            value={filters.sector}
            onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}
            className="form-select"
            style={{ minWidth: 130, fontSize: '0.8rem', padding: '5px 10px' }}
            id="filter-sector"
          >
            <option value="">All Sectors</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Year */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 700 }}>Year</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {YEARS.map(y => (
              <button key={y} style={btnBase(filters.year === y)} onClick={() => setFilters(f => ({ ...f, year: y }))}>
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Return type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 700 }}>Returns</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {RETURN_OPTS.map(o => (
              <button key={o.value} style={btnBase(filters.returnType === o.value)} onClick={() => setFilters(f => ({ ...f, returnType: o.value }))}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Risk */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 700 }}>Risk</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {RISK_OPTS.map(r => (
              <button key={r} style={btnBase(filters.risk === r)} onClick={() => setFilters(f => ({ ...f, risk: r }))}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 700 }}>Sort By</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {SORT_OPTS.map(o => (
              <button key={o.value} style={btnBase(filters.sort === o.value)} onClick={() => setFilters(f => ({ ...f, sort: o.value }))}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clear */}
        <button
          onClick={onClear}
          id="clear-filters-btn"
          style={{
            padding: '6px 14px', borderRadius: 20,
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.08)', color: '#EF4444',
            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
            alignSelf: 'flex-end',
          }}
        >
          ✕ Clear
        </button>
      </div>
    </div>
  );
}

/* ── Enhanced Table ── */
function EnhancedHistoryTable({ records }) {
  const [expandedRow, setExpandedRow] = useState(null);

  if (!records.length) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '0.88rem' }}>
        No predictions match the selected filters.
      </div>
    );
  }

  const cols = ['Company', 'Sector', 'Return', 'Risk', 'Date', 'Model', ''];
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr>
            {cols.map(h => (
              <th key={h} style={{
                textAlign: h === 'Return' || h === '' ? 'center' : 'left',
                padding: '11px 14px', fontSize: '0.68rem', fontWeight: 700,
                color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px',
                borderBottom: '1px solid var(--border)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => {
            const isPos = r.predicted_return >= 0;
            const isExpanded = expandedRow === i;
            return (
              <>
                <tr
                  key={i}
                  onClick={() => setExpandedRow(isExpanded ? null : i)}
                  style={{
                    background: isExpanded ? 'rgba(37,99,235,0.06)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <td style={{ padding: '11px 14px', borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.04)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {r.company_name || '—'}
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                    <SectorChip sector={r.sector} />
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{
                      fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800,
                      fontSize: '0.95rem',
                      color: isPos ? '#18B981' : '#EF4444',
                    }}>
                      {isPos ? '+' : ''}{r.predicted_return?.toFixed(2)}%
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                    <RiskBadge risk={r.risk} />
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--text-muted)', fontSize: '0.78rem', borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--text-muted)', fontSize: '0.75rem', borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                    {r.model_used || '—'}
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </td>
                </tr>
                {isExpanded && <ExpandedRow record={r} key={`exp-${i}`} />}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const DEFAULT_FILTERS = { sector: '', year: 'All', returnType: 'all', risk: 'All', sort: 'latest' };

function applyFilters(records, filters) {
  let out = [...records];
  if (filters.sector) out = out.filter(r => r.sector === filters.sector);
  if (filters.year !== 'All') out = out.filter(r => {
    const d = r.created_at ? new Date(r.created_at).getFullYear().toString() : '';
    return d === filters.year;
  });
  if (filters.returnType === 'gainers') out = out.filter(r => r.predicted_return >= 0);
  if (filters.returnType === 'losers')  out = out.filter(r => r.predicted_return < 0);
  if (filters.risk !== 'All') out = out.filter(r => r.risk === filters.risk);
  if (filters.sort === 'best')   out.sort((a, b) => b.predicted_return - a.predicted_return);
  if (filters.sort === 'worst')  out.sort((a, b) => a.predicted_return - b.predicted_return);
  if (filters.sort === 'latest') out.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return out;
}

export default function HistoryPage() {
  return (
    <ErrorBoundary>
      <HistoryPageInner />
    </ErrorBoundary>
  );
}

function HistoryPageInner() {
  const [records, setRecords]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [sectors, setSectors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState(DEFAULT_FILTERS);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [histRes, statsRes, secRes] = await Promise.allSettled([
        axios.get(`${API}/history`),
        axios.get(`${API}/history/stats`),
        axios.get(`${API}/sectors`),
      ]);
      // API returns { count, filters, results: [...] }
      const histData = histRes.status === 'fulfilled' ? histRes.value.data : null;
      const recs = Array.isArray(histData)
        ? histData
        : (histData?.results ?? histData?.history ?? []);
      setRecords(recs);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (secRes.status === 'fulfilled') {
        const secData = secRes.value.data;
        // /sectors returns { sectors: [...] }
        setSectors(Array.isArray(secData) ? secData : (secData?.sectors ?? []));
      } else {
        // Derive sectors from the fetched records
        const uniq = [...new Set(recs.map(r => r.sector).filter(Boolean))];
        setSectors(uniq.sort());
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Safe stats — guards against records being an object instead of array
  const safeRecords = Array.isArray(records) ? records : [];
  const totalPredictions = stats?.total_count ?? safeRecords.length;
  const avgReturn = stats?.avg_return ?? (
    safeRecords.length
      ? (safeRecords.reduce((s, r) => s + (r.predicted_return || 0), 0) / safeRecords.length).toFixed(2)
      : '—'
  );
  const bestIPO  = stats?.max_return ?? (safeRecords.length ? Math.max(...safeRecords.map(r => r.predicted_return || 0)).toFixed(1) : '—');
  const worstIPO = stats?.min_return ?? (safeRecords.length ? Math.min(...safeRecords.map(r => r.predicted_return || 0)).toFixed(1) : '—');

  const filtered = applyFilters(safeRecords, filters);

  return (
    <div className="page">
      {loading && <Loader message="Loading prediction history..." />}
      <div className="container">

        <div className="page-header animate-fadeUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>🕒 Prediction History</h2>
            <p>All past IPO predictions logged in real-time</p>
          </div>
          <button className="btn btn-ghost" onClick={fetchAll} id="refresh-history-btn">🔄 Refresh</button>
        </div>

        {/* ── Stats Bar ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }} className="animate-fadeUp">
          <StatTile icon="📊" label="Total Predictions" value={totalPredictions} color="var(--royal-bright)" />
          <StatTile icon="📈" label="Avg Listing Gain" value={`${Number(avgReturn) >= 0 ? '+' : ''}${avgReturn}%`} color={Number(avgReturn) >= 0 ? '#18B981' : '#EF4444'} />
          <StatTile icon="🚀" label="Best IPO" value={bestIPO !== '—' ? `+${bestIPO}%` : '—'} color="#18B981" />
          <StatTile icon="📉" label="Worst IPO" value={worstIPO !== '—' ? `${worstIPO}%` : '—'} color="#EF4444" />
        </div>

        {/* ── Chart ── */}
        {safeRecords.length > 0 && (
          <div className="animate-fadeUp" style={{ marginBottom: 28 }}>
            <HistoryReturnChart data={safeRecords} />
          </div>
        )}

        {/* ── Filter Bar ── */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          sectors={sectors}
          onClear={() => setFilters(DEFAULT_FILTERS)}
        />

        {/* ── Enhanced Table ── */}
        <div className="card animate-fadeUp" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {filtered.length} prediction{filtered.length !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click a row to expand</span>
          </div>
          <EnhancedHistoryTable records={filtered} />
        </div>

      </div>
    </div>
  );
}
