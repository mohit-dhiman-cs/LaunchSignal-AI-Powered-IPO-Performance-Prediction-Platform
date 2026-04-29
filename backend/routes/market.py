from flask import Blueprint, jsonify, request
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

market_bp = Blueprint('market', __name__)

INDICES = {
    "nifty50":    "^NSEI",
    "sensex":     "^BSESN",
    "niftybank":  "^NSEBANK",
    "niftymid50": "^NSEMDCP50",
}

SECTOR_ETFS = {
    "IT":        "^CNXit",
    "Pharma":    "^CNXPHARMA",
    "Banking":   "^NSEBANK",
    "FMCG":      "^CNXFMCG",
    "Auto":      "^CNXAUTO",
    "Infra":     "^CNXINFRA",
}


@market_bp.route('/market/analysis', methods=['GET'])
def market_analysis():
    period = request.args.get('period', '1mo')  # 1wk, 1mo, 3mo, 6mo, 1y
    results = {}

    # Fetch main indices
    for name, ticker in INDICES.items():
        try:
            t = yf.Ticker(ticker)
            info = t.fast_info
            hist = t.history(period=period)

            if hist.empty:
                continue

            close_series = hist['Close']
            results[name] = {
                "ticker": ticker,
                "current": round(float(close_series.iloc[-1]), 2),
                "prev_close": round(float(close_series.iloc[-2]), 2) if len(close_series) > 1 else None,
                "change": round(float(close_series.iloc[-1] - close_series.iloc[-2]), 2) if len(close_series) > 1 else 0,
                "change_pct": round(float((close_series.iloc[-1] - close_series.iloc[-2]) / close_series.iloc[-2] * 100), 2) if len(close_series) > 1 else 0,
                "high_52w": round(float(info.year_high), 2) if hasattr(info, 'year_high') and info.year_high else None,
                "low_52w": round(float(info.year_low), 2) if hasattr(info, 'year_low') and info.year_low else None,
                "chart": [
                    {"date": str(d.date()), "close": round(float(v), 2)}
                    for d, v in zip(hist.index, close_series)
                ]
            }
        except Exception as e:
            results[name] = {"error": str(e)}

    # Market sentiment score (based on Nifty50 performance)
    sentiment = "Neutral"
    try:
        n50 = results.get("nifty50", {})
        chg = n50.get("change_pct", 0)
        if chg >= 1.0:
            sentiment = "Bullish 🟢"
        elif chg >= 0:
            sentiment = "Mildly Bullish 🟡"
        elif chg >= -1.0:
            sentiment = "Mildly Bearish 🟠"
        else:
            sentiment = "Bearish 🔴"
    except Exception:
        pass

    return jsonify({
        "indices": results,
        "sentiment": sentiment,
        "last_updated": datetime.now().isoformat()
    })


@market_bp.route('/market/sector-performance', methods=['GET'])
def sector_performance():
    """Returns % returns of sector indices."""
    period = request.args.get('period', '1mo')
    result = {}
    for sector, ticker in SECTOR_ETFS.items():
        try:
            hist = yf.Ticker(ticker).history(period=period)
            if hist.empty:
                continue
            start = float(hist['Close'].iloc[0])
            end = float(hist['Close'].iloc[-1])
            ret = round((end - start) / start * 100, 2)
            result[sector] = {"return_pct": ret, "ticker": ticker}
        except Exception as e:
            result[sector] = {"error": str(e)}
    return jsonify(result)
