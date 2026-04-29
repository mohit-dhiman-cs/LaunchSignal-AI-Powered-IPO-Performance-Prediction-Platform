import { useEffect, useState } from 'react';

function ScoreGauge({ score, color }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  // SVG semicircle gauge — radius 58, centre (75, 75)
  const r   = 58;
  const cx  = 75;
  const cy  = 75;
  const arc = Math.PI * r; // half-circle circumference ≈ 182.2

  // Arc path: from left (180°) → right (0°)
  const startX = cx - r;
  const endX   = cx + r;

  const dashFill   = (animated / 100) * arc;
  const dashOffset = arc - dashFill;

  return (
    <svg width="150" height="90" viewBox="0 0 150 90" style={{ overflow: 'visible' }}>
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="11"
        strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={`${arc}`}
        strokeDashoffset={`${dashOffset}`}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {/* Score */}
      <text
        x={cx} y={cy - 6}
        textAnchor="middle"
        fontSize="26"
        fontWeight="800"
        fontFamily="'Space Grotesk', sans-serif"
        fill={color}
      >
        {Math.round(animated)}
      </text>
      {/* /100 */}
      <text
        x={cx} y={cy + 12}
        textAnchor="middle"
        fontSize="10"
        fill="#64748b"
        fontFamily="'Inter', sans-serif"
      >
        / 100
      </text>
    </svg>
  );
}

export default function ScoreCard({ score }) {
  if (!score) return null;
  const { total, rating, color, breakdown } = score;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${color}33`,
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      backdropFilter: 'blur(10px)',
    }} id="score-card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
            IPO Score Card
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color }}>
            {rating}
          </p>
        </div>
        <ScoreGauge score={total} color={color} />
      </div>

      {/* Breakdown bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(breakdown).map(([label, { score: s, max }]) => {
          const pct = (s / max) * 100;
          const barColor = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
          return (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: barColor }}>{s}/{max}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, height: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: barColor,
                  borderRadius: 20,
                  transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 14, textAlign: 'center' }}>
        Proprietary scoring: GMP (30) + Subscriptions (40) + Market (20) + Size (10)
      </p>
    </div>
  );
}
