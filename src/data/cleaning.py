"""
Data Cleaning & Quality Audit Module for AST-XGB Valuation System.
Executes non-destructive deduplication, stratified IQR outlier treatment, and target transformations.
"""

import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any
from sklearn.impute import KNNImputer

def audit_and_deduplicate(df: pd.DataFrame) -> pd.DataFrame:
    """
    Audits column data types and removes duplicate records based on core transaction keys.
    """
    initial_count = len(df)
    dedup_subset = ['property_id', 'transaction_date', 'price', 'area']
    existing_subset = [c for c in dedup_subset if c in df.columns]
    
    df_clean = df.drop_duplicates(subset=existing_subset).copy()
    removed = initial_count - len(df_clean)
    if removed > 0:
        print(f"[Data Audit] Removed {removed} duplicate transaction records.")
    return df_clean

def impute_missing_values(df: pd.DataFrame, n_neighbors: int = 5) -> pd.DataFrame:
    """
    Imputes categorical missingness with 'Unknown' and numerical missingness via spatial KNN.
    """
    df_out = df.copy()
    
    # Categorical columns
    cat_cols = df_out.select_dtypes(include=['object', 'category']).columns
    for c in cat_cols:
        df_out[c] = df_out[c].fillna('Unknown')
        
    # Numerical columns
    num_cols = df_out.select_dtypes(include=[np.number]).columns.tolist()
    if df_out[num_cols].isnull().sum().sum() > 0:
        imputer = KNNImputer(n_neighbors=n_neighbors)
        df_out[num_cols] = imputer.fit_transform(df_out[num_cols])
        
    return df_out

def handle_outliers_stratified(
    df: pd.DataFrame,
    target_col: str = 'price_per_sqft',
    strata_col: str = 'property_type',
    iqr_multiplier: float = 1.5
) -> pd.DataFrame:
    """
    Applies IQR outlier filtering strictly within homogeneous property-type strata
    to preserve verified luxury observations (e.g. Penthouses/Villas).
    """
    if target_col not in df.columns:
        df['price_per_sqft'] = df['price'] / df['area']
        
    clean_frames = []
    for stratum, group in df.groupby(strata_col):
        q1 = group[target_col].quantile(0.25)
        q3 = group[target_col].quantile(0.75)
        iqr = q3 - q1
        
        lower_bound = q1 - iqr_multiplier * iqr
        upper_bound = q3 + iqr_multiplier * iqr
        
        filtered = group[(group[target_col] >= lower_bound) & (group[target_col] <= upper_bound)]
        clean_frames.append(filtered)
        
    df_clean = pd.concat(clean_frames, axis=0).sort_index()
    print(f"[Outlier Treatment] Retained {len(df_clean)} / {len(df)} records across {df[strata_col].nunique()} strata.")
    return df_clean

def transform_target(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes log(1 + price) and price_per_sqft target distributions.
    """
    df_out = df.copy()
    df_out['price_per_sqft'] = df_out['price'] / df_out['area']
    df_out['log_price'] = np.log1p(df_out['price'])
    return df_out
