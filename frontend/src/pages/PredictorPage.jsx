import { useState, useRef, useEffect } from 'react';
import IPOForm from '../components/IPOForm';
import ResultCard from '../components/ResultCard';
import Loader from '../components/Loader';
import ScoreCard from '../components/ScoreCard';
import FeatureImpactChart from '../components/FeatureImpactChart';
import WhatIfSimulator from '../components/WhatIfSimulator';
import AllotmentCalc from '../components/AllotmentCalc';
import ModelComparison from '../components/ModelComparison';
import { SubscriptionChart, LiveSubscriptionChart } from '../components/Charts';
import TiltCard from '../components/TiltCard';
import { useToast } from '../context/ToastContext';
import RiskAnalyzer from '../components/RiskAnalyzer';
import PeerComparison from '../components/PeerComparison';
import GMPTrendChart from '../components/GMPTrendChart';
import SectorHeatmap from '../components/SectorHeatmap';
import ValuationPanel from '../components/ValuationPanel';
import NewsSentimentPanel from '../components/NewsSentimentPanel';
import PDFExport from '../components/PDFExport';
import BrokerRecommendations from '../components/BrokerRecommendations';
import RHPSummaryCard from '../components/RHPSummaryCard';
import SocialBuzzPanel from '../components/SocialBuzzPanel';

/* ─────────────────────────────────────────────────────────────────
   3D Floating Orbs (pure CSS canvas-free blobs)
───────────────────────────────────────────────────────────────── */
function AmbientOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* Deep navy glow – top left */}
      <div style={{
        position: 'absolute', top: '-8%', left: '-6%',
        width: '55vw', height: '55vw', maxWidth: 680,
        background: 'radial-gradient(circle, rgba(30,73,175,0.18) 0%, transparent 65%)',
        borderRadius: '50%',
        animation: 'floatSlow 14s ease-in-out infinite',
      }} />
      {/* Emerald – bottom right */}
      <div style={{
        position: 'absolute', bottom: '-12%', right: '-8%',
        width: '50vw', height: '50vw', maxWidth: 600,
        background: 'radial-gradient(circle, rgba(24,185,129,0.12) 0%, transparent 65%)',
        borderRadius: '50%',
        animation: 'floatSlow 18s ease-in-out infinite reverse',
      }} />
      {/* Amber – center */}
      <div style={{
        position: 'absolute', top: '40%', left: '50%',
        width: '30vw', height: '30vw', maxWidth: 380,
        transform: 'translate(-50%,-50%)',
        background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)',
        borderRadius: '50%',
        animation: 'float 10s ease-in-out infinite',
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   3D Hero Graphic — Floating Isometric Finance Dashboard
───────────────────────────────────────────────────────────────── */
function HeroVisual() {
  return (
    <div style={{
      width: '100%', maxWidth: 460,
      perspective: '900px',
      perspectiveOrigin: '50% 45%',
      animation: 'float 7s ease-in-out infinite',
    }}>
      {/* Main floating card */}
      <div style={{
        transform: 'rotateX(8deg) rotateY(-12deg)',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.3s ease',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e2937 0%, #243447 100%)',
          border: '1px solid rgba(37,99,235,0.3)',
          borderRadius: 20,
          padding: 28,
          boxShadow: '-16px 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Specular shimmer */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 20,
            background: 'linear-gradient(120deg, rgba(255,255,255,0.06) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.9px', fontWeight: 700 }}>LaunchSignal AI</div>
              <div style={{ fontSize: '1rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#f1f5f9' }}>Zomato IPO</div>
            </div>
            <div style={{
              background: 'rgba(24,185,129,0.12)', border: '1px solid rgba(24,185,129,0.3)',
              borderRadius: 8, padding: '4px 10px',
              fontSize: '0.72rem', fontWeight: 700, color: '#18B981',
            }}>+65.4%</div>
          </div>

          {/* Mini bar chart */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60, marginBottom: 18 }}>
            {[40, 55, 35, 70, 60, 85, 95].map((h, i) => (
              <div key={i} style={{
                flex: 1, height: `${h}%`, borderRadius: '3px 3px 0 0',
                background: i === 6
                  ? 'linear-gradient(180deg, #18B981 0%, #059669 100%)'
                  : `rgba(37,99,235,${0.25 + i * 0.06})`,
                boxShadow: i === 6 ? '0 0 12px rgba(24,185,129,0.6)' : 'none',
                transition: 'height 0.5s ease',
              }} />
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'GMP', value: '₹120', color: '#18B981' },
              { label: 'QIB Sub', value: '71x', color: '#2563EB' },
              { label: 'Confidence', value: '91%', color: '#F59E0B' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '10px 8px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.58rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Shadow underneath (depth layer) */}
        <div style={{
          position: 'absolute', bottom: -14, left: 12, right: -12,
          height: '90%',
          background: 'rgba(10,31,61,0.5)',
          borderRadius: 20,
          filter: 'blur(18px)',
          zIndex: -1,
          transform: 'translateZ(-30px)',
        }} />
      </div>

      {/* Floating mini card — top right */}
      <div style={{
        position: 'absolute', top: -20, right: -10,
        background: 'linear-gradient(135deg, #243447, #1e2937)',
        border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: 14, padding: '12px 16px',
        transform: 'rotateX(4deg) rotateY(-8deg) translateZ(20px)',
        boxShadow: '-8px 12px 32px rgba(0,0,0,0.6)',
        minWidth: 130,
        animation: 'float 5s ease-in-out 1s infinite',
      }}>
        <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Model R²</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F59E0B', fontFamily: 'Space Grotesk, sans-serif' }}>93.7%</div>
      </div>

      {/* Floating mini card — bottom left */}
      <div style={{
        position: 'absolute', bottom: -10, left: -20,
        background: 'linear-gradient(135deg, #1e2937, #243447)',
        border: '1px solid rgba(24,185,129,0.25)',
        borderRadius: 14, padding: '12px 16px',
        transform: 'rotateX(-4deg) rotateY(8deg) translateZ(20px)',
        boxShadow: '8px 12px 32px rgba(0,0,0,0.6)',
        minWidth: 140,
        animation: 'float 6s ease-in-out 2s infinite',
      }}>
        <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Live Nifty</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#18B981', fontFamily: 'Space Grotesk, sans-serif' }}>+0.84%</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Stat Pill
───────────────────────────────────────────────────────────────── */
function StatPill({ icon, label, value, color = '#2563EB' }) {
  return (
    <TiltCard intensity={5} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(30,41,55,0.8)',
      border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: 12, padding: '10px 16px',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8,
        background: `${color}1a`,
        border: `1px solid ${color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: '0.92rem', color: '#f1f5f9', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>{value}</div>
      </div>
    </TiltCard>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Recent IPO card
───────────────────────────────────────────────────────────────── */
function RecentIPOCard({ name, sector, ret, date }) {
  const pos = ret >= 0;
  return (
    <TiltCard intensity={6} style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16, padding: '18px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      cursor: 'default',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 11,
          background: pos ? 'rgba(24,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${pos ? 'rgba(24,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
        }}>{pos ? '🚀' : '📉'}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif' }}>{name}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{sector} · {date}</div>
        </div>
      </div>
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '1.2rem', fontWeight: 800,
        color: pos ? '#18B981' : '#EF4444',
        textShadow: pos ? '0 0 20px rgba(24,185,129,0.5)' : '0 0 20px rgba(239,68,68,0.5)',
      }}>
        {pos ? '+' : ''}{ret}%
      </div>
    </TiltCard>
  );
}

const RECENT = [
  { name: 'Zomato',         sector: 'Consumer Tech', ret: 65,  date: 'Jul 2021' },
  { name: 'Nykaa',          sector: 'E-Commerce',    ret: 96,  date: 'Nov 2021' },
  { name: 'Delhivery',      sector: 'Logistics',     ret: -11, date: 'May 2022' },
  { name: 'Paytm',          sector: 'Fintech',       ret: -27, date: 'Nov 2021' },
  { name: 'LIC',            sector: 'Insurance',     ret: -8,  date: 'May 2022' },
  { name: 'Mankind Pharma', sector: 'Pharma',        ret: 20,  date: 'May 2023' },
];

/* ─────────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────────── */
export default function PredictorPage() {
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState('explain');
  const toast = useToast();

  const handleResult = (res) => {
    setResult(res);
    if (res?.error) {
      toast(res.error, 'error');
    } else if (res?.predicted_return !== undefined) {
      const r = res.predicted_return;
      toast(`Prediction: ${r >= 0 ? '+' : ''}${r.toFixed(2)}% · ${res.risk} Risk`, r >= 0 ? 'success' : 'warning');
    }
  };

  const hasResult = result && !result.error;

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64, position: 'relative' }}>
      <AmbientOrbs />
      {loading && <Loader message="Running ML prediction..." />}

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ══════════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════════ */}
        {!hasResult && (
          <section style={{
            maxWidth: 1240, margin: '0 auto',
            padding: '64px 28px 56px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 60, alignItems: 'center',
          }} className="hero-grid">

            {/* LEFT */}
            <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div className="badge-live" style={{ alignSelf: 'flex-start' }}>
                <span className="live-dot" />
                Live GMP · AI Ensemble · R² = 93.7%
              </div>

              <h1 style={{ margin: 0 }}>
                Predict{' '}
                <span className="gradient-text">IPO Returns</span>
                <br />Before They List
              </h1>

              <p style={{
                fontSize: '1.05rem', color: '#94a3b8',
                maxWidth: 460, lineHeight: 1.75, margin: 0,
              }}>
                Our AI analyses GMP, subscription ratios, sector trends and live Nifty data to give you a precise listing-day prediction — with full explainability.
              </p>

              {/* Stat pills */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <StatPill icon="🧠" label="Model Accuracy" value="93.7% R²"   color="#2563EB" />
                <StatPill icon="📡" label="Market Feed"    value="Real-time"   color="#18B981" />
                <StatPill icon="📊" label="IPOs Trained"   value="400+"        color="#F59E0B" />
              </div>

              {/* CTA scroll hint */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div style={{ fontSize: '0.78rem', color: '#475569' }}>Scroll down to run a prediction</div>
                <div style={{ animation: 'float 2s ease-in-out infinite', fontSize: '1rem' }}>↓</div>
              </div>
            </div>

            {/* RIGHT — 3D Visual */}
            <div className="animate-scale-in" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <HeroVisual />
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            MAIN DASHBOARD
        ══════════════════════════════════════════════════════════ */}
        <section style={{ maxWidth: 1240, margin: '0 auto', padding: hasResult ? '32px 28px' : '0 28px 56px' }}>
          <TiltCard intensity={3} style={{
            background: 'linear-gradient(145deg, #1E2937 0%, #1a2540 100%)',
            border: '1px solid rgba(37,99,235,0.15)',
            borderRadius: 26,
            padding: 32,
            boxShadow: '-8px 16px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 0,
          }} className="dashboard-grid">

            {/* TOP glow line */}
            <div style={{
              position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.5), rgba(24,185,129,0.3), transparent)',
              borderRadius: 1,
            }} />

            {/* LEFT — Form */}
            <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: 28 }} className="form-col">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'linear-gradient(135deg, rgba(30,73,175,0.4), rgba(37,99,235,0.4))',
                  border: '1px solid rgba(37,99,235,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                }}>🎯</div>
                <h3 style={{ margin: 0, color: '#f1f5f9' }}>IPO Details</h3>
              </div>

              <IPOForm onResult={handleResult} onLoading={setLoading} />

              {hasResult && <div style={{ marginTop: 16 }}><ScoreCard score={result.score} /></div>}
            </div>

            {/* RIGHT — Result / empty */}
            <div style={{ paddingLeft: 28 }} className="result-col">
              {hasResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Circular gauge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.9px', fontWeight: 700 }}>
                      Predicted Listing Return
                    </div>
                    <div style={{ position: 'relative', width: 168, height: 168 }}>
                      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
                        <circle
                          cx="50" cy="50" r="42" fill="none"
                          stroke={result.predicted_return >= 0 ? '#18B981' : '#EF4444'}
                          strokeWidth="9" strokeLinecap="round"
                          strokeDasharray="264"
                          strokeDashoffset={264 - (264 * Math.min(Math.abs(result.predicted_return), 100) / 100)}
                          className="score-ring"
                          style={{ filter: result.predicted_return >= 0 ? 'drop-shadow(0 0 10px #18B981)' : 'drop-shadow(0 0 10px #EF4444)' }}
                        />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                          fontFamily: 'Space Grotesk, sans-serif',
                          fontSize: '2.1rem', fontWeight: 900, lineHeight: 1,
                          color: result.predicted_return >= 0 ? '#18B981' : '#EF4444',
                          textShadow: result.predicted_return >= 0 ? '0 0 20px rgba(24,185,129,0.6)' : '0 0 20px rgba(239,68,68,0.6)',
                        }}>
                          {result.predicted_return >= 0 ? '+' : ''}{result.predicted_return.toFixed(1)}<span style={{ fontSize: '1rem' }}>%</span>
                        </div>
                        <div style={{
                          fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
                          letterSpacing: '0.9px', marginTop: 4,
                          color: result.predicted_return >= 0 ? '#18B981' : '#EF4444', opacity: 0.8,
                        }}>{result.risk} Risk</div>
                      </div>
                    </div>
                  </div>
                  <ResultCard result={result} />
                  {/* PDF Export button */}
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <PDFExport result={result} />
                  </div>
                </div>
              ) : (
                /* ── Empty state ── */
                <div style={{
                  height: '100%', minHeight: 340,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', gap: 22, padding: '24px 16px',
                }}>
                  {/* 3D icon */}
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(30,73,175,0.2) 0%, rgba(24,185,129,0.1) 100%)',
                    border: '1px solid rgba(37,99,235,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem',
                    boxShadow: '0 0 40px rgba(37,99,235,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
                    animation: 'glow-pulse 3s ease-in-out infinite',
                  }}>🔮</div>

                  <div>
                    <h3 style={{ margin: '0 0 8px', color: '#f1f5f9' }}>Awaiting Input</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: 260, lineHeight: 1.65, margin: 0 }}>
                      Fill the form to run the AI prediction engine and get a listing return forecast with full explainability.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9, width: '100%', maxWidth: 280 }}>
                    {[
                      { icon: '🧠', label: 'AI Feature Explainability', color: '#2563EB' },
                      { icon: '🎛️', label: 'What-If Simulator',         color: '#18B981' },
                      { icon: '💰', label: 'Allotment Calculator',       color: '#F59E0B' },
                      { icon: '🤖', label: 'Model Comparison',           color: '#8B5CF6' },
                    ].map(f => (
                      <div key={f.label} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 9, padding: '9px 14px',
                        fontSize: '0.82rem', color: '#94a3b8',
                        transition: 'all 0.2s',
                      }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: 7,
                          background: `${f.color}1a`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.9rem', flexShrink: 0,
                        }}>{f.icon}</span>
                        {f.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TiltCard>
        </section>

        {/* ══════════════════════════════════════════════════════════
            POST-PREDICTION TABS
        ══════════════════════════════════════════════════════════ */}
        {hasResult && (
          <section style={{ maxWidth: 1240, margin: '0 auto', padding: '0 28px 60px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16, overflowX: 'auto' }}>
              {[
                { id: 'explain',   label: '🧠 AI Explainability' },
                { id: 'simulator', label: '🎛️ Simulator' },
                ...(result.comparisons ? [{ id: 'models', label: '🤖 Models' }] : []),
                { id: 'allotment', label: '💰 Allotment Calc' },
                { id: 'risk',      label: '⚠️ Risk Analysis' },
                { id: 'peers',     label: '👥 Peer Comparison' },
                { id: 'valuation', label: '📐 Valuation' },
                ...(result.company_name ? [{ id: 'rhp', label: '📑 RHP Details' }] : []),
                { id: 'news',      label: '📰 News' },
                ...(result.company_name ? [{ id: 'social', label: '💬 Social Buzz' }] : []),
                { id: 'brokers',   label: '🏦 Brokers' },
                ...(result.company_name ? [{ id: 'gmp', label: '📈 GMP Trend' }] : []),
              ].map(t => (
                <button key={t.id} className={`tab-btn${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === 'explain' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="tab-grid">
                <TiltCard intensity={4} className="card"><FeatureImpactChart data={result.feature_impact} /></TiltCard>
                <TiltCard intensity={4} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <SubscriptionChart inputs={result.inputs} />
                  {result.company_name && <LiveSubscriptionChart companyName={result.company_name} />}
                </TiltCard>
              </div>
            )}
            {activeTab === 'simulator' && (
              <TiltCard intensity={2} className="card"><WhatIfSimulator baseInputs={result.inputs} marketTrend={result.market_trend_used} /></TiltCard>
            )}
            {activeTab === 'models' && result.comparisons && (
              <TiltCard intensity={2} className="card"><ModelComparison comparisons={result.comparisons} /></TiltCard>
            )}
            {activeTab === 'allotment' && (
              <div style={{ maxWidth: 520 }}>
                <TiltCard intensity={4} className="card"><AllotmentCalc predictedReturn={result.predicted_return} /></TiltCard>
              </div>
            )}
            {activeTab === 'risk' && (
              <RiskAnalyzer riskData={result.risk_analysis} />
            )}
            {activeTab === 'peers' && (
              <PeerComparison
                sector={result.inputs?.sector}
                companyName={result.company_name}
                predictedReturn={result.predicted_return}
              />
            )}
            {activeTab === 'valuation' && (
              <ValuationPanel
                sector={result.inputs?.sector}
                peRatio={result.inputs?.pe_ratio}
                revenueGrowth={result.inputs?.revenue_growth}
                profitMargin={result.inputs?.profit_margin}
                issuePrice={result.inputs?.issue_price}
              />
            )}
            {activeTab === 'rhp' && result.company_name && (
              <RHPSummaryCard companyName={result.company_name} />
            )}
            {activeTab === 'news' && (
              <NewsSentimentPanel companyName={result.company_name} />
            )}
            {activeTab === 'social' && result.company_name && (
              <SocialBuzzPanel companyName={result.company_name} />
            )}
            {activeTab === 'brokers' && (
              <BrokerRecommendations
                sector={result.inputs?.sector}
                predictedReturn={result.predicted_return}
                risk={result.risk}
              />
            )}
            {activeTab === 'gmp' && result.company_name && (
              <GMPTrendChart
                companyName={result.company_name}
                gmpNow={result.gmp}
                issuePrice={result.issue_price}
              />
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            RECENT IPOs
        ══════════════════════════════════════════════════════════ */}
        {!hasResult && (
          <section style={{ maxWidth: 1240, margin: '0 auto', padding: '0 28px 80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
                Recent <span className="gradient-text-gold">IPO Performance</span>
              </h2>
              <div className="badge-live"><span className="live-dot" />Historical</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="recent-grid">
              {RECENT.map(ipo => <RecentIPOCard key={ipo.name} {...ipo} />)}
            </div>

            {/* Sector Heatmap below Recent IPOs */}
            <div style={{ marginTop: 8 }}>
              <SectorHeatmap />
            </div>
          </section>
        )}

      </div>

      {/* Responsive overrides */}
      <style>{`
        @keyframes floatSlow { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-22px) rotate(3deg)} }
        @keyframes float     { 0%,100%{transform:translateY(0)}               50%{transform:translateY(-14px)} }
        @keyframes glow-pulse{ 0%,100%{opacity:.7;transform:scale(1)}         50%{opacity:1;transform:scale(1.06)} }
        @media(max-width:900px){
          .hero-grid      { grid-template-columns:1fr !important; }
          .dashboard-grid { grid-template-columns:1fr !important; }
          .form-col       { border-right:none !important; padding-right:0 !important; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:24px; }
          .result-col     { padding-left:0 !important; }
          .tab-grid       { grid-template-columns:1fr !important; }
          .recent-grid    { grid-template-columns:1fr !important; }
        }
        @media(max-width:540px){ .recent-grid { grid-template-columns:1fr !important; } }
      `}</style>
    </div>
  );
}
