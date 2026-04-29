import { useState, useEffect } from 'react';
import axios from 'axios';
import HistoryTable from '../components/HistoryTable';
import { HistoryReturnChart } from '../components/Charts';
import Loader from '../components/Loader';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/history`);
      setRecords(res.data || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const totalPredictions = records.length;
  const avgReturn = records.length
    ? (records.reduce((s, r) => s + r.predicted_return, 0) / records.length).toFixed(2)
    : '—';
  const lowRiskCount  = records.filter(r => r.risk === 'Low').length;
  const highRiskCount = records.filter(r => r.risk === 'High').length;

  return (
    <div className="page">
      {loading && <Loader message="Loading prediction history..." />}
      <div className="container">

        <div className="page-header animate-fadeUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>🕒 Prediction History</h2>
            <p>All past IPO predictions logged in real-time</p>
          </div>
          <button className="btn btn-ghost" onClick={fetchHistory} id="refresh-history-btn">🔄 Refresh</button>
        </div>

        {/* Stats Row */}
        <div className="grid-4 animate-fadeUp" style={{ marginBottom: 28 }}>
          {[
            { label: 'Total Predictions', value: totalPredictions, color: 'var(--accent-blue)' },
            { label: 'Avg Predicted Return', value: `${avgReturn}%`, color: 'var(--accent-green)' },
            { label: 'Low Risk IPOs', value: lowRiskCount, color: 'var(--accent-green)' },
            { label: 'High Risk IPOs', value: highRiskCount, color: 'var(--accent-red)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        {records.length > 0 && (
          <div className="animate-fadeUp" style={{ marginBottom: 28 }}>
            <HistoryReturnChart data={records} />
          </div>
        )}

        {/* Table */}
        <div className="card animate-fadeUp" style={{ padding: 0, overflow: 'hidden' }}>
          <HistoryTable records={records} />
        </div>
      </div>
    </div>
  );
}
