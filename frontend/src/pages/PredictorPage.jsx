import { useState } from 'react';
import IPOForm from '../components/IPOForm';
import ResultCard from '../components/ResultCard';
import Loader from '../components/Loader';
import ScoreCard from '../components/ScoreCard';
import FeatureImpactChart from '../components/FeatureImpactChart';
import WhatIfSimulator from '../components/WhatIfSimulator';
import AllotmentCalc from '../components/AllotmentCalc';
import NewsSentiment from '../components/NewsSentiment';
import ModelComparison from '../components/ModelComparison';
import { SubscriptionChart } from '../components/Charts';
import { useToast } from '../context/ToastContext';
import MarketWave from '../components/MarketWave';
import ParticleWave from '../components/ParticleWave';

export default function PredictorPage() {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('explain');
  const toast = useToast();

  const handleResult = (res) => {
    setResult(res);
    if (res?.error) {
      toast(res.error, 'error');
    } else if (res?.predicted_return !== undefined) {
      const ret = res.predicted_return;
      toast(
        `Prediction saved: ${ret >= 0 ? '+' : ''}${ret.toFixed(2)}% · ${res.risk} Risk`,
        ret >= 0 ? 'success' : 'warning'
      );
    }
  };

  const hasResult = result && !result.error;

  return (
    <div className="page">
      {loading && <Loader message="Running ML prediction..." />}
      <div className="container">

        {/* ── Hero ─────────────────────────────────── */}
        {!hasResult && (
          <div className="hero-section animate-fadeUp" style={{ display: 'flex', justifyContent: 'center', textAlign: 'center' }}>
            <ParticleWave />
            <div className="hero-content" style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
              <div className="hero-tag" style={{ justifyContent: 'center' }}>
                <span className="live-dot" />
                ML Model · R² = 93.7% · Live GMP + Real-Time Market Data
              </div>
              <h1 className="hero-title" style={{ fontSize: '3.2rem', lineHeight: 1.1 }}>
                <span>LaunchSignal</span><br />
                AI Powered IPO Performance Prediction
              </h1>
              <p className="hero-subtitle" style={{ maxWidth: '600px', margin: '0 auto' }}>
                Select a live IPO or enter details manually. Our AI explains <em>why</em> it
                made each prediction — not just a number, but the full story behind it.
              </p>
            </div>
          </div>
        )}

        {/* ── Form + Result ─────────────────────────── */}
        <div className="main-grid">
          {/* LEFT — Form & ScoreCard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card animate-fadeUp">
              <h3 style={{ marginBottom: 24 }}>🎯 IPO Details</h3>
              <IPOForm onResult={handleResult} onLoading={setLoading} />
            </div>
            {hasResult && (
              <div className="animate-fadeUp">
                <ScoreCard score={result.score} />
              </div>
            )}
          </div>

          {/* RIGHT — Result */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {hasResult ? (
              <ResultCard result={result} />
            ) : (
              <div className="card" style={{
                textAlign: 'center', padding: '60px 32px',
                border: '1px dashed var(--border-color)',
                background: 'transparent',
              }}>
                <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔮</div>
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Awaiting Input</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7 }}>
                  Fill in the IPO details on the left or select<br />
                  a live IPO to auto-fill from the grey market.
                </p>
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['🧠 AI Explainability (SHAP-style)', '🎛️ What-If Simulator', '💰 Allotment Calculator', '📰 News Sentiment'].map(f => (
                    <div key={f} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)', display: 'inline-block' }} />
                      {f} unlocks after prediction
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Post-prediction Dashboard (Tabs) ── */}
        {hasResult && (
          <div className="post-prediction-dashboard animate-fadeUp" style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 12, overflowX: 'auto' }}>
              <button onClick={() => setActiveTab('explain')} className={`tab-btn ${activeTab === 'explain' ? 'active' : ''}`}>🧠 AI Explainability</button>
              <button onClick={() => setActiveTab('simulator')} className={`tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}>🎛️ Simulator</button>
              {result.comparisons && (
                <button onClick={() => setActiveTab('models')} className={`tab-btn ${activeTab === 'models' ? 'active' : ''}`}>🤖 Model Comparison</button>
              )}
              <button onClick={() => setActiveTab('allotment')} className={`tab-btn ${activeTab === 'allotment' ? 'active' : ''}`}>💰 Allotment Calc</button>
            </div>

            <div className="tab-content">
              {activeTab === 'explain' && (
                <div className="grid-2">
                  <FeatureImpactChart data={result.feature_impact} />
                  <SubscriptionChart inputs={result.inputs} />
                </div>
              )}
              
              {activeTab === 'simulator' && (
                <WhatIfSimulator
                  baseInputs={result.inputs}
                  marketTrend={result.market_trend_used}
                />
              )}
              
              {activeTab === 'models' && result.comparisons && (
                <ModelComparison comparisons={result.comparisons} />
              )}
              
              {activeTab === 'allotment' && (
                <div className="grid-2">
                  <AllotmentCalc predictedReturn={result.predicted_return} />
                  {/* Note: News sentiment is already heavily integrated into ResultCard now */}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
