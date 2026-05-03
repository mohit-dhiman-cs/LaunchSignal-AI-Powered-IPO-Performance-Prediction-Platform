import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

const COLORS = {
  retail: '#3b82f6',
  qib:    '#8b5cf6',
  nii:    '#06b6d4',
  nifty:  '#3b82f6',
  sensex: '#8b5cf6',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      borderRadius: 8, padding: '10px 16px',
      fontSize: '0.82rem', color: '#64748b'
    }}>
      <p style={{ marginBottom: 6, color: '#0f172a', fontWeight: 600 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color || p.fill || '#334155' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Subscription Breakdown Bar Chart ────────────────────────────
export function SubscriptionChart({ inputs }) {
  if (!inputs) return null;

  const data = [
    { name: 'Retail', value: parseFloat(inputs.retail_sub) || 0, color: COLORS.retail },
    { name: 'QIB',    value: parseFloat(inputs.qib_sub)    || 0, color: COLORS.qib },
    { name: 'NII',    value: parseFloat(inputs.nii_sub)    || 0, color: COLORS.nii },
  ];

  return (
    <div className="chart-wrapper" id="subscription-chart">
      <p className="chart-title">📊 Subscription Breakdown (x)</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
          <Bar dataKey="value" name="Subscription (x)" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Market Index Area Chart ──────────────────────────────────────
export function MarketIndexChart({ data, indexName = 'Index', color = COLORS.nifty }) {
  if (!data?.length) return null;
  const sliced = data.slice(-60); // last 60 data points

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={sliced} margin={{ top: 8, right: 16, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={d => d?.slice(5)}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={['auto', 'auto']}
          tickFormatter={v => v.toLocaleString('en-IN')}
          width={72}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="close"
          name={indexName}
          stroke={color}
          strokeWidth={2.5}
          fillOpacity={1}
          fill="url(#colorValue)"
          activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Sector Performance Horizontal Bar Chart ──────────────────────
export function SectorBarChart({ data }) {
  if (!data?.length) return null;

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 24, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="sector"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
        <ReferenceLine x={0} stroke="#cbd5e1" />
        <Bar dataKey="return_pct" name="Return %" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.sector}
              fill={entry.return_pct >= 0 ? '#10b981' : '#ef4444'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── History Return Bar Chart ─────────────────────────────────────
export function HistoryReturnChart({ data }) {
  if (!data?.length) return null;

  const chartData = data
    .slice(0, 20)
    .reverse()
    .map(d => ({
      name: d.company_name?.slice(0, 12) || 'IPO',
      return: parseFloat(d.predicted_return?.toFixed(1)),
    }));

  return (
    <div className="chart-wrapper" id="history-chart">
      <p className="chart-title">📈 Recent Prediction Returns</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 36 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            angle={-35}
            textAnchor="end"
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
          <ReferenceLine y={0} stroke="#cbd5e1" />
          <Bar dataKey="return" name="Predicted Return" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.return >= 0 ? '#10b981' : '#ef4444'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
