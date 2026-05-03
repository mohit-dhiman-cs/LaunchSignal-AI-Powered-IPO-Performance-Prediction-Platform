import requests
import xml.etree.ElementTree as ET
from textblob import TextBlob

def analyze_ipo_sentiment(company_name):
    """
    Scrapes Google News RSS for the company IPO and performs NLP sentiment analysis on the headlines.
    Returns the overall sentiment score (-1 to 1) and top headlines with their individual sentiment.
    """
    if not company_name or company_name == "Unknown":
        return None

    query = f"{company_name} IPO India"
    url = f"https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"
    
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        
        root = ET.fromstring(response.content)
        items = root.findall('.//item')
        
        if not items:
            return None
            
        headlines = []
        total_polarity = 0.0
        
        # Take up to top 5 news articles
        for item in items[:5]:
            title = item.find('title').text
            
            # Use TextBlob for NLP Sentiment Analysis
            # polarity ranges from -1 (very negative) to +1 (very positive)
            blob = TextBlob(title)
            polarity = blob.sentiment.polarity
            
            # Determine label
            if polarity > 0.15:
                label = "Bullish"
            elif polarity < -0.15:
                label = "Bearish"
            else:
                label = "Neutral"
                
            headlines.append({
                "headline": title.split(" - ")[0], # Remove publisher name from title
                "polarity": round(polarity, 2),
                "label": label
            })
            total_polarity += polarity
            
        avg_polarity = round(total_polarity / len(headlines), 2)
        
        if avg_polarity > 0.15:
            overall = "Bullish Hype"
        elif avg_polarity < -0.15:
            overall = "Negative Sentiment"
        else:
            overall = "Neutral"
            
        return {
            "score": avg_polarity,
            "sentiment": overall,
            "headlines": headlines
        }
        
    except Exception as e:
        print(f"[NLP ERROR] Failed to fetch news sentiment for {company_name}: {e}")
        return None
