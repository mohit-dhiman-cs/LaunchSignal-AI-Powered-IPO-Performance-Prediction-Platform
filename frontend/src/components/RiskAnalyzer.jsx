import { useState } from 'react';
import TiltCard from './TiltCard';

/* ── helpers ── */
function severityColor(severity) {
  if (!severity) return 'var(--text-muted)';
  const s = severity.toUpperCase();
  if (s.includes('LOW'))    return 'var(--emerald)';
  if (s.includes('HIGH'))   return 'var(--crimson)';
  return 'var(--amber)';
}

function flagIcon(level) {
  if (level === 'green')  return '🟢';
  if (level === 'amber')  return '🟡';
  return '🔴';
}

function flagBg(level) {
  if (level === 'green')  return 'rgba(24,185,129,0.08)';
  if (level === 'amber')  return 'rgba(245,158,11,0.08)';
  return 'rgba(239,68,68,0.08)';
}

function flagBorder(level) {
  if (level === 'green')  return 'rgba(24,185,129,0.25)';
  if (level === 'amber')  return 'rgba(245,158,11,0.25)';
  return 'rgba(239,68,68,0.25)';
}

/* ── Circular Score Meter ── */
function ScoreMeter({ score = 0 }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(Math.max(score, 0), 100) / 100;
  const dash = circ * pct;

  const col = score < 33
    ? 'var(--emerald)'
    : score < 66
    ? 'var(--amber)'
    : 'var(--crimson)';

  return (
    <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={col} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 8px ${col})` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '1.6rem', fontWeight: 800, color: col, lineHeight: 1,
        }}>{score}</span>
        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Risk</span>
      </div>
    </div>
  );
}

/* ── Skeleton ── */
function Skeleton() {
  return (
    <TiltCard intensity={4} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: 24,
    }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
        <div className="skeleton-box" style={{ width: 100, height: 100, borderRadius: '50%' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="skeleton-box" style={{ height: 22, width: '60%' }} />
          <div className="skeleton-box" style={{ height: 16, width: '40%' }} />
        </div>
      </div>
      <div className="skeleton-box" style={{ height: 40, borderRadius: 10 }} />
    </TiltCard>
  );
}

export default function RiskAnalyzer({ riskData }) {
  const [open, setOpen] = useState(false);

  if (!riskData) return <Skeleton />;

  const { overall_score = 0, overall_severity = 'MEDIUM', flags = [], red_count = 0, amber_count = 0, green_count = 0 } = riskData;
  const sColor = severityColor(overall_severity);

  return (
    <TiltCard intensity={4} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: 24,
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 16 }}>
        <ScoreMeter score={overall_score} />

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, marginBottom: 8 }}>
            Risk Analysis
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${sColor}18`, border: `1px solid ${sColor}40`,
            borderRadius: 20, padding: '5px 14px',
            fontSize: '0.82rem', fontWeight: 700, color: sColor,
            letterSpacing: '0.4px',
          }}>
            {overall_severity.toUpperCase().includes('LOW') ? '🛡️' :
             overall_severity.toUpperCase().includes('HIGH') ? '⚠️' : '📊'}{' '}
            {overall_severity.toUpperCase()} RISK
          </div>

          {/* Counter row */}
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            {[
              { emoji: '🟢', count: green_count, label: 'Green' },
              { emoji: '🟡', count: amber_count, label: 'Amber' },
              { emoji: '🔴', count: red_count,   label: 'Red' },
            ].map(({ emoji, count, label }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600,
              }}>
                <span>{emoji}</span>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>{count}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Toggle Button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        id="risk-breakdown-toggle"
        style={{
          width: '100%',
          background: open ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${open ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 10, padding: '9px 16px',
          color: open ? 'var(--royal-bright)' : 'var(--text-secondary)',
          fontSize: '0.82rem', fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', display: 'inline-block' }}>▼</span>
        {open ? 'Hide Risk Breakdown' : 'View Risk Breakdown'}
        {flags.length > 0 && (
          <span style={{
            background: 'var(--royal-bright)', color: '#fff',
            borderRadius: 20, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700,
          }}>{flags.length}</span>
        )}
      </button>

      {/* ── Collapsible Flag List ── */}
      <div style={{
        maxHeight: open ? `${flags.length * 90 + 20}px` : '0px',
        overflow: 'hidden',
        transition: 'max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          {flags.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', padding: '16px 0' }}>
              🎉 No risk flags detected
            </div>
          ) : (
            flags.map((flag, i) => {
              const level = flag.level || 'amber';
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  background: flagBg(level), border: `1px solid ${flagBorder(level)}`,
                  borderRadius: 10, padding: '10px 14px',
                  transition: 'transform 0.2s ease',
                }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 1 }}>{flagIcon(level)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {flag.name || flag.flag || 'Risk Factor'}
                      </span>
                      {flag.metric !== undefined && (
                        <span style={{
                          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 6, padding: '2px 8px',
                          fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)',
                          flexShrink: 0,
                        }}>
                          {flag.metric}
                        </span>
                      )}
                    </div>
                    {flag.detail && (
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {flag.detail}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </TiltCard>
  );
}
