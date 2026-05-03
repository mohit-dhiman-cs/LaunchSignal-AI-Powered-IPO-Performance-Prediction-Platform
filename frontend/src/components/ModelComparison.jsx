import React from 'react';

export default function ModelComparison({ comparisons }) {
  if (!comparisons || comparisons.length === 0) return null;

  // Find the model with the highest R2
  const bestR2 = Math.max(...comparisons.map(c => c.r2));

  return (
    <div className="card animate-fadeUp">
      <h3 style={{ marginBottom: 16 }}>🧪 AI Model Comparison</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
        Why did we choose Gradient Boosting? Here is what other Machine Learning algorithms predicted for this exact IPO, compared with their historical accuracy (R² score).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {comparisons.map((comp, idx) => {
          const isBest = comp.r2 === bestR2;
          const isPositive = comp.prediction >= 0;
          return (
            <div 
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: isBest ? 'rgba(59,130,246,0.1)' : 'var(--bg-secondary)',
                border: isBest ? '1px solid var(--border-accent)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', color: isBest ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {comp.name} {isBest && '👑'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Historical Accuracy: {(comp.r2 * 100).toFixed(1)}%
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontSize: '1.1rem', 
                  fontWeight: 700,
                  color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)'
                }}>
                  {isPositive ? '+' : ''}{comp.prediction}%
                </p>
                {isBest && (
                  <p style={{ fontSize: '0.65rem', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Selected Model
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
