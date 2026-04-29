import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SLIDERS = [
  { key: 'gmp',        label: 'Grey Market Premium (₹)', min: -100, max: 500,  step: 5  },
  { key: 'retail_sub', label: 'Retail Subscription (x)',  min: 0,   max: 300,  step: 1  },
  { key: 'qib_sub',    label: 'QIB Subscription (x)',     min: 0,   max: 300,  step: 1  },
  { key: 'nii_sub',    label: 'NII Subscription (x)',     min: 0,   max: 300,  step: 1  },
];

const RISK_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function WhatIfSimulator({ baseInputs, marketTrend }) {
  const [sliders, setSliders] = useState({
    gmp:        parseFloat(baseInputs?.gmp)        || 0,
    retail_sub: parseFloat(baseInputs?.retail_sub) || 10,
    qib_sub:    parseFloat(baseInputs?.qib_sub)    || 20,
    nii_sub:    parseFloat(baseInputs?.nii_sub)    || 10,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Debounced API call
  const callApi = useCallback(
    debounce(async (vals) => {
      setLoading(true);
      try {
        const res = await axios.post(`${API}/whatif`, {
          ...baseInputs,
          ...vals,
          market_trend: marketTrend || 0,
        });
        setResult(res.data);
      } catch {
        // silent fail in what-if
      } finally {
        setLoading(false);
      }
    }, 450),
    [baseInputs, marketTrend]
  );

  useEffect(() => {
    callApi(sliders);
  }, [sliders]);

  const handleChange = (key, val) => {
    setSliders(prev => ({ ...prev, [key]: parseFloat(val) }));
  };

  const ret = result?.predicted_return;
  const risk = result?.risk;
  const score = result?.score;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid rgba(139,92,246,0.3)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
    }} id="whatif-simulator">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
          🎛️ What-If Simulator
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Drag sliders to explore how changing each factor affects the prediction in real-time
        </p>
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 24 }}>
        {SLIDERS.map(({ key, label, min, max, step }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {label}
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                {key === 'gmp' ? `₹${sliders[key]}` : `${sliders[key]}x`}
              </span>
            </div>
            <input
              type="range"
              min={min} max={max} step={step}
              value={sliders[key]}
              onChange={e => handleChange(key, e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
              id={`slider-${key}`}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{min}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{max}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Live Result */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        minHeight: 64,
      }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Calculating...</p>
        ) : ret !== undefined && ret !== null ? (
          <>
            <div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 4 }}>What-If Return</p>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem', fontWeight: 800,
                color: ret >= 0 ? '#10b981' : '#ef4444',
                lineHeight: 1,
              }}>
                {ret >= 0 ? '+' : ''}{ret?.toFixed(2)}%
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {risk && (
                <span style={{
                  background: `${RISK_COLORS[risk]}22`,
                  color: RISK_COLORS[risk],
                  border: `1px solid ${RISK_COLORS[risk]}55`,
                  borderRadius: 20, padding: '4px 12px',
                  fontSize: '0.78rem', fontWeight: 700,
                }}>
                  {risk} Risk
                </span>
              )}
              {score && (
                <span style={{
                  background: `${score.color}22`,
                  color: score.color,
                  border: `1px solid ${score.color}55`,
                  borderRadius: 20, padding: '4px 12px',
                  fontSize: '0.78rem', fontWeight: 700,
                }}>
                  Score: {score.total}/100
                </span>
              )}
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Move a slider to see the impact</p>
        )}
      </div>
    </div>
  );
}
