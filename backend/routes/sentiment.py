from flask import Blueprint, jsonify, request
import xml.etree.ElementTree as ET
import requests
import re
import time

sentiment_bp = Blueprint('sentiment', __name__)

_cache = {}
CACHE_TTL = 600  # 10 minutes

POSITIVE = {
    'surge', 'gain', 'profit', 'strong', 'bullish', 'oversubscribed', 'premium',
    'rally', 'rise', 'climb', 'jump', 'soar', 'record', 'high', 'growth',
    'positive', 'robust', 'demand', 'allot', 'listing', 'boom', 'upbeat',
    'beat', 'exceed', 'outperform', 'interest', 'subscribe', 'good'
}
NEGATIVE = {
    'loss', 'weak', 'bearish', 'decline', 'fall', 'concern', 'risk',
    'disappoint', 'below', 'drop', 'crash', 'fear', 'caution', 'warning',
    'underperform', 'cut', 'fail', 'miss', 'poor', 'avoid', 'sell', 'low',
    'uncertain', 'volatile', 'dull', 'flat', 'cancel', 'withdraw'
}


def _score_text(text: str) -> float:
    words = re.findall(r'\b\w+\b', text.lower())
    pos = sum(1 for w in words if w in POSITIVE)
    neg = sum(1 for w in words if w in NEGATIVE)
    total = pos + neg
    if total == 0:
        return 0.0
    return round((pos - neg) / total, 3)


def _fetch_news(company: str) -> list:
    query = requests.utils.quote(f"{company} IPO India")
    url = (
        f"https://news.google.com/rss/search"
        f"?q={query}&hl=en-IN&gl=IN&ceid=IN:en"
    )
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 Chrome/124.0 Safari/537.36"
        )
    }
    resp = requests.get(url, headers=headers, timeout=8)
    root = ET.fromstring(resp.content)
    articles = []
    for item in root.findall('.//item')[:6]:
        title = item.findtext('title', '').strip()
        desc  = item.findtext('description', '').strip()
        pub   = item.findtext('pubDate', '').strip()
        link  = item.findtext('link', '').strip()
        if title:
            text  = f"{title} {desc}"
            score = _score_text(text)
            articles.append({
                "title":     title,
                "published": pub,
                "link":      link,
                "sentiment": score,
                "label": (
                    "Positive" if score > 0.1 else
                    "Negative" if score < -0.1 else
                    "Neutral"
                ),
            })
    return articles


@sentiment_bp.route('/api/sentiment', methods=['GET'])
def get_sentiment():
    company = request.args.get('company', '').strip()
    if not company:
        return jsonify({"error": "company name required"}), 400

    cache_key = company.lower()
    now = time.time()
    if cache_key in _cache and (now - _cache[cache_key]['ts']) < CACHE_TTL:
        return jsonify(_cache[cache_key]['data'])

    try:
        articles = _fetch_news(company)
        if not articles:
            return jsonify({"articles": [], "overall_score": 0, "overall_label": "Neutral", "count": 0})

        overall = round(sum(a['sentiment'] for a in articles) / len(articles), 3)
        label = (
            "Positive 🟢" if overall > 0.1 else
            "Negative 🔴" if overall < -0.1 else
            "Neutral 🟡"
        )
        result = {
            "articles":      articles,
            "overall_score": overall,
            "overall_label": label,
            "count":         len(articles),
            "company":       company,
        }
        _cache[cache_key] = {"data": result, "ts": now}
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e), "articles": [], "overall_score": 0, "overall_label": "Neutral"}), 200
