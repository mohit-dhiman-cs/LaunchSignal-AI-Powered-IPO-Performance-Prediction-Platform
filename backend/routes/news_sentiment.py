import os
import json
import time
from flask import Blueprint, jsonify, request
from database import get_connection
from services.rss_news import fetch_rss_news_sentiment

news_bp = Blueprint('news', __name__)

DEMO_HEADLINES = [
    {"title": "Strong institutional interest boosts IPO grey market premium", "url": "#", "publishedAt": "2026-05-28", "sentiment": "Positive"},
    {"title": "Retail investors show record subscription in recent IPOs", "url": "#", "publishedAt": "2026-05-27", "sentiment": "Positive"},
    {"title": "Market volatility poses risk for upcoming IPO listings", "url": "#", "publishedAt": "2026-05-26", "sentiment": "Negative"},
    {"title": "SEBI approves new IPO framework for SME listings", "url": "#", "publishedAt": "2026-05-25", "sentiment": "Neutral"},
    {"title": "Analysts mixed on IPO valuations amid rising interest rates", "url": "#", "publishedAt": "2026-05-24", "sentiment": "Neutral"},
]


def _get_cached(query):
    conn = get_connection()
    row = conn.execute(
        'SELECT * FROM sentiment_cache WHERE query = ?', (query.lower(),)
    ).fetchone()
    conn.close()
    if not row: return None
    row = dict(row)
    age_hours = (time.time() - row['cached_at']) / 3600
    if age_hours > 4: return None
    return {
        'sentiment': row['sentiment'],
        'score':     row['score'],
        'headlines': json.loads(row['headlines']),
        'cached':    True,
        'cached_minutes_ago': round(age_hours * 60),
    }


def _save_cache(query, sentiment, score, headlines):
    conn = get_connection()
    conn.execute(
        '''INSERT INTO sentiment_cache(query, sentiment, score, headlines, cached_at)
           VALUES(?,?,?,?,?)
           ON CONFLICT(query) DO UPDATE SET sentiment=excluded.sentiment,
           score=excluded.score, headlines=excluded.headlines, cached_at=excluded.cached_at''',
        (query.lower(), sentiment, score, json.dumps(headlines), time.time())
    )
    conn.commit()
    conn.close()


@news_bp.route('/news-sentiment', methods=['GET'])
def news_sentiment():
    query = (request.args.get('query') or '').strip()
    if not query:
        return jsonify({'error': 'query parameter required'}), 400

    # 1. Check SQLite cache first
    cached = _get_cached(query)
    if cached:
        return jsonify(cached)

    # 2. Try NewsAPI (if API key exists)
    api_key = os.environ.get('NEWS_API_KEY', '')
    if api_key:
        try:
            import urllib.request
            url = f"https://newsapi.org/v2/everything?q={urllib.request.quote(query+' IPO')}&language=en&pageSize=10&sortBy=publishedAt&apiKey={api_key}"
            with urllib.request.urlopen(url, timeout=5) as resp:
                news_data = json.loads(resp.read())
            articles = news_data.get('articles', [])
            if articles:
                # Let's map NewsAPI results
                from routes.news_sentiment import _analyze_headlines
                overall, score, headlines = _analyze_headlines(articles)
                _save_cache(query, overall, score, headlines)
                return jsonify({'sentiment': overall, 'score': score, 'headlines': headlines, 'cached': False, 'source': 'NewsAPI'})
        except Exception:
            pass

    # 3. Fallback: Google News RSS Search with TextBlob (Free, no key!)
    try:
        overall, score, headlines = fetch_rss_news_sentiment(query)
        if headlines:
            _save_cache(query, overall, score, headlines)
            return jsonify({'sentiment': overall, 'score': score, 'headlines': headlines, 'cached': False, 'source': 'Google News RSS'})
    except Exception as e:
        print(f"[*] Google News RSS fallback failed: {e}")

    # 4. Final Fallback: Demo headlines
    return jsonify({
        'sentiment': 'Neutral',
        'score': 0.5,
        'headlines': DEMO_HEADLINES,
        'cached': False,
        'demo': True,
        'source': 'Demo/Hardcoded'
    })
