import requests
from bs4 import BeautifulSoup
import urllib.parse
from textblob import TextBlob
from datetime import datetime

def fetch_rss_news_sentiment(query: str):
    """
    Fetches news from Google News RSS for the given query,
    parses the RSS items, and calculates their sentiment scores using TextBlob.
    Returns a tuple: (overall_sentiment, average_score, articles_list)
    """
    # Google News RSS Search URL
    encoded_query = urllib.parse.quote(f"{query} IPO")
    rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-IN&gl=IN&ceid=IN:en"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    articles = []
    scores = []
    
    try:
        resp = requests.get(rss_url, headers=headers, timeout=10)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'xml') # parse as xml
            items = soup.find_all('item')
            
            for item in items[:12]: # process top 12 articles
                title = item.find('title').get_text() if item.find('title') else ""
                link = item.find('link').get_text() if item.find('link') else "#"
                pub_date_str = item.find('pubDate').get_text() if item.find('pubDate') else ""
                
                # Format publish date
                # pubDate is usually like "Thu, 28 May 2026 08:00:00 GMT"
                pub_date = pub_date_str[:16] if pub_date_str else datetime.now().strftime("%a, %d %b %Y")
                
                if not title:
                    continue
                    
                # Calculate sentiment polarity using TextBlob (-1.0 to +1.0)
                blob = TextBlob(title)
                polarity = blob.sentiment.polarity
                
                # Map -1.0 -> 1.0 to a score of 0.0 -> 1.0 (with 0.5 as neutral)
                normalized_score = round((polarity + 1.0) / 2.0, 3)
                scores.append(normalized_score)
                
                # Classify sentiment
                if polarity > 0.05:
                    sentiment = "Positive"
                elif polarity < -0.05:
                    sentiment = "Negative"
                else:
                    sentiment = "Neutral"
                    
                articles.append({
                    "title": title,
                    "url": link,
                    "publishedAt": pub_date,
                    "sentiment": sentiment,
                    "score": normalized_score
                })
    except Exception as e:
        print(f"[RSS News] Failed to fetch news for query '{query}': {e}")
        
    # Calculate aggregate scores
    avg_score = round(sum(scores) / len(scores), 3) if scores else 0.500
    
    if avg_score >= 0.55:
        overall = "Positive"
    elif avg_score <= 0.45:
        overall = "Negative"
    else:
        overall = "Neutral"
        
    return overall, avg_score, articles
