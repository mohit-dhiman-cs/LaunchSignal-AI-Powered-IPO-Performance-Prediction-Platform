import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'predictions.db')


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()

    # ── Original predictions table ────────────────────────────────────
    conn.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT,
            gmp REAL,
            retail_sub REAL,
            qib_sub REAL,
            nii_sub REAL,
            issue_size REAL,
            sector TEXT,
            market_trend REAL,
            predicted_return REAL,
            risk TEXT,
            confidence REAL,
            created_at TEXT
        )
    ''')

    # ── GMP history tracking ──────────────────────────────────────────
    conn.execute('''
        CREATE TABLE IF NOT EXISTS gmp_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL,
            gmp REAL NOT NULL,
            issue_price REAL,
            recorded_at TEXT NOT NULL
        )
    ''')

    # ── Users table (for auth) ────────────────────────────────────────
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            avatar_url TEXT,
            is_admin INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    ''')

    # ── Watchlist ─────────────────────────────────────────────────────
    conn.execute('''
        CREATE TABLE IF NOT EXISTS watchlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            company_name TEXT NOT NULL,
            sector TEXT,
            added_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # ── Portfolio ─────────────────────────────────────────────────────
    conn.execute('''
        CREATE TABLE IF NOT EXISTS portfolio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            company_name TEXT NOT NULL,
            lots_applied INTEGER DEFAULT 0,
            allotted INTEGER DEFAULT 0,
            issue_price REAL,
            listing_price REAL,
            listing_gain_pct REAL,
            applied_at TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # ── Sentiment Cache ───────────────────────────────────────────────
    conn.execute('''
        CREATE TABLE IF NOT EXISTS sentiment_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT UNIQUE NOT NULL,
            sentiment TEXT,
            score REAL,
            headlines TEXT,
            cached_at REAL
        )
    ''')

    # ── Community Posts ───────────────────────────────────────────────
    conn.execute('''
        CREATE TABLE IF NOT EXISTS community_posts (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER,
            author_name TEXT NOT NULL DEFAULT 'Anonymous',
            title       TEXT NOT NULL,
            body        TEXT NOT NULL,
            tag         TEXT DEFAULT 'Discussion',
            company     TEXT,
            sector      TEXT,
            sentiment   TEXT DEFAULT 'Neutral',
            upvotes     INTEGER DEFAULT 0,
            downvotes   INTEGER DEFAULT 0,
            is_pinned   INTEGER DEFAULT 0,
            is_removed  INTEGER DEFAULT 0,
            created_at  TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # ── Community Comments ────────────────────────────────────────────
    conn.execute('''
        CREATE TABLE IF NOT EXISTS community_comments (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id     INTEGER NOT NULL,
            user_id     INTEGER,
            author_name TEXT NOT NULL DEFAULT 'Anonymous',
            body        TEXT NOT NULL,
            upvotes     INTEGER DEFAULT 0,
            created_at  TEXT NOT NULL,
            FOREIGN KEY(post_id) REFERENCES community_posts(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # ── Community Votes ───────────────────────────────────────────────
    conn.execute('''
        CREATE TABLE IF NOT EXISTS community_votes (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id    INTEGER,
            comment_id INTEGER,
            voter_key  TEXT NOT NULL,
            vote       INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')

    # ── RHP Data ──────────────────────────────────────────────────────
    conn.execute('''
        CREATE TABLE IF NOT EXISTS rhp_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT UNIQUE NOT NULL,
            promoter_holding REAL,
            issue_size REAL,
            revenue REAL,
            pat REAL,
            objects_of_issue TEXT,
            risk_factors TEXT,
            updated_at TEXT NOT NULL
        )
    ''')

    # ── Social Buzz ───────────────────────────────────────────────────
    conn.execute('''
        CREATE TABLE IF NOT EXISTS social_buzz (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT UNIQUE NOT NULL,
            mention_count INTEGER DEFAULT 0,
            positive_mentions INTEGER DEFAULT 0,
            negative_mentions INTEGER DEFAULT 0,
            sentiment_score REAL DEFAULT 0.0,
            buzz_score REAL DEFAULT 0.0,
            updated_at TEXT NOT NULL
        )
    ''')

    conn.commit()
    conn.close()


# ── Original helpers ──────────────────────────────────────────────────

def log_prediction(data):
    conn = get_connection()
    conn.execute('''
        INSERT INTO predictions (
            company_name, gmp, retail_sub, qib_sub, nii_sub,
            issue_size, sector, market_trend,
            predicted_return, risk, confidence, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('company_name', 'Unknown'),
        data['gmp'], data['retail_sub'], data['qib_sub'],
        data['nii_sub'], data['issue_size'], data['sector'],
        data['market_trend'], data['predicted_return'],
        data['risk'], data['confidence'],
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()


def get_history(limit=50):
    conn = get_connection()
    rows = conn.execute(
        'SELECT * FROM predictions ORDER BY created_at DESC LIMIT ?', (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── GMP History helpers ───────────────────────────────────────────────

def save_gmp_history(company_name: str, gmp: float, issue_price: float = None):
    """Insert a new GMP data point for a company."""
    conn = get_connection()
    conn.execute(
        '''INSERT INTO gmp_history (company_name, gmp, issue_price, recorded_at)
           VALUES (?, ?, ?, ?)''',
        (company_name, gmp, issue_price, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()


def get_gmp_history(company_name: str, limit: int = 30) -> list:
    """Return GMP trend for a company ordered chronologically."""
    conn = get_connection()
    rows = conn.execute(
        '''SELECT * FROM gmp_history
           WHERE LOWER(company_name) = LOWER(?)
           ORDER BY recorded_at ASC
           LIMIT ?''',
        (company_name, limit)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Filtered History ──────────────────────────────────────────────────

def get_history_filtered(
    sector=None,
    year=None,
    min_return=None,
    max_return=None,
    risk=None,
    sort_by='created_at',
    limit=100
) -> list:
    """Return prediction history with optional filters."""
    allowed_sort = {'predicted_return', 'created_at', 'confidence', 'gmp'}
    if sort_by not in allowed_sort:
        sort_by = 'created_at'

    conditions = []
    params = []

    if sector:
        conditions.append('LOWER(sector) = LOWER(?)')
        params.append(sector)

    if year:
        conditions.append("strftime('%Y', created_at) = ?")
        params.append(str(year))

    if min_return is not None:
        conditions.append('predicted_return >= ?')
        params.append(float(min_return))

    if max_return is not None:
        conditions.append('predicted_return <= ?')
        params.append(float(max_return))

    if risk:
        conditions.append('LOWER(risk) = LOWER(?)')
        params.append(risk)

    where_clause = ('WHERE ' + ' AND '.join(conditions)) if conditions else ''
    params.append(int(limit))

    query = f'''
        SELECT * FROM predictions
        {where_clause}
        ORDER BY {sort_by} DESC
        LIMIT ?
    '''

    conn = get_connection()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── History Stats ─────────────────────────────────────────────────────

def get_history_stats() -> dict:
    """Return aggregate statistics over all predictions."""
    conn = get_connection()
    row = conn.execute('''
        SELECT
            ROUND(AVG(predicted_return), 2)  AS avg_return,
            ROUND(MAX(predicted_return), 2)  AS max_return,
            ROUND(MIN(predicted_return), 2)  AS min_return,
            COUNT(*)                          AS total_count,
            SUM(CASE WHEN predicted_return > 0 THEN 1 ELSE 0 END) AS positive_count
        FROM predictions
    ''').fetchone()
    conn.close()
    if row:
        return dict(row)
    return {
        'avg_return': None, 'max_return': None, 'min_return': None,
        'total_count': 0, 'positive_count': 0
    }


# ── Sector Heatmap ────────────────────────────────────────────────────

def get_sector_heatmap() -> list:
    """Return per-sector aggregates for the heatmap view."""
    conn = get_connection()
    rows = conn.execute('''
        SELECT
            sector,
            COUNT(*)                          AS count,
            ROUND(AVG(predicted_return), 2)   AS avg_return,
            ROUND(MAX(predicted_return), 2)   AS max_return,
            ROUND(MIN(predicted_return), 2)   AS min_return
        FROM predictions
        WHERE sector IS NOT NULL AND sector != ''
        GROUP BY LOWER(sector)
        ORDER BY avg_return DESC
    ''').fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Watchlist helpers ─────────────────────────────────────────────────

def get_watchlist(user_id: int) -> list:
    conn = get_connection()
    rows = conn.execute('SELECT * FROM watchlist WHERE user_id = ? ORDER BY added_at DESC', (user_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_watchlist(user_id: int, company_name: str, sector: str = None):
    conn = get_connection()
    existing = conn.execute('SELECT id FROM watchlist WHERE user_id=? AND LOWER(company_name)=LOWER(?)', (user_id, company_name)).fetchone()
    if existing:
        conn.close(); return {'error': 'Already in watchlist'}
    conn.execute('INSERT INTO watchlist (user_id, company_name, sector, added_at) VALUES (?,?,?,?)',
        (user_id, company_name, sector, datetime.now().isoformat()))
    conn.commit(); conn.close()
    return {'success': True}

def remove_watchlist(user_id: int, item_id: int):
    conn = get_connection()
    conn.execute('DELETE FROM watchlist WHERE id=? AND user_id=?', (item_id, user_id))
    conn.commit(); conn.close()


# ── Portfolio helpers ─────────────────────────────────────────────────

def get_portfolio(user_id: int) -> list:
    conn = get_connection()
    rows = conn.execute('SELECT * FROM portfolio WHERE user_id = ? ORDER BY applied_at DESC', (user_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_portfolio(user_id: int, data: dict):
    conn = get_connection()
    conn.execute('''
        INSERT INTO portfolio (user_id, company_name, lots_applied, allotted, issue_price, listing_price, listing_gain_pct, applied_at)
        VALUES (?,?,?,?,?,?,?,?)''',
        (user_id, data.get('company_name'), data.get('lots_applied', 0), data.get('allotted', 0),
         data.get('issue_price'), data.get('listing_price'), data.get('listing_gain_pct'),
         data.get('applied_at', datetime.now().isoformat())))
    conn.commit(); conn.close()

def update_portfolio_item(user_id: int, item_id: int, data: dict):
    fields = []
    params = []
    for key in ['lots_applied','allotted','issue_price','listing_price','listing_gain_pct']:
        if key in data:
            fields.append(f'{key}=?'); params.append(data[key])
    if not fields: return
    params += [item_id, user_id]
    conn = get_connection()
    conn.execute(f"UPDATE portfolio SET {', '.join(fields)} WHERE id=? AND user_id=?", params)
    conn.commit(); conn.close()

def remove_portfolio_item(user_id: int, item_id: int):
    conn = get_connection()
    conn.execute('DELETE FROM portfolio WHERE id=? AND user_id=?', (item_id, user_id))
    conn.commit(); conn.close()
