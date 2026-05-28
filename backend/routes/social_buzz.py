from flask import Blueprint, jsonify
from services.reddit_client import fetch_reddit_buzz
from database import get_connection
from datetime import datetime

social_buzz_bp = Blueprint('social_buzz', __name__)

@social_buzz_bp.route('/social-buzz/<company_name>', methods=['GET'])
def get_social_buzz(company_name: str):
    """
    GET /social-buzz/<company_name>
    Returns live sentiment, mention count, and trending buzz score for the company
    from r/IndianStreetBets and r/IndiaInvestments.
    Caches results in SQLite to optimize performance.
    """
    if not company_name:
        return jsonify({'error': 'company_name is required'}), 400
        
    # Check SQLite cache first
    conn = get_connection()
    row = conn.execute(
        'SELECT * FROM social_buzz WHERE LOWER(company_name) = LOWER(?)',
        (company_name,)
    ).fetchone()
    conn.close()
    
    # Cache duration: 2 hours
    if row:
        row = dict(row)
        last_updated = datetime.fromisoformat(row['updated_at'])
        age_hours = (datetime.now() - last_updated).total_seconds() / 3600.0
        if age_hours < 2.0:
            return jsonify({
                "company_name": company_name,
                "mention_count": row['mention_count'],
                "positive_mentions": row['positive_mentions'],
                "negative_mentions": row['negative_mentions'],
                "sentiment_score": row['sentiment_score'],
                "buzz_score": row['buzz_score'],
                "cached": True,
                "is_live": True
            })
            
    # Fetch fresh reddit buzz metrics
    try:
        data = fetch_reddit_buzz(company_name)
        
        # Save / update SQLite cache
        conn = get_connection()
        conn.execute('''
            INSERT INTO social_buzz (
                company_name, mention_count, positive_mentions, 
                negative_mentions, sentiment_score, buzz_score, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(company_name) DO UPDATE SET
                mention_count=excluded.mention_count,
                positive_mentions=excluded.positive_mentions,
                negative_mentions=excluded.negative_mentions,
                sentiment_score=excluded.sentiment_score,
                buzz_score=excluded.buzz_score,
                updated_at=excluded.updated_at
        ''', (
            company_name, data['mention_count'], data['positive_mentions'],
            data['negative_mentions'], data['sentiment_score'], data['buzz_score'],
            datetime.now().isoformat()
        ))
        conn.commit()
        conn.close()
        
        data['cached'] = False
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch social buzz: {str(e)}'}), 500
