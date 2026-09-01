"""
Multi-Model Training & Benchmark Evaluation Harness
AST-XGB Real Estate Valuation Engine
Author: Apoorv Mishra

Trains 7 machine learning models on Phase 13 chronological temporal splits:
  1. Linear Regression
  2. Random Forest Regressor
  3. Gradient Boosting Regressor
  4. XGBoost Regressor
  5. LightGBM Regressor
  6. CatBoost Regressor
  7. MLP Regressor

Saves trained model artifacts and multi_model_leaderboard.json to models/multi_model/
"""

import os, sys, time, warnings, json, joblib
import numpy as np
import pandas as pd
from pathlib import Path

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neural_network import MLPRegressor

import xgboost as xgb
import lightgbm as lgb

try:
    from catboost import CatBoostRegressor
    HAS_CATBOOST = True
except ImportError:
    HAS_CATBOOST = False

warnings.filterwarnings('ignore')

BASE_DIR       = Path(__file__).resolve().parent.parent
DATA_PATH      = BASE_DIR / "data" / "features" / "final_features_v4.csv"
TRAIN_SPLIT    = BASE_DIR / "data" / "splits" / "final_temporal_train_v4.csv"
VAL_SPLIT      = BASE_DIR / "data" / "splits" / "final_temporal_val_v4.csv"
TEST_SPLIT     = BASE_DIR / "data" / "splits" / "final_temporal_test_v4.csv"
OUT_MODELS_DIR = BASE_DIR / "models" / "multi_model"
OUT_MODELS_DIR.mkdir(parents=True, exist_ok=True)

PROHIBITED_LEAKAGE = ['rental_yield_pct', 'derived_rental_yield_log1p', 'target_locality_median_ppsf']

def compute_metrics(y_true_inr: np.ndarray, y_pred_inr: np.ndarray) -> dict:
    """Computes R2, MAE (INR), RMSE (INR), and MAPE (%) on native INR scale."""
    r2 = float(r2_score(y_true_inr, y_pred_inr))
    mae = float(mean_absolute_error(y_true_inr, y_pred_inr))
    rmse = float(np.sqrt(mean_squared_error(y_true_inr, y_pred_inr)))
    mask = y_true_inr > 0
    mape = float(np.mean(np.abs((y_true_inr[mask] - y_pred_inr[mask]) / y_true_inr[mask])) * 100.0)
    return {'R2': round(r2, 4), 'MAE': round(mae, 2), 'RMSE': round(rmse, 2), 'MAPE': round(mape, 2)}

def train_and_evaluate_all():
    print("=" * 72)
    print("STARTING MULTI-MODEL VALUATION PIPELINE TRAINING (7 MODELS)")
    print("=" * 72)

    df = pd.read_csv(DATA_PATH)
    train_ids = pd.read_csv(TRAIN_SPLIT)['property_master_id'].values
    val_ids   = pd.read_csv(VAL_SPLIT)['property_master_id'].values
    test_ids  = pd.read_csv(TEST_SPLIT)['property_master_id'].values

    train_df = df[df['property_master_id'].isin(train_ids)].copy()
    val_df   = df[df['property_master_id'].isin(val_ids)].copy()
    test_df  = df[df['property_master_id'].isin(test_ids)].copy()

    drop_cols = ['property_master_id', 'price_inr', 'price_inr_log1p'] + PROHIBITED_LEAKAGE
    feature_cols = [c for c in df.columns if c not in drop_cols]

    print(f"Loaded Features: {len(feature_cols)} features (0 leakage)")
    print(f"Splits -> Train: {len(train_df)} | Val: {len(val_df)} | Test: {len(test_df)}")

    X_train = train_df[feature_cols]
    y_train = train_df['price_inr'].values
    y_train_log = np.log1p(y_train)

    X_val   = val_df[feature_cols]
    y_val   = val_df['price_inr'].values
    y_val_log = np.log1p(y_val)

    X_test  = test_df[feature_cols]
    y_test  = test_df['price_inr'].values

    num_cols = X_train.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = X_train.select_dtypes(include=['object', 'category']).columns.tolist()

    preprocessor = ColumnTransformer(transformers=[
        ('num', Pipeline([('imputer', SimpleImputer(strategy='median')), ('scaler', StandardScaler())]), num_cols),
        ('cat', Pipeline([('imputer', SimpleImputer(strategy='most_frequent')), ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))]), cat_cols)
    ])

    print("Fitting ColumnTransformer on X_train ...")
    X_train_proc = preprocessor.fit_transform(X_train)
    X_val_proc   = preprocessor.transform(X_val)
    X_test_proc  = preprocessor.transform(X_test)

    # Save preprocessing artifact
    joblib.dump(preprocessor, OUT_MODELS_DIR / "preprocessing_pipeline.pkl")

    # Define 7 estimators
    models_dict = {
        'linear_regression': ('Linear Regression', LinearRegression()),
        'random_forest': ('Random Forest', RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)),
        'gradient_boosting': ('Gradient Boosting', GradientBoostingRegressor(n_estimators=120, max_depth=5, learning_rate=0.08, random_state=42)),
        'xgboost': ('XGBoost', xgb.XGBRegressor(n_estimators=150, max_depth=6, learning_rate=0.05, random_state=42, n_jobs=-1)),
        'lightgbm': ('LightGBM', lgb.LGBMRegressor(n_estimators=150, max_depth=6, learning_rate=0.05, random_state=42, verbose=-1)),
        'mlp': ('MLP (Neural Net)', MLPRegressor(hidden_layer_sizes=(64, 32), max_iter=300, alpha=0.1, learning_rate_init=0.001, random_state=42, early_stopping=True))
    }

    if HAS_CATBOOST:
        models_dict['catboost'] = ('CatBoost', CatBoostRegressor(iterations=150, depth=6, learning_rate=0.05, random_seed=42, verbose=0))
    else:
        print("CatBoost unavailable, using HistGradientBoosting fallback...")
        from sklearn.ensemble import HistGradientBoostingRegressor
        models_dict['catboost'] = ('CatBoost (Fallback)', HistGradientBoostingRegressor(max_iter=150, max_depth=6, learning_rate=0.05, random_state=42))

    leaderboard = []

    for model_key, (display_name, estimator) in models_dict.items():
        print(f"\nTraining [{display_name}] ...")
        t0 = time.time()
        estimator.fit(X_train_proc, y_train_log)
        train_time = round(time.time() - t0, 3)

        t_inf0 = time.time()
        y_test_pred_log = estimator.predict(X_test_proc)
        inf_time_ms = round(((time.time() - t_inf0) / len(X_test_proc)) * 1000.0, 3)
        y_test_pred_inr = np.expm1(y_test_pred_log)

        metrics = compute_metrics(y_test, y_test_pred_inr)
        metrics['model_key'] = model_key
        metrics['display_name'] = display_name
        metrics['train_time_sec'] = train_time
        metrics['inference_time_ms'] = inf_time_ms

        print(f"  [OK] {display_name} -> R2: {metrics['R2']} | MAE: INR {metrics['MAE']:,.2f} | RMSE: INR {metrics['RMSE']:,.2f} | MAPE: {metrics['MAPE']}%")

        # Save individual model artifact
        joblib.dump(estimator, OUT_MODELS_DIR / f"{model_key}.pkl")
        leaderboard.append(metrics)

    # Rank by lowest RMSE
    leaderboard = sorted(leaderboard, key=lambda x: x['RMSE'])
    for idx, item in enumerate(leaderboard, start=1):
        item['rank'] = idx

    with open(OUT_MODELS_DIR / "multi_model_leaderboard.json", 'w', encoding='utf-8') as f:
        json.dump(leaderboard, f, indent=2)

    print("\n" + "=" * 72)
    print("FINAL MULTI-MODEL LEADERBOARD")
    print("=" * 72)
    lb_df = pd.DataFrame(leaderboard)[['rank', 'display_name', 'R2', 'MAE', 'RMSE', 'MAPE', 'train_time_sec', 'inference_time_ms']]
    print(lb_df.to_string(index=False))

if __name__ == '__main__':
    train_and_evaluate_all()
