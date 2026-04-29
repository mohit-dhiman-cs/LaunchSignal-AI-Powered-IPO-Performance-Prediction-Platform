import { useState } from 'react';
import IPOForm from '../components/IPOForm';
import ResultCard from '../components/ResultCard';
import Loader from '../components/Loader';
import ScoreCard from '../components/ScoreCard';
import FeatureImpactChart from '../components/FeatureImpactChart';
import WhatIfSimulator from '../components/WhatIfSimulator';
import AllotmentCalc from '../components/AllotmentCalc';
import NewsSentiment from '../components/NewsSentiment';
import { SubscriptionChart } from '../components/Charts';
import { useToast } from '../context/ToastContext';

export default function PredictorPage() {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
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
        <div className="hero-section animate-fadeUp">
          <div className="hero-tag">
            <span className="live-dot" />
            ML Model · R² = 93.7% · Live GMP + Real-Time Market Data
          </div>
          <h1 className="hero-title">
            <span>LaunchSignal</span><br />
            AI Powered IPO Performance Prediction
          </h1>
          <p className="hero-subtitle">
            Select a live IPO or enter details manually. Our AI explains <em>why</em> it
            made each prediction — not just a number, but the full story behind it.
          </p>
        </div>

        {/* ── Form + Result ─────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: 28,
          alignItems: 'start',
          marginBottom: 28,
        }}>
          {/* LEFT — Form */}
          <div className="card animate-fadeUp">
            <h3 style={{ marginBottom: 24 }}>🎯 IPO Details</h3>
            <IPOForm onResult={handleResult} onLoading={setLoading} />
          </div>

          {/* RIGHT — Result */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {hasResult ? (
              <>
                <ResultCard result={result} />
                <ScoreCard score={result.score} />
              </>
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

        {/* ── Post-prediction panels (unlock after first prediction) ── */}
        {hasResult && (
          <>
            {/* Subscription Chart */}
            <div style={{ marginBottom: 28 }}>
              <SubscriptionChart inputs={result.inputs} />
            </div>

            {/* Feature Impact + What-If side by side */}
            <div className="grid-2" style={{ marginBottom: 28 }}>
              <FeatureImpactChart data={result.feature_impact} />
              <WhatIfSimulator
                baseInputs={result.inputs}
                marketTrend={result.market_trend_used}
              />
            </div>

            {/* Allotment Calc + News Sentiment */}
            <div className="grid-2" style={{ marginBottom: 28 }}>
              <AllotmentCalc predictedReturn={result.predicted_return} />
              <NewsSentiment company={result.company_name} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
