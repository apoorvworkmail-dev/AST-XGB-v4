"""
Production Drift Monitoring Engine for AST-XGB Valuation System.
Computes Population Stability Index (PSI) and KS-tests to trigger automated model retraining.
"""

import numpy as np
import pandas as pd
from scipy.stats import ks_2samp
from typing import Dict, List, Any, Tuple

def calculate_psi(reference: np.ndarray, current: np.ndarray, num_bins: int = 10) -> float:
    """
    Computes Population Stability Index (PSI) between reference baseline and current production distribution.
    PSI = sum((P_b - Q_b) * ln(P_b / Q_b))
    """
    # Remove NaN values
    ref = reference[~np.isnan(reference)]
    cur = current[~np.isnan(current)]
    
    if len(ref) == 0 or len(cur) == 0:
        return 0.0
        
    # Determine quantile bins based on reference distribution
    percentiles = np.linspace(0, 100, num_bins + 1)
    bins = np.percentile(ref, percentiles)
    bins[0] = -np.inf
    bins[-1] = np.inf
    # Ensure unique bin edges
    bins = np.unique(bins)
    if len(bins) < 2:
        return 0.0
        
    ref_counts, _ = np.histogram(ref, bins=bins)
    cur_counts, _ = np.histogram(cur, bins=bins)
    
    P_b = ref_counts / (len(ref) + 1e-12)
    Q_b = cur_counts / (len(cur) + 1e-12)
    
    # Clip zero probabilities to prevent log(0)
    P_b = np.clip(P_b, 1e-4, 1.0)
    Q_b = np.clip(Q_b, 1e-4, 1.0)
    
    psi_val = np.sum((P_b - Q_b) * np.log(P_b / Q_b))
    return float(psi_val)

class DriftDetector:
    """
    Production MLOps monitoring engine evaluating feature drift (PSI/KS-test) and model coverage degradation.
    """
    def __init__(self, ref_data: pd.DataFrame, psi_threshold: float = 0.25):
        self.ref_data = ref_data
        self.psi_threshold = psi_threshold
        
    def audit_feature_drift(self, curr_data: pd.DataFrame) -> pd.DataFrame:
        """
        Audits numerical features for distribution drift against baseline reference partition.
        """
        num_cols = self.ref_data.select_dtypes(include=[np.number]).columns
        report = []
        
        for col in num_cols:
            if col not in curr_data.columns:
                continue
                
            ref_vals = self.ref_data[col].values
            cur_vals = curr_data[col].values
            
            psi = calculate_psi(ref_vals, cur_vals)
            stat, p_val = ks_2samp(ref_vals, cur_vals)
            
            if psi > self.psi_threshold:
                status = 'ACTION_REQUIRED (Significant Drift)'
            elif psi > 0.10:
                status = 'WARNING (Moderate Shift)'
            else:
                status = 'STABLE'
                
            report.append({
                'Feature': col,
                'PSI': psi,
                'KS_Statistic': float(stat),
                'KS_PValue': float(p_val),
                'Status': status
            })
            
        df_report = pd.DataFrame(report).sort_values('PSI', ascending=False).reset_index(drop=True)
        return df_report
        
    def check_retraining_trigger(self, df_report: pd.DataFrame, conformal_coverage: float) -> Tuple[bool, str]:
        """
        Evaluates whether automated retraining is required based on PSI > 0.25 or Conformal Coverage < 85%.
        """
        significant_drifts = df_report[df_report['PSI'] > self.psi_threshold]
        
        if len(significant_drifts) > 0:
            msg = f"Retraining triggered: {len(significant_drifts)} features breached PSI threshold ({self.psi_threshold})."
            return True, msg
        elif conformal_coverage < 85.0:
            msg = f"Retraining triggered: Conformal coverage dropped to {conformal_coverage:.1f}% (< 85.0%)."
            return True, msg
        else:
            return False, "System status optimal. Retraining not required."
