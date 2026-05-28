from flask import Blueprint, jsonify, request
from database import get_history_filtered, get_history_stats, get_sector_heatmap

history_bp = Blueprint('history', __name__)


@history_bp.route('/history', methods=['GET'])
def history():
    """
    GET /history
    Query params:
      - sector      : filter by sector name (case-insensitive)
      - year        : 4-digit year string e.g. "2024"
      - min_return  : float, minimum predicted_return
      - max_return  : float, maximum predicted_return
      - risk        : Low | Medium | High (case-insensitive)
      - sort_by     : predicted_return | created_at | confidence | gmp  (default: created_at)
      - limit       : int, max rows (default: 100, max: 500)
    """
    sector     = request.args.get('sector')
    year       = request.args.get('year')
    min_return = request.args.get('min_return')
    max_return = request.args.get('max_return')
    risk       = request.args.get('risk')
    sort_by    = request.args.get('sort_by', 'created_at')

    try:
        limit = min(int(request.args.get('limit', 100)), 500)
    except (ValueError, TypeError):
        limit = 100

    try:
        min_return = float(min_return) if min_return is not None else None
        max_return = float(max_return) if max_return is not None else None
    except (ValueError, TypeError):
        return jsonify({'error': 'min_return and max_return must be numeric'}), 400

    rows = get_history_filtered(
        sector=sector,
        year=year,
        min_return=min_return,
        max_return=max_return,
        risk=risk,
        sort_by=sort_by,
        limit=limit
    )

    return jsonify({
        'count': len(rows),
        'filters': {
            'sector': sector, 'year': year,
            'min_return': min_return, 'max_return': max_return,
            'risk': risk, 'sort_by': sort_by, 'limit': limit
        },
        'results': rows
    })


@history_bp.route('/history/stats', methods=['GET'])
def history_stats():
    """
    GET /history/stats
    Returns aggregate statistics over all predictions.
    """
    stats = get_history_stats()
    return jsonify(stats)


@history_bp.route('/sector-heatmap', methods=['GET'])
def sector_heatmap():
    """
    GET /sector-heatmap
    Returns per-sector aggregates for heatmap rendering.
    """
    data = get_sector_heatmap()
    return jsonify({'sectors': data, 'count': len(data)})
