import { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from './Loader';
import TiltCard from './TiltCard';

export default function RHPSummaryCard({ companyName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!companyName) return;
    setLoading(true);
    axios.get(`${API}/rhp/${encodeURIComponent(companyName)}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [companyName]);

  if (loading) return <div style={{ padding: 20 }}><Loader message="Reading Red Herring Prospectus..." /></div>;
  if (!data) return <div style={{ color: '#64748b', padding: 20, textAlign: 'center' }}>No RHP details available.</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
      {/* Promoter & Key Metrics Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Promoter Stake Card */}
        <TiltCard intensity={4} style={{
          background: 'rgba(30,41,55,0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: 20,
          backdropFilter: 'blur(12px)'
        }}>
          <h4 style={{ margin: '0 0 16px', color: '#f1f5f9', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
            🤝 Promoter Shareholding
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
                <span>Pre-IPO Stake</span>
                <span style={{ fontWeight: 800, color: '#3b82f6' }}>{data.promoter_holding}%</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${data.promoter_holding}%`, height: '100%', background: '#3b82f6', borderRadius: 3 }} />
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
                <span>Post-IPO Stake (Est.)</span>
                <span style={{ fontWeight: 800, color: '#10b981' }}>{data.promoter_holding_post ?? 55.4}%</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${data.promoter_holding_post ?? 55.4}%`, height: '100%', background: '#10b981', borderRadius: 3 }} />
              </div>
            </div>
          </div>
        </TiltCard>

        {/* Financial Metrics Card */}
        <TiltCard intensity={4} style={{
          background: 'rgba(30,41,55,0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: 20,
          backdropFilter: 'blur(12px)'
        }}>
          <h4 style={{ margin: '0 0 16px', color: '#f1f5f9', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
            📊 Key Financial Ratios
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Revenue Growth</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981', fontFamily: 'Space Grotesk, sans-serif' }}>+{data.revenue_growth_pct ?? 18.5}%</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Debt-Equity Ratio</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'Space Grotesk, sans-serif' }}>{data.debt_equity_ratio ?? 0.45}</div>
            </div>
          </div>
        </TiltCard>
      </div>

      {/* Objects & Risks Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Objects of Issue */}
        <TiltCard intensity={3} style={{
          background: 'rgba(30,41,55,0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: 20,
          backdropFilter: 'blur(12px)'
        }}>
          <h4 style={{ margin: '0 0 12px', color: '#f1f5f9', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
            🎯 Objects of the Issue
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.objects_of_issue.split('\n').map((obj, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span>
                <span>{obj}</span>
              </div>
            ))}
          </div>
        </TiltCard>

        {/* Risk Factors */}
        <TiltCard intensity={3} style={{
          background: 'rgba(30,41,55,0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: 20,
          backdropFilter: 'blur(12px)'
        }}>
          <h4 style={{ margin: '0 0 12px', color: '#f1f5f9', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
            ⚠️ Key Risk Factors
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.risk_factors.split('\n').map((risk, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: '0.82rem', color: '#f87171', lineHeight: 1.5 }}>
                <span style={{ color: '#f87171', flexShrink: 0 }}>•</span>
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
