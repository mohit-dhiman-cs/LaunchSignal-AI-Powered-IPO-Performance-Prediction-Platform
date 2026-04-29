export default function HistoryTable({ records }) {
  if (!records?.length) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
        <p>No predictions yet. Run your first prediction!</p>
      </div>
    );
  }

  return (
    <div className="history-table-wrapper" id="history-table">
      <table className="history-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Company</th>
            <th>Sector</th>
            <th>GMP (₹)</th>
            <th>Retail x</th>
            <th>QIB x</th>
            <th>Predicted Return</th>
            <th>Risk</th>
            <th>Confidence</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => {
            const isPos = r.predicted_return >= 0;
            const riskClass = `risk-${r.risk?.toLowerCase()}`;
            const date = r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
            return (
              <tr key={r.id}>
                <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.company_name || '—'}</td>
                <td>{r.sector}</td>
                <td style={{ color: r.gmp >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {r.gmp >= 0 ? '+' : ''}₹{r.gmp}
                </td>
                <td>{r.retail_sub}x</td>
                <td>{r.qib_sub}x</td>
                <td className={isPos ? 'return-positive' : 'return-negative'}>
                  {isPos ? '+' : ''}{r.predicted_return?.toFixed(2)}%
                </td>
                <td><span className={`risk-badge ${riskClass}`}>{r.risk}</span></td>
                <td>{Math.round((r.confidence || 0) * 100)}%</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
