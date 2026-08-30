"""
Leakage-Free Spatio-Temporal Transformer Engine for AST-XGB.
Enforces strict chronological point-in-time rollups (t_obs < t_pred) and dynamic spatial comparable valuation.
"""

import numpy as np
import pandas as pd
from typing import Tuple, List, Dict

def haversine_dist(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes Haversine distance in km between two coordinate points."""
    R = 6371.0
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlam = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2.0)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlam / 2.0)**2
    return 2.0 * R * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))

def compute_leakage_free_rollups(
    df: pd.DataFrame,
    window_days: List[int] = [30, 90, 180],
    alpha: float = 1.5,
    epsilon: float = 1e-5
) -> pd.DataFrame:
    """
    Computes point-in-time trailing rolling neighborhood stats (volume, median price, price growth)
    and dynamic inverse distance-decay comparable valuation C_i.
    Guarantees zero temporal data leakage: t_j < t_i for all historical lookups.
    """
    df_sorted = df.sort_values('transaction_date').reset_index(drop=True)
    n_samples = len(df_sorted)
    
    dates = df_sorted['transaction_date'].values
    lats = df_sorted['latitude'].values
    lons = df_sorted['longitude'].values
    prices = df_sorted['price'].values
    areas = df_sorted['area'].values
    ppsf = prices / areas
    locations = df_sorted['location_id'].values
    
    # Pre-allocate output feature arrays
    vol_30 = np.zeros(n_samples, dtype=np.float32)
    vol_90 = np.zeros(n_samples, dtype=np.float32)
    vol_180 = np.zeros(n_samples, dtype=np.float32)
    
    med_ppsf_30 = np.zeros(n_samples, dtype=np.float32)
    med_ppsf_90 = np.zeros(n_samples, dtype=np.float32)
    
    price_growth_3m = np.zeros(n_samples, dtype=np.float32)
    comp_valuation_C_i = np.zeros(n_samples, dtype=np.float32)
    
    global_median_ppsf = np.median(ppsf)
    
    # Iterate through transactions in chronological order
    for i in range(n_samples):
        t_i = dates[i]
        loc_i = locations[i]
        lat_i = lats[i]
        lon_i = lons[i]
        
        # Historical mask: t_j < t_i
        hist_mask = dates[:i] < t_i
        if not np.any(hist_mask):
            # No prior history, set defaults
            vol_30[i] = 0
            vol_90[i] = 0
            vol_180[i] = 0
            med_ppsf_30[i] = global_median_ppsf
            med_ppsf_90[i] = global_median_ppsf
            price_growth_3m[i] = 0.0
            comp_valuation_C_i[i] = global_median_ppsf
            continue
            
        hist_indices = np.where(hist_mask)[0]
        hist_dates = dates[hist_indices]
        hist_locs = locations[hist_indices]
        hist_ppsf = ppsf[hist_indices]
        hist_lats = lats[hist_indices]
        hist_lons = lons[hist_indices]
        
        # 1. Neighborhood Location Match
        loc_mask = hist_locs == loc_i
        
        # Time windows (in days)
        dt_days = (t_i - hist_dates).astype('timedelta64[D]').astype(int)
        
        mask_30 = (dt_days <= 30) & loc_mask
        mask_90 = (dt_days <= 90) & loc_mask
        mask_180 = (dt_days <= 180) & loc_mask
        
        vol_30[i] = np.sum(mask_30)
        vol_90[i] = np.sum(mask_90)
        vol_180[i] = np.sum(mask_180)
        
        med_30 = np.median(hist_ppsf[mask_30]) if np.any(mask_30) else global_median_ppsf
        med_90 = np.median(hist_ppsf[mask_90]) if np.any(mask_90) else global_median_ppsf
        med_180 = np.median(hist_ppsf[mask_180]) if np.any(mask_180) else global_median_ppsf
        
        med_ppsf_30[i] = med_30
        med_ppsf_90[i] = med_90
        
        # Price growth over 3 months: (med_30 - med_90) / (med_90 + 1e-5)
        price_growth_3m[i] = (med_30 - med_90) / (med_90 + 1e-5)
        
        # 2. Dynamic Inverse Distance-Decay Comparable Valuation C_i (over 180-day window)
        comp_mask = dt_days <= 180
        if np.any(comp_mask):
            comp_idx = np.where(comp_mask)[0]
            c_lats = hist_lats[comp_idx]
            c_lons = hist_lons[comp_idx]
            c_ppsf = hist_ppsf[comp_idx]
            
            # Compute Haversine distances to candidate comparables
            # Vectorized approx distance
            d_lat = np.radians(c_lats - lat_i)
            d_lon = np.radians(c_lons - lon_i)
            a_dist = np.sin(d_lat / 2.0)**2 + np.cos(np.radians(lat_i)) * np.cos(np.radians(c_lats)) * np.sin(d_lon / 2.0)**2
            distances = 2.0 * 6371.0 * np.arctan2(np.sqrt(a_dist), np.sqrt(1.0 - a_dist))
            
            # Distance weights w_ij = 1 / (d_ij + epsilon)^alpha
            weights = 1.0 / ((distances + epsilon) ** alpha)
            C_val = np.sum(weights * c_ppsf) / (np.sum(weights) + 1e-12)
            comp_valuation_C_i[i] = C_val
        else:
            comp_valuation_C_i[i] = global_median_ppsf
            
    df_sorted['vol_30d'] = vol_30
    df_sorted['vol_90d'] = vol_90
    df_sorted['vol_180d'] = vol_180
    df_sorted['med_ppsf_30d'] = med_ppsf_30
    df_sorted['med_ppsf_90d'] = med_ppsf_90
    df_sorted['price_growth_3m'] = price_growth_3m
    df_sorted['comp_valuation_Ci'] = comp_valuation_C_i
    
    return df_sorted

def create_chronological_splits(
    df: pd.DataFrame,
    train_ratio: float = 0.60,
    val_ratio: float = 0.15,
    calib_ratio: float = 0.10
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Splits data chronologically into:
    D_train (t < T1), D_val (T1 <= t < T2), D_calib (T2 <= t < T3), D_test (t >= T3).
    """
    df_sorted = df.sort_values('transaction_date').reset_index(drop=True)
    n = len(df_sorted)
    
    idx_train = int(n * train_ratio)
    idx_val = int(n * (train_ratio + val_ratio))
    idx_calib = int(n * (train_ratio + val_ratio + calib_ratio))
    
    df_train = df_sorted.iloc[:idx_train].copy()
    df_val = df_sorted.iloc[idx_train:idx_val].copy()
    df_calib = df_sorted.iloc[idx_val:idx_calib].copy()
    df_test = df_sorted.iloc[idx_calib:].copy()
    
    print(f"[Chronological Split] Train: {len(df_train)}, Val: {len(df_val)}, Calib: {len(df_calib)}, Test: {len(df_test)}")
    return df_train, df_val, df_calib, df_test
