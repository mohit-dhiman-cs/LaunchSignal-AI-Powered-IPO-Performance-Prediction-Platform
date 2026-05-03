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

    # --- Linear Regression (Baseline) ---
    from sklearn.linear_model import LinearRegression
    print("\n[*] Training Linear Regression...")
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    y_pred_lr = lr.predict(X_test)
    r2_lr = r2_score(y_test, y_pred_lr)
    print(f"   R²   : {r2_lr:.3f}")

    # --- Ensemble (Voting Regressor) ---
    from sklearn.ensemble import VotingRegressor
    print("\n[*] Training Ensemble (Voting Regressor)...")
    ensemble = VotingRegressor(estimators=[
        ('rf', rf),
        ('gb', gb)
    ])
    ensemble.fit(X_train, y_train)
    y_pred_ens = ensemble.predict(X_test)
    r2_ens = r2_score(y_test, y_pred_ens)
    print(f"   R²   : {r2_ens:.3f}")

    # --- Classifier (Profit vs Loss) ---
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import accuracy_score
    print("\n[*] Training Profit/Loss Classifier...")
    y_class = (y > 0).astype(int)
    y_train_class, y_test_class = train_test_split(y_class, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    clf.fit(X_train, y_train_class)
    acc_clf = accuracy_score(y_test_class, clf.predict(X_test))
    print(f"   Accuracy: {acc_clf * 100:.2f}%")

    # Pick best model for default
    best_model = ensemble
    model_name = "AI Ensemble (RF + GB)"
    print(f"\n[BEST] Best model: {model_name}")

    # Save artifacts
    os.makedirs(BACKEND_PATH, exist_ok=True)
    model_out  = os.path.join(BACKEND_PATH, 'model.pkl')
    models_dict_out = os.path.join(BACKEND_PATH, 'models_dict.pkl')
    scaler_out = os.path.join(BACKEND_PATH, 'scaler.pkl')
    le_out     = os.path.join(BACKEND_PATH, 'label_encoder.pkl')
    cols_out   = os.path.join(BACKEND_PATH, 'feature_cols.pkl')

    # Save best model to model.pkl for backward compatibility
    joblib.dump(best_model, model_out)
    
    # Save all models + stats for comparison
    models_data = {
        'AI Ensemble (RF + GB)': {'model': ensemble, 'r2': r2_ens},
        'Gradient Boosting':     {'model': gb, 'r2': r2_gb},
        'Random Forest':         {'model': rf, 'r2': r2_rf},
        'Linear Regression':     {'model': lr, 'r2': r2_lr},
        'Classifier':            {'model': clf, 'acc': acc_clf}
    }
    joblib.dump(models_data, models_dict_out)

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
