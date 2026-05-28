from flask import Blueprint, jsonify, request
import sys
import os

# Ensure backend root is on path so risk_analyzer.py can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from risk_analyzer import analyze_risk

risk_bp = Blueprint('risk', __name__)


@risk_bp.route('/risk-analysis', methods=['POST'])
def risk_analysis():
    """
    POST /risk-analysis
    Accepts the same inputs as /predict plus optional financial fields.

    Required body fields (same as /predict):
      gmp, retail_sub, qib_sub, nii_sub, issue_size, sector, market_trend

    Optional body fields:
      pe_ratio, debt_equity, revenue_growth, profit_margin

    Returns:
      overall_score, overall_severity, flags[], red_count, amber_count, green_count
    """
    data = request.get_json(force=True)

    # Validate required fields
    required = ['gmp', 'retail_sub', 'qib_sub', 'nii_sub', 'issue_size', 'sector']
    for field in required:
        if field not in data:
            return jsonify({'error': f"Missing required field: '{field}'"}), 400

    try:
        float(data['gmp'])
        float(data['retail_sub'])
        float(data['qib_sub'])
        float(data['nii_sub'])
        float(data['issue_size'])
    except (ValueError, TypeError):
        return jsonify({'error': 'Numeric fields must be valid numbers'}), 400

    if not isinstance(data.get('sector'), str) or len(data['sector']) > 100:
        return jsonify({'error': 'Sector must be a valid string under 100 characters'}), 400

    # Pass market_trend through if provided, otherwise default to 0.0
    market_trend = data.get('market_trend', 0.0)
    try:
        market_trend = float(market_trend)
    except (ValueError, TypeError):
        market_trend = 0.0

    inputs = {
        'gmp':           float(data['gmp']),
        'retail_sub':    float(data['retail_sub']),
        'qib_sub':       float(data['qib_sub']),
        'nii_sub':       float(data['nii_sub']),
        'issue_size':    float(data['issue_size']),
        'sector':        str(data['sector']),
        'market_trend':  market_trend,
        # Optional financials — passed through only if present
        'pe_ratio':      data.get('pe_ratio'),
        'debt_equity':   data.get('debt_equity'),
        'profit_margin': data.get('profit_margin'),
        'revenue_growth': data.get('revenue_growth'),
    }

    try:
        result = analyze_risk(inputs)
    except Exception as e:
        return jsonify({'error': f'Risk analysis failed: {str(e)}'}), 500

    return jsonify(result)
