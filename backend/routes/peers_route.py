from flask import Blueprint, jsonify, request
import sys
import os

# Ensure backend root is on path so peers.py can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from peers import get_peers, get_all_sectors

peers_bp = Blueprint('peers_route', __name__)


@peers_bp.route('/peers', methods=['GET'])
def peers():
    """
    GET /peers?sector=<sector>&company=<name>&limit=<n>
    Returns a list of peer companies in the same sector.
    Query params:
      - sector  : (required) sector name
      - company : (optional) company name to exclude from results
      - limit   : (optional) max results, default 5, max 20
    """
    sector = request.args.get('sector', '').strip()
    if not sector:
        return jsonify({'error': 'sector query parameter is required'}), 400

    company = request.args.get('company', '').strip() or None

    try:
        limit = min(int(request.args.get('limit', 5)), 20)
    except (ValueError, TypeError):
        limit = 5

    try:
        result = get_peers(sector=sector, company_name=company, limit=limit)
    except Exception as e:
        return jsonify({'error': f'Failed to load peer data: {str(e)}'}), 500

    return jsonify({
        'sector': sector,
        'company': company,
        'count': len(result),
        'peers': result
    })


@peers_bp.route('/peers/sectors', methods=['GET'])
def peer_sectors():
    """
    GET /peers/sectors
    Returns all available sectors from the peer companies dataset.
    """
    try:
        sectors = get_all_sectors()
    except Exception as e:
        return jsonify({'error': f'Failed to load sectors: {str(e)}'}), 500

    return jsonify({'sectors': sectors, 'count': len(sectors)})
