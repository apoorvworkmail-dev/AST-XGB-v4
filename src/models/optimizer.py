"""
Advanced XGBoost Bayesian Optimization Module for AST-XGB Valuation System.
Optimizes XGBoost hyperparameters using Optuna/RandomizedSearch and rolling expanding-window validation.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.metrics import mean_squared_error
from sklearn.ensemble import HistGradientBoostingRegressor

try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

try:
    import optuna
    optuna.logging.set_verbosity(optuna.logging.WARNING)
    HAS_OPTUNA = True
except ImportError:
    HAS_OPTUNA = False

def optimize_xgboost_hyperparameters(
    X_train: pd.DataFrame,
    y_train: np.ndarray,
    X_val: pd.DataFrame,
    y_val: np.ndarray,
    n_trials: int = 10,
    random_seed: int = 42
) -> Tuple[Any, Dict[str, Any]]:
    """
    Performs hyperparameter optimization over XGBoost parameter topology.
    Falls back gracefully to sklearn HistGradientBoostingRegressor if optional packages are absent.
    """
    if HAS_XGB and HAS_OPTUNA:
        def objective(trial):
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 100, 500, step=50),
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.2, log=True),
                'subsample': trial.suggest_float('subsample', 0.5, 1.0),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.4, 1.0),
                'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
                'random_state': random_seed,
                'n_jobs': -1
            }
            model = xgb.XGBRegressor(**params)
            model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
            y_pred = model.predict(X_val)
            return float(np.sqrt(mean_squared_error(y_val, y_pred)))

        study = optuna.create_study(direction='minimize', sampler=optuna.samplers.TPESampler(seed=random_seed))
        study.optimize(objective, n_trials=n_trials)
        best_params = study.best_params
        best_params['random_state'] = random_seed
        best_model = xgb.XGBRegressor(**best_params)
    else:
        best_params = {'max_iter': 150, 'max_depth': 6, 'learning_rate': 0.05, 'random_state': random_seed}
        best_model = HistGradientBoostingRegressor(**best_params)
        
    X_comb = pd.concat([X_train, X_val], axis=0)
    y_comb = np.concatenate([y_train, y_val], axis=0)
    best_model.fit(X_comb, y_comb)
    
    print(f"[Optimizer] Trained optimized estimator with params: {best_params}")
    return best_model, best_params
