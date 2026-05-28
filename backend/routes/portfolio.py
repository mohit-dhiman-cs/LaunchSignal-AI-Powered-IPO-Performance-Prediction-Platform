from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_portfolio, add_portfolio, update_portfolio_item, remove_portfolio_item

portfolio_bp = Blueprint('portfolio', __name__, url_prefix='/portfolio')


@portfolio_bp.route('', methods=['GET'])
@jwt_required()
def get():
    user_id = int(get_jwt_identity())
    items = get_portfolio(user_id)
    # Compute P&L summary
    total_invested = 0
    total_current  = 0
    for item in items:
        if item.get('issue_price') and item.get('lots_applied'):
            lot_size = 1  # approximate — user sets allotment
            invested = item['issue_price'] * item.get('lots_applied', 1) * lot_size
            total_invested += invested
            if item.get('listing_price'):
                total_current += item['listing_price'] * item.get('lots_applied', 1) * lot_size

    summary = {
        'total_ipos': len(items),
        'allotted_count': sum(1 for i in items if i.get('allotted', 0) > 0),
        'total_invested': round(total_invested, 2),
        'total_current': round(total_current, 2),
        'total_gain_pct': round((total_current - total_invested) / total_invested * 100, 2) if total_invested else 0,
    }
    return jsonify({'portfolio': items, 'summary': summary})


@portfolio_bp.route('', methods=['POST'])
@jwt_required()
def add():
    user_id = int(get_jwt_identity())
    data = request.get_json(force=True) or {}
    company = (data.get('company_name') or '').strip()
    if not company:
        return jsonify({'error': 'company_name required'}), 400
    add_portfolio(user_id, {**data, 'company_name': company})
    return jsonify({'message': f'{company} added to portfolio', 'success': True}), 201


@portfolio_bp.route('/<int:item_id>', methods=['PATCH'])
@jwt_required()
def update(item_id):
    user_id = int(get_jwt_identity())
    data = request.get_json(force=True) or {}
    update_portfolio_item(user_id, item_id, data)
    return jsonify({'message': 'Updated'})


@portfolio_bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove(item_id):
    user_id = int(get_jwt_identity())
    remove_portfolio_item(user_id, item_id)
    return jsonify({'message': 'Removed from portfolio'})
