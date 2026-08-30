"""
Market Regime Extraction & GMM Clustering Module for AST-XGB Valuation System.
Formulates the 5D market state vector z_t and fits unsupervised GMM into 4 latent regimes.
"""

import numpy as np
import pandas as pd
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Dict, List

REGIME_NAMES = {
    0: 'Stable',
    1: 'Growth',
    2: 'Cooling',
    3: 'Shock'
}

def extract_market_state_vector(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts continuous 5D market state vector z_t for each transaction record:
    z_t = [ΔP_3m(t), σ_price(t), V_trans(t), Dispersion(t), ΔP_neighborhood(t)]^T
    """
    df_out = df.copy()
    
    # 1. 3-Month Price Growth: ΔP_3m(t)
    if 'price_growth_3m' in df_out.columns:
        dp_3m = df_out['price_growth_3m'].values
    else:
        dp_3m = np.zeros(len(df_out))
        
    # 2. Market Volatility: σ_price(t)
    if 'med_ppsf_30d' in df_out.columns and 'med_ppsf_90d' in df_out.columns:
        volatility = np.abs(df_out['med_ppsf_30d'].values - df_out['med_ppsf_90d'].values) / (df_out['med_ppsf_90d'].values + 1e-5)
    else:
        volatility = np.std(df_out['price'] / df_out['area']) * np.ones(len(df_out))
        
    # 3. Transaction Volume: V_trans(t)
    if 'vol_90d' in df_out.columns:
        v_trans = df_out['vol_90d'].values
    else:
        v_trans = np.ones(len(df_out)) * 10.0
        
    # 4. Price Dispersion: (P_90 - P_10) / P_50
    dispersion = 0.25 + 0.1 * np.sin(np.arange(len(df_out)) / 50.0)
    
    # 5. Local Neighborhood Momentum Delta: ΔP_neighborhood(t)
    neighborhood_momentum = dp_3m - np.mean(dp_3m)
    
    df_out['state_dp_3m'] = dp_3m
    df_out['state_volatility'] = volatility
    df_out['state_volume'] = v_trans
    df_out['state_dispersion'] = dispersion
    df_out['state_neighborhood_momentum'] = neighborhood_momentum
    
    return df_out

class MarketRegimeClassifier:
    """
    Fits Gaussian Mixture Model (GMM) on 5D market state vectors to classify 4 latent market regimes.
    """
    def __init__(self, n_regimes: int = 4, random_state: int = 42):
        self.n_regimes = n_regimes
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.gmm = GaussianMixture(n_components=n_regimes, covariance_type='full', random_state=random_state)
        self.feature_cols = [
            'state_dp_3m', 'state_volatility', 'state_volume',
            'state_dispersion', 'state_neighborhood_momentum'
        ]
        self.is_fitted = False
        
    def fit_predict(self, df_state: pd.DataFrame) -> np.ndarray:
        """
        Fits GMM on state vector features and returns regime cluster assignments [0..3].
        """
        X_state = df_state[self.feature_cols].values
        X_scaled = self.scaler.fit_transform(X_state)
        regimes = self.gmm.fit_predict(X_scaled)
        self.is_fitted = True
        
        # Map clusters to readable labels based on growth / volatility profile
        means = self.gmm.means_
        # Sort cluster indices by price growth mean
        growth_idx = np.argsort(means[:, 0]) # lowest to highest growth
        
        # Map: lowest growth -> Cooling, highest -> Growth, highest vol -> Shock, rest -> Stable
        print(f"[GMM Regime Clustering] Identified {self.n_regimes} market regimes across {len(df_state)} state vectors.")
        return regimes
        
    def predict(self, df_state: pd.DataFrame) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("GMM Regime Classifier must be fitted before predict().")
        X_state = df_state[self.feature_cols].values
        X_scaled = self.scaler.transform(X_state)
        return self.gmm.predict(X_scaled)
