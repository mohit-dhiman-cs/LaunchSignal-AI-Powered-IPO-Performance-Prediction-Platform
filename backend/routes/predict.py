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
from database import log_prediction, save_gmp_history
from nlp_engine import analyze_ipo_sentiment
from risk_analyzer import analyze_risk

predict_bp = Blueprint('predict', __name__)

BASE = os.path.dirname(os.path.dirname(__file__))
model        = joblib.load(os.path.join(BASE, 'model.pkl'))
scaler       = joblib.load(os.path.join(BASE, 'scaler.pkl'))
le           = joblib.load(os.path.join(BASE, 'label_encoder.pkl'))
feature_cols = joblib.load(os.path.join(BASE, 'feature_cols.pkl'))

models_dict = None
try:
    models_dict = joblib.load(os.path.join(BASE, 'models_dict.pkl'))
except Exception:
    pass


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

    # Allow frontend to select which model to use
    selected_model = model
    model_name = payload.get('model_type', 'AI Ensemble (RF + GB)')
    if models_dict and model_name in models_dict:
        selected_model = models_dict[model_name]['model']
    else:
        model_name = "AI Ensemble (RF + GB)"

    predicted_return = round(float(selected_model.predict(X_scaled)[0]), 2)
    risk             = classify_risk(predicted_return)
    confidence       = compute_confidence(selected_model, X_scaled)
    score            = compute_ipo_score(
        row['gmp'], row['retail_sub'], row['qib_sub'],
        row['nii_sub'], row['issue_size'], market_trend
    )
    contributions    = compute_feature_contributions(selected_model, X_scaled, feature_cols)

    comparisons = []
    profit_probability = None

    if models_dict:
        for m_name, m_data in models_dict.items():
            if m_name == 'Classifier':
                # Run the two-step AI classification
                prob = m_data['model'].predict_proba(X_scaled)[0]
                profit_probability = round(prob[1] * 100, 1)  # Probability of class 1 (Profit)
                continue

            pred = round(float(m_data['model'].predict(X_scaled)[0]), 2)
            comparisons.append({
                "name": m_name,
                "prediction": pred,
                "r2": round(m_data['r2'], 3)
            })

    return predicted_return, risk, confidence, score, contributions, row, comparisons, profit_probability, model_name


@predict_bp.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(force=True)
    valid, err = validate_input(data)
    if not valid:
        return jsonify({"error": err}), 400

    market_trend = data.get('market_trend') or _fetch_market_trend()
    predicted_return, risk, confidence, score, contributions, row, comparisons, profit_prob, model_name = _run_prediction(data, market_trend)

    # ── Confidence interval ──────────────────────────────────────────
    margin = (1 - confidence) * 50
    confidence_low  = round(predicted_return - margin, 2)
    confidence_high = round(predicted_return + margin, 2)

    # ── Listing price range (if issue_price provided) ────────────────
    listing_price_range = None
    issue_price = data.get('issue_price')
    if issue_price is not None:
        try:
            ip = float(issue_price)
            listing_price_range = {
                'low':  round(ip * (1 + confidence_low  / 100), 2),
                'high': round(ip * (1 + confidence_high / 100), 2),
            }
        except (ValueError, TypeError):
            pass

    # ── NLP Sentiment Analysis ───────────────────────────────────────
    nlp_sentiment = analyze_ipo_sentiment(data.get("company_name", "Unknown"))

    # ── AI Risk Analysis ─────────────────────────────────────────────
    risk_inputs = {**row, 'market_trend': market_trend}
    for optional_key in ('pe_ratio', 'debt_equity', 'profit_margin', 'revenue_growth'):
        if optional_key in data:
            risk_inputs[optional_key] = data[optional_key]
    try:
        risk_analysis_result = analyze_risk(risk_inputs)
    except Exception as e:
        risk_analysis_result = {'error': str(e)}

    result = {
        "predicted_return":   predicted_return,
        "risk":               risk,
        "confidence":         confidence,
        "confidence_low":     confidence_low,
        "confidence_high":    confidence_high,
        "listing_price_range": listing_price_range,
        "market_trend_used":  market_trend,
        "score":              score,
        "feature_impact":     contributions,
        "comparisons":        comparisons,
        "inputs":             row,
        "profit_probability": profit_prob,
        "model_used":         model_name,
        "nlp_analysis":       nlp_sentiment,
        "risk_analysis":      risk_analysis_result,
    }

    try:
        log_prediction({**row, **result, "company_name": data.get("company_name", "Unknown")})
    except Exception as e:
        print(f"[DB] Logging failed: {e}")

    # ── Track GMP history ────────────────────────────────────────────
    company_name = data.get("company_name", "").strip()
    if company_name:
        try:
            save_gmp_history(
                company_name=company_name,
                gmp=row['gmp'],
                issue_price=issue_price
            )
        except Exception as e:
            print(f"[DB] GMP history logging failed: {e}")

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
    predicted_return, risk, confidence, score, contributions, _, comparisons, profit_prob, model_name = _run_prediction(data, market_trend)

    margin = round((1 - confidence) * 50, 2)
    confidence_low  = round(predicted_return - margin, 2)
    confidence_high = round(predicted_return + margin, 2)

    return jsonify({
        "predicted_return":  predicted_return,
        "risk":              risk,
        "confidence":        confidence,
        "confidence_low":    confidence_low,
        "confidence_high":   confidence_high,
        "score":             score,
        "feature_impact":    contributions,
        "profit_probability": profit_prob,
        "model_used":        model_name
    })


@predict_bp.route('/sectors', methods=['GET'])
def sectors():
    return jsonify({"sectors": SECTOR_CATEGORIES})
