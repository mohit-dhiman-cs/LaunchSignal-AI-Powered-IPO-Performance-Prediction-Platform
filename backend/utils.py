import numpy as np

# ── Risk Classification ─────────────────────────────────────────────
def classify_risk(predicted_return: float) -> str:
    if predicted_return >= 20:
        return "Low"
    elif predicted_return >= 0:
        return "Medium"
    else:
        return "High"


# ── Confidence Score ────────────────────────────────────────────────
def compute_confidence(model, X_scaled) -> float:
    try:
        tree_preds = np.array([tree.predict(X_scaled) for tree in model.estimators_])
        std = np.std(tree_preds)
        confidence = max(0.50, min(0.99, 1 - (std / 100)))
        return round(float(confidence), 2)
    except Exception:
        return 0.75


# ── Input Validation ────────────────────────────────────────────────
def validate_input(data: dict) -> tuple:
    required = ['gmp', 'retail_sub', 'qib_sub', 'nii_sub', 'issue_size', 'sector']
    for field in required:
        if field not in data:
            return False, f"Missing required field: '{field}'"
    try:
        float(data['gmp'])
        float(data['retail_sub'])
        float(data['qib_sub'])
        float(data['nii_sub'])
        float(data['issue_size'])
    except (ValueError, TypeError):
        return False, "Numeric fields must be valid numbers"
    if float(data['issue_size']) <= 0:
        return False, "issue_size must be greater than 0"
    return True, ""


# ── IPO Score Card (0–100) ──────────────────────────────────────────
def compute_ipo_score(gmp, retail_sub, qib_sub, nii_sub, issue_size, market_trend) -> dict:
    """
    Proprietary IPO scoring system combining 4 dimensions into a 0-100 score.
    """

    # 1. GMP Strength (0–30)
    if gmp >= 200:      gmp_score = 30
    elif gmp >= 150:    gmp_score = 27
    elif gmp >= 100:    gmp_score = 23
    elif gmp >= 60:     gmp_score = 18
    elif gmp >= 30:     gmp_score = 13
    elif gmp >= 10:     gmp_score = 8
    elif gmp >= 0:      gmp_score = 4
    else:               gmp_score = max(0, int(4 + gmp // 10))
    gmp_score = max(0, min(30, gmp_score))

    # 2. Subscription Quality (0–40) — QIB weighted most
    weighted = 0.50 * qib_sub + 0.35 * retail_sub + 0.15 * nii_sub
    if weighted >= 150:   sub_score = 40
    elif weighted >= 100: sub_score = 36
    elif weighted >= 50:  sub_score = 30
    elif weighted >= 25:  sub_score = 24
    elif weighted >= 10:  sub_score = 17
    elif weighted >= 5:   sub_score = 11
    elif weighted >= 2:   sub_score = 6
    elif weighted >= 1:   sub_score = 3
    else:                 sub_score = 0
    sub_score = max(0, min(40, sub_score))

    # 3. Market Conditions (0–20)
    if market_trend >= 0.015:    mkt_score = 20
    elif market_trend >= 0.008:  mkt_score = 17
    elif market_trend >= 0.003:  mkt_score = 14
    elif market_trend >= 0:      mkt_score = 11
    elif market_trend >= -0.005: mkt_score = 7
    elif market_trend >= -0.01:  mkt_score = 4
    else:                        mkt_score = 2
    mkt_score = max(0, min(20, mkt_score))

    # 4. Issue Size Penalty (0–10) — smaller = better listing gains
    if issue_size <= 300:    size_score = 10
    elif issue_size <= 700:  size_score = 8
    elif issue_size <= 1500: size_score = 6
    elif issue_size <= 4000: size_score = 4
    elif issue_size <= 8000: size_score = 2
    else:                    size_score = 1

    total = gmp_score + sub_score + mkt_score + size_score

    if total >= 82:   rating, color = "Excellent",    "#10b981"
    elif total >= 65: rating, color = "Good",         "#3b82f6"
    elif total >= 48: rating, color = "Average",      "#f59e0b"
    elif total >= 28: rating, color = "Below Average","#f97316"
    else:             rating, color = "Risky",        "#ef4444"

    return {
        "total": total,
        "max": 100,
        "rating": rating,
        "color": color,
        "breakdown": {
            "GMP Strength":         {"score": gmp_score,  "max": 30},
            "Subscription Quality": {"score": sub_score,  "max": 40},
            "Market Conditions":    {"score": mkt_score,  "max": 20},
            "Issue Size":           {"score": size_score, "max": 10},
        }
    }


# ── Feature Impact / Explainability ────────────────────────────────
FEATURE_LABELS = {
    "gmp":              "Grey Market Premium",
    "qib_sub":          "QIB Subscription",
    "retail_sub":       "Retail Subscription",
    "nii_sub":          "NII Subscription",
    "total_sub":        "Total Subscription",
    "sub_weighted":     "Weighted Subscription",
    "market_trend":     "Market Trend (Nifty)",
    "issue_size":       "Issue Size",
    "gmp_to_size_ratio":"GMP / Size Ratio",
    "sector_enc":       "Sector",
}

def compute_feature_contributions(model, X_scaled, feature_cols) -> list:
    """
    Compute feature contributions via perturbation analysis.
    For each feature, measures the prediction change when it's set to its mean.
    This is a model-agnostic explainability method — no SHAP library needed.
    """
    base_pred = float(model.predict(X_scaled)[0])
    contributions = []

    for i, feat in enumerate(feature_cols):
        X_perturbed = X_scaled.copy()
        X_perturbed[0, i] = 0.0          # set to mean (StandardScaler → 0 = mean)
        pred_without = float(model.predict(X_perturbed)[0])
        impact = round(base_pred - pred_without, 2)
        contributions.append({
            "feature":      feat,
            "label":        FEATURE_LABELS.get(feat, feat),
            "contribution": impact,
            "direction":    "positive" if impact >= 0 else "negative",
        })

    # Sort by absolute impact, top 7
    contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)
    return contributions[:7]
