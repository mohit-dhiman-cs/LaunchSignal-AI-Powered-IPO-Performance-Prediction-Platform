import { useState } from 'react';

/**
 * PDFExport — generates a styled prediction report PDF using the browser print API.
 * No external libraries needed. Renders a hidden printable div and triggers window.print().
 */
export default function PDFExport({ result }) {
  const [generating, setGenerating] = useState(false);

  if (!result || result.error) return null;

  const handleExport = () => {
    setGenerating(true);
    setTimeout(() => {
      const win = window.open('', '_blank', 'width=900,height=700');
      const risk = result.risk_analysis || {};
      const flagsHtml = (risk.flags || []).map(f => `
        <div class="flag ${f.severity.toLowerCase()}">
          <span class="flag-dot">${f.severity === 'GREEN' ? '🟢' : f.severity === 'AMBER' ? '🟡' : '🔴'}</span>
          <div>
            <strong>${f.name}</strong> <span class="metric">${f.metric || ''}</span>
            <p>${f.detail}</p>
          </div>
        </div>`).join('');

      const contribHtml = (result.feature_impact || []).slice(0, 6).map(c => `
        <tr>
          <td>${c.feature || c.name}</td>
          <td>${c.value !== undefined ? c.value : '—'}</td>
          <td style="color:${(c.contribution || c.impact) >= 0 ? '#18B981' : '#EF4444'};font-weight:700">
            ${(c.contribution || c.impact) >= 0 ? '+' : ''}${((c.contribution || c.impact) || 0).toFixed(2)}
          </td>
        </tr>`).join('');

      const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

      win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>LaunchSignal — ${result.company_name || 'IPO'} Prediction Report</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #fff; padding: 40px; font-size: 13px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 3px solid #2563EB; padding-bottom: 20px; margin-bottom: 28px; }
  .brand { font-size: 22px; font-weight: 900; color: #1e3a8a; letter-spacing:-0.5px; }
  .brand span { color: #2563EB; }
  .meta { text-align:right; font-size:11px; color:#64748b; line-height:1.8; }
  .report-title { font-size: 18px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
  h2 { font-size: 14px; font-weight: 700; color: #1e293b; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  .grid { display:grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 24px; }
  .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
  .stat-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
  .stat-value { font-size: 22px; font-weight: 900; color: #1e3a8a; }
  .positive { color: #059669 !important; }
  .negative { color: #DC2626 !important; }
  .amber { color: #D97706 !important; }
  .badge { display:inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .badge-low { background:#dcfce7; color:#166534; }
  .badge-med { background:#fef9c3; color:#854d0e; }
  .badge-high { background:#fee2e2; color:#991b1b; }
  table { width:100%; border-collapse:collapse; margin-bottom: 20px; }
  th { background:#f1f5f9; padding: 8px 12px; text-align:left; font-size:10px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.6px; }
  td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #334155; }
  .flag { display:flex; gap:12px; padding: 10px 14px; background:#f8fafc; border-radius:8px; margin-bottom:8px; align-items:flex-start; border-left: 3px solid #e2e8f0; }
  .flag.green { border-color: #059669; background:#f0fdf4; }
  .flag.amber { border-color: #D97706; background:#fffbeb; }
  .flag.red   { border-color: #DC2626; background:#fff5f5; }
  .flag strong { font-size: 12px; color: #1e293b; }
  .flag p { font-size: 11px; color: #475569; margin-top: 3px; }
  .metric { font-size: 11px; font-weight: 700; background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 4px; margin-left: 6px; }
  .flag-dot { font-size: 14px; flex-shrink:0; margin-top:1px; }
  .conf-bar-wrap { position:relative; height:12px; background:#e2e8f0; border-radius:6px; margin:8px 0; }
  .conf-bar { position:absolute; height:12px; border-radius:6px; background: linear-gradient(90deg,#2563EB,#18B981); }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align:center; line-height: 1.8; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="brand">Launch<span>Signal</span></div>
    <div style="font-size:11px;color:#64748b;margin-top:4px">AI-Powered IPO Performance Prediction</div>
  </div>
  <div class="meta">
    <div class="report-title">${result.company_name || 'IPO'} Prediction Report</div>
    <div>Generated: ${now}</div>
    <div>Model: ${result.model_used || 'AI Ensemble'}</div>
    <div>Confidence: ${Math.round((result.confidence || 0) * 100)}%</div>
  </div>
</div>

<h2>📊 Prediction Summary</h2>
<div class="grid">
  <div class="stat-box">
    <div class="stat-label">Predicted Listing Gain</div>
    <div class="stat-value ${result.predicted_return >= 0 ? 'positive' : 'negative'}">
      ${result.predicted_return >= 0 ? '+' : ''}${result.predicted_return}%
    </div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Risk Level</div>
    <div class="stat-value" style="font-size:16px;margin-top:4px">
      <span class="badge ${result.risk === 'Low' ? 'badge-low' : result.risk === 'High' ? 'badge-high' : 'badge-med'}">${result.risk} Risk</span>
    </div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Probability of Gain</div>
    <div class="stat-value ${(result.profit_probability || 0) >= 65 ? 'positive' : (result.profit_probability || 0) >= 40 ? 'amber' : 'negative'}">
      ${result.profit_probability || 0}%
    </div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Confidence Interval</div>
    <div class="stat-value" style="font-size:15px;margin-top:4px">
      ${result.confidence_low !== undefined ? `${result.confidence_low}% – ${result.confidence_high}%` : '—'}
    </div>
  </div>
  <div class="stat-box">
    <div class="stat-label">IPO Score</div>
    <div class="stat-value ${(result.score?.total || 0) >= 70 ? 'positive' : (result.score?.total || 0) >= 40 ? 'amber' : 'negative'}">
      ${result.score?.total || 0}/100
    </div>
  </div>
  ${result.listing_price_range ? `
  <div class="stat-box">
    <div class="stat-label">Listing Price Range</div>
    <div class="stat-value" style="font-size:13px;margin-top:4px">
      ₹${result.listing_price_range.low} – ₹${result.listing_price_range.high}
    </div>
  </div>` : `
  <div class="stat-box">
    <div class="stat-label">Sector</div>
    <div class="stat-value" style="font-size:16px;margin-top:4px">${result.inputs?.sector || "—"}</div>
  </div>`}
</div>

${result.feature_impact?.length ? `
<h2>🧠 AI Feature Impact</h2>
<table>
  <tr><th>Feature</th><th>Value</th><th>Impact on Return</th></tr>
  ${contribHtml}
</table>` : ''}

${risk.flags?.length ? `
<h2>⚠️ Risk Analysis — ${risk.overall_severity || ''} (Score: ${risk.overall_score || 0}/100)</h2>
${flagsHtml}` : ''}

<div class="footer">
  <strong>LaunchSignal</strong> · AI-Powered IPO Intelligence · launchsignal.ai<br>
  ⚠️ This report is generated by an AI model and is for informational purposes only. It does not constitute financial advice.<br>
  Past predictions do not guarantee future returns. Please consult a SEBI-registered investment advisor before investing.
</div>
</body>
</html>`);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); setGenerating(false); }, 600);
    }, 200);
  };

  return (
    <button
      onClick={handleExport}
      disabled={generating}
      id="pdf-export-btn"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 18px',
        background: generating ? 'var(--bg-elevated)' : 'rgba(37,99,235,0.1)',
        border: '1px solid rgba(37,99,235,0.3)',
        borderRadius: 'var(--r-xs)',
        color: 'var(--royal-bright)', fontSize: '0.82rem', fontWeight: 700,
        cursor: generating ? 'wait' : 'pointer',
        fontFamily: 'var(--font-primary)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => !generating && (e.currentTarget.style.background = 'rgba(37,99,235,0.18)')}
      onMouseLeave={e => !generating && (e.currentTarget.style.background = 'rgba(37,99,235,0.1)')}
    >
      {generating ? '⏳ Generating...' : '📄 Export PDF Report'}
    </button>
  );
}
