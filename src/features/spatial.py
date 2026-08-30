"""
Geospatial Proximity & POI Diversity Module for AST-XGB Valuation System.
Vectorized Haversine distance computation to urban anchors, POI density, and Shannon Diversity.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple

def haversine_vectorized(lat1: np.ndarray, lon1: np.ndarray, lat2: float, lon2: float) -> np.ndarray:
    """
    Computes Haversine distance in kilometers between arrays of coordinates (lat1, lon1) and fixed anchor (lat2, lon2).
    """
    R = 6371.0  # Earth radius in kilometers
    
    phi1 = np.radians(lat1)
    phi2 = np.radians(lat2)
    delta_phi = np.radians(lat2 - lat1)
    delta_lambda = np.radians(lon2 - lon1)
    
    a = np.sin(delta_phi / 2.0)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(delta_lambda / 2.0)**2
    c = 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))
    return R * c

def compute_spatial_proximities(df_prop: pd.DataFrame, df_poi: pd.DataFrame) -> pd.DataFrame:
    """
    Computes Haversine distance vectors to key POI anchors (CBD, Metro, School, Hospital),
    1km POI density, and Shannon POI Diversity Index.
    """
    df_out = df_prop.copy()
    lats = df_out['latitude'].values
    lons = df_out['longitude'].values
    
    # 1. Proximity to specific categories
    categories = ['CBD', 'Metro_Station', 'School', 'Hospital']
    for cat in categories:
        sub_poi = df_poi[df_poi['category'] == cat]
        if len(sub_poi) > 0:
            distances = []
            for _, row in sub_poi.iterrows():
                d = haversine_vectorized(lats, lons, row['latitude'], row['longitude'])
                distances.append(d)
            min_dist = np.min(np.column_stack(distances), axis=1)
            df_out[f'dist_{cat.lower()}'] = min_dist
        else:
            df_out[f'dist_{cat.lower()}'] = 10.0  # Default fallback
            
    # 2. 1km Radius POI Density & Shannon Diversity
    poi_lats = df_poi['latitude'].values
    poi_lons = df_poi['longitude'].values
    poi_cats = df_poi['category'].values
    unique_cats = np.unique(poi_cats)
    
    poi_counts = []
    shannon_indices = []
    
    for lat, lon in zip(lats, lons):
        dists = haversine_vectorized(poi_lats, poi_lons, lat, lon)
        within_1km = dists <= 1.0
        count_1km = np.sum(within_1km)
        poi_counts.append(count_1km)
        
        if count_1km > 0:
            cats_in_range = poi_cats[within_1km]
            _, cat_counts = np.unique(cats_in_range, return_counts=True)
            probs = cat_counts / np.sum(cat_counts)
            shannon = -np.sum(probs * np.log2(probs + 1e-12))
        else:
            shannon = 0.0
        shannon_indices.append(shannon)
        
    df_out['poi_density_1km'] = poi_counts
    df_out['shannon_poi_diversity'] = shannon_indices
    
    return df_out
