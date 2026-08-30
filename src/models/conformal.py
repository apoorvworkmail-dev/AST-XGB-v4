"""
Split Conformal Prediction Interval Module for AST-XGB Valuation System.
Generates distribution-free, mathematically guaranteed prediction intervals at user-specified confidence level (e.g. 90%).
"""

import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any

class SplitConformalPredictor:
    """
    Inductive Split Conformal Quantile Predictor.
    Computes empirical quantile residual threshold q_{1-alpha} over calibration partition D_calib.
    """
    def __init__(self, alpha: float = 0.10):
        """
        :param alpha: Significance level (default 0.10 for 90% confidence interval)
        """
        self.alpha = alpha
        self.q_threshold = None
        self.is_calibrated = False
        
    def calibrate(self, y_calib: np.ndarray, y_pred_calib: np.ndarray) -> float:
        """
        Calibrates non-conformity residuals alpha_i = |y_i - y_hat(x_i)| on D_calib.
        """
        residuals = np.abs(y_calib - y_pred_calib)
        n = len(residuals)
        
        # Conformal quantile rank: ceil((n + 1)(1 - alpha)) / n
        quantile_level = np.ceil((n + 1) * (1.0 - self.alpha)) / n
        quantile_level = np.clip(quantile_level, 0.0, 1.0)
        
        self.q_threshold = float(np.quantile(residuals, quantile_level))
        self.is_calibrated = True
        
        print(f"[Conformal Predictor] Calibrated 90% PI threshold q_0.90 = {self.q_threshold:.2f} on {n} calibration samples.")
        return self.q_threshold
        
    def predict_interval(self, y_pred: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generates lower and upper 90% conformal prediction bounds:
        PI = [y_hat - q_{1-alpha}, y_hat + q_{1-alpha}]
        """
        if not self.is_calibrated:
            raise ValueError("Conformal predictor must be calibrated before predict_interval().")
            
        lower_bound = np.maximum(0, y_pred - self.q_threshold)
        upper_bound = y_pred + self.q_threshold
        
        return lower_bound, upper_bound
        
    def evaluate_coverage(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """
        Evaluates empirical coverage percentage and average interval width on test partition.
        """
        lower, upper = self.predict_interval(y_pred)
        covered = (y_true >= lower) & (y_true <= upper)
        coverage_pct = float(np.mean(covered) * 100.0)
        mean_width = float(np.mean(upper - lower))
        
        return {
            'Target_Coverage_Pct': (1.0 - self.alpha) * 100.0,
            'Empirical_Coverage_Pct': coverage_pct,
            'Mean_Interval_Width': mean_width,
            'Calibrated_Q_Threshold': self.q_threshold
        }
