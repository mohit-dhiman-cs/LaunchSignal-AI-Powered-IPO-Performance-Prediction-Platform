import requests
from bs4 import BeautifulSoup
import time
import re

# Simple in-memory cache
_cache = {"data": None, "timestamp": 0}
CACHE_TTL = 900  # 15 minutes

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

def _parse_float(val: str) -> float:
    """Extract float from a messy string like '₹120 (30%)' → 120."""
    if not val:
        return 0.0
    cleaned = re.sub(r'[^\d.\-]', '', str(val).replace(',', ''))
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def fetch_live_ipos() -> list[dict]:
    """
    Scrape live IPO data from ipowatch.in.
    Returns a list of dicts with company, gmp, retail_sub, qib_sub, nii_sub, issue_size, sector.
    Falls back to static sample data if scraping fails.
    """
    now = time.time()
    if _cache["data"] and (now - _cache["timestamp"]) < CACHE_TTL:
        return _cache["data"]

    try:
        result = _scrape_ipowatch()
        if result:
            _cache["data"] = result
            _cache["timestamp"] = now
            return result
    except Exception as e:
        print(f"[Scraper] ipowatch failed: {e}")

    try:
        result = _scrape_chittorgarh()
        if result:
            _cache["data"] = result
            _cache["timestamp"] = now
            return result
    except Exception as e:
        print(f"[Scraper] chittorgarh failed: {e}")

    # Fallback static data (used when both scrape sources fail)
    fallback = _get_fallback_data()
    _cache["data"] = fallback
    _cache["timestamp"] = now
    return fallback


def _scrape_ipowatch() -> list[dict]:
    url = "https://www.ipowatch.in/live-ipo-gmp/"
    resp = requests.get(url, headers=HEADERS, timeout=10)
    soup = BeautifulSoup(resp.text, "html.parser")

    results = []
    table = soup.find("table")
    if not table:
        return []

    rows = table.find_all("tr")[1:]  # skip header
    for row in rows:
        cols = [td.get_text(strip=True) for td in row.find_all("td")]
        if len(cols) < 4:
            continue
        try:
            company = cols[0]
            gmp = _parse_float(cols[2]) if len(cols) > 2 else 0.0
            issue_size = _parse_float(cols[3]) if len(cols) > 3 else 500.0
            results.append({
                "company": company,
                "gmp": gmp,
                "retail_sub": 0.0,
                "qib_sub": 0.0,
                "nii_sub": 0.0,
                "issue_size": issue_size,
                "sector": "Unknown",
                "source": "ipowatch.in"
            })
        except Exception:
            continue

    return results


def _scrape_chittorgarh() -> list[dict]:
    url = "https://www.chittorgarh.com/report/ipo-grey-market-premium-gmp-today/95/"
    resp = requests.get(url, headers=HEADERS, timeout=10)
    soup = BeautifulSoup(resp.text, "html.parser")

    results = []
    table = soup.find("table", {"id": lambda x: x and "ipo" in x.lower()}) or soup.find("table")
    if not table:
        return []

    rows = table.find_all("tr")[1:]
    for row in rows:
        cols = [td.get_text(strip=True) for td in row.find_all("td")]
        if len(cols) < 3:
            continue
        try:
            company = cols[0]
            gmp = _parse_float(cols[1])
            results.append({
                "company": company,
                "gmp": gmp,
                "retail_sub": 0.0,
                "qib_sub": 0.0,
                "nii_sub": 0.0,
                "issue_size": 500.0,
                "sector": "Unknown",
                "source": "chittorgarh.com"
            })
        except Exception:
            continue

    return results


def _get_fallback_data() -> list[dict]:
    """Static fallback with realistic IPO data when scraping is unavailable."""
    return [
        {
            "company": "Sample Tech IPO",
            "gmp": 85,
            "retail_sub": 45.2,
            "qib_sub": 78.5,
            "nii_sub": 32.1,
            "issue_size": 1200,
            "sector": "IT",
            "source": "fallback"
        },
        {
            "company": "Sample Pharma IPO",
            "gmp": 120,
            "retail_sub": 65.0,
            "qib_sub": 95.0,
            "nii_sub": 48.0,
            "issue_size": 800,
            "sector": "Pharma",
            "source": "fallback"
        },
        {
            "company": "Sample Finance IPO",
            "gmp": 35,
            "retail_sub": 12.5,
            "qib_sub": 28.0,
            "nii_sub": 8.0,
            "issue_size": 2000,
            "sector": "Finance",
            "source": "fallback"
        },
        {
            "company": "Sample FMCG IPO",
            "gmp": -10,
            "retail_sub": 2.1,
            "qib_sub": 3.5,
            "nii_sub": 1.2,
            "issue_size": 5000,
            "sector": "FMCG",
            "source": "fallback"
        },
    ]
