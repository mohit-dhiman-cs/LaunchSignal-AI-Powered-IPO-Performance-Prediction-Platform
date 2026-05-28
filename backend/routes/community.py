from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from database import get_connection
from datetime import datetime

community_bp = Blueprint('community', __name__, url_prefix='/community')

ALLOWED_TAGS = ['Bullish 📈', 'Bearish 📉', 'Analysis 🧠', 'Question ❓',
                'GMP Update 💹', 'Allotment 🎯', 'Listing Day 🚀', 'Discussion 💬', 'Warning ⚠️']

BAD_WORDS = ['spam', 'scam', 'fake', 'fraud']  # Basic moderation list


def _get_voter_key(user_id=None):
    """Unique key per voter — user_id if logged in, else IP."""
    if user_id:
        return f"u:{user_id}"
    return f"ip:{request.remote_addr}"


def _has_voted(conn, post_id=None, comment_id=None, voter_key=None):
    if post_id:
        row = conn.execute(
            'SELECT vote FROM community_votes WHERE post_id=? AND voter_key=? AND comment_id IS NULL',
            (post_id, voter_key)
        ).fetchone()
    else:
        row = conn.execute(
            'SELECT vote FROM community_votes WHERE comment_id=? AND voter_key=?',
            (comment_id, voter_key)
        ).fetchone()
    return dict(row)['vote'] if row else None


def _basic_moderate(text):
    tl = text.lower()
    for bw in BAD_WORDS:
        if bw in tl:
            return False
    return True


def _seed_demo_posts():
    """Seed database with a few starter posts if empty."""
    conn = get_connection()
    count = conn.execute('SELECT COUNT(*) as c FROM community_posts').fetchone()['c']
    if count == 0:
        demo = [
            ('IPO Genie Community 🚀', '📢 Welcome to the LaunchSignal community! Share your IPO predictions, insights, GMP updates, and analysis here. Let\'s build India\'s most informed IPO investing community together!\n\n✅ Be respectful and constructive\n✅ Share analysis, not just tips\n✅ Mark speculative posts clearly', 'Discussion 💬', None, None, 'Neutral', 1),
            ('Swiggy IPO — Bullish case 🛵', 'Swiggy has a strong brand moat in food delivery. With Zomato trading at 3x revenue, Swiggy IPO at 2.5x looks reasonable. GMP is holding steady at ₹15-20 above issue price. QIB subscription is likely to be 40x+.\n\n📊 My prediction: +18% to +25% listing gain\n⚠️ Risk: Competition from Zomato + ONDC disruption', 'Bullish 📈', 'Swiggy', 'Consumer Tech', 'Positive', 0),
            ('Why I\'m avoiding high-debt IPOs right now', 'With interest rates still elevated, companies with D/E ratio > 2.0 are getting punished at listing. I\'ve noticed 3 recent IPOs with high debt listed below issue price.\n\nAlways check the balance sheet in the RHP before subscribing. Profit margin < 5% combined with high debt = red flag for me.\n\n📉 Risk > Reward for highly leveraged IPOs.', 'Analysis 🧠', None, 'Finance', 'Negative', 0),
            ('What does GMP of 50% mean? (Beginner question)', 'I\'m new to IPO investing. If an IPO\'s issue price is ₹500 and GMP is ₹250, does that mean the listing price will be ₹750? How reliable is GMP?\n\nAlso — how do people track GMP? Is there any official source?', 'Question ❓', None, None, 'Neutral', 0),
        ]
        now = datetime.now().isoformat()
        for title, body, tag, company, sector, sentiment, pinned in demo:
            conn.execute(
                '''INSERT INTO community_posts (author_name, title, body, tag, company, sector, sentiment, upvotes, is_pinned, created_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?)''',
                ('LaunchSignal Team' if pinned else 'IPO Analyst', title, body, tag, company, sector, sentiment, pinned * 5, pinned, now)
            )
        conn.commit()
    conn.close()


# ── GET /community/posts ─────────────────────────────────────────────────────
@community_bp.route('/posts', methods=['GET'])
def get_posts():
    _seed_demo_posts()
    sort   = request.args.get('sort', 'hot')     # hot | new | top
    tag    = request.args.get('tag', '')
    page   = int(request.args.get('page', 1))
    limit  = min(int(request.args.get('limit', 20)), 50)
    offset = (page - 1) * limit

    conditions = ['is_removed = 0']
    params = []
    if tag:
        conditions.append('tag = ?')
        params.append(tag)

    where = 'WHERE ' + ' AND '.join(conditions)

    if sort == 'hot':
        order = 'is_pinned DESC, (upvotes - downvotes + (strftime("%s","now") - strftime("%s", created_at)) / -3600.0) DESC'
    elif sort == 'top':
        order = 'is_pinned DESC, (upvotes - downvotes) DESC'
    else:  # new
        order = 'is_pinned DESC, created_at DESC'

    conn = get_connection()
    total = conn.execute(f'SELECT COUNT(*) as c FROM community_posts {where}', params).fetchone()['c']
    rows  = conn.execute(
        f'SELECT * FROM community_posts {where} ORDER BY {order} LIMIT ? OFFSET ?',
        params + [limit, offset]
    ).fetchall()

    # Get comment counts
    posts = []
    for r in rows:
        p = dict(r)
        p['comment_count'] = conn.execute(
            'SELECT COUNT(*) as c FROM community_comments WHERE post_id=?', (p['id'],)
        ).fetchone()['c']
        p['score'] = p['upvotes'] - p['downvotes']
        posts.append(p)

    conn.close()
    return jsonify({ 'posts': posts, 'total': total, 'page': page, 'pages': -(-total // limit) })


# ── POST /community/posts ─────────────────────────────────────────────────────
@community_bp.route('/posts', methods=['POST'])
def create_post():
    user_id     = None
    author_name = 'Anonymous'
    try:
        verify_jwt_in_request(optional=True)
        uid = get_jwt_identity()
        if uid:
            user_id = int(uid)
            conn = get_connection()
            u = conn.execute('SELECT name FROM users WHERE id=?', (user_id,)).fetchone()
            conn.close()
            if u: author_name = u['name']
    except Exception:
        pass

    data = request.get_json(force=True) or {}
    title     = (data.get('title') or '').strip()[:200]
    body      = (data.get('body')  or '').strip()[:5000]
    tag       = data.get('tag', 'Discussion 💬')
    company   = (data.get('company') or '').strip()[:100] or None
    sector    = (data.get('sector') or '').strip() or None
    sentiment = data.get('sentiment', 'Neutral')

    if not title or not body:
        return jsonify({'error': 'title and body are required'}), 400
    if tag not in ALLOWED_TAGS:
        tag = 'Discussion 💬'
    if not _basic_moderate(title + ' ' + body):
        return jsonify({'error': 'Post flagged by moderation filters'}), 400

    conn = get_connection()
    cur = conn.execute(
        '''INSERT INTO community_posts (user_id, author_name, title, body, tag, company, sector, sentiment, created_at)
           VALUES (?,?,?,?,?,?,?,?,?)''',
        (user_id, author_name, title, body, tag, company, sector, sentiment, datetime.now().isoformat())
    )
    post_id = cur.lastrowid
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'post_id': post_id, 'message': 'Post created'}), 201


# ── POST /community/posts/<id>/vote ──────────────────────────────────────────
@community_bp.route('/posts/<int:post_id>/vote', methods=['POST'])
def vote_post(post_id):
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        uid = get_jwt_identity()
        if uid: user_id = int(uid)
    except Exception:
        pass

    data  = request.get_json(force=True) or {}
    value = 1 if data.get('vote') == 'up' else -1
    voter_key = _get_voter_key(user_id)
    now = datetime.now().isoformat()

    conn = get_connection()
    existing = _has_voted(conn, post_id=post_id, voter_key=voter_key)

    if existing == value:
        # Toggle off
        conn.execute('DELETE FROM community_votes WHERE post_id=? AND voter_key=? AND comment_id IS NULL', (post_id, voter_key))
        if value == 1:
            conn.execute('UPDATE community_posts SET upvotes = MAX(0, upvotes-1) WHERE id=?', (post_id,))
        else:
            conn.execute('UPDATE community_posts SET downvotes = MAX(0, downvotes-1) WHERE id=?', (post_id,))
        action = 'removed'
    elif existing is not None:
        # Change vote
        conn.execute('UPDATE community_votes SET vote=?, created_at=? WHERE post_id=? AND voter_key=? AND comment_id IS NULL', (value, now, post_id, voter_key))
        if value == 1:
            conn.execute('UPDATE community_posts SET upvotes=upvotes+1, downvotes=MAX(0,downvotes-1) WHERE id=?', (post_id,))
        else:
            conn.execute('UPDATE community_posts SET downvotes=downvotes+1, upvotes=MAX(0,upvotes-1) WHERE id=?', (post_id,))
        action = 'changed'
    else:
        conn.execute('INSERT INTO community_votes (post_id, voter_key, vote, created_at) VALUES (?,?,?,?)', (post_id, voter_key, value, now))
        if value == 1:
            conn.execute('UPDATE community_posts SET upvotes=upvotes+1 WHERE id=?', (post_id,))
        else:
            conn.execute('UPDATE community_posts SET downvotes=downvotes+1 WHERE id=?', (post_id,))
        action = 'voted'

    conn.commit()
    post = dict(conn.execute('SELECT upvotes, downvotes FROM community_posts WHERE id=?', (post_id,)).fetchone())
    conn.close()
    return jsonify({ 'action': action, 'upvotes': post['upvotes'], 'downvotes': post['downvotes'], 'score': post['upvotes'] - post['downvotes'] })


# ── GET /community/posts/<id>/comments ──────────────────────────────────────
@community_bp.route('/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    conn = get_connection()
    rows = conn.execute(
        'SELECT * FROM community_comments WHERE post_id=? ORDER BY upvotes DESC, created_at ASC', (post_id,)
    ).fetchall()
    conn.close()
    return jsonify({'comments': [dict(r) for r in rows]})


# ── POST /community/posts/<id>/comments ─────────────────────────────────────
@community_bp.route('/posts/<int:post_id>/comments', methods=['POST'])
def add_comment(post_id):
    user_id     = None
    author_name = 'Anonymous'
    try:
        verify_jwt_in_request(optional=True)
        uid = get_jwt_identity()
        if uid:
            user_id = int(uid)
            conn2 = get_connection()
            u = conn2.execute('SELECT name FROM users WHERE id=?', (user_id,)).fetchone()
            conn2.close()
            if u: author_name = u['name']
    except Exception:
        pass

    data = request.get_json(force=True) or {}
    body = (data.get('body') or '').strip()[:2000]
    if not body:
        return jsonify({'error': 'body required'}), 400
    if not _basic_moderate(body):
        return jsonify({'error': 'Comment flagged by moderation'}), 400

    conn = get_connection()
    cur = conn.execute(
        'INSERT INTO community_comments (post_id, user_id, author_name, body, created_at) VALUES (?,?,?,?,?)',
        (post_id, user_id, author_name, body, datetime.now().isoformat())
    )
    comment_id = cur.lastrowid
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'comment_id': comment_id}), 201


# ── DELETE /community/posts/<id> (admin / author) ────────────────────────────
@community_bp.route('/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    user_id = int(get_jwt_identity())
    conn = get_connection()
    post = conn.execute('SELECT user_id FROM community_posts WHERE id=?', (post_id,)).fetchone()
    if not post:
        conn.close(); return jsonify({'error': 'Not found'}), 404
    if post['user_id'] != user_id:
        conn.close(); return jsonify({'error': 'You can only delete your own posts'}), 403
    conn.execute('UPDATE community_posts SET is_removed=1 WHERE id=?', (post_id,))
    conn.commit(); conn.close()
    return jsonify({'message': 'Post removed'})

