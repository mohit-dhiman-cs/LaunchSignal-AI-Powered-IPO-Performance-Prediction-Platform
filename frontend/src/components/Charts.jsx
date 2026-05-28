import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend
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
      <p className="chart-title">📊 Subscription Breakdown (3D)</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
          <Bar dataKey="value" name="Subscription (x)" shape={<Custom3DBar />}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Live Day-wise Subscription Chart ──────────────────────────────
export function LiveSubscriptionChart({ companyName }) {
  const [subData, setSubData] = useState([]);
  const [loading, setLoading] = useState(true);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!companyName) return;
    setLoading(true);
    axios.get(`${API}/ipo/subscription/${encodeURIComponent(companyName)}`)
      .then(res => {
        if (res.data && res.data.day_wise) {
          setSubData(res.data.day_wise);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [companyName]);

  if (loading) return <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading subscription trend...</div>;
  if (!subData || subData.length === 0) return null;

  return (
    <div className="chart-wrapper">
      <p className="chart-title">📡 Live Subscription Accumulation (Day-wise)</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={subData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="retailGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.retail} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={COLORS.retail} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="qibGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.qib} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={COLORS.qib} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="niiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.nii} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={COLORS.nii} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
          <Area type="monotone" dataKey="retail" name="Retail (x)" stroke={COLORS.retail} fill="url(#retailGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="qib" name="QIB (x)" stroke={COLORS.qib} fill="url(#qibGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="nii" name="NII (x)" stroke={COLORS.nii} fill="url(#niiGrad)" strokeWidth={2} />
        </AreaChart>
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

const Custom3DBar = (props) => {
  const { fill, x, y, width, height } = props;
  // Guard: skip rendering if any dimension is invalid
  if (!width || !height || isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) return null;
  // Skip very tiny bars to avoid SVG artifacts
  if (Math.abs(height) < 1) return <rect x={x} y={y} width={width} height={1} fill={fill} />;

  const depth = 6;
  const yTop    = y;
  const yBottom = y + height;

  return (
    <g>
      {/* Right Face */}
      <path
        d={`M${x+width},${yTop} L${x+width+depth},${yTop-depth} L${x+width+depth},${yBottom-depth} L${x+width},${yBottom} Z`}
        fill={fill} opacity={0.7}
      />
      {/* Top Face */}
      <path
        d={`M${x},${yTop} L${x+depth},${yTop-depth} L${x+width+depth},${yTop-depth} L${x+width},${yTop} Z`}
        fill={fill} opacity={1.2}
      />
      {/* Front Face */}
      <rect x={x} y={yTop} width={width} height={height} fill={fill} />
    </g>
  );
};

// ── History Return Bar Chart ─────────────────────────────────────
export function HistoryReturnChart({ data }) {
  // Guard: must be a non-empty array
  if (!Array.isArray(data) || data.length === 0) return null;

  const chartData = data
    .slice(0, 20)
    .reverse()
    .map(d => ({
      name: (d.company_name || 'IPO').slice(0, 12),
      return: isNaN(d.predicted_return) ? 0 : parseFloat((d.predicted_return).toFixed(1)),
    }))
    .filter(d => d.name); // remove blank entries

  if (!chartData.length) return null;

  return (
    <div className="chart-wrapper" id="history-chart">
      <p className="chart-title">📈 Recent Prediction Returns</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 36 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={false} tickLine={false}
            angle={-35} textAnchor="end"
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
          <Bar dataKey="return" name="Predicted Return" shape={<Custom3DBar />} radius={[3,3,0,0]}>
            {chartData.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.return >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
