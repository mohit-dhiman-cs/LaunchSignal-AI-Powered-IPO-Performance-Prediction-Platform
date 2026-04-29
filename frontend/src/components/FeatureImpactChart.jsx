import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from 'recharts';

const LABEL_TRUNCATE = 22;

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: 'rgba(13,18,32,0.97)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem'
    }}>
      <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>{d?.label}</p>
      <p style={{ color: d?.contribution >= 0 ? '#10b981' : '#ef4444' }}>
        Impact: <strong>{d?.contribution >= 0 ? '+' : ''}{d?.contribution?.toFixed(2)}%</strong>
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 4 }}>
        {d?.contribution >= 0 ? 'Boosted' : 'Reduced'} the prediction
      </p>
    </div>
  );
}

export default function FeatureImpactChart({ data }) {
  if (!data?.length) return null;

  // Prepare: truncate label, sort by contribution value (not abs)
  const chartData = [...data]
    .sort((a, b) => b.contribution - a.contribution)
    .map(d => ({
      ...d,
      shortLabel: d.label.length > LABEL_TRUNCATE
        ? d.label.slice(0, LABEL_TRUNCATE) + '…'
        : d.label,
    }));

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
    }} id="feature-impact-chart">
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
          🧠 AI Explainability — Feature Impact
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          How much each factor <em>contributed</em> to the predicted return (perturbation analysis)
        </p>
      </div>

      <ResponsiveContainer width="100%" height={chartData.length * 42 + 20}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 50, left: 8, bottom: 4 }}
        >
          <XAxis
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`}
          />
          <YAxis
            type="category"
            dataKey="shortLabel"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={140}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
          <Bar dataKey="contribution" name="Impact (%)" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.feature}
                fill={entry.contribution >= 0 ? '#10b981' : '#ef4444'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 12 }}>
        {[
          { color: '#10b981', label: 'Boosted Return' },
          { color: '#ef4444', label: 'Reduced Return' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
