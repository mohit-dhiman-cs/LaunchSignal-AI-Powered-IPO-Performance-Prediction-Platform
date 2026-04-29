import os
import sys
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

sys.path.append(os.path.dirname(__file__))
from preprocess import preprocess, get_label_encoder

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data.csv')
BACKEND_PATH = os.path.join(os.path.dirname(__file__), '..', 'backend')

def train():
    print("[*] Loading IPO dataset...")
    df = pd.read_csv(DATA_PATH)
    print(f"   Loaded {len(df)} records")

    # Separate features and target
    y = df['listing_return'].values
    df_features = df.drop(columns=['listing_return'])

    print("[*] Preprocessing features...")
    X, scaler, le, feature_cols = preprocess(df_features, fit=True)
    print(f"   Features: {feature_cols}")

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"   Train: {len(X_train)} | Test: {len(X_test)}")

    # --- Random Forest ---
    print("\n[*] Training Random Forest...")
    rf = RandomForestRegressor(
        n_estimators=300,
        max_depth=12,
        min_samples_split=3,
        min_samples_leaf=2,
        max_features='sqrt',
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)

    y_pred_rf = rf.predict(X_test)
    mae_rf  = mean_absolute_error(y_test, y_pred_rf)
    rmse_rf = np.sqrt(mean_squared_error(y_test, y_pred_rf))
    r2_rf   = r2_score(y_test, y_pred_rf)

    print(f"   MAE  : {mae_rf:.2f}%")
    print(f"   RMSE : {rmse_rf:.2f}%")
    print(f"   R²   : {r2_rf:.3f}")

    # --- Gradient Boosting (compare) ---
    print("\n[*] Training Gradient Boosting...")
    gb = GradientBoostingRegressor(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=5,
        random_state=42
    )
    gb.fit(X_train, y_train)
    y_pred_gb = gb.predict(X_test)
    r2_gb = r2_score(y_test, y_pred_gb)
    print(f"   R²   : {r2_gb:.3f}")

    # Pick best model
    best_model = rf if r2_rf >= r2_gb else gb
    model_name = "Random Forest" if r2_rf >= r2_gb else "Gradient Boosting"
    print(f"\n[BEST] Best model: {model_name}")

    # Save artifacts
    os.makedirs(BACKEND_PATH, exist_ok=True)
    model_out  = os.path.join(BACKEND_PATH, 'model.pkl')
    scaler_out = os.path.join(BACKEND_PATH, 'scaler.pkl')
    le_out     = os.path.join(BACKEND_PATH, 'label_encoder.pkl')
    cols_out   = os.path.join(BACKEND_PATH, 'feature_cols.pkl')

    joblib.dump(best_model, model_out)
    joblib.dump(scaler, scaler_out)
    joblib.dump(le, le_out)
    joblib.dump(feature_cols, cols_out)

    print(f"\n[OK] Saved: model.pkl, scaler.pkl, label_encoder.pkl, feature_cols.pkl -> {BACKEND_PATH}")
    print("\n[INFO] Feature Importances (Random Forest):")
    if hasattr(rf, 'feature_importances_'):
        for feat, imp in sorted(zip(feature_cols, rf.feature_importances_), key=lambda x: -x[1]):
            print(f"   {feat:<25} {imp:.4f}")

if __name__ == '__main__':
    train()
