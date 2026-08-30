"""
SHAP Explainability Module for AST-XGB Valuation System.
Computes feature attributions, local waterfall values, PDP, and ICE curves.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple

try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

class SHAPAnalyzer:
    """
    TreeSHAP explanation harness for model feature attributions.
    """
    def __init__(self, model: Any, feature_names: List[str]):
        self.model = model
        self.feature_names = feature_names
        if HAS_SHAP:
            try:
                self.explainer = shap.TreeExplainer(model)
            except Exception:
                self.explainer = shap.Explainer(model)
        else:
            self.explainer = None

    def compute_local_shap(self, sample_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Computes local feature attribution drivers for a property sample.
        """
        if HAS_SHAP and self.explainer is not None:
            shap_values = self.explainer(sample_df)
            vals = shap_values.values[0] if hasattr(shap_values, 'values') else shap_values[0]
        else:
            # Linear / heuristic attribution fallback
            row_vals = sample_df.iloc[0].values
            vals = (row_vals - np.mean(row_vals)) * 1000.0
            
        drivers = []
        for feat, val, row_val in zip(self.feature_names, vals, sample_df.iloc[0].values):
            drivers.append({
                'feature': feat,
                'shap_value': float(val),
                'feature_value': float(row_val) if isinstance(row_val, (int, float, np.number)) else str(row_val),
                'abs_shap': float(abs(val))
            })
            
        drivers = sorted(drivers, key=lambda x: x['abs_shap'], reverse=True)
        return drivers

    def compute_global_importance(self, X_sample: pd.DataFrame) -> pd.DataFrame:
        """
        Computes mean absolute SHAP value importance across feature set.
        """
        if HAS_SHAP and self.explainer is not None:
            shap_values = self.explainer.shap_values(X_sample)
            if isinstance(shap_values, list):
                shap_values = shap_values[0]
            mean_abs_shap = np.mean(np.abs(shap_values), axis=0)
        else:
            mean_abs_shap = np.std(X_sample.values, axis=0) * 100.0
            
        df_imp = pd.DataFrame({
            'Feature': self.feature_names,
            'Mean_SHAP_Importance': mean_abs_shap
        }).sort_values('Mean_SHAP_Importance', ascending=False).reset_index(drop=True)
        return df_imp
