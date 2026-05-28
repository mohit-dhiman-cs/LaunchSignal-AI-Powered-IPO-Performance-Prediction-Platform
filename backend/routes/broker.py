from flask import Blueprint, jsonify, request

broker_bp = Blueprint('broker', __name__)

# ── Curated broker recommendation database ───────────────────────────────────
# Structured as: sector → list of typical broker stances
# Based on publicly known analyst tendencies (educational only)

SECTOR_STANCES = {
    "IT": [
        {"broker": "ICICI Securities", "rating": "Subscribe", "rationale": "Strong order book & cloud migration tailwind", "target_multiple": "35-40x P/E"},
        {"broker": "Angel One", "rating": "Subscribe for listing gains", "rationale": "IT sector premium valuations supported by FII inflows", "target_multiple": ""},
        {"broker": "Zerodha (Coin)", "rating": "Neutral", "rationale": "Valuations rich; long-term investors may wait for post-listing dip", "target_multiple": ""},
        {"broker": "Motilal Oswal", "rating": "Subscribe", "rationale": "Digital transformation spend driving revenue visibility", "target_multiple": "38x FY25E EPS"},
        {"broker": "HDFC Securities", "rating": "Subscribe", "rationale": "Healthy margins and repeat client base reduce revenue risk", "target_multiple": ""},
    ],
    "Fintech": [
        {"broker": "ICICI Securities", "rating": "Subscribe", "rationale": "Fintech disruption story with strong TAM; high-growth phase", "target_multiple": ""},
        {"broker": "Zerodha (Coin)", "rating": "High Risk / Subscribe", "rationale": "Regulatory headwinds possible; suitable for risk-tolerant investors", "target_multiple": ""},
        {"broker": "Motilal Oswal", "rating": "Subscribe for Long Term", "rationale": "Payment volumes growing 30%+ YoY; path to profitability visible", "target_multiple": ""},
        {"broker": "Kotak Securities", "rating": "Neutral", "rationale": "Competitive landscape intensifying; margins under pressure", "target_multiple": ""},
    ],
    "Pharma": [
        {"broker": "ICICI Securities", "rating": "Subscribe", "rationale": "USFDA approvals and domestic formulation growth provide stability", "target_multiple": "28-32x P/E"},
        {"broker": "Angel One", "rating": "Subscribe", "rationale": "Pharma sector resilience and defensive characteristics attract FIIs", "target_multiple": ""},
        {"broker": "Motilal Oswal", "rating": "Subscribe for Long Term", "rationale": "R&D pipeline and biosimilar opportunity priced at fair value", "target_multiple": "30x FY25E"},
        {"broker": "HDFC Securities", "rating": "Neutral", "rationale": "USFDA inspection risks and US generic price erosion a concern", "target_multiple": ""},
    ],
    "Healthcare": [
        {"broker": "ICICI Securities", "rating": "Subscribe", "rationale": "Post-COVID healthcare infra spending driving strong volumes", "target_multiple": ""},
        {"broker": "Angel One", "rating": "Subscribe", "rationale": "Hospital chains with strong brand command premium valuations", "target_multiple": ""},
        {"broker": "Motilal Oswal", "rating": "Subscribe for Long Term", "rationale": "Increasing health insurance penetration boosting occupancy rates", "target_multiple": ""},
    ],
    "Consumer Tech": [
        {"broker": "ICICI Securities", "rating": "Risky Subscribe", "rationale": "High-growth but path to profitability unclear; monitor burn rate", "target_multiple": ""},
        {"broker": "Zerodha (Coin)", "rating": "Avoid / Wait", "rationale": "Consumer tech IPOs historically volatile post-listing", "target_multiple": ""},
        {"broker": "Angel One", "rating": "Subscribe for Listing Gains", "rationale": "Brand recognition supports short-term listing pop", "target_multiple": ""},
        {"broker": "Motilal Oswal", "rating": "Neutral", "rationale": "Competitive intensity from incumbents caps medium-term upside", "target_multiple": ""},
    ],
    "EV / Clean Energy": [
        {"broker": "ICICI Securities", "rating": "Subscribe for Long Term", "rationale": "EV adoption curve early; 5-7 year horizon for full value unlock", "target_multiple": ""},
        {"broker": "Motilal Oswal", "rating": "Subscribe", "rationale": "Government PLI incentives and rising fuel costs drive structural tailwind", "target_multiple": ""},
        {"broker": "HDFC Securities", "rating": "Subscribe", "rationale": "Clean energy is a decade-long mega-theme; early mover advantage", "target_multiple": ""},
    ],
    "Banking": [
        {"broker": "ICICI Securities", "rating": "Subscribe", "rationale": "NIM expansion and credit cost normalization support earnings growth", "target_multiple": "1.5-2x P/BV"},
        {"broker": "Motilal Oswal", "rating": "Subscribe", "rationale": "CASA ratio and loan book quality differentiate quality names", "target_multiple": ""},
        {"broker": "Angel One", "rating": "Subscribe", "rationale": "PSU bank valuations inexpensive vs. private peers", "target_multiple": ""},
        {"broker": "Kotak Securities", "rating": "Subscribe for Long Term", "rationale": "Asset quality improving; provision coverage adequate", "target_multiple": ""},
    ],
    "Logistics": [
        {"broker": "Angel One", "rating": "Subscribe", "rationale": "E-commerce and quick-commerce boom driving last-mile logistics demand", "target_multiple": ""},
        {"broker": "ICICI Securities", "rating": "Subscribe for Listing Gains", "rationale": "Asset-light models with high OCF generation valued at premium", "target_multiple": ""},
        {"broker": "Motilal Oswal", "rating": "Subscribe", "rationale": "India logistics underpenetrated; GDP-linked growth story intact", "target_multiple": ""},
    ],
    "Manufacturing": [
        {"broker": "ICICI Securities", "rating": "Subscribe", "rationale": "China+1 beneficiary; export market diversification underway", "target_multiple": "25-28x P/E"},
        {"broker": "Motilal Oswal", "rating": "Subscribe for Long Term", "rationale": "PLI schemes creating capacity; import substitution story", "target_multiple": ""},
        {"broker": "HDFC Securities", "rating": "Subscribe", "rationale": "Order visibility of 18-24 months provides revenue predictability", "target_multiple": ""},
    ],
    "EdTech": [
        {"broker": "Zerodha (Coin)", "rating": "Avoid", "rationale": "EdTech sector facing structural headwinds post-COVID normalisation", "target_multiple": ""},
        {"broker": "Angel One", "rating": "High Risk", "rationale": "Regulatory concerns and customer refund issues cloud outlook", "target_multiple": ""},
        {"broker": "ICICI Securities", "rating": "Neutral", "rationale": "Only invest if company has demonstrated path to profitability", "target_multiple": ""},
    ],
    "E-Commerce": [
        {"broker": "ICICI Securities", "rating": "Subscribe for Long Term", "rationale": "India e-commerce penetration at ~5% vs 25%+ for mature markets", "target_multiple": ""},
        {"broker": "Motilal Oswal", "rating": "Subscribe", "rationale": "Category expansion and quick-commerce growth driving GMV momentum", "target_multiple": ""},
        {"broker": "Kotak Securities", "rating": "Neutral", "rationale": "Unit economics improving but full profitability 2-3 years away", "target_multiple": ""},
    ],
    "Finance": [
        {"broker": "ICICI Securities", "rating": "Subscribe", "rationale": "NBFCs bridging formal credit gap in underserved segments", "target_multiple": ""},
        {"broker": "Angel One", "rating": "Subscribe", "rationale": "Co-lending models and fintech partnerships improving cost of funds", "target_multiple": ""},
        {"broker": "HDFC Securities", "rating": "Subscribe for Long Term", "rationale": "Financial inclusion tailwind; strong AUM growth trajectory", "target_multiple": ""},
    ],
    "FMCG": [
        {"broker": "ICICI Securities", "rating": "Subscribe", "rationale": "Rural recovery and premiumisation driving volume & margin expansion", "target_multiple": "45-50x P/E"},
        {"broker": "Motilal Oswal", "rating": "Subscribe for Long Term", "rationale": "FMCG sector defensiveness; brand moat supports pricing power", "target_multiple": ""},
        {"broker": "HDFC Securities", "rating": "Neutral", "rationale": "Rich valuations leave limited margin of safety at IPO price", "target_multiple": ""},
    ],
    "Insurance": [
        {"broker": "ICICI Securities", "rating": "Subscribe", "rationale": "India insurance underpenetrated; growth runway of 15-20 years", "target_multiple": "3-4x P/EV"},
        {"broker": "Motilal Oswal", "rating": "Subscribe", "rationale": "Digital distribution reducing acquisition cost; VNB margin improving", "target_multiple": ""},
    ],
}

DEFAULT_STANCES = [
    {"broker": "ICICI Securities", "rating": "Subscribe", "rationale": "Diversified Indian conglomerate; track record of execution", "target_multiple": ""},
    {"broker": "Angel One", "rating": "Subscribe for Listing Gains", "rationale": "Monitor grey market premium for near-term price discovery", "target_multiple": ""},
    {"broker": "Zerodha (Coin)", "rating": "Neutral", "rationale": "Evaluate fundamentals carefully before subscribing at IPO price", "target_multiple": ""},
    {"broker": "Motilal Oswal", "rating": "Subscribe for Long Term", "rationale": "Long-term secular growth story outweighs near-term IPO premium", "target_multiple": ""},
]

RATING_COLORS = {
    "Subscribe":             {"bg": "rgba(24,185,129,0.12)", "color": "#18B981"},
    "Subscribe for listing gains": {"bg": "rgba(245,158,11,0.12)", "color": "#F59E0B"},
    "Subscribe for Listing Gains": {"bg": "rgba(245,158,11,0.12)", "color": "#F59E0B"},
    "Subscribe for Long Term":     {"bg": "rgba(37,99,235,0.12)", "color": "#2563EB"},
    "Neutral":               {"bg": "rgba(100,116,139,0.12)", "color": "#64748b"},
    "High Risk":             {"bg": "rgba(239,68,68,0.12)", "color": "#EF4444"},
    "High Risk / Subscribe": {"bg": "rgba(239,68,68,0.12)", "color": "#EF4444"},
    "Risky Subscribe":       {"bg": "rgba(239,68,68,0.12)", "color": "#EF4444"},
    "Avoid":                 {"bg": "rgba(239,68,68,0.15)", "color": "#EF4444"},
    "Avoid / Wait":          {"bg": "rgba(239,68,68,0.15)", "color": "#EF4444"},
}


@broker_bp.route('/broker-recs', methods=['GET'])
def broker_recs():
    sector = (request.args.get('sector') or '').strip()
    predicted_return = request.args.get('predicted_return', type=float)
    risk = (request.args.get('risk') or '').strip()

    stances = SECTOR_STANCES.get(sector, DEFAULT_STANCES)

    # Add color metadata
    enriched = []
    for s in stances:
        rating_key = s['rating']
        color_info = RATING_COLORS.get(rating_key, {"bg": "rgba(100,116,139,0.12)", "color": "#64748b"})
        enriched.append({**s, **color_info})

    # AI consensus summary
    ratings = [s['rating'].lower() for s in stances]
    subscribe_count = sum(1 for r in ratings if 'subscribe' in r and 'avoid' not in r)
    avoid_count     = sum(1 for r in ratings if 'avoid' in r)
    neutral_count   = sum(1 for r in ratings if 'neutral' in r)
    total           = len(ratings)

    if subscribe_count / total >= 0.6:
        consensus = "Strong Subscribe"
        consensus_color = "#18B981"
    elif subscribe_count > neutral_count and avoid_count == 0:
        consensus = "Moderate Subscribe"
        consensus_color = "#F59E0B"
    elif avoid_count > 0:
        consensus = "Risky / Avoid"
        consensus_color = "#EF4444"
    else:
        consensus = "Mixed / Neutral"
        consensus_color = "#64748b"

    return jsonify({
        "sector":          sector or "General",
        "brokers":         enriched,
        "consensus":       consensus,
        "consensus_color": consensus_color,
        "subscribe_count": subscribe_count,
        "neutral_count":   neutral_count,
        "avoid_count":     avoid_count,
        "disclaimer":      "Broker stances shown are curated illustrative examples based on publicly known analyst tendencies. These do not constitute actual analyst reports or financial advice. Always verify with official broker research portals.",
    })
