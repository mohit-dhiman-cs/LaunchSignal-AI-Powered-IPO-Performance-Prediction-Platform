import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AutocompleteInput from './AutocompleteInput';
import { KNOWN_IPOS } from '../data/ipoCompanies';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SECTORS = [
  'Fintech', 'Food Tech', 'E-commerce', 'Auto Tech', 'Food', 'Pharma',
  'Manufacturing', 'Chemicals', 'Infrastructure', 'IT', 'Finance',
  'Healthcare', 'Banking', 'Defence', 'Gaming', 'Agri', 'Metals',
  'Consumer', 'Consumer Durables', 'FMCG', 'Energy', 'Logistics',
  'Telecom', 'Insurance', 'Real Estate', 'REIT', 'Retail',
  'Travel Tech', 'Analytics', 'Building Materials', 'Staffing',
  'Internet', 'Gas', 'Media', 'Electricals', 'IT Security', 'Cement', 'Paper'
];

const DEFAULT_FORM = {
  company_name: '', gmp: '', retail_sub: '', qib_sub: '',
  nii_sub: '', issue_size: '', sector: 'IT', model_type: 'AI Ensemble (RF + GB)',
  // Advanced optional
  pe_ratio: '', debt_equity: '', profit_margin: '', revenue_growth: '', issue_price: '',
};

export default function IPOForm({ onResult, onLoading }) {
  const [form, setForm]               = useState(DEFAULT_FORM);
  const [liveIpos, setLiveIpos]       = useState([]);
  const [loadingIpos, setLoadingIpos] = useState(true);
  const [ipoSource, setIpoSource]     = useState('');
  const [advOpen, setAdvOpen]         = useState(false);

  // Merge curated list + live scraped company names (deduplicated)
  const allCompanyNames = useMemo(() => {
    const liveNames = liveIpos.map(i => i.company);
    return Array.from(new Set([...liveNames, ...KNOWN_IPOS])).sort();
  }, [liveIpos]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/api/live-ipos`);
        setLiveIpos(res.data.ipos || []);
        if (res.data.ipos?.length > 0) {
          setIpoSource(res.data.ipos[0].source || 'live');
        }
      } catch {
        setLiveIpos([]);
      } finally {
        setLoadingIpos(false);
      }
    })();
  }, []);

  // When a company name is selected from autocomplete,
  // also auto-fill from live IPO data if available
  const handleCompanySelect = (name) => {
    setForm(prev => ({ ...prev, company_name: name }));

    // Auto-fill from live IPO data if this company is currently live
    const liveMatch = liveIpos.find(
      i => i.company.toLowerCase() === name.toLowerCase()
    );
    if (liveMatch) {
      setForm(prev => ({
        ...prev,
        company_name: liveMatch.company,
        gmp:          liveMatch.gmp        ?? '',
        retail_sub:   liveMatch.retail_sub ?? '',
        qib_sub:      liveMatch.qib_sub    ?? '',
        nii_sub:      liveMatch.nii_sub    ?? '',
        issue_size:   liveMatch.issue_size ?? '',
        sector:       liveMatch.sector !== 'Unknown' ? liveMatch.sector : 'IT',
      }));
    }
  };

  const handleIpoSelect = (e) => {
    const name = e.target.value;
    if (!name) { setForm(DEFAULT_FORM); return; }
    const ipo = liveIpos.find(i => i.company === name);
    if (ipo) {
      setForm(prev => ({
        ...prev,
        company_name: ipo.company,
        gmp:         ipo.gmp        ?? '',
        retail_sub:  ipo.retail_sub ?? '',
        qib_sub:     ipo.qib_sub    ?? '',
        nii_sub:     ipo.nii_sub    ?? '',
        issue_size:  ipo.issue_size ?? '',
        sector:      ipo.sector !== 'Unknown' ? ipo.sector : 'IT',
      }));
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onLoading(true);
    try {
      const payload = {
        company_name: form.company_name,
        gmp:          parseFloat(form.gmp),
        retail_sub:   parseFloat(form.retail_sub),
        qib_sub:      parseFloat(form.qib_sub),
        nii_sub:      parseFloat(form.nii_sub),
        issue_size:   parseFloat(form.issue_size),
        sector:       form.sector,
        model_type:   form.model_type,
      };
      // Attach optional advanced fields if filled
      if (form.pe_ratio)       payload.pe_ratio        = parseFloat(form.pe_ratio);
      if (form.debt_equity)    payload.debt_equity      = parseFloat(form.debt_equity);
      if (form.profit_margin)  payload.profit_margin    = parseFloat(form.profit_margin);
      if (form.revenue_growth) payload.revenue_growth   = parseFloat(form.revenue_growth);
      if (form.issue_price)    payload.issue_price      = parseFloat(form.issue_price);

      const res = await axios.post(`${API}/predict`, payload);
      onResult({ ...res.data, company_name: form.company_name, inputs: form });
    } catch (err) {
      onResult({ error: err.response?.data?.error || 'Prediction failed. Is the backend running?' });
    } finally {
      onLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} id="ipo-form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Live IPO Quick-Select ─────────────────────────── */}
      <div style={{
        background: 'rgba(59,130,246,0.05)',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: 'var(--radius-sm)',
        padding: 12,
      }}>
        <div style={{
          fontSize: '0.68rem', fontWeight: 700,
          color: 'var(--blue)', textTransform: 'uppercase',
          letterSpacing: '0.8px', marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span className="live-dot" />
          Live IPOs – Auto-fill from scraper
          {ipoSource && (
            <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>
              · {ipoSource}
            </span>
          )}
        </div>
        {loadingIpos ? (
          <div className="skeleton-box" style={{ height: '40px', borderRadius: 'var(--radius-sm)' }}></div>
        ) : (
          <select className="form-select" onChange={handleIpoSelect} id="live-ipo-select" defaultValue="">
            <option value="">— Select a live IPO to auto-fill —</option>
            {liveIpos.map(ipo => (
              <option key={ipo.company} value={ipo.company}>
                {ipo.company}{ipo.gmp !== 0 ? ` · GMP ₹${ipo.gmp}` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── Company Name with Autocomplete ───────────────── */}
      <div className="form-group">
        <label className="form-label" htmlFor="company_name">Company Name</label>
        <AutocompleteInput
          id="company_name"
          value={form.company_name}
          onChange={handleCompanySelect}
          suggestions={allCompanyNames}
          placeholder="Type to search — e.g. Zomato, LIC, Paytm..."
        />
        {form.company_name && liveIpos.some(i => i.company === form.company_name) && (
          <p style={{ fontSize: '0.72rem', color: 'var(--green)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="live-dot" /> Live IPO detected — fields auto-filled
          </p>
        )}
      </div>

      {/* ── GMP + Issue Size ──────────────────────────────── */}
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="gmp">Grey Market Premium (₹)</label>
          <input id="gmp" name="gmp" className="form-input" type="number"
            placeholder="e.g. 120" value={form.gmp} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="issue_size">Issue Size (₹ Cr)</label>
          <input id="issue_size" name="issue_size" className="form-input" type="number"
            placeholder="e.g. 2000" value={form.issue_size} onChange={handleChange} required />
        </div>
      </div>

      {/* ── Subscriptions ─────────────────────────────────── */}
      <div className="grid-3">
        <div className="form-group">
          <label className="form-label" htmlFor="retail_sub">Retail Sub (x)</label>
          <input id="retail_sub" name="retail_sub" className="form-input" type="number"
            step="0.01" placeholder="e.g. 15.5" value={form.retail_sub} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="qib_sub">QIB Sub (x)</label>
          <input id="qib_sub" name="qib_sub" className="form-input" type="number"
            step="0.01" placeholder="e.g. 80.2" value={form.qib_sub} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="nii_sub">NII Sub (x)</label>
          <input id="nii_sub" name="nii_sub" className="form-input" type="number"
            step="0.01" placeholder="e.g. 25.0" value={form.nii_sub} onChange={handleChange} required />
        </div>
      </div>

      {/* ── Sector ────────────────────────────────────────── */}
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="sector">Sector</label>
          <select id="sector" name="sector" className="form-select"
            value={form.sector} onChange={handleChange} required>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="model_type">AI Engine</label>
          <select id="model_type" name="model_type" className="form-select"
            value={form.model_type} onChange={handleChange} required>
            <option value="AI Ensemble (RF + GB)">Ensemble (Most Accurate)</option>
            <option value="Gradient Boosting">Gradient Boosting</option>
            <option value="Random Forest">Random Forest</option>
            <option value="Linear Regression">Linear Regression (Baseline)</option>
          </select>
        </div>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        💡 Nifty 50 market trend is auto-fetched live for every prediction.
      </p>

      {/* ── Advanced Metrics (Optional) ── */}
      <div style={{
        background: 'rgba(245,158,11,0.04)',
        border: '1px solid rgba(245,158,11,0.15)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}>
        <button
          type="button"
          onClick={() => setAdvOpen(v => !v)}
          id="advanced-metrics-toggle"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', background: 'transparent', border: 'none',
            cursor: 'pointer', color: '#F59E0B',
            fontSize: '0.82rem', fontWeight: 700,
          }}
        >
          <span style={{ fontSize: '0.9rem' }}>{advOpen ? '➖' : '➕'}</span>
          Advanced Metrics (Optional)
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            Improves listing price range accuracy
          </span>
        </button>

        <div style={{
          maxHeight: advOpen ? '400px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="pe_ratio">P/E Ratio</label>
                <input id="pe_ratio" name="pe_ratio" className="form-input" type="number"
                  step="0.01" placeholder="e.g. 35.5" value={form.pe_ratio} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="debt_equity">Debt/Equity Ratio</label>
                <input id="debt_equity" name="debt_equity" className="form-input" type="number"
                  step="0.01" placeholder="e.g. 0.8" value={form.debt_equity} onChange={handleChange} />
              </div>
            </div>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="profit_margin">Profit Margin %</label>
                <input id="profit_margin" name="profit_margin" className="form-input" type="number"
                  step="0.01" placeholder="e.g. 12.5" value={form.profit_margin} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="revenue_growth">Revenue Growth %</label>
                <input id="revenue_growth" name="revenue_growth" className="form-input" type="number"
                  step="0.01" placeholder="e.g. 28.0" value={form.revenue_growth} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="issue_price">Issue Price ₹</label>
                <input id="issue_price" name="issue_price" className="form-input" type="number"
                  step="0.01" placeholder="e.g. 540" value={form.issue_price} onChange={handleChange} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1rem', padding: '14px' }}
        id="predict-btn">
        🚀 Predict with LaunchSignal
      </button>
    </form>
  );
}
