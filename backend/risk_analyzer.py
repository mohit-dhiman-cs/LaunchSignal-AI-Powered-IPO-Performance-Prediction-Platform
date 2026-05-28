"""
AI Risk Analyzer — evaluates IPO inputs against 10 risk dimensions.
Returns structured risk flags with severity (GREEN/AMBER/RED) and an overall score.
"""

SECTOR_PE_MEDIANS = {
    'Technology': 35, 'Fintech': 40, 'Consumer Tech': 45,
    'Healthcare': 30, 'Pharma': 28, 'FMCG': 32,
    'Manufacturing': 22, 'Infrastructure': 20, 'Real Estate': 18,
    'Banking': 15, 'Finance': 18, 'Insurance': 20,
    'Defence': 25, 'EV / Clean Energy': 50, 'Agriculture': 18,
    'Logistics': 22, 'Retail': 25, 'Media': 20, 'Telecom': 18,
    'E-Commerce': 60, 'EdTech': 70, 'SaaS': 80,
}


def analyze_risk(inputs: dict) -> dict:
    """
    inputs: dict with keys gmp, retail_sub, qib_sub, nii_sub, issue_size, sector,
            market_trend, pe_ratio (optional), debt_equity (optional),
            revenue_growth (optional), profit_margin (optional)
    Returns: {overall_score, overall_severity, flags: [...]}
    """
    flags = []
    gmp = float(inputs.get('gmp', 0))
    qib = float(inputs.get('qib_sub', 0))
    retail = float(inputs.get('retail_sub', 0))
    nii = float(inputs.get('nii_sub', 0))
    issue_size = float(inputs.get('issue_size', 1000))
    sector = str(inputs.get('sector', ''))
    market_trend = float(inputs.get('market_trend', 0))
    pe = inputs.get('pe_ratio')
    de = inputs.get('debt_equity')
    pm = inputs.get('profit_margin')
    rg = inputs.get('revenue_growth')

    def flag(name, severity, detail, metric=None):
        flags.append({'name': name, 'severity': severity, 'detail': detail, 'metric': metric})

    # 1. GMP signal
    if gmp >= 100:
        flag('GMP Signal', 'GREEN', f'Strong grey market demand (GMP: ₹{gmp})', f'₹{gmp}')
    elif gmp >= 20:
        flag('GMP Signal', 'AMBER', f'Moderate grey market interest (GMP: ₹{gmp})', f'₹{gmp}')
    elif gmp >= 0:
        flag('GMP Signal', 'AMBER', f'Low grey market premium (GMP: ₹{gmp})', f'₹{gmp}')
    else:
        flag('GMP Signal', 'RED', f'Negative GMP — market discounting IPO (GMP: ₹{gmp})', f'₹{gmp}')

    # 2. QIB Subscription
    if qib >= 50:
        flag('QIB Interest', 'GREEN', f'Excellent institutional demand ({qib}x)', f'{qib}x')
    elif qib >= 10:
        flag('QIB Interest', 'AMBER', f'Moderate institutional interest ({qib}x)', f'{qib}x')
    elif qib >= 1:
        flag('QIB Interest', 'AMBER', f'Low QIB subscription ({qib}x) — institutional caution', f'{qib}x')
    else:
        flag('QIB Interest', 'RED', f'Very low QIB subscription ({qib}x) — major red flag', f'{qib}x')

    # 3. Retail Subscription
    if retail >= 30:
        flag('Retail Demand', 'GREEN', f'High retail interest ({retail}x)', f'{retail}x')
    elif retail >= 5:
        flag('Retail Demand', 'AMBER', f'Moderate retail subscription ({retail}x)', f'{retail}x')
    else:
        flag('Retail Demand', 'RED', f'Weak retail subscription ({retail}x)', f'{retail}x')

    # 4. Issue Size
    if issue_size <= 500:
        flag('Issue Size', 'GREEN', f'Small IPO (₹{issue_size}Cr) — easier to deliver listing gains', f'₹{issue_size}Cr')
    elif issue_size <= 3000:
        flag('Issue Size', 'AMBER', f'Mid-size IPO (₹{issue_size}Cr)', f'₹{issue_size}Cr')
    else:
        flag('Issue Size', 'RED', f'Large IPO (₹{issue_size}Cr) — harder to sustain premium post-listing', f'₹{issue_size}Cr')

    # 5. Market Conditions
    if market_trend >= 0.01:
        flag('Market Trend', 'GREEN', f'Bullish market conditions (+{round(market_trend*100,2)}% Nifty)', f'+{round(market_trend*100,2)}%')
    elif market_trend >= 0:
        flag('Market Trend', 'AMBER', f'Flat market conditions', f'{round(market_trend*100,2)}%')
    else:
        flag('Market Trend', 'RED', f'Bearish market conditions ({round(market_trend*100,2)}% Nifty) — listing risk elevated', f'{round(market_trend*100,2)}%')

    # 6. P/E vs sector (optional)
    if pe is not None:
        pe = float(pe)
        sector_median = SECTOR_PE_MEDIANS.get(sector, 30)
        if pe <= sector_median * 0.8:
            flag('Valuation (P/E)', 'GREEN', f'P/E of {pe}x is below sector median ({sector_median}x) — attractively priced', f'{pe}x vs {sector_median}x median')
        elif pe <= sector_median * 1.2:
            flag('Valuation (P/E)', 'AMBER', f'P/E of {pe}x is near sector median ({sector_median}x)', f'{pe}x vs {sector_median}x median')
        else:
            flag('Valuation (P/E)', 'RED', f'P/E of {pe}x is significantly above sector median ({sector_median}x) — overvalued', f'{pe}x vs {sector_median}x median')

    # 7. Debt/Equity (optional)
    if de is not None:
        de = float(de)
        if de <= 0.5:
            flag('Debt Level', 'GREEN', f'Low debt/equity ratio ({de}x) — strong balance sheet', f'{de}x')
        elif de <= 1.5:
            flag('Debt Level', 'AMBER', f'Moderate debt/equity ({de}x)', f'{de}x')
        else:
            flag('Debt Level', 'RED', f'High debt/equity ({de}x) — balance sheet risk', f'{de}x')

    # 8. Profit Margin (optional)
    if pm is not None:
        pm = float(pm)
        if pm >= 15:
            flag('Profitability', 'GREEN', f'Strong profit margin ({pm}%)', f'{pm}%')
        elif pm >= 5:
            flag('Profitability', 'AMBER', f'Moderate profit margin ({pm}%)', f'{pm}%')
        elif pm >= 0:
            flag('Profitability', 'AMBER', f'Thin profit margins ({pm}%) — watch for dilution post-IPO', f'{pm}%')
        else:
            flag('Profitability', 'RED', f'Loss-making company (margin: {pm}%) — speculative bet', f'{pm}%')

    # 9. Revenue Growth (optional)
    if rg is not None:
        rg = float(rg)
        if rg >= 25:
            flag('Revenue Growth', 'GREEN', f'High revenue growth ({rg}% YoY)', f'{rg}%')
        elif rg >= 10:
            flag('Revenue Growth', 'AMBER', f'Moderate growth ({rg}% YoY)', f'{rg}%')
        else:
            flag('Revenue Growth', 'RED', f'Slow/declining revenue growth ({rg}% YoY)', f'{rg}%')

    # 10. NII / HNI demand
    if nii >= 20:
        flag('HNI Demand', 'GREEN', f'Strong HNI/NII subscription ({nii}x)', f'{nii}x')
    elif nii >= 5:
        flag('HNI Demand', 'AMBER', f'Moderate HNI interest ({nii}x)', f'{nii}x')
    else:
        flag('HNI Demand', 'RED', f'Weak HNI/NII demand ({nii}x)', f'{nii}x')

    # Score
    weights = {'GREEN': 3, 'AMBER': 1, 'RED': 0}
    if flags:
        raw_score = sum(weights[f['severity']] for f in flags) / (len(flags) * 3) * 100
    else:
        raw_score = 50
    score = round(raw_score)

    if score >= 70:
        overall = 'LOW RISK'
    elif score >= 45:
        overall = 'MEDIUM RISK'
    else:
        overall = 'HIGH RISK'

    return {
        'overall_score': score,
        'overall_severity': overall,
        'flags': flags,
        'total_flags': len(flags),
        'red_count': sum(1 for f in flags if f['severity'] == 'RED'),
        'amber_count': sum(1 for f in flags if f['severity'] == 'AMBER'),
        'green_count': sum(1 for f in flags if f['severity'] == 'GREEN'),
    }
