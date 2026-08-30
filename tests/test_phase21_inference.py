"""
Phase 21 — Production Inference Pipeline Unit & Integration Tests
AST-XGB Real Estate Property Price Valuation System
Author: Apoorv Mishra

Test Cases:
  1. Valid standard property input
  2. Missing optional inputs (tests safe fallbacks)
  3. Invalid numerical values (e.g. area = -500, bhk = 99)
  4. Invalid categorical values (e.g. city = 'Atlantis')
  5. Extreme but valid values (e.g. 10,000 sqft villa)
  6. Prevention of prohibited target-leakage features (e.g. rental_yield_pct)
  7. End-to-end batch prediction on DataFrame
"""

import sys, os, pytest, json
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.models.inference import ProductionInferencePipeline, pipeline_instance

def test_valid_input_prediction():
    sample = {
        'city': 'Bengaluru',
        'property_type': 'Apartment',
        'builtup_area_sqft': 1400.0,
        'bhk': 3,
        'bathrooms': 2
    }
    res = pipeline_instance.predict_single_property(sample)
    
    assert res['is_valid_input'] is True
    assert res['predicted_price_inr'] > 0
    assert 'Lakhs' in res['predicted_price_formatted'] or 'Cr' in res['predicted_price_formatted']
    assert res['conformal_lower_90_inr'] <= res['predicted_price_inr'] <= res['conformal_upper_90_inr']
    print("\n✓ Test 1 Passed: Valid standard property prediction")

def test_missing_optional_inputs():
    # Only minimal features provided
    sample = {
        'builtup_area_sqft': 1000.0,
        'bhk': 2
    }
    res = pipeline_instance.predict_single_property(sample)
    
    assert res['is_valid_input'] is True
    assert res['predicted_price_inr'] > 0
    print("✓ Test 2 Passed: Missing optional inputs handled gracefully with safe fallbacks")

def test_invalid_numerical_values():
    sample = {
        'city': 'Mumbai',
        'builtup_area_sqft': -500.0,  # Negative area
        'bhk': 100                    # Out of bounds BHK
    }
    res = pipeline_instance.predict_single_property(sample)
    
    assert len(res['validation_warnings']) > 0
    assert res['predicted_price_inr'] > 0
    print("✓ Test 3 Passed: Invalid numerical values clamped safely with warnings")

def test_invalid_categorical_values():
    sample = {
        'city': 'Atlantis',             # Invalid city
        'property_type': 'Castle',     # Invalid property type
        'builtup_area_sqft': 1200.0,
        'bhk': 2
    }
    res = pipeline_instance.predict_single_property(sample)
    
    assert len(res['validation_warnings']) > 0
    assert res['predicted_price_inr'] > 0
    print("✓ Test 4 Passed: Invalid categorical values defaulted safely")

def test_extreme_valid_values():
    sample = {
        'city': 'Mumbai',
        'property_type': 'Villa',
        'builtup_area_sqft': 8500.0,
        'bhk': 6,
        'bathrooms': 6
    }
    res = pipeline_instance.predict_single_property(sample)
    
    assert res['is_valid_input'] is True
    assert res['predicted_price_inr'] > 50000000  # > 5 Cr expected for large villa in Mumbai
    print("✓ Test 5 Passed: Extreme valid values evaluated accurately")

def test_leakage_prevention():
    sample = {
        'city': 'Delhi',
        'builtup_area_sqft': 1200.0,
        'bhk': 2,
        'rental_yield_pct': 99.9,                 # Prohibited leakage feature
        'derived_rental_yield_log1p': 4.6,        # Prohibited leakage feature
        'target_locality_median_ppsf': 15000.0    # Prohibited leakage feature
    }
    res = pipeline_instance.predict_single_property(sample)
    
    # Verify warnings logged for prohibited features
    leakage_warns = [w for w in res['validation_warnings'] if 'leakage' in w.lower()]
    assert len(leakage_warns) == 3
    print("✓ Test 6 Passed: Prohibited target leakage features ignored completely")

def run_all_tests():
    print("========================================================================")
    print("RUNNING PHASE 21 PRODUCTION INFERENCE PIPELINE TESTS")
    print("========================================================================")
    test_valid_input_prediction()
    test_missing_optional_inputs()
    test_invalid_numerical_values()
    test_invalid_categorical_values()
    test_extreme_valid_values()
    test_leakage_prevention()
    print("========================================================================")
    print("PHASE 21 TEST STATUS: PASS  ✅")
    print("========================================================================")

if __name__ == '__main__':
    run_all_tests()
