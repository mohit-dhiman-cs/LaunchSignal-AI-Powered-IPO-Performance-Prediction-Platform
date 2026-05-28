import { useState, useEffect } from 'react';
import axios from 'axios';
import TiltCard from './TiltCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ValuationMeter({ score, verdict, color }) {
  // score 0-100, map to position on bar
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ position: 'relative', height: 12, borderRadius: 6, background: 'linear-gradient(90deg, var(--emerald) 0%, var(--amber) 50%, var(--crimson) 100%)', marginBottom: 8 }}>
        <div style={{
          position: 'absolute', top: '50%', left: `${100 - pct}%`,
          transform: 'translate(-50%, -50%)',
          width: 18, height: 18, borderRadius: '50%',
          background: color, border: '3px solid white',
          boxShadow: `0 0 10px ${color}80`,
          transition: 'left 0.6s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--emerald)' }}>Undervalued</span>
        <span>Fairly Valued</span>
        <span style={{ color: 'var(--crimson)' }}>Overvalued</span>
      </div>
    </div>
  );
}

export default function ValuationPanel({ sector, peRatio, revenueGrowth, profitMargin, issuePrice, revenueCr }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!sector) return;
    setLoading(true); setError('');
    axios.post(`${API}/valuation`, {
      sector,
      pe_ratio:            peRatio    || undefined,
      revenue_growth_pct:  revenueGrowth || undefined,
      profit_margin_pct:   profitMargin  || undefined,
      issue_price:         issuePrice    || undefined,
      revenue_cr:          revenueCr     || undefined,
    })
      .then(r => setData(r.data))
      .catch(() => setError('Could not load valuation data'))
      .finally(() => setLoading(false));
  }, [sector, peRatio, revenueGrowth, profitMargin, issuePrice, revenueCr]);

  if (!sector) return (
    <TiltCard intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2rem', marginBottom: 10 }}>📐</div>
      Select a sector to view valuation analysis
    </TiltCard>
  );

  if (loading) return (
    <TiltCard intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 28 }}>
      <div className="skeleton-box" style={{ height: 24, width: '40%', marginBottom: 20 }} />
      <div className="skeleton-box" style={{ height: 12, marginBottom: 12 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton-box" style={{ height: 80 }} />)}
      </div>
    </TiltCard>
  );

  if (error) return (
    <TiltCard intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--r-md)', padding: 28, color: 'var(--crimson)', textAlign: 'center' }}>
      ⚠️ {error}
    </TiltCard>
  );

  if (!data) return null;

  const verdictColor = data.verdict_color || '#F59E0B';

  return (
    <TiltCard intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          📐 Valuation Analysis
        </h3>
        <span style={{
          background: `${verdictColor}18`, color: verdictColor,
          border: `1px solid ${verdictColor}40`,
          padding: '5px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700,
        }}>{data.overall_verdict}</span>
      </div>

      {/* Valuation Meter */}
      <ValuationMeter score={data.valuation_score} verdict={data.overall_verdict} color={verdictColor} />

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
        <MetricBox label="Valuation Score" value={`${data.valuation_score}/100`} color={verdictColor} />
        <MetricBox label="Sector" value={data.sector} color="var(--royal-bright)" />
        <MetricBox label="Sector P/E Median" value={`${data.sector_pe_median}x`} color="var(--text-secondary)" />
        {data.inputs?.revenue_growth_pct && <MetricBox label="Revenue Growth" value={`${data.inputs.revenue_growth_pct}%`} color="var(--emerald)" />}
      </div>

      {/* P/E Analysis */}
      {data.pe_analysis ? (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>P/E Ratio Analysis</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <span style={{ fontFamily: 'Space Grotesk', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{data.pe_analysis.company_pe}x</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: 8 }}>vs {data.pe_analysis.sector_median}x sector</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: data.pe_analysis.premium_pct > 0 ? 'var(--crimson)' : 'var(--emerald)' }}>
                {data.pe_analysis.premium_pct > 0 ? '+' : ''}{data.pe_analysis.premium_pct}% premium
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{data.pe_analysis.verdict}</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--r-sm)', padding: '12px 16px', fontSize: '0.83rem', color: 'var(--amber)', marginBottom: 16 }}>
          💡 Add <strong>P/E Ratio</strong> in Advanced Metrics for detailed valuation analysis
        </div>
      )}

      {/* DCF Analysis */}
      {data.dcf_analysis && (
        <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 'var(--r-sm)', padding: 16 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>DCF Fair Value (3-Stage Model)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', fontWeight: 800, color: 'var(--royal-bright)' }}>
                ₹{data.dcf_analysis.fair_value_low} – ₹{data.dcf_analysis.fair_value_high}
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Fair Value Range</div>
            </div>
            <span style={{
              padding: '5px 12px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700,
              background: data.dcf_analysis.upside_pct >= 0 ? 'rgba(24,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: data.dcf_analysis.upside_pct >= 0 ? 'var(--emerald)' : 'var(--crimson)',
            }}>
              {data.dcf_analysis.upside_pct >= 0 ? '+' : ''}{data.dcf_analysis.upside_pct}% upside
            </span>
          </div>
        </div>
      )}
    </TiltCard>
  );
}

function MetricBox({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-xs)', padding: '12px 14px' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.05rem', fontWeight: 800, color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
