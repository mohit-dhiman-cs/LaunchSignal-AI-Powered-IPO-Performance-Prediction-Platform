import { useState } from 'react';

export default function AllotmentCalc({ predictedReturn }) {
  const [form, setForm] = useState({
    investment: 15000,
    lot_size:   300,
    issue_price: 100,
  });
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: parseFloat(e.target.value) || 0 }));
  };

  const calculate = () => {
    const { investment, lot_size, issue_price } = form;
    if (!lot_size || !issue_price) return;

    const lot_value   = lot_size * issue_price;
    const lots_applied = Math.floor(investment / lot_value);

    // Allotment probability model — empirically derived
    // Oversubscription context not available, so use a generalized estimate
    const allot_prob = lots_applied > 0 ? Math.min(0.85, 0.35 + lots_applied * 0.05) : 0;

    const listing_price  = issue_price * (1 + (predictedReturn || 0) / 100);
    const gain_per_lot   = (listing_price - issue_price) * lot_size;
    const expected_gain  = allot_prob * gain_per_lot;
    const invested       = lot_value; // assuming 1 lot gets allotted

    setResult({
      lot_value:     Math.round(lot_value),
      lots_applied,
      allot_prob:    Math.round(allot_prob * 100),
      listing_price: listing_price.toFixed(2),
      gain_per_lot:  Math.round(gain_per_lot),
      expected_gain: Math.round(expected_gain),
      roi:           invested > 0 ? ((gain_per_lot / invested) * 100).toFixed(1) : '—',
    });
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid rgba(6,182,212,0.25)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
    }} id="allotment-calc">
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
        💰 Allotment Profit Calculator
      </p>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>
        Estimate your expected profit based on investment and lot size
      </p>

      <div className="grid-3" style={{ marginBottom: 16 }}>
        {[
          { name: 'investment',  label: 'Investment (₹)', placeholder: '15000' },
          { name: 'lot_size',    label: 'Lot Size (shares)', placeholder: '300' },
          { name: 'issue_price', label: 'Issue Price (₹)', placeholder: '100' },
        ].map(f => (
          <div className="form-group" key={f.name}>
            <label className="form-label">{f.label}</label>
            <input
              id={`allot-${f.name}`}
              name={f.name}
              className="form-input"
              type="number"
              placeholder={f.placeholder}
              value={form[f.name]}
              onChange={handleChange}
            />
          </div>
        ))}
      </div>

      <button
        className="btn btn-ghost"
        onClick={calculate}
        style={{ width: '100%', borderColor: 'rgba(6,182,212,0.4)', color: '#06b6d4' }}
        id="calc-allotment-btn"
      >
        🧮 Calculate
      </button>

      {result && (
        <div style={{
          marginTop: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
        }}>
          {[
            { label: 'Lot Value',      value: `₹${result.lot_value.toLocaleString('en-IN')}`,   color: 'var(--text-primary)' },
            { label: 'Lots Applied',   value: result.lots_applied,                               color: '#06b6d4' },
            { label: 'Allot. Chance',  value: `~${result.allot_prob}%`,                         color: '#f59e0b' },
            { label: 'Listing Price',  value: `₹${result.listing_price}`,                       color: 'var(--text-primary)' },
            { label: 'Gain / Lot',     value: `₹${result.gain_per_lot.toLocaleString('en-IN')}`,color: result.gain_per_lot >= 0 ? '#10b981' : '#ef4444' },
            { label: 'Expected ROI',   value: `${result.roi}%`,                                  color: result.roi >= 0 ? '#10b981' : '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: 10, padding: '10px 14px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 14, textAlign: 'center' }}>
        * Allotment probability is estimated. Actual allotment depends on total subscription.
      </p>
    </div>
  );
}
