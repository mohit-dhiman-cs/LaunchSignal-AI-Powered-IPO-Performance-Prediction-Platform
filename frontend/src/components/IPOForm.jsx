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
  nii_sub: '', issue_size: '', sector: 'IT',
};

export default function IPOForm({ onResult, onLoading }) {
  const [form, setForm]               = useState(DEFAULT_FORM);
  const [liveIpos, setLiveIpos]       = useState([]);
  const [loadingIpos, setLoadingIpos] = useState(true);
  const [ipoSource, setIpoSource]     = useState('');

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
      setForm({
        company_name: liveMatch.company,
        gmp:          liveMatch.gmp        ?? '',
        retail_sub:   liveMatch.retail_sub ?? '',
        qib_sub:      liveMatch.qib_sub    ?? '',
        nii_sub:      liveMatch.nii_sub    ?? '',
        issue_size:   liveMatch.issue_size ?? '',
        sector:       liveMatch.sector !== 'Unknown' ? liveMatch.sector : 'IT',
      });
    }
  };

  const handleIpoSelect = (e) => {
    const name = e.target.value;
    if (!name) { setForm(DEFAULT_FORM); return; }
    const ipo = liveIpos.find(i => i.company === name);
    if (ipo) {
      setForm({
        company_name: ipo.company,
        gmp:         ipo.gmp        ?? '',
        retail_sub:  ipo.retail_sub ?? '',
        qib_sub:     ipo.qib_sub    ?? '',
        nii_sub:     ipo.nii_sub    ?? '',
        issue_size:  ipo.issue_size ?? '',
        sector:      ipo.sector !== 'Unknown' ? ipo.sector : 'IT',
      });
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onLoading(true);
    try {
      const res = await axios.post(`${API}/predict`, {
        company_name: form.company_name,
        gmp:          parseFloat(form.gmp),
        retail_sub:   parseFloat(form.retail_sub),
        qib_sub:      parseFloat(form.qib_sub),
        nii_sub:      parseFloat(form.nii_sub),
        issue_size:   parseFloat(form.issue_size),
        sector:       form.sector,
      });
      onResult({ ...res.data, company_name: form.company_name, inputs: form });
    } catch (err) {
      onResult({ error: err.response?.data?.error || 'Prediction failed. Is the backend running?' });
    } finally {
      onLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} id="ipo-form">

      {/* ── Live IPO Quick-Select ─────────────────────────── */}
      <div className="ipo-selector">
        <div className="ipo-selector-title">
          <span className="live-dot" />
          Live IPOs – Auto-fill from scraper
          {ipoSource && (
            <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>
              · {ipoSource}
            </span>
          )}
        </div>
        {loadingIpos ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fetching live IPOs...</p>
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
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label className="form-label" htmlFor="company_name">
          Company Name
        </label>
        <AutocompleteInput
          id="company_name"
          value={form.company_name}
          onChange={handleCompanySelect}
          suggestions={allCompanyNames}
          placeholder="Type to search — e.g. Zomato, LIC, Paytm..."
        />
        {form.company_name && liveIpos.some(i => i.company === form.company_name) && (
          <p style={{ fontSize: '0.72rem', color: 'var(--accent-green)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="live-dot" /> Live IPO detected — fields auto-filled from grey market data
          </p>
        )}
      </div>

      {/* ── GMP + Issue Size ──────────────────────────────── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
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
      <div className="grid-3" style={{ marginBottom: 20 }}>
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
      <div className="form-group" style={{ marginBottom: 28 }}>
        <label className="form-label" htmlFor="sector">Sector</label>
        <select id="sector" name="sector" className="form-select"
          value={form.sector} onChange={handleChange} required>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>
        💡 Market trend (Nifty 50) is auto-fetched in real-time for every prediction.
      </p>

      <button type="submit" className="btn btn-primary"
        style={{ width: '100%', fontSize: '1rem', padding: '15px' }}
        id="predict-btn">
        🚀 Predict with LaunchSignal
      </button>
    </form>
  );
}
