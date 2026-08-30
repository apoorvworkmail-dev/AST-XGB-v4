"""
Baseline Machine Learning Model Suite for AST-XGB Benchmark System.
Implements OLS, Ridge, Lasso, Random Forest, Extra Trees, GBR, LightGBM, and XGBoost with evaluation harness.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

try:
    import lightgbm as lgb
    HAS_LGB = True
except ImportError:
    HAS_LGB = False

from sklearn.ensemble import HistGradientBoostingRegressor

def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """
    Computes standard regression benchmark metrics: R^2, MAE, RMSE, MAPE, and COD.
    """
    r2 = float(r2_score(y_true, y_pred))
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    
    # MAPE calculation (avoiding zero division)
    mask = y_true != 0
    mape = float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100.0)
    
    # Coefficient of Dispersion (COD): % deviation from median
    med_true = np.median(y_true)
    cod = float(np.mean(np.abs(y_true - y_pred) / med_true) * 100.0)
    
    return {
        'R2': r2,
        'MAE': mae,
        'RMSE': rmse,
        'MAPE': mape,
        'COD': cod
    }

class BaselineModelSuite:
    """
    Unified trainer and benchmark runner for baseline estimators.
    """
    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.models = {
            'Linear_Regression': LinearRegression(),
            'Ridge_L2': Ridge(alpha=1.0, random_state=random_state),
            'Lasso_L1': Lasso(alpha=0.01, random_state=random_state),
            'Random_Forest': RandomForestRegressor(n_estimators=100, max_depth=12, random_state=random_state, n_jobs=-1),
            'Extra_Trees': ExtraTreesRegressor(n_estimators=100, max_depth=12, random_state=random_state, n_jobs=-1),
            'Gradient_Boosting': GradientBoostingRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=random_state),
            'LightGBM': lgb.LGBMRegressor(n_estimators=150, max_depth=6, learning_rate=0.05, random_state=random_state, verbose=-1) if HAS_LGB else HistGradientBoostingRegressor(max_iter=150, max_depth=6, learning_rate=0.05, random_state=random_state),
            'XGBoost_Standard': xgb.XGBRegressor(n_estimators=150, max_depth=6, learning_rate=0.05, random_state=random_state, n_jobs=-1) if HAS_XGB else HistGradientBoostingRegressor(max_iter=150, max_depth=6, learning_rate=0.05, random_state=random_state)
        }
        self.fitted_models = {}
        self.results = {}
        
    def fit_evaluate_all(
        self,
        X_train: pd.DataFrame,
        y_train: np.ndarray,
        X_test: pd.DataFrame,
        y_test: np.ndarray
    ) -> pd.DataFrame:
        """
        Fits each model on X_train/y_train and evaluates on X_test/y_test.
        """
        metrics_list = []
        for name, model in self.models.items():
            model.fit(X_train, y_train)
            self.fitted_models[name] = model
            
            y_pred = model.predict(X_test)
            m = compute_metrics(y_test, y_pred)
            m['Model'] = name
            metrics_list.append(m)
            self.results[name] = y_pred
            
        df_res = pd.DataFrame(metrics_list)[['Model', 'R2', 'MAE', 'RMSE', 'MAPE', 'COD']]
        return df_res.sort_values('R2', ascending=False).reset_index(drop=True)
