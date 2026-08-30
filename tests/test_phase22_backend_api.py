"""
Phase 22 — FastAPI Backend Prediction API Unit & Integration Tests
AST-XGB Real Estate Property Price Valuation System
Author: Apoorv Mishra

Test Cases:
  1. GET /health & /api/v1/health
  2. POST /api/v1/predict with valid input
  3. POST /api/v1/predict with invalid city (422 Unprocessable Entity)
  4. POST /api/v1/predict with out-of-range area (422 Unprocessable Entity)
  5. POST /api/v1/predict with target leakage feature (ignored safely)
  6. POST /api/v1/explain
  7. POST /api/v1/counterfactual
  8. GET /api/v1/market-state
  9. Multiple consecutive prediction requests
"""

import sys, os, pytest
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoints():
    r1 = client.get("/health")
    assert r1.status_code == 200
    assert r1.json()["status"] == "HEALTHY"
    assert r1.json()["model_loaded"] is True
    
    r2 = client.get("/api/v1/health")
    assert r2.status_code == 200
    assert r2.json()["status"] == "HEALTHY"
    print("\n✓ Test 1 Passed: GET /health and /api/v1/health endpoints OK")

def test_valid_predict_endpoint():
    payload = {
        "builtup_area_sqft": 1450.0,
        "bhk": 3,
        "bathrooms": 2,
        "city": "Bengaluru",
        "property_type": "Apartment",
        "locality": "Whitefield"
    }
    r = client.post("/api/v1/predict", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["predicted_price_inr"] > 0
    assert "Lakhs" in data["predicted_price_formatted"] or "Cr" in data["predicted_price_formatted"]
    assert data["conformal_lower_90_inr"] <= data["predicted_price_inr"] <= data["conformal_upper_90_inr"]
    assert data["latency_ms"] >= 0
    print("✓ Test 2 Passed: POST /api/v1/predict valid prediction OK")

def test_invalid_city_predict():
    payload = {
        "builtup_area_sqft": 1200.0,
        "bhk": 2,
        "city": "Atlantis"  # Invalid city
    }
    r = client.post("/api/v1/predict", json=payload)
    assert r.status_code == 422
    print("✓ Test 3 Passed: POST /api/v1/predict invalid city rejected with 422 Unprocessable Entity")

def test_out_of_range_area_predict():
    payload = {
        "builtup_area_sqft": -50.0,  # Invalid area < 100
        "bhk": 2,
        "city": "Mumbai"
    }
    r = client.post("/api/v1/predict", json=payload)
    assert r.status_code == 422
    print("✓ Test 4 Passed: POST /api/v1/predict out-of-range area rejected with 422 Unprocessable Entity")

def test_target_leakage_feature_rejection():
    payload = {
        "builtup_area_sqft": 1500.0,
        "bhk": 3,
        "city": "Delhi",
        "rental_yield_pct": 99.9  # Prohibited leakage feature
    }
    r = client.post("/api/v1/predict", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["predicted_price_inr"] > 0
    print("✓ Test 5 Passed: Prohibited target-leakage feature safely stripped by Pydantic schema")

def test_explain_endpoint():
    payload = {
        "builtup_area_sqft": 1600.0,
        "bhk": 3,
        "city": "Mumbai"
    }
    r = client.post("/api/v1/explain", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert len(data["top_positive_drivers"]) > 0
    assert len(data["top_negative_drivers"]) > 0
    print("✓ Test 6 Passed: POST /api/v1/explain OK")

def test_counterfactual_endpoint():
    payload = {
        "builtup_area_sqft": 1200.0,
        "bhk": 2,
        "city": "Chennai"
    }
    r = client.post("/api/v1/counterfactual", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["baseline_prediction_inr"] > 0
    assert len(data["scenarios"]) == 3
    print("✓ Test 7 Passed: POST /api/v1/counterfactual simulation OK")

def test_market_state_endpoint():
    r = client.get("/api/v1/market-state")
    assert r.status_code == 200
    data = r.json()
    assert data["active_regime"] in ["Growth", "Stable", "Cooling", "Shock"]
    print("✓ Test 8 Passed: GET /api/v1/market-state OK")

def test_multiple_consecutive_predictions():
    cities = ["Bengaluru", "Chennai", "Delhi", "Hyderabad", "Kolkata", "Mumbai", "Pune"]
    for c in cities:
        payload = {"builtup_area_sqft": 1000.0 + len(c)*50, "bhk": 2, "city": c}
        r = client.post("/api/v1/predict", json=payload)
        assert r.status_code == 200
    print("✓ Test 9 Passed: Multiple consecutive prediction requests OK")

def run_all_backend_tests():
    print("========================================================================")
    print("RUNNING PHASE 22 FASTAPI BACKEND PREDICTION API TESTS")
    print("========================================================================")
    test_health_endpoints()
    test_valid_predict_endpoint()
    test_invalid_city_predict()
    test_out_of_range_area_predict()
    test_target_leakage_feature_rejection()
    test_explain_endpoint()
    test_counterfactual_endpoint()
    test_market_state_endpoint()
    test_multiple_consecutive_predictions()
    print("========================================================================")
    print("PHASE 22 BACKEND API TEST STATUS: PASS  ✅")
    print("========================================================================")

if __name__ == '__main__':
    run_all_backend_tests()
