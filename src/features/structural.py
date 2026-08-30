"""
Property Structural Features Module for AST-XGB Valuation System.
Engineers physical structural ratios, room distributions, and amenity density.
"""

import numpy as np
import pandas as pd

def compute_structural_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes structural physical metrics and room ratio features.
    """
    df_out = df.copy()
    
    # 1. Total rooms
    df_out['total_rooms'] = df_out['bedrooms'] + df_out['bathrooms']
    
    # 2. Ratios
    df_out['bath_bed_ratio'] = df_out['bathrooms'] / (df_out['bedrooms'] + 1e-5)
    df_out['area_per_bedroom'] = df_out['area'] / (df_out['bedrooms'] + 1e-5)
    df_out['area_per_room'] = df_out['area'] / (df_out['total_rooms'] + 1e-5)
    df_out['parking_per_bedroom'] = df_out['parking'] / (df_out['bedrooms'] + 1e-5)
    
    # 3. Categorical encoding flags
    if 'condition' in df_out.columns:
        cond_map = {'Fair': 1, 'Good': 2, 'Renovated': 3, 'Excellent': 4, 'Unknown': 2}
        df_out['condition_score'] = df_out['condition'].map(cond_map).fillna(2)
        
    return df_out
