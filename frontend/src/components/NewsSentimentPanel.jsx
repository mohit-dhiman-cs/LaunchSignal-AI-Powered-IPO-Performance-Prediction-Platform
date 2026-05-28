import { useState, useEffect } from 'react';
import axios from 'axios';
import TiltCard from './TiltCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SENTIMENT_COLORS = { Positive: '#18B981', Neutral: '#F59E0B', Negative: '#EF4444' };
const SENTIMENT_ICONS  = { Positive: '📈', Neutral: '➡️', Negative: '📉' };

// SVG semicircle sentiment gauge
function SentimentGauge({ score, sentiment }) {
  // score 0-1 → 0deg=Negative, 90deg=Neutral, 180deg=Positive
  const deg = Math.round(score * 180);
  const rad = (deg - 90) * Math.PI / 180;
  const R = 70;
  const cx = 90, cy = 90;
  const nx = cx + R * Math.cos(rad);
  const ny = cy + R * Math.sin(rad);
  const color = SENTIMENT_COLORS[sentiment] || '#F59E0B';

  return (
    <svg width="180" height="100" viewBox="0 0 180 100" style={{ display: 'block', margin: '0 auto' }}>
      <defs>
        <linearGradient id="gaugGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#EF4444" />
          <stop offset="50%"  stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#18B981" />
        </linearGradient>
      </defs>
      {/* Track */}
      <path d={`M 20 90 A 70 70 0 0 1 160 90`} fill="none" stroke="var(--bg-elevated)" strokeWidth="10" strokeLinecap="round" />
      {/* Arc progress */}
      <path d={`M 20 90 A 70 70 0 0 1 160 90`} fill="none" stroke="url(#gaugGrad)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray="220" strokeDashoffset={220 - (score * 220)} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill={color} />
      {/* Labels */}
      <text x="20" y="108" textAnchor="middle" fontSize="9" fill="#EF4444" fontFamily="Inter">Neg</text>
      <text x="90" y="20" textAnchor="middle" fontSize="9" fill="#F59E0B" fontFamily="Inter">Neutral</text>
      <text x="160" y="108" textAnchor="middle" fontSize="9" fill="#18B981" fontFamily="Inter">Pos</text>
    </svg>
  );
}

export default function NewsSentimentPanel({ companyName }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!companyName) return;
    setLoading(true); setError(''); setData(null);
    axios.get(`${API}/news-sentiment`, { params: { query: companyName } })
      .then(r => setData(r.data))
      .catch(() => setError('Could not fetch news sentiment'))
      .finally(() => setLoading(false));
  }, [companyName]);

  if (!companyName) return (
    <TiltCard intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2rem', marginBottom: 10 }}>📰</div>
      Enter company name to see news sentiment
    </TiltCard>
  );

  if (loading) return (
    <TiltCard intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 28 }}>
      <div className="skeleton-box" style={{ height: 24, width: '40%', marginBottom: 16 }} />
      <div className="skeleton-box" style={{ height: 100, borderRadius: 90, marginBottom: 16 }} />
      {[1,2,3].map(i => <div key={i} className="skeleton-box" style={{ height: 48, marginBottom: 8 }} />)}
    </TiltCard>
  );

  if (error) return (
    <TiltCard intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r-md)', padding: 28, textAlign: 'center', color: 'var(--crimson)' }}>
      ⚠️ {error}
    </TiltCard>
  );

  if (!data) return null;

  const sentiment = data.sentiment || 'Neutral';
  const score     = data.score ?? 0.5;
  const color     = SENTIMENT_COLORS[sentiment];

  return (
    <TiltCard intensity={4} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          📰 News Sentiment
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {data.demo && <span style={{ fontSize: '0.7rem', color: 'var(--amber)', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(245,158,11,0.3)' }}>Demo</span>}
          {data.cached && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cached {data.cached_minutes_ago}m ago</span>}
          <span style={{ background: `${color}18`, color, border: `1px solid ${color}40`, padding: '4px 12px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700 }}>
            {SENTIMENT_ICONS[sentiment]} {sentiment}
          </span>
        </div>
      </div>

      {/* Company name */}
      <div style={{ textAlign: 'center', marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
        {companyName}
      </div>

      {/* Gauge */}
      <SentimentGauge score={score} sentiment={sentiment} />

      {/* Score display */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', fontWeight: 800, color }}>
          {Math.round(score * 100)}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>/100</span>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Sentiment Score</div>
      </div>

      {/* Headlines */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
          Latest Headlines
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(data.headlines || []).slice(0, 5).map((h, i) => {
            const hColor = SENTIMENT_COLORS[h.sentiment] || 'var(--text-muted)';
            return (
              <a key={i} href={h.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-xs)', textDecoration: 'none', transition: 'all 0.15s', border: '1px solid transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}>
                <span style={{ fontSize: '0.8rem', marginTop: 1 }}>{SENTIMENT_ICONS[h.sentiment]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{h.title}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{h.publishedAt}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: hColor, background: `${hColor}15`, padding: '1px 7px', borderRadius: 10 }}>{h.sentiment}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </TiltCard>
  );
}
