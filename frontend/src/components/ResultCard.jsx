import { useEffect, useRef } from 'react';
import { useCountUp } from '../hooks/useCountUp';
import TiltCard from './TiltCard';

/* ── Confidence Interval Bar ── */
function ConfidenceIntervalBar({ low, high, center }) {
  if (low === undefined || high === undefined) return null;
  // Determine display range: min to max across 0 and the values
  const rangeMin = Math.min(low, high, 0) - 5;
  const rangeMax = Math.max(low, high, 0) + 5;
  const span     = rangeMax - rangeMin || 1;
  const toX      = v => ((v - rangeMin) / span) * 100;

  const leftPct   = toX(Math.min(low, high));
  const widthPct  = Math.abs(toX(high) - toX(low));
  const centerPct = toX(center ?? 0);

  // Bar color logic
  let barColor;
  if (low >= 0 && high >= 0)   barColor = 'linear-gradient(90deg, #059669, #18B981)';
  else if (low < 0 && high < 0) barColor = 'linear-gradient(90deg, #DC2626, #EF4444)';
  else                          barColor = 'linear-gradient(90deg, #EF4444, #F59E0B, #18B981)';

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Confidence Range
        </span>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          {low >= 0 ? '+' : ''}{low.toFixed(1)}% — {high >= 0 ? '+' : ''}{high.toFixed(1)}%
        </span>
      </div>
      <div style={{ position: 'relative', height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
        {/* Colored range */}
        <div style={{
          position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`,
          top: 0, bottom: 0, background: barColor, borderRadius: 99, opacity: 0.85,
        }} />
        {/* Zero line */}
        {rangeMin < 0 && rangeMax > 0 && (
          <div style={{
            position: 'absolute', left: `${toX(0)}%`, top: -2, bottom: -2,
            width: 2, background: 'rgba(255,255,255,0.25)', borderRadius: 1,
          }} />
        )}
        {/* Center marker */}
        <div style={{
          position: 'absolute', left: `${centerPct}%`, top: -3, bottom: -3,
          width: 3, background: '#fff', borderRadius: 2,
          boxShadow: '0 0 8px rgba(255,255,255,0.5)',
          transform: 'translateX(-50%)',
        }} />
      </div>
    </div>
  );
}

/* ── Probability Ring ── */
function ProbabilityRing({ probability }) {
  if (probability === undefined || probability === null) return null;
  const r    = 42;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(Math.max(probability, 0), 100) / 100;
  const dash = circ * pct;
  const col  = probability > 65 ? '#18B981' : probability >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
      <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
          <circle
            cx="50" cy="50" r={r} fill="none"
            stroke={col} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            style={{ filter: `drop-shadow(0 0 8px ${col})`, transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: col, lineHeight: 1,
          }}>{probability}%</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
          Probability of Gain
        </div>
        <div style={{ fontSize: '0.82rem', color: col, fontWeight: 600 }}>
          {probability > 65 ? '🚀 Strong likelihood of profit'
           : probability >= 40 ? '⚖️ Moderate chance of gain'
           : '⚠️ High risk of listing loss'}
        </div>
      </div>
    </div>
  );
}

/* ── Listing Price Range ── */
function ListingPriceRange({ range }) {
  if (!range) return null;
  const { low, high } = range;
  if (low === undefined || high === undefined) return null;
  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        Expected Listing Price
      </span>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'linear-gradient(90deg, rgba(24,185,129,0.12), rgba(37,99,235,0.12))',
        border: '1px solid rgba(24,185,129,0.25)',
        borderRadius: 99, padding: '6px 18px',
        fontSize: '1rem', fontWeight: 700,
        fontFamily: 'Space Grotesk, sans-serif',
        color: 'var(--text-primary)',
        alignSelf: 'flex-start',
      }}>
        <span style={{ color: '#18B981' }}>₹{low.toLocaleString('en-IN')}</span>
        <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.9rem' }}>—</span>
        <span style={{ color: '#2563EB' }}>₹{high.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}

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
      <TiltCard className="card" style={{ borderColor: 'var(--accent-red)' }}>
        <p style={{ color: 'var(--accent-red)', fontWeight: 600 }}>⚠️ {result.error}</p>
      </TiltCard>
    );
  }

  const isPositive    = ret >= 0;
  const riskClass     = `risk-${result.risk?.toLowerCase()}`;
  const confidencePct = Math.round((result.confidence ?? 0.75) * 100);

  return (
    <TiltCard className="card" ref={cardRef} id="result-card">
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
            textShadow: 'none',
            letterSpacing: '-1px',
          }}
        >
          {isPositive ? '+' : ''}{animated.toFixed(2)}%
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 6 }}>
          {isPositive ? '🚀 Expected listing gain' : '⚠️ Expected listing loss'}
        </p>
      </div>

      {/* Confidence Interval Bar */}
      <ConfidenceIntervalBar
        low={result.confidence_low}
        high={result.confidence_high}
        center={ret}
      />

      {/* Probability Ring */}
      <ProbabilityRing probability={result.profit_probability} />

      {/* Listing Price Range */}
      <ListingPriceRange range={result.listing_price_range} />

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

      {/* Profit Probability (Classifier) */}
      {result.profit_probability !== undefined && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Profit Probability (Two-Step AI)
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: result.profit_probability > 50 ? '#10b981' : '#ef4444' }}>
              {result.profit_probability}%
            </span>
          </div>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{ width: `${result.profit_probability}%`, background: result.profit_probability > 50 ? '#10b981' : '#ef4444' }}
            />
          </div>
        </div>
      )}

      {/* Engine & Market Trend */}
      <div style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginBottom: 16,
        fontSize: '0.82rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>🧠 Engine</span>
          <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{result.model_used || 'AI Ensemble (RF + GB)'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>📡 Live Nifty 50 Trend</span>
          <span style={{ fontWeight: 700, color: result.market_trend_used >= 0 ? '#10b981' : '#ef4444' }}>
            {result.market_trend_used >= 0 ? '+' : ''}{(result.market_trend_used * 100)?.toFixed(3)}%
          </span>
        </div>
      </div>

      {/* NLP Sentiment Analysis */}
      {result.nlp_analysis && (
        <div style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          marginBottom: 16,
          fontSize: '0.82rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
              🤖 Live News NLP Sentiment
            </span>
            <span style={{ 
              fontWeight: 700, 
              color: result.nlp_analysis.sentiment === 'Bullish Hype' ? '#10b981' : 
                     result.nlp_analysis.sentiment === 'Negative Sentiment' ? '#ef4444' : '#f59e0b' 
            }}>
              {result.nlp_analysis.sentiment} ({result.nlp_analysis.score > 0 ? '+' : ''}{result.nlp_analysis.score})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {result.nlp_analysis.headlines.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem' }}>
                  {item.label === 'Bullish' ? '🟢' : item.label === 'Bearish' ? '🔴' : '🟡'}
                </span>
                <span style={{ color: 'var(--text-secondary)', lineHeight: 1.3, fontSize: '0.78rem' }}>
                  {item.headline}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginTop: 20
      }}>
        <a href="https://kite.zerodha.com/ipo" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', padding: '10px', background: '#387ed1', borderColor: '#387ed1' }}>
          Apply on Zerodha
        </a>
        <a href="https://groww.in/ipo" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', padding: '10px', background: '#00d09c', borderColor: '#00d09c', color: '#000', fontWeight: 600 }}>
          Apply on Groww
        </a>
      </div>
    </TiltCard>
  );
}
