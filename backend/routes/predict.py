from flask import Blueprint, jsonify, request
import joblib
import os
import sys
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'ml'))
from preprocess import preprocess, get_label_encoder, SECTOR_CATEGORIES

from utils import (
    classify_risk, compute_confidence, validate_input,
    compute_ipo_score, compute_feature_contributions
)
from database import log_prediction

predict_bp = Blueprint('predict', __name__)

BASE = os.path.dirname(os.path.dirname(__file__))
model        = joblib.load(os.path.join(BASE, 'model.pkl'))
scaler       = joblib.load(os.path.join(BASE, 'scaler.pkl'))
le           = joblib.load(os.path.join(BASE, 'label_encoder.pkl'))
feature_cols = joblib.load(os.path.join(BASE, 'feature_cols.pkl'))


def _fetch_market_trend():
    """Fetch live Nifty 50 daily % change via yfinance."""
    try:
        import yfinance as yf
        hist = yf.Ticker("^NSEI").history(period="5d")
        if len(hist) >= 2:
            return round(float(
                (hist['Close'].iloc[-1] - hist['Close'].iloc[-2]) / hist['Close'].iloc[-2]
            ), 4)
    except Exception:
        pass
    return 0.0


def _run_prediction(payload: dict, market_trend: float):
    """Core prediction logic — shared by /predict and /whatif."""
    row = {
        "gmp":         float(payload['gmp']),
        "retail_sub":  float(payload['retail_sub']),
        "qib_sub":     float(payload['qib_sub']),
        "nii_sub":     float(payload['nii_sub']),
        "issue_size":  float(payload['issue_size']),
        "sector":      str(payload['sector']),
        "market_trend": float(market_trend),
    }
    df = pd.DataFrame([row])
    X_scaled, _ = preprocess(df, scaler=scaler, le=le, fit=False)

    predicted_return = round(float(model.predict(X_scaled)[0]), 2)
    risk             = classify_risk(predicted_return)
    confidence       = compute_confidence(model, X_scaled)
    score            = compute_ipo_score(
        row['gmp'], row['retail_sub'], row['qib_sub'],
        row['nii_sub'], row['issue_size'], market_trend
    )
    contributions    = compute_feature_contributions(model, X_scaled, feature_cols)

    return predicted_return, risk, confidence, score, contributions, row


@predict_bp.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(force=True)
    valid, err = validate_input(data)
    if not valid:
        return jsonify({"error": err}), 400

    market_trend = data.get('market_trend') or _fetch_market_trend()
    predicted_return, risk, confidence, score, contributions, row = _run_prediction(data, market_trend)

    result = {
        "predicted_return":   predicted_return,
        "risk":               risk,
        "confidence":         confidence,
        "market_trend_used":  market_trend,
        "score":              score,
        "feature_impact":     contributions,
        "inputs":             row,
    }

    try:
        log_prediction({**row, **result, "company_name": data.get("company_name", "Unknown")})
    except Exception as e:
        print(f"[DB] Logging failed: {e}")

    return jsonify(result)


@predict_bp.route('/whatif', methods=['POST'])
def whatif():
    """
    Lightweight endpoint for the What-If simulator.
    Uses cached market trend (passed in payload) — no yfinance call for speed.
    """
    data = request.get_json(force=True)
    valid, err = validate_input(data)
    if not valid:
        return jsonify({"error": err}), 400

    market_trend = float(data.get('market_trend', 0.0))
    predicted_return, risk, confidence, score, contributions, _ = _run_prediction(data, market_trend)

    return jsonify({
        "predicted_return": predicted_return,
        "risk":             risk,
        "confidence":       confidence,
        "score":            score,
        "feature_impact":   contributions,
    })


@predict_bp.route('/history', methods=['GET'])
def history():
    from database import get_history
    return jsonify(get_history(limit=50))


@predict_bp.route('/sectors', methods=['GET'])
def sectors():
    return jsonify({"sectors": SECTOR_CATEGORIES})
