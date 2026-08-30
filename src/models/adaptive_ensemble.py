"""
AST-XGB Adaptive Market-Regime Softmax Ensemble Core Engine.
Dynamically tracks trailing validation error per market regime and applies Softmax error-loss weighting.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from sklearn.metrics import mean_absolute_error, mean_squared_error

class AdaptiveSoftmaxEnsemble:
    """
    AST-XGB Core Novelty: Dynamic Softmax Error-Loss Weighted Ensemble across Market Regimes.
    """
    def __init__(self, base_models: Dict[str, Any], lambda_temp: float = 5.0):
        """
        :param base_models: Dict of fitted base regression estimators {name: model}
        :param lambda_temp: Softmax temperature parameter governing error penalty sensitivity
        """
        self.base_models = base_models
        self.model_names = list(base_models.keys())
        self.n_models = len(self.model_names)
        self.lambda_temp = lambda_temp
        
        # Regime-indexed error tracking: regime_id -> {model_name: rolling_mae}
        self.regime_errors = {}
        # Regime-indexed softmax weights: regime_id -> {model_name: weight}
        self.regime_weights = {}
        
    def calibrate_regime_weights(
        self,
        X_val: pd.DataFrame,
        y_val: np.ndarray,
        regimes_val: np.ndarray
    ) -> Dict[int, Dict[str, float]]:
        """
        Evaluates base estimator errors across each latent market regime in validation data
        and computes regime-specific Softmax weights:
        w_{k,t}^{(r)} = exp(-lambda * E_{k,t}^{(r)}) / sum_j exp(-lambda * E_{j,t}^{(r)})
        """
        unique_regimes = np.unique(regimes_val)
        
        # Get base model predictions
        val_preds = {name: model.predict(X_val) for name, model in self.base_models.items()}
        
        for r in unique_regimes:
            mask = regimes_val == r
            if not np.any(mask):
                continue
                
            y_r = y_val[mask]
            errors = {}
            for name in self.model_names:
                preds_r = val_preds[name][mask]
                # Normalized MAE error
                mae = np.mean(np.abs(y_r - preds_r)) / (np.mean(np.abs(y_r)) + 1e-5)
                errors[name] = float(mae)
                
            self.regime_errors[int(r)] = errors
            
            # Compute Softmax weights
            err_vec = np.array([errors[name] for name in self.model_names])
            # Softmax with temperature scaling: exp(-lambda * error)
            exp_neg_err = np.exp(-self.lambda_temp * err_vec)
            softmax_w = exp_neg_err / (np.sum(exp_neg_err) + 1e-12)
            
            self.regime_weights[int(r)] = {
                name: float(w) for name, w in zip(self.model_names, softmax_w)
            }
            
        print("[AST-XGB Ensemble] Calibrated regime-aware Softmax weights:")
        for r, w_dict in self.regime_weights.items():
            formatted_w = ", ".join([f"{k}: {v:.4f}" for k, v in w_dict.items()])
            print(f"  Regime {r}: [{formatted_w}]")
            
        return self.regime_weights
        
    def predict(self, X: pd.DataFrame, regimes: np.ndarray) -> np.ndarray:
        """
        Generates AST-XGB dynamically weighted predictions:
        y_hat = sum_k w_{k,t}^{(r)} * y_hat_{k,t}
        """
        # Base predictions shape: (n_samples, n_models)
        preds_matrix = np.column_stack([
            self.base_models[name].predict(X) for name in self.model_names
        ])
        
        n_samples = len(X)
        final_preds = np.zeros(n_samples, dtype=np.float32)
        
        # Default equal weights fallback if regime not seen
        default_w = np.ones(self.n_models) / self.n_models
        
        for i in range(n_samples):
            r = int(regimes[i])
            if r in self.regime_weights:
                w_vec = np.array([self.regime_weights[r][name] for name in self.model_names])
            else:
                w_vec = default_w
            final_preds[i] = np.sum(w_vec * preds_matrix[i, :])
            
        return final_preds
