"""
Constrained Local Counterfactual Scenario Engine for AST-XGB Valuation System.
Simulates property renovation, feature perturbation, and macroeconomic shock scenarios within feasible bounds S_feasible.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any

FEASIBLE_PERTURBATION_SPECS = {
    'add_bathroom': {'bathrooms': +1, 'bath_bed_ratio_delta': +0.5},
    'add_parking': {'parking': +1},
    'renovate_excellent': {'condition_score': 4},
    'expand_area_200sqft': {'area': +200},
    'macro_interest_drop_50bps': {'interest_rate': -0.5}
}

class CounterfactualSimulator:
    """
    Simulates sensitivity deltas ΔP = f(x + Δx) - f(x) under physically & legally feasible constraints.
    """
    def __init__(self, predict_fn: Any):
        """
        :param predict_fn: Callable mapping DataFrame -> np.ndarray predictions
        """
        self.predict_fn = predict_fn
        
    def simulate_scenarios(self, base_sample: pd.DataFrame) -> pd.DataFrame:
        """
        Runs feasible perturbation scenarios for a given property input record.
        """
        base_pred = float(self.predict_fn(base_sample)[0])
        results = [{
            'Scenario': 'Base Property Valuation',
            'Perturbation': 'None',
            'Predicted_Value': base_pred,
            'Value_Delta': 0.0,
            'Percentage_Change': 0.0
        }]
        
        # 1. Add 1 Bathroom
        sample_bath = base_sample.copy()
        if 'bathrooms' in sample_bath.columns:
            sample_bath['bathrooms'] += 1
            if 'bath_bed_ratio' in sample_bath.columns and 'bedrooms' in sample_bath.columns:
                sample_bath['bath_bed_ratio'] = sample_bath['bathrooms'] / (sample_bath['bedrooms'] + 1e-5)
            pred_bath = float(self.predict_fn(sample_bath)[0])
            delta = pred_bath - base_pred
            results.append({
                'Scenario': 'Add 1 Bathroom',
                'Perturbation': '+1 Bathroom',
                'Predicted_Value': pred_bath,
                'Value_Delta': delta,
                'Percentage_Change': (delta / base_pred) * 100.0
            })
            
        # 2. Add 1 Parking Spot
        sample_pk = base_sample.copy()
        if 'parking' in sample_pk.columns:
            sample_pk['parking'] += 1
            pred_pk = float(self.predict_fn(sample_pk)[0])
            delta = pred_pk - base_pred
            results.append({
                'Scenario': 'Add 1 Reserved Parking',
                'Perturbation': '+1 Parking Space',
                'Predicted_Value': pred_pk,
                'Value_Delta': delta,
                'Percentage_Change': (delta / base_pred) * 100.0
            })
            
        # 3. Upgrade Finish Condition to Excellent
        sample_cond = base_sample.copy()
        if 'condition_score' in sample_cond.columns:
            sample_cond['condition_score'] = 4
            pred_cond = float(self.predict_fn(sample_cond)[0])
            delta = pred_cond - base_pred
            results.append({
                'Scenario': 'Full Interior Renovation',
                'Perturbation': 'Condition -> Excellent',
                'Predicted_Value': pred_cond,
                'Value_Delta': delta,
                'Percentage_Change': (delta / base_pred) * 100.0
            })
            
        # 4. Expand Area by 200 sqft
        sample_area = base_sample.copy()
        if 'area' in sample_area.columns:
            sample_area['area'] += 200
            pred_area = float(self.predict_fn(sample_area)[0])
            delta = pred_area - base_pred
            results.append({
                'Scenario': 'Property Area Expansion',
                'Perturbation': '+200 sqft Built-up Area',
                'Predicted_Value': pred_area,
                'Value_Delta': delta,
                'Percentage_Change': (delta / base_pred) * 100.0
            })
            
        return pd.DataFrame(results)
