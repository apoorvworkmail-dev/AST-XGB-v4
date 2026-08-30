"""
Phase 21 — Production Inference Pipeline Module
AST-XGB Real Estate Property Price Valuation System
Author: Apoorv Mishra

Loads the validated Phase 20 XGBoost model & ColumnTransformer pipeline.
Executes deterministic, leakage-free price predictions, 90% conformal prediction intervals,
and input validation for single or batch property instances.
"""

import os, sys, warnings, json, joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List, Union, Tuple

warnings.filterwarnings('ignore')

# Paths
BASE_DIR   = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BASE_DIR / "models" / "xgboost_final_v4"
MODEL_FILE = MODELS_DIR / "final_xgboost_model.pkl"
PREP_FILE  = MODELS_DIR / "preprocessing_pipeline.pkl"
META_FILE  = MODELS_DIR / "model_metadata.json"
CALIB_FILE = BASE_DIR / "results" / "phase_19_calibration_summary.csv"

# Valid Categories & Defaults from v4 training set
VALID_CITIES = ['Bengaluru', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Mumbai', 'Pune']
VALID_PROPERTY_TYPES = ['Apartment', 'Independent House', 'Penthouse', 'Villa', 'Builder Floor']

# Default medians for non-mandatory modeling features
DEFAULT_FEATURE_VALUES = {
    'city': 'Bengaluru',
    'property_type': 'Apartment',
    'bhk': 2,
    'bathrooms': 2,
    'balconies': 1,
    'builtup_area_sqft': 1200.0,
    'floor_no': 3,
    'total_floors': 10,
    'parking': 1,
    'furnishing': 'Unfurnished',
    'facing': 'North',
    'latitude': 12.9716,
    'longitude': 77.5946,
    'schools_distance_km': 1.5,
    'hospitals_distance_km': 2.0,
    'metro_stations_distance_km': 1.2,
    'railway_stations_distance_km': 5.0,
    'malls_distance_km': 2.5,
    'parks_distance_km': 1.0,
    'transit_stations_distance_km': 1.0,
    'accessibility_score': 7.5,
    'avg_monthly_rent': 25000.0,
    'median_monthly_rent': 24000.0,
    'median_rent_per_sqft': 20.0,
    'rental_listing_count': 150,
    'hist_hpi_market': 125.0,
    'hist_qoq_growth': 1.2,
    'hist_yoy_growth': 5.5,
    'hist_market_regime': 'Stable',
    'repo_rate': 6.50,
    'bank_rate': 6.75,
    'CRR': 4.50,
    'SLR': 18.0,
    'repo_rate_change': 0.0,
    'repo_rate_3m_change': 0.0,
    'repo_rate_12m_change': 0.25,
    'hist_cpi_index': 160.0,
    'hist_cpi_yoy_growth': 5.0,
    'hist_cpi_3m_change': 1.0,
    'hist_cpi_12m_change': 4.5,
    'rera_registered': 1,
    'project_status': 'Under Construction',
    'completion_percent': 75.0,
    'construction_duration_months': 36.0,
    'project_age': 2.0,
    'developer_project_count': 10,
    'developer_completion_rate': 90.0,
    'developer_lapsed_project_count': 0,
    'aqi': 120.0,
    'pm25': 45.0,
    'pm10': 90.0,
    'aqi_30d_avg': 115.0,
    'aqi_90d_avg': 118.0,
    'derived_carpet_efficiency': 0.75,
    'derived_floor_ratio': 0.30,
    'derived_carpet_efficiency_log1p': np.log1p(0.75),
    'historical_locality_median_ppsf': 5500.0,
    'historical_rental_yield_pct': 3.5,
    'derived_historical_rental_yield_log1p': np.log1p(3.5)
}


class ProductionInferencePipeline:
    """
    Leakage-Free Production Inference Pipeline.
    Loads Phase 20 XGBoost v4 model, ColumnTransformer, and Conformal prediction bounds.
    """

    def __init__(self, model_dir: Path = MODELS_DIR):
        self.model_dir = model_dir
        self.model = None
        self.preprocessor = None
        self.metadata = {}
        self.q_90_inr = 5876387.66  # Default Phase 19 90% Conformal Quantile
        self._is_loaded = False
        self._load_artifacts()

    def _load_artifacts(self):
        """Loads model, preprocessor, metadata, and conformal calibration quantiles."""
        if not MODEL_FILE.exists() or not PREP_FILE.exists():
            raise FileNotFoundError(f"Missing required model artifacts in {self.model_dir}")

        self.model = joblib.load(MODEL_FILE)
        self.preprocessor = joblib.load(PREP_FILE)

        if META_FILE.exists():
            with open(META_FILE, 'r', encoding='utf-8') as f:
                self.metadata = json.load(f)

        if CALIB_FILE.exists():
            try:
                calib_df = pd.read_csv(CALIB_FILE)
                if 'q_90' in calib_df.columns:
                    self.q_90_inr = float(calib_df['q_90'].iloc[0])
            except Exception:
                pass

        self._is_loaded = True

    @staticmethod
    def format_price_inr(price: float) -> str:
        """Formats INR price into Lakhs (L) or Crores (Cr) for user-friendly UI display."""
        if price >= 10000000:
            return f"₹ {price / 10000000:.2f} Cr"
        elif price >= 100000:
            return f"₹ {price / 100000:.2f} Lakhs"
        else:
            return f"₹ {price:,.2f}"

    def validate_input(self, prop_dict: Dict[str, Any]) -> Tuple[Dict[str, Any], bool, List[str]]:
        """
        Validates input types, numerical ranges, and categorical values.
        Applies safe fallbacks for missing non-critical features without target leakage.
        """
        warnings_list = []
        is_valid = True
        clean_input = DEFAULT_FEATURE_VALUES.copy()

        # Check for contaminated features and explicitly reject them
        for c_feat in ['rental_yield_pct', 'derived_rental_yield_log1p', 'target_locality_median_ppsf']:
            if c_feat in prop_dict:
                warnings_list.append(f"Ignored prohibited target-leakage feature: {c_feat}")

        # Validate City
        if 'city' in prop_dict and prop_dict['city'] in VALID_CITIES:
            clean_input['city'] = prop_dict['city']
        elif 'city' in prop_dict:
            warnings_list.append(f"Invalid city '{prop_dict['city']}'. Defaulting to 'Bengaluru'.")

        # Validate Property Type
        if 'property_type' in prop_dict and prop_dict['property_type'] in VALID_PROPERTY_TYPES:
            clean_input['property_type'] = prop_dict['property_type']
        elif 'property_type' in prop_dict:
            warnings_list.append(f"Invalid property type '{prop_dict['property_type']}'. Defaulting to 'Apartment'.")

        # Validate Built-up Area
        if 'builtup_area_sqft' in prop_dict or 'area' in prop_dict:
            area_val = prop_dict.get('builtup_area_sqft', prop_dict.get('area'))
            try:
                area_float = float(area_val)
                if 100 <= area_float <= 50000:
                    clean_input['builtup_area_sqft'] = area_float
                else:
                    warnings_list.append(f"Area {area_float} out of range [100, 50000]. Clamped.")
                    clean_input['builtup_area_sqft'] = np.clip(area_float, 100, 50000)
            except (ValueError, TypeError):
                is_valid = False
                warnings_list.append("Invalid numerical value for area.")

        # Validate BHK
        if 'bhk' in prop_dict or 'bedrooms' in prop_dict:
            bhk_val = prop_dict.get('bhk', prop_dict.get('bedrooms'))
            try:
                bhk_int = int(bhk_val)
                if 1 <= bhk_int <= 20:
                    clean_input['bhk'] = bhk_int
                else:
                    clean_input['bhk'] = np.clip(bhk_int, 1, 20)
            except (ValueError, TypeError):
                is_valid = False
                warnings_list.append("Invalid numerical value for BHK.")

        # Validate Bathrooms
        if 'bathrooms' in prop_dict:
            try:
                bath_int = int(prop_dict['bathrooms'])
                clean_input['bathrooms'] = max(1, bath_int)
            except (ValueError, TypeError):
                pass

        # Update any other valid user-supplied features
        for key, val in prop_dict.items():
            if key in clean_input and key not in ['city', 'property_type', 'builtup_area_sqft', 'bhk', 'bathrooms']:
                try:
                    clean_input[key] = type(clean_input[key])(val)
                except Exception:
                    pass

        # Dynamically compute derived area and bathroom features
        area = clean_input['builtup_area_sqft']
        bhk  = clean_input['bhk']
        bath = clean_input['bathrooms']

        clean_input['derived_area_per_bhk'] = area / bhk
        clean_input['derived_bathrooms_per_bhk'] = bath / bhk
        clean_input['derived_area_per_bhk_log1p'] = np.log1p(area / bhk)
        clean_input['derived_rent_per_sqft_log1p'] = np.log1p(clean_input['median_rent_per_sqft'])

        return clean_input, is_valid, warnings_list

    def predict_single_property(self, prop_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes end-to-end inference for a single property dictionary.
        Returns predicted price, formatted string, price/sqft, and 90% conformal bounds.
        """
        if not self._is_loaded:
            self._load_artifacts()

        clean_input, is_valid, warnings_list = self.validate_input(prop_dict)

        # Convert to single-row DataFrame
        df_input = pd.DataFrame([clean_input])

        # Preprocess features using fitted ColumnTransformer
        X_trans = self.preprocessor.transform(df_input)

        # Model point prediction on log scale
        pred_log = self.model.predict(X_trans)[0]

        # Exponentiate back to native INR scale
        pred_inr = float(np.expm1(pred_log))
        area = float(clean_input['builtup_area_sqft'])
        ppsf = pred_inr / area if area > 0 else 0.0

        # Conformal 90% Prediction Interval
        lower_90_inr = max(0.0, pred_inr - self.q_90_inr)
        upper_90_inr = pred_inr + self.q_90_inr

        return {
            'predicted_price_inr': round(pred_inr, 2),
            'predicted_price_formatted': self.format_price_inr(pred_inr),
            'price_per_sqft': round(ppsf, 2),
            'conformal_lower_90_inr': round(lower_90_inr, 2),
            'conformal_upper_90_inr': round(upper_90_inr, 2),
            'conformal_lower_90_formatted': self.format_price_inr(lower_90_inr),
            'conformal_upper_90_formatted': self.format_price_inr(upper_90_inr),
            'is_valid_input': is_valid,
            'validation_warnings': warnings_list,
            'model_version': self.metadata.get('model_version', 'Phase 15 XGBoost v4'),
            'feature_version': 'v4'
        }

    def predict_batch(self, df_props: pd.DataFrame) -> pd.DataFrame:
        """Executes batch inference on a DataFrame of properties."""
        results = [self.predict_single_property(row.to_dict()) for _, row in df_props.iterrows()]
        return pd.DataFrame(results)


# Singleton instance for efficient reuse across API endpoints
pipeline_instance = ProductionInferencePipeline()

if __name__ == '__main__':
    # Test single property prediction
    sample_prop = {
        'city': 'Bengaluru',
        'property_type': 'Apartment',
        'builtup_area_sqft': 1500.0,
        'bhk': 3,
        'bathrooms': 2,
        'locality': 'Whitefield'
    }

    res = pipeline_instance.predict_single_property(sample_prop)
    print("Test Single Prediction:")
    print(json.dumps(res, indent=2))
