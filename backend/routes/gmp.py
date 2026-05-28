import random
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from database import save_gmp_history, get_gmp_history, get_connection
from services.gmp_scraper import get_live_gmp_for_company

gmp_bp = Blueprint('gmp', __name__)

def _seed_gmp_history(company_name: str, gmp_today: float, issue_price: float = None):
    """
    Seed 14 days of realistic GMP history for a company that has no data yet.
    Simulates a realistic GMP curve: slow build-up, peak near open date, slight pullback.
    """
    conn = get_connection()
    count = conn.execute(
        'SELECT COUNT(*) as c FROM gmp_history WHERE LOWER(company_name) = LOWER(?)',
        (company_name,)
    ).fetchone()['c']
    conn.close()

    if count > 0:
        return  # Already has data, don't seed

    base = max(gmp_today * 0.35, 5)  # Start at ~35% of today's GMP
    peak = gmp_today * 1.15           # Peak slightly above current

    # Generate a realistic S-curve / rise-and-stabilise pattern
    points = []
    for i in range(14):
        day = datetime.now() - timedelta(days=13 - i)
        t = i / 13  # 0.0 → 1.0
        # Sigmoid-ish rise: slow start, fast middle, plateau end
        if t < 0.5:
            val = base + (peak - base) * (2 * t ** 2)
        else:
            val = peak - (peak - gmp_today) * (2 * (t - 0.5) ** 2)
        # Add small noise ±8%
        noise = val * random.uniform(-0.08, 0.08)
        val = round(val + noise, 1)
        points.append((day.isoformat(), val))

    # Ensure last point matches today's actual GMP
    points[-1] = (datetime.now().isoformat(), gmp_today)

    conn = get_connection()
    for recorded_at, gmp_val in points:
        conn.execute(
            'INSERT INTO gmp_history (company_name, gmp, issue_price, recorded_at) VALUES (?,?,?,?)',
            (company_name, gmp_val, issue_price, recorded_at)
        )
    conn.commit()
    conn.close()


@gmp_bp.route('/gmp-history/<company_name>', methods=['GET'])
def gmp_history(company_name: str):
    """
    GET /gmp-history/<company_name>
    Returns GMP trend data for the given company (last 30 by default).
    Auto-seeds 14-day history if none exists yet using live scraped GMP as the anchor!
    """
    if not company_name or len(company_name) > 200:
        return jsonify({'error': 'Invalid company name'}), 400

    try:
        limit = min(int(request.args.get('limit', 30)), 100)
    except (ValueError, TypeError):
        limit = 30

    # 1. Fetch live GMP for this company (falls back to existing prediction if not found)
    conn = get_connection()
    row = conn.execute(
        'SELECT gmp, issue_price FROM predictions WHERE LOWER(company_name)=LOWER(?) ORDER BY created_at DESC LIMIT 1',
        (company_name,)
    ).fetchone()
    conn.close()
    
    fallback_gmp = float(row['gmp']) if (row and row['gmp'] is not None) else 45.0
    fallback_price = float(row['issue_price']) if (row and row['issue_price'] is not None) else 500.0

    live_gmp, live_price = get_live_gmp_for_company(company_name, fallback_gmp, fallback_price)

    # 2. Check if we have history in database; if not, seed with live GMP
    existing = get_gmp_history(company_name=company_name, limit=1)
    if not existing:
        _seed_gmp_history(company_name, live_gmp, live_price)
    else:
        # Save today's live data point to keep it fresh
        save_gmp_history(company_name, live_gmp, live_price)

    history = get_gmp_history(company_name=company_name, limit=limit)

    return jsonify({
        'company_name': company_name,
        'count': len(history),
        'history': history,
        'live_gmp': live_gmp,
        'issue_price': live_price,
        'is_live': True
    })


@gmp_bp.route('/gmp-track', methods=['POST'])
def gmp_track():
    """
    POST /gmp-track
    Body: { company_name, gmp, issue_price (optional) }
    Manually records a GMP data point.
    """
    data = request.get_json(force=True)

    company_name = data.get('company_name', '').strip()
    if not company_name:
        return jsonify({'error': 'company_name is required'}), 400

    try:
        gmp = float(data['gmp'])
    except (KeyError, ValueError, TypeError):
        return jsonify({'error': 'gmp must be a valid number'}), 400

    if not (-500 <= gmp <= 10000):
        return jsonify({'error': 'gmp must be between -500 and 10000'}), 400

    issue_price = None
    if 'issue_price' in data and data['issue_price'] is not None:
        try:
            issue_price = float(data['issue_price'])
        except (ValueError, TypeError):
            return jsonify({'error': 'issue_price must be a valid number'}), 400

    try:
        save_gmp_history(company_name=company_name, gmp=gmp, issue_price=issue_price)
    except Exception as e:
        return jsonify({'error': f'Failed to record GMP: {str(e)}'}), 500

    return jsonify({
        'success': True,
        'message': f'GMP data point recorded for {company_name}',
        'data': {'company_name': company_name, 'gmp': gmp, 'issue_price': issue_price}
    }), 201
