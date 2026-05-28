import re
from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
import bcrypt
from database import get_connection

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


def _get_user_by_email(email):
    conn = get_connection()
    row = conn.execute('SELECT * FROM users WHERE email = ?', (email.lower(),)).fetchone()
    conn.close()
    return dict(row) if row else None


def _create_user(name, email, password):
    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    conn = get_connection()
    cursor = conn.execute(
        'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
        (name.strip(), email.lower(), pw_hash, datetime.now().isoformat())
    )
    user_id = cursor.lastrowid
    conn.commit()
    row = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return dict(row)


def _safe_user(u):
    return {'id': u['id'], 'name': u['name'], 'email': u['email'], 'created_at': u['created_at']}


# ── POST /auth/register ────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(force=True) or {}
    name     = (data.get('name') or '').strip()
    email    = (data.get('email') or '').strip()
    password = (data.get('password') or '')

    if not name:
        return jsonify({'error': 'Name is required'}), 400
    if not email or not EMAIL_RE.match(email):
        return jsonify({'error': 'Valid email is required'}), 400
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    if _get_user_by_email(email):
        return jsonify({'error': 'An account with this email already exists'}), 409

    user = _create_user(name, email, password)
    return jsonify({'message': 'Account created successfully', 'user': _safe_user(user)}), 201


# ── POST /auth/login ───────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(force=True) or {}
    email    = (data.get('email') or '').strip()
    password = (data.get('password') or '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = _get_user_by_email(email)
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401

    if not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
        return jsonify({'error': 'Invalid email or password'}), 401

    access_token  = create_access_token(identity=str(user['id']))
    refresh_token = create_refresh_token(identity=str(user['id']))

    return jsonify({
        'access_token':  access_token,
        'refresh_token': refresh_token,
        'user': _safe_user(user)
    })


# ── POST /auth/refresh ─────────────────────────────────────────────────
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify({'access_token': access_token})


# ── GET /auth/me ───────────────────────────────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    conn = get_connection()
    row = conn.execute('SELECT * FROM users WHERE id = ?', (int(user_id),)).fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(_safe_user(dict(row)))


# ── POST /auth/logout ──────────────────────────────────────────────────
@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully'})
