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
    conn.commit()
    conn.close()

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
