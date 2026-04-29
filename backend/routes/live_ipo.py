from flask import Blueprint, jsonify
from scraper import fetch_live_ipos

live_ipo_bp = Blueprint('live_ipo', __name__)

@live_ipo_bp.route('/api/live-ipos', methods=['GET'])
def live_ipos():
    """
    Returns current live IPOs with GMP and subscription data
    scraped from ipowatch.in / chittorgarh.com.
    """
    try:
        ipos = fetch_live_ipos()
        return jsonify({"ipos": ipos, "count": len(ipos)})
    except Exception as e:
        return jsonify({"error": str(e), "ipos": []}), 500
