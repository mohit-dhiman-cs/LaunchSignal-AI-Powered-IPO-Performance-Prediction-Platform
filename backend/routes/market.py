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

COMMODITIES = {
    "gold":       "GC=F",
    "silver":     "SI=F",
}

@market_bp.route('/market/analysis', methods=['GET'])
def market_analysis():
    period = request.args.get('period', '1mo')  # 1wk, 1mo, 3mo, 6mo, 1y
    results = {}
    commodities_res = {}

    # Fetch live USD to INR rate for conversion
    usd_inr_rate = 83.50 # Fallback
    try:
        usd_inr_rate = float(yf.Ticker("INR=X").fast_info.last_price)
    except Exception:
        pass

    def fetch_data(ticker_dict, target_dict, is_commodity=False):
        for name, ticker in ticker_dict.items():
            try:
                t = yf.Ticker(ticker)
                info = t.fast_info
                hist = t.history(period=period)

                if hist.empty:
                    continue

                multiplier = 1.0
                if is_commodity:
                    multiplier = usd_inr_rate
                    if name == "gold":
                        # Convert from Troy Ounces to Grams (1 Troy Ounce = 31.1034768 grams)
                        multiplier = usd_inr_rate / 31.1034768
                    elif name == "silver":
                        # Convert from Troy Ounces to Grams
                        multiplier = usd_inr_rate / 31.1034768

                close_series = hist['Close'] * multiplier
                
                target_dict[name] = {
                    "ticker": ticker,
                    "current": round(float(close_series.iloc[-1]), 2),
                    "prev_close": round(float(close_series.iloc[-2]), 2) if len(close_series) > 1 else None,
                    "change": round(float(close_series.iloc[-1] - close_series.iloc[-2]), 2) if len(close_series) > 1 else 0,
                    "change_pct": round(float((close_series.iloc[-1] - close_series.iloc[-2]) / close_series.iloc[-2] * 100), 2) if len(close_series) > 1 else 0,
                    "high_52w": round(float(info.year_high * multiplier), 2) if hasattr(info, 'year_high') and info.year_high else None,
                    "low_52w": round(float(info.year_low * multiplier), 2) if hasattr(info, 'year_low') and info.year_low else None,
                    "chart": [
                        {"date": str(d.date()), "close": round(float(v), 2)}
                        for d, v in zip(hist.index, close_series)
                    ]
                }
            except Exception as e:
                target_dict[name] = {"error": str(e)}

    # Fetch main indices & commodities
    fetch_data(INDICES, results, is_commodity=False)
    fetch_data(COMMODITIES, commodities_res, is_commodity=True)

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
        "commodities": commodities_res,
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
