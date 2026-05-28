from flask import Blueprint, jsonify, request
from database import get_connection
import statistics

backtest_bp = Blueprint('backtest', __name__)


@backtest_bp.route('/backtest', methods=['GET'])
def backtest():
    """
    GET /backtest?year=&sector=
    Returns model accuracy metrics computed from stored prediction history.
    """
    year   = request.args.get('year')
    sector = request.args.get('sector')

    conn = get_connection()
    query = 'SELECT * FROM predictions'
    params = []
    conditions = []

    if year:
        conditions.append("strftime('%Y', created_at) = ?")
        params.append(str(year))
    if sector:
        conditions.append("LOWER(sector) = LOWER(?)")
        params.append(sector)

    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)
    query += ' ORDER BY created_at DESC'

    rows = [dict(r) for r in conn.execute(query, params).fetchall()]
    conn.close()

    if not rows:
        return jsonify({
            'total': 0,
            'metrics': {},
            'predictions': [],
            'message': 'No predictions found for the selected filters.'
        })

    returns     = [r['predicted_return'] for r in rows if r.get('predicted_return') is not None]
    confidences = [r['confidence'] for r in rows if r.get('confidence') is not None]

    avg_return    = round(statistics.mean(returns), 2)          if returns     else 0
    median_return = round(statistics.median(returns), 2)        if returns     else 0
    std_return    = round(statistics.stdev(returns), 2)         if len(returns) > 1 else 0
    avg_conf      = round(statistics.mean(confidences), 3)      if confidences else 0

    # Risk distribution
    risk_dist = {'Low': 0, 'Medium': 0, 'High': 0}
    for r in rows:
        risk = r.get('risk', 'Medium')
        risk_dist[risk] = risk_dist.get(risk, 0) + 1

    # Sector distribution
    sector_dist = {}
    for r in rows:
        s = r.get('sector', 'Unknown')
        sector_dist[s] = sector_dist.get(s, 0) + 1

    # Confidence buckets
    conf_buckets = {'High (>80%)': 0, 'Medium (60-80%)': 0, 'Low (<60%)': 0}
    for c in confidences:
        if c > 0.8:
            conf_buckets['High (>80%)'] += 1
        elif c >= 0.6:
            conf_buckets['Medium (60-80%)'] += 1
        else:
            conf_buckets['Low (<60%)'] += 1

    # Top predictions
    top_preds = sorted(rows, key=lambda x: x.get('predicted_return', 0), reverse=True)[:5]
    top_preds_clean = [{
        'company': r.get('company_name', 'Unknown'),
        'predicted_return': r.get('predicted_return'),
        'risk': r.get('risk'),
        'confidence': r.get('confidence'),
        'sector': r.get('sector'),
        'date': r.get('created_at', '')[:10],
    } for r in top_preds]

    # Positive return count
    positive_count = sum(1 for r in returns if r > 0)

    return jsonify({
        'total': len(rows),
        'metrics': {
            'avg_predicted_return':    avg_return,
            'median_predicted_return': median_return,
            'std_predicted_return':    std_return,
            'avg_confidence':          avg_conf,
            'positive_return_count':   positive_count,
            'positive_return_pct':     round(positive_count / len(returns) * 100, 1) if returns else 0,
        },
        'risk_distribution':   risk_dist,
        'sector_distribution': sector_dist,
        'confidence_buckets':  conf_buckets,
        'top_predictions':     top_preds_clean,
        'filters': {'year': year, 'sector': sector},
    })
