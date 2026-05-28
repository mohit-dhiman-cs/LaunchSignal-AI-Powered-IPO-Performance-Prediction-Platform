from flask import Blueprint, jsonify, request
from services.nse_client import NSEClient

live_sub_bp = Blueprint('live_subscription', __name__)
client = NSEClient()

@live_sub_bp.route('/ipo/subscription/<company_name>', methods=['GET'])
def get_live_subscription(company_name: str):
    """
    GET /ipo/subscription/<company_name>
    Returns day-wise live subscription numbers (Day 1, Day 2, Day 3) for Retail, QIB, NII.
    """
    if not company_name:
        return jsonify({'error': 'company_name is required'}), 400
        
    # Derive stock ticker symbol (e.g. Zomato -> ZOMATO, Tata Technologies -> TATATECH)
    # Simple derivation, converting to uppercase clean ticker format
    symbol = company_name.upper().replace(" LIMITED", "").replace(" LTD", "").replace(" ", "").strip()
    
    try:
        data = client.fetch_live_subscription(symbol)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch subscription: {str(e)}'}), 500
