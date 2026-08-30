"""
Data Ingestion Module for AST-XGB Valuation System.
Handles multi-attribute transaction records, spatial POIs, macro series, and synthetic testbed generation.
"""

import os
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any

REQUIRED_SCHEMA_FIELDS = [
    'property_id', 'transaction_date', 'price', 'area',
    'bedrooms', 'bathrooms', 'property_type', 'age',
    'floor', 'parking', 'condition', 'latitude', 'longitude',
    'location_id'
]

def generate_synthetic_testbed(
    n_samples: int = 5000,
    start_date: str = '2021-01-01',
    end_date: str = '2025-12-31',
    random_seed: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Generates a realistic multi-year real estate transaction testbed dataset,
    urban POI telemetry layer, and macroeconomic time-series.
    """
    np.random.seed(random_seed)
    
    # 1. Generate Timestamps
    dates = pd.date_range(start=start_date, end=end_date, periods=n_samples)
    dates = np.random.choice(dates, size=n_samples, replace=True)
    dates = sorted(dates)
    
    # 2. Location & Neighborhood Clusters (e.g. 5 distinct zones)
    n_zones = 5
    zone_centers = {
        0: (25.1972, 55.2744),  # Downtown / CBD core
        1: (25.0772, 55.1332),  # Marina / Coastal
        2: (25.0483, 55.2185),  # Suburban Villas
        3: (25.2631, 55.3087),  # Old City / Cultural
        4: (25.1185, 55.3902),  # East Metro Expansion
    }
    
    zone_ids = np.random.choice(list(zone_centers.keys()), size=n_samples, p=[0.25, 0.25, 0.20, 0.15, 0.15])
    
    lats = [zone_centers[z][0] + np.random.normal(0, 0.015) for z in zone_ids]
    lons = [zone_centers[z][1] + np.random.normal(0, 0.015) for z in zone_ids]
    
    # 3. Property Attributes
    property_types = np.random.choice(['Apartment', 'Villa', 'Townhouse', 'Penthouse'], size=n_samples, p=[0.55, 0.25, 0.15, 0.05])
    
    areas = []
    beds = []
    baths = []
    floors = []
    parkings = []
    
    for ptype in property_types:
        if ptype == 'Apartment':
            a = np.random.normal(950, 250)
            b = np.random.choice([1, 2, 3], p=[0.4, 0.4, 0.2])
            ba = np.random.choice([1, 2, 3], p=[0.4, 0.5, 0.1])
            fl = np.random.randint(1, 40)
            pk = np.random.choice([0, 1, 2], p=[0.2, 0.7, 0.1])
        elif ptype == 'Villa':
            a = np.random.normal(3200, 700)
            b = np.random.choice([3, 4, 5, 6], p=[0.2, 0.4, 0.3, 0.1])
            ba = b + np.random.choice([0, 1], p=[0.4, 0.6])
            fl = np.random.randint(1, 3)
            pk = np.random.choice([2, 3, 4], p=[0.5, 0.3, 0.2])
        elif ptype == 'Townhouse':
            a = np.random.normal(2100, 400)
            b = np.random.choice([2, 3, 4], p=[0.2, 0.6, 0.2])
            ba = b
            fl = np.random.randint(1, 3)
            pk = np.random.choice([1, 2], p=[0.4, 0.6])
        else:  # Penthouse
            a = np.random.normal(4800, 1000)
            b = np.random.choice([4, 5, 6], p=[0.4, 0.4, 0.2])
            ba = b + 1
            fl = np.random.randint(35, 75)
            pk = np.random.choice([2, 3, 4], p=[0.3, 0.5, 0.2])
            
        areas.append(max(350, int(a)))
        beds.append(b)
        baths.append(ba)
        floors.append(fl)
        parkings.append(pk)
        
    ages = np.random.randint(0, 30, size=n_samples)
    conditions = np.random.choice(['Good', 'Excellent', 'Fair', 'Renovated'], size=n_samples, p=[0.4, 0.3, 0.15, 0.15])
    
    # 4. Realistic Price Engine with Macro Trend + Regimes
    # Distance to CBD core (25.1972, 55.2744)
    cbd_lat, cbd_lon = 25.1972, 55.2744
    d_cbd = np.sqrt((np.array(lats) - cbd_lat)**2 + (np.array(lons) - cbd_lon)**2) * 111.0 # approx km
    
    # Base price per sqft depends on zone, property type, CBD dist
    base_ppsf = 1200 - 35 * d_cbd + np.where(property_types == 'Penthouse', 800, 0) + np.where(property_types == 'Villa', 300, 0)
    base_ppsf = np.clip(base_ppsf, 400, 3500)
    
    # Macro inflation/appreciation trend over time
    days_from_start = (pd.to_datetime(dates) - pd.to_datetime(start_date)).days
    macro_factor = 1.0 + 0.08 * (days_from_start / 365.0) + 0.05 * np.sin(days_from_start / 180.0)
    
    # Add condition & age impact
    cond_factor = np.where(conditions == 'Excellent', 1.15, np.where(conditions == 'Renovated', 1.10, np.where(conditions == 'Good', 1.0, 0.88)))
    age_factor = 1.0 - 0.005 * ages
    
    noise = np.random.normal(1.0, 0.08, size=n_samples)
    
    prices = np.array(areas) * base_ppsf * macro_factor * cond_factor * age_factor * noise
    prices = np.round(prices, -2)
    
    df_transactions = pd.DataFrame({
        'property_id': [f'PROP_{i:06d}' for i in range(n_samples)],
        'transaction_date': pd.to_datetime(dates),
        'price': prices,
        'area': areas,
        'bedrooms': beds,
        'bathrooms': baths,
        'property_type': property_types,
        'age': ages,
        'floor': floors,
        'parking': parkings,
        'condition': conditions,
        'latitude': lats,
        'longitude': lons,
        'location_id': zone_ids
    })
    
    # 5. POI Layer
    poi_data = pd.DataFrame({
        'poi_id': [f'POI_{i:04d}' for i in range(50)],
        'poi_name': [f'Urban_Anchor_{i}' for i in range(50)],
        'category': np.random.choice(['CBD', 'Metro_Station', 'School', 'Hospital', 'Shopping_Mall'], size=50),
        'latitude': np.random.uniform(25.0, 25.3, size=50),
        'longitude': np.random.uniform(55.1, 55.4, size=50)
    })
    
    # Add fixed anchors
    anchors = pd.DataFrame([
        {'poi_id': 'POI_CBD_01', 'poi_name': 'Central Business District', 'category': 'CBD', 'latitude': 25.1972, 'longitude': 55.2744},
        {'poi_id': 'POI_METRO_01', 'poi_name': 'Central Metro Station', 'category': 'Metro_Station', 'latitude': 25.2000, 'longitude': 55.2700},
        {'poi_id': 'POI_SCH_01', 'poi_name': 'International Academy', 'category': 'School', 'latitude': 25.1800, 'longitude': 55.2600},
        {'poi_id': 'POI_HOSP_01', 'poi_name': 'Metropolitan Medical Center', 'category': 'Hospital', 'latitude': 25.1900, 'longitude': 55.2800},
    ])
    poi_data = pd.concat([anchors, poi_data], ignore_index=True)
    
    # 6. Economic Indicators
    monthly_dates = pd.date_range(start=start_date, end=end_date, freq='MS')
    df_economic = pd.DataFrame({
        'date': monthly_dates,
        'interest_rate': 3.5 + 0.5 * np.sin(np.arange(len(monthly_dates)) / 6.0) + np.random.normal(0, 0.1, len(monthly_dates)),
        'inflation_rate': 2.1 + 0.3 * np.cos(np.arange(len(monthly_dates)) / 4.0),
        'gdp_growth': 3.8 + np.random.normal(0, 0.2, len(monthly_dates))
    })
    
    return df_transactions, poi_data, df_economic

def load_transaction_data(file_path: str) -> pd.DataFrame:
    """
    Loads transaction dataset from Parquet or CSV and enforces mandatory schema.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Transaction data file not found at: {file_path}")
        
    if file_path.endswith('.parquet'):
        df = pd.read_parquet(file_path)
    elif file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    else:
        raise ValueError("Unsupported file format. Use .parquet or .csv")
        
    missing_fields = [f for f in REQUIRED_SCHEMA_FIELDS if f not in df.columns]
    if missing_fields:
        raise ValueError(f"Dataset missing required schema fields: {missing_fields}")
        
    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    return df
