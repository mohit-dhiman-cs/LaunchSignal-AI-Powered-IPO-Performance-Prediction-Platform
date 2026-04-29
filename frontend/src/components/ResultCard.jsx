import { useEffect, useRef } from 'react';
import { useCountUp } from '../hooks/useCountUp';

function RiskIcon({ risk }) {
  if (risk === 'Low')    return <span>🟢</span>;
  if (risk === 'Medium') return <span>🟡</span>;
  return <span>🔴</span>;
}

export default function ResultCard({ result }) {
  const cardRef = useRef();
  const ret = result?.predicted_return;

  // Animated counter — the cinematic reveal
  const animated = useCountUp(ret, 1400);

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.opacity = 0;
      cardRef.current.style.transform = 'scale(0.92)';
      requestAnimationFrame(() => {
        cardRef.current.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
        cardRef.current.style.opacity = 1;
        cardRef.current.style.transform = 'scale(1)';
      });
    }
  }, [result]);

  if (result?.error) {
    return (
      <div className="card" style={{ borderColor: 'var(--accent-red)' }}>
        <p style={{ color: 'var(--accent-red)', fontWeight: 600 }}>⚠️ {result.error}</p>
      </div>
    );
  }

  const isPositive    = ret >= 0;
  const riskClass     = `risk-${result.risk?.toLowerCase()}`;
  const confidencePct = Math.round((result.confidence ?? 0.75) * 100);

  return (
    <div className="card" ref={cardRef} id="result-card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>
            Predicted Listing Return
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {result.company_name || 'Unknown IPO'}
          </p>
        </div>
        <span className={`risk-badge ${riskClass}`} id="risk-badge">
          <RiskIcon risk={result.risk} />
          {result.risk} Risk
        </span>
      </div>

      {/* ── ANIMATED NUMBER REVEAL ── */}
      <div style={{ textAlign: 'center', margin: '20px 0 16px' }}>
        <div
          id="predicted-return"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.8rem, 6vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1,
            color: isPositive ? '#10b981' : '#ef4444',
            textShadow: isPositive
              ? '0 0 40px rgba(16,185,129,0.35)'
              : '0 0 40px rgba(239,68,68,0.35)',
            letterSpacing: '-1px',
          }}
        >
          {isPositive ? '+' : ''}{animated.toFixed(2)}%
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 6 }}>
          {isPositive ? '🚀 Expected listing gain' : '⚠️ Expected listing loss'}
        </p>
      </div>

      <hr className="divider" />

      {/* Confidence */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Model Confidence
          </span>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{confidencePct}%</span>
        </div>
        <div className="confidence-bar">
          <div
            className="confidence-fill"
            style={{ width: `${confidencePct}%` }}
            id="confidence-fill"
          />
        </div>
      </div>

      {/* Market Trend */}
      <div style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        fontSize: '0.82rem',
      }}>
        <span style={{ color: 'var(--text-muted)' }}>📡 Live Nifty 50 Trend</span>
        <span style={{ fontWeight: 700, color: result.market_trend_used >= 0 ? '#10b981' : '#ef4444' }}>
          {result.market_trend_used >= 0 ? '+' : ''}{(result.market_trend_used * 100)?.toFixed(3)}%
        </span>
      </div>

      {/* Input Summary grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '14px',
      }}>
        {[
          { label: 'GMP',    value: `₹${result.inputs?.gmp}` },
          { label: 'Retail', value: `${result.inputs?.retail_sub}x` },
          { label: 'QIB',    value: `${result.inputs?.qib_sub}x` },
          { label: 'NII',    value: `${result.inputs?.nii_sub}x` },
          { label: 'Size',   value: `₹${result.inputs?.issue_size}Cr` },
          { label: 'Sector', value: result.inputs?.sector },
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
