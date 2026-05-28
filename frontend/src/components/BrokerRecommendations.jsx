import { useState, useEffect } from 'react';
import axios from 'axios';
import TiltCard from './TiltCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const BROKER_LOGOS = { 'ICICI Securities': '🏦', 'Angel One': '😇', 'Zerodha (Coin)': '🟡', 'Motilal Oswal': '📊', 'HDFC Securities': '🔵', 'Kotak Securities': '🔴' };

export default function BrokerRecommendations({ sector, predictedReturn, risk }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sector) return;
    setLoading(true);
    axios.get(`${API}/broker-recs`, { params: { sector, predicted_return: predictedReturn, risk } })
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sector]);

  if (!sector) return (
    <TiltCard intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2rem', marginBottom: 10 }}>🏦</div>
      Select a sector to see broker recommendations
    </TiltCard>
  );

  if (loading) return (
    <TiltCard intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 28 }}>
      <div className="skeleton-box" style={{ height: 24, width: '50%', marginBottom: 20 }} />
      {[1,2,3,4].map(i => <div key={i} className="skeleton-box" style={{ height: 72, marginBottom: 10 }} />)}
    </TiltCard>
  );

  if (!data) return null;

  const counts = { subscribe: data.subscribe_count, neutral: data.neutral_count, avoid: data.avoid_count };

  return (
    <TiltCard intensity={3} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          🏦 Broker Recommendations
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>({data.sector})</span>
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ padding: '5px 14px', borderRadius: 20, fontWeight: 800, fontSize: '0.82rem', background: data.consensus_color + '18', color: data.consensus_color, border: `1px solid ${data.consensus_color}40` }}>
            {data.consensus}
          </span>
        </div>
      </div>

      {/* Consensus bar */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 0, height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
          {counts.subscribe > 0 && <div style={{ flex: counts.subscribe, background: '#18B981', transition: 'flex 0.5s' }} />}
          {counts.neutral   > 0 && <div style={{ flex: counts.neutral,   background: '#94A3B8', transition: 'flex 0.5s' }} />}
          {counts.avoid     > 0 && <div style={{ flex: counts.avoid,     background: '#EF4444', transition: 'flex 0.5s' }} />}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span style={{ color: '#18B981' }}>✅ Subscribe: {counts.subscribe}</span>
          <span>➡️ Neutral: {counts.neutral}</span>
          {counts.avoid > 0 && <span style={{ color: '#EF4444' }}>⛔ Avoid: {counts.avoid}</span>}
        </div>
      </div>

      {/* Broker cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(data.brokers || []).map((b, i) => (
          <div key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '14px 16px', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = b.color + '40'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: 2 }}>{BROKER_LOGOS[b.broker] || '🏦'}</span>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{b.broker}</span>
                  <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: b.bg, color: b.color, border: `1px solid ${b.color}30` }}>
                    {b.rating}
                  </span>
                  {b.target_multiple && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>{b.target_multiple}</span>}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{b.rationale}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        ⚠️ {data.disclaimer}
      </div>
    </TiltCard>
  );
}
