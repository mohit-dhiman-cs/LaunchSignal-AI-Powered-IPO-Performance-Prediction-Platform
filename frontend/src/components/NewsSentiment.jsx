import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LABEL_MAP = {
  'Positive 🟢': { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  'Neutral 🟡':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
  'Negative 🔴': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
};

export default function NewsSentiment({ company }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!company) return;
    setLoading(true);
    setError(null);
    setData(null);

    axios.get(`${API}/api/sentiment?company=${encodeURIComponent(company)}`)
      .then(r => setData(r.data))
      .catch(() => setError('Could not fetch news data.'))
      .finally(() => setLoading(false));
  }, [company]);

  if (!company) return null;

  const label = data?.overall_label || 'Neutral 🟡';
  const style = LABEL_MAP[label] || LABEL_MAP['Neutral 🟡'];

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
    }} id="news-sentiment">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
            📰 News Sentiment Analysis
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Google News · {company}
          </p>
        </div>
        {data && (
          <span style={{
            background: style.bg, color: style.color,
            border: `1px solid ${style.border}`,
            borderRadius: 20, padding: '5px 14px',
            fontSize: '0.8rem', fontWeight: 700,
          }}>
            {label}
          </span>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <div style={{ width: 16, height: 16, border: '2px solid var(--accent-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Fetching news...
        </div>
      )}

      {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem' }}>{error}</p>}

      {data?.articles?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.articles.slice(0, 4).map((art, i) => {
            const s = art.sentiment;
            const artColor = s > 0.1 ? '#10b981' : s < -0.1 ? '#ef4444' : '#f59e0b';
            return (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${artColor}`,
                borderRadius: 10,
                padding: '10px 14px',
              }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 4 }}>
                  {art.title}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{art.published?.slice(0, 16)}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: artColor }}>
                    {s > 0.1 ? '▲ Positive' : s < -0.1 ? '▼ Negative' : '→ Neutral'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data?.count === 0 && !loading && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '8px 0' }}>
          No recent news found for this IPO.
        </p>
      )}
    </div>
  );
}
