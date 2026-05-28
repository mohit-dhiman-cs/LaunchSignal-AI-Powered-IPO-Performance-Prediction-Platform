from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_watchlist, add_watchlist, remove_watchlist

watchlist_bp = Blueprint('watchlist', __name__, url_prefix='/watchlist')


@watchlist_bp.route('', methods=['GET'])
@jwt_required()
def get():
    user_id = int(get_jwt_identity())
    return jsonify({'watchlist': get_watchlist(user_id)})


@watchlist_bp.route('', methods=['POST'])
@jwt_required()
def add():
    user_id = int(get_jwt_identity())
    data = request.get_json(force=True) or {}
    company = (data.get('company_name') or '').strip()
    sector  = (data.get('sector') or '').strip() or None
    if not company:
        return jsonify({'error': 'company_name required'}), 400
    result = add_watchlist(user_id, company, sector)
    if 'error' in result:
        return jsonify(result), 409
    return jsonify({'message': f'{company} added to watchlist', 'success': True}), 201


@watchlist_bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove(item_id):
    user_id = int(get_jwt_identity())
    remove_watchlist(user_id, item_id)
    return jsonify({'message': 'Removed from watchlist'})
