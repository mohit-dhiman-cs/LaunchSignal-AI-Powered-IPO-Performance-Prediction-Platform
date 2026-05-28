import { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from './Loader';
import TiltCard from './TiltCard';

export default function SocialBuzzPanel({ companyName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!companyName) return;
    setLoading(true);
    axios.get(`${API}/social-buzz/${encodeURIComponent(companyName)}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [companyName]);

  if (loading) return <div style={{ padding: 20 }}><Loader message="Analyzing Reddit & Twitter sentiment..." /></div>;
  if (!data) return <div style={{ color: '#64748b', padding: 20, textAlign: 'center' }}>No social buzz data available.</div>;

  const total = data.mention_count || 1;
  const posPct = Math.round((data.positive_mentions / total) * 100);
  const negPct = Math.round((data.negative_mentions / total) * 100);
  const neuPct = 100 - posPct - negPct;

  // Derive status style based on buzz_score
  const getBuzzState = (score) => {
    if (score >= 50) return { label: '🔥 Extreme Hype', color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
    if (score >= 25) return { label: '📈 High Buzz', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    return { label: '💬 Moderate Discussion', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
  };
  const buzzState = getBuzzState(data.buzz_score);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Metrics Card */}
      <TiltCard intensity={4} style={{
        background: 'rgba(30,41,55,0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: 24,
        backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column', gap: 20
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: '1rem' }}>
            📡 Retail Investor Sentiment
          </h4>
          <span style={{
            fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px',
            borderRadius: 8, color: buzzState.color, background: buzzState.bg,
            border: `1px solid ${buzzState.color}33`
          }}>{buzzState.label}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Weekly Mentions</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk, sans-serif' }}>
              {data.mention_count}
              <span className="live-dot" style={{ marginLeft: 8, display: 'inline-block', width: 6, height: 6, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981', animation: 'pulse 1.5s infinite' }} />
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Buzz Score</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'Space Grotesk, sans-serif' }}>{data.buzz_score}</div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 8 }}>
            <span>r/IndianStreetBets Buzz Mix</span>
            <span>{posPct}% Bullish</span>
          </div>
          {/* Multi-segment progress bar */}
          <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${posPct}%`, height: '100%', background: '#10b981' }} title="Positive" />
            <div style={{ width: `${neuPct}%`, height: '100%', background: 'rgba(255,255,255,0.25)' }} title="Neutral" />
            <div style={{ width: `${negPct}%`, height: '100%', background: '#ef4444' }} title="Negative" />
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: '0.68rem', color: '#64748b', marginTop: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> Bullish ({posPct}%)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} /> Neutral ({neuPct}%)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} /> Bearish ({negPct}%)</span>
          </div>
        </div>
      </TiltCard>

      {/* Community Channels Card */}
      <TiltCard intensity={3} style={{
        background: 'rgba(30,41,55,0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: 24,
        backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column', gap: 14
      }}>
        <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: '1rem' }}>
          👥 Tracked Communities
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { name: 'r/IndianStreetBets', desc: 'Active meme, trading and YOLO discussions.', icon: '📈' },
            { name: 'r/IndiaInvestments', desc: 'Long-term financial planning & analysis.', icon: '🏦' },
            { name: 'r/dalalstreet', desc: 'Stock market strategies and IPO debates.', icon: '🚀' }
          ].map(ch => (
            <div key={ch.name} style={{
              display: 'flex', gap: 12, alignItems: 'center',
              padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <span style={{ fontSize: '1.4rem' }}>{ch.icon}</span>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9' }}>{ch.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>{ch.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </TiltCard>
    </div>
  );
}
