from flask import Blueprint, jsonify, request

valuation_bp = Blueprint('valuation', __name__)

SECTOR_PE_MEDIANS = {
    'Technology': 35, 'Fintech': 40, 'Consumer Tech': 45,
    'Healthcare': 30, 'Pharma': 28, 'FMCG': 32,
    'Manufacturing': 22, 'Infrastructure': 20, 'Real Estate': 18,
    'Banking': 15, 'Finance': 18, 'Insurance': 20,
    'Defence': 25, 'EV / Clean Energy': 50, 'Agriculture': 18,
    'Logistics': 22, 'Retail': 25, 'Media': 20, 'Telecom': 18,
    'E-Commerce': 60, 'EdTech': 70, 'SaaS': 80,
    'IT': 35,
}


@valuation_bp.route('/valuation', methods=['POST'])
def valuation():
    """
    POST /valuation
    Body: { sector, pe_ratio, revenue_growth_pct, profit_margin_pct,
            issue_price (optional), revenue_cr (optional) }
    """
    data = request.get_json(force=True) or {}
    sector     = data.get('sector', 'Technology')
    pe         = data.get('pe_ratio')
    rev_growth = float(data.get('revenue_growth_pct', 15) or 15)
    margin     = float(data.get('profit_margin_pct', 10) or 10)
    issue_price = data.get('issue_price')
    revenue_cr  = data.get('revenue_cr')

    sector_pe = SECTOR_PE_MEDIANS.get(sector, 30)

    pe_analysis = None
    if pe is not None:
        pe = float(pe)
        pe_premium = round(((pe - sector_pe) / sector_pe * 100), 1) if sector_pe else 0
        if pe <= sector_pe * 0.8:
            pe_verdict = 'Attractively Priced'
        elif pe <= sector_pe * 1.2:
            pe_verdict = 'Fairly Valued'
        elif pe <= sector_pe * 1.5:
            pe_verdict = 'Slightly Overvalued'
        else:
            pe_verdict = 'Significantly Overvalued'

        pe_analysis = {
            'company_pe':    round(pe, 1),
            'sector_median': sector_pe,
            'verdict':       pe_verdict,
            'premium_pct':   pe_premium,
        }

    # DCF analysis (simplified 3-stage)
    dcf_analysis = None
    if issue_price and revenue_cr:
        try:
            ip  = float(issue_price)
            rev = float(revenue_cr)
            discount = 0.12
            fcf_margin = (margin / 100) * 0.6
            g1 = rev_growth / 100
            g2 = g1 / 2
            gT = 0.08

            fcf = rev * fcf_margin
            pv  = sum(fcf * (1 + g1) ** t / (1 + discount) ** t for t in range(1, 4))
            pv += sum(fcf * (1 + g1) ** 3 * (1 + g2) ** (t - 3) / (1 + discount) ** t for t in range(4, 8))
            terminal = fcf * (1 + g1) ** 3 * (1 + g2) ** 4 * (1 + gT) / (discount - gT)
            pv += terminal / (1 + discount) ** 7

            shares_cr = 100  # assumed 100Cr shares outstanding
            fair_value = pv / shares_cr

            dcf_analysis = {
                'fair_value_low':  round(fair_value * 0.8, 2),
                'fair_value_high': round(fair_value * 1.2, 2),
                'fair_value_mid':  round(fair_value, 2),
                'upside_pct':      round((fair_value - ip) / ip * 100, 1),
                'issue_price':     ip,
            }
        except Exception:
            dcf_analysis = None

    # Overall valuation score (0-100)
    score = 70  # base
    if pe_analysis:
        premium = pe_analysis['premium_pct']
        if premium < -20:
            score += 20
        elif premium < 0:
            score += 10
        elif premium < 20:
            score += 0
        elif premium < 50:
            score -= 15
        else:
            score -= 30
    if rev_growth > 25:
        score += 15
    elif rev_growth > 15:
        score += 8
    if margin > 15:
        score += 10
    elif margin > 5:
        score += 5
    elif margin < 0:
        score -= 20

    score = max(0, min(100, score))

    if score >= 70:
        overall_verdict = 'Undervalued'
        verdict_color   = '#18B981'
    elif score >= 45:
        overall_verdict = 'Fairly Valued'
        verdict_color   = '#F59E0B'
    else:
        overall_verdict = 'Overvalued'
        verdict_color   = '#EF4444'

    return jsonify({
        'pe_analysis':      pe_analysis,
        'dcf_analysis':     dcf_analysis,
        'overall_verdict':  overall_verdict,
        'verdict_color':    verdict_color,
        'valuation_score':  round(score),
        'sector':           sector,
        'sector_pe_median': sector_pe,
        'inputs': {
            'revenue_growth_pct': rev_growth,
            'profit_margin_pct':  margin,
        }
    })
