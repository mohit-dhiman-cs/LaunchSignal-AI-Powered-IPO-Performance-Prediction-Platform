import { useState, useEffect } from 'react';
import axios from 'axios';
import TiltCard from './TiltCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function tileBackground(avgReturn) {
  if (avgReturn > 40)   return 'linear-gradient(135deg, rgba(16,100,60,0.55) 0%, rgba(24,185,129,0.25) 100%)';
  if (avgReturn > 20)   return 'linear-gradient(135deg, rgba(20,83,45,0.45) 0%, rgba(24,185,129,0.18) 100%)';
  if (avgReturn > 5)    return 'linear-gradient(135deg, rgba(20,83,45,0.25) 0%, rgba(24,185,129,0.10) 100%)';
  if (avgReturn < -10)  return 'linear-gradient(135deg, rgba(100,10,10,0.50) 0%, rgba(239,68,68,0.22) 100%)';
  if (avgReturn < 0)    return 'linear-gradient(135deg, rgba(80,15,15,0.35) 0%, rgba(239,68,68,0.14) 100%)';
  return 'linear-gradient(135deg, rgba(30,41,55,0.6) 0%, rgba(50,65,80,0.3) 100%)';
}

function tileBorder(avgReturn) {
  if (avgReturn > 10)  return 'rgba(24,185,129,0.3)';
  if (avgReturn < 0)   return 'rgba(239,68,68,0.25)';
  return 'rgba(255,255,255,0.07)';
}

function Skeleton() {
  return (
    <div>
      <div className="skeleton-box" style={{ height: 28, width: '45%', marginBottom: 8 }} />
      <div className="skeleton-box" style={{ height: 16, width: '60%', marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-box" style={{ height: 110, borderRadius: 14 }} />
        ))}
      </div>
    </div>
  );
}

export default function SectorHeatmap() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    axios.get(`${API}/sector-heatmap`)
      .then(res => {
        const d = res.data;
        setData(Array.isArray(d) ? d : (d?.sectors ?? []));
      })
      .catch(() => setError('Failed to load sector heatmap'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div style={{ marginTop: 40 }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          🏭 <span style={{ fontFamily: 'Space Grotesk, sans-serif' }}>IPO Sector Heatmap</span>
        </h2>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Based on LaunchSignal historical predictions
        </p>
      </div>

      {error && (
        <div style={{ textAlign: 'center', color: 'var(--crimson)', padding: '32px 0', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {!error && (!data || data.length === 0) && (
        <div style={{
          textAlign: 'center', color: 'var(--text-muted)',
          padding: '48px 24px', background: 'var(--bg-card)',
          borderRadius: 'var(--r-lg)', border: '1px solid var(--border)',
          fontSize: '0.88rem', lineHeight: 1.8,
        }}>
          📊 No sector data yet.<br />
          <span style={{ color: 'var(--royal-bright)' }}>Run predictions to populate the heatmap.</span>
        </div>
      )}

      {!error && data && data.length > 0 && (
        <>
          {/* Heatmap grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 14,
            marginBottom: 24,
          }}>
            {data.map((item) => {
              const avg = item.avg_return ?? 0;
              const isPos = avg >= 0;
              const returnColor = avg > 5 ? '#18B981' : avg < 0 ? '#EF4444' : 'var(--text-muted)';
              return (
                <TiltCard
                  key={item.sector}
                  intensity={5}
                  style={{
                    background: tileBackground(avg),
                    border: `1px solid ${tileBorder(avg)}`,
                    borderRadius: 14, padding: '16px 18px',
                    cursor: 'default', position: 'relative',
                    overflow: 'visible',
                  }}
                  className="heatmap-tile"
                  id={`sector-tile-${item.sector?.replace(/\s/g, '-').toLowerCase()}`}
                >
                  {/* Sector name */}
                  <div style={{
                    fontWeight: 700, fontSize: '0.88rem',
                    color: 'var(--text-primary)', marginBottom: 8,
                    fontFamily: 'Space Grotesk, sans-serif',
                  }}>{item.sector}</div>

                  {/* Avg return */}
                  <div style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '1.7rem', fontWeight: 800,
                    color: returnColor, lineHeight: 1,
                    marginBottom: 8,
                    textShadow: avg > 5
                      ? '0 0 20px rgba(24,185,129,0.5)'
                      : avg < 0
                      ? '0 0 20px rgba(239,68,68,0.4)'
                      : 'none',
                  }}>
                    {isPos ? '+' : ''}{avg.toFixed(1)}%
                  </div>

                  {/* Count badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20, padding: '2px 10px',
                    fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600,
                  }}>
                    📊 {item.count} IPO{item.count !== 1 ? 's' : ''}
                  </div>

                  {/* CSS Tooltip on hover */}
                  <style>{`
                    .heatmap-tile:hover .heatmap-tooltip { opacity: 1 !important; transform: translateY(0) !important; pointer-events: auto !important; }
                  `}</style>
                  <div className="heatmap-tooltip" style={{
                    opacity: 0, transform: 'translateY(6px)',
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                    pointerEvents: 'none',
                    position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                    transform: 'translateX(-50%) translateY(6px)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 10, padding: '10px 14px',
                    minWidth: 160, zIndex: 100,
                    boxShadow: 'var(--shadow-lg)',
                    fontSize: '0.78rem',
                    whiteSpace: 'nowrap',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 5 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Best</span>
                      <span style={{ color: '#18B981', fontWeight: 700 }}>+{(item.max_return ?? 0).toFixed(1)}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Worst</span>
                      <span style={{ color: '#EF4444', fontWeight: 700 }}>{(item.min_return ?? 0).toFixed(1)}%</span>
                    </div>
                    {/* Arrow */}
                    <div style={{
                      position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                      width: 0, height: 0,
                      borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                      borderTop: '6px solid var(--border)',
                    }} />
                  </div>
                </TiltCard>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loss</span>
            <div style={{
              height: 10, width: 200, borderRadius: 20,
              background: 'linear-gradient(90deg, #7f1d1d, #ef4444, #94a3b8, #16a34a, #064e3b)',
            }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>High Gain</span>
          </div>
        </>
      )}
    </div>
  );
}
