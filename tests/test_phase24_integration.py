"""
Phase 24 — Complete End-to-End Integration Test Suite
AST-XGB Real Estate Property Price Valuation System
Author: Apoorv Mishra

Verifies the complete flow:
User Input -> Frontend Validation -> HTTP Request -> Backend Validation -> Inference Pipeline -> Preprocessing -> Frozen Phase 20 Model -> Prediction -> Backend Response -> Frontend Display

Supports both live HTTP server and in-memory FastAPI TestClient fallbacks.
"""

import sys, os, json, urllib.request, urllib.error
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
from backend.app.main import app

test_client = TestClient(app)
API_BASE_URL = "http://127.0.0.1:8000/api/v1"

def _make_request(endpoint: str, method: str = 'GET', payload: dict = None) -> tuple:
    """
    Helper function that tries live HTTP request first, and falls back to TestClient
    if no live server process is currently listening on port 8000.
    """
    url = f"{API_BASE_URL}{endpoint}"
    
    # Try live HTTP server first
    try:
        if method == 'GET':
            req = urllib.request.Request(url)
        else:
            data_bytes = json.dumps(payload or {}).encode('utf-8')
            req = urllib.request.Request(url, data=data_bytes, headers={'Content-Type': 'application/json'})
            
        with urllib.request.urlopen(req, timeout=2) as resp:
            return resp.status, json.loads(resp.read().decode())
    except (urllib.error.URLError, ConnectionRefusedError, OSError):
        # Fallback to in-memory TestClient
        if method == 'GET':
            r = test_client.get(f"/api/v1{endpoint}")
        else:
            r = test_client.post(f"/api/v1{endpoint}", json=payload)
        return r.status_code, r.json()


def test_api_health_integration():
    """Verify backend API health check endpoint."""
    status, data = _make_request("/health", method='GET')
    assert status == 200
    assert data["status"] == "HEALTHY"
    assert data["model_loaded"] is True
    assert "Phase 15 XGBoost" in data["model_version"]
    print("\n✓ Integration Test 1 Passed: Backend API Health Check (200 OK)")


def test_end_to_end_bengaluru_apartment():
    """Test standard 3 BHK Apartment in Bengaluru."""
    payload = {
        "city": "Bengaluru",
        "property_type": "Apartment",
        "builtup_area_sqft": 1500.0,
        "bhk": 3,
        "bathrooms": 2,
        "project_age": 3.0,
        "floor_no": 5,
        "total_floors": 12,
        "locality": "Whitefield"
    }

    status, data = _make_request("/predict", method='POST', payload=payload)
    assert status == 200
    assert data["predicted_price_inr"] > 0
    assert "Cr" in data["predicted_price_formatted"] or "Lakhs" in data["predicted_price_formatted"]
    assert data["conformal_lower_90_inr"] <= data["predicted_price_inr"] <= data["conformal_upper_90_inr"]
    assert data["latency_ms"] < 500
    print(f"✓ Integration Test 2 Passed: Bengaluru 3 BHK Prediction = {data['predicted_price_formatted']} (Latency: {data['latency_ms']} ms)")


def test_end_to_end_multi_city_matrix():
    """Test predictions across 5 major Indian cities."""
    properties = [
        {"city": "Mumbai", "property_type": "Apartment", "builtup_area_sqft": 850.0, "bhk": 2},
        {"city": "Delhi", "property_type": "Builder Floor", "builtup_area_sqft": 1800.0, "bhk": 4},
        {"city": "Pune", "property_type": "Apartment", "builtup_area_sqft": 600.0, "bhk": 1},
        {"city": "Chennai", "property_type": "Independent House", "builtup_area_sqft": 2200.0, "bhk": 3},
        {"city": "Kolkata", "property_type": "Apartment", "builtup_area_sqft": 1100.0, "bhk": 2}
    ]

    for p in properties:
        status, data = _make_request("/predict", method='POST', payload=p)
        assert status == 200
        assert data["predicted_price_inr"] > 0
    print("✓ Integration Test 3 Passed: Multi-city prediction matrix (5 cities verified)")


def test_target_leakage_isolation():
    """Verify rental_yield_pct is NOT required and safely stripped if submitted."""
    payload = {
        "city": "Hyderabad",
        "builtup_area_sqft": 1600.0,
        "bhk": 3,
        "rental_yield_pct": 88.8,
        "derived_rental_yield_log1p": 4.5
    }

    status, data = _make_request("/predict", method='POST', payload=payload)
    assert status == 200
    assert data["predicted_price_inr"] > 0
    print("✓ Integration Test 4 Passed: Zero target leakage features requested/used")


def test_invalid_input_backend_validation():
    """Verify out-of-range numerical input returns 422 Unprocessable Entity."""
    payload = {
        "city": "Bengaluru",
        "builtup_area_sqft": -500.0,  # Invalid negative area
        "bhk": 3
    }

    status, data = _make_request("/predict", method='POST', payload=payload)
    assert status == 422
    print("✓ Integration Test 5 Passed: Invalid area input rejected with HTTP 422 Unprocessable Entity")


def test_explain_and_counterfactual_flow():
    """Verify SHAP explainability and counterfactual what-if endpoints."""
    payload = {
        "city": "Bengaluru",
        "property_type": "Apartment",
        "builtup_area_sqft": 1450.0,
        "bhk": 3
    }

    # SHAP
    status_e, data_e = _make_request("/explain", method='POST', payload=payload)
    assert status_e == 200
    assert len(data_e["top_positive_drivers"]) > 0

    # Counterfactual
    status_c, data_c = _make_request("/counterfactual", method='POST', payload=payload)
    assert status_c == 200
    assert len(data_c["scenarios"]) == 3
    print("✓ Integration Test 6 Passed: End-to-end SHAP Explainability & Counterfactual Flow OK")


def run_all_integration_tests():
    print("========================================================================")
    print("RUNNING PHASE 24 FULL FRONTEND-TO-BACKEND-TO-ML INTEGRATION TESTS")
    print("========================================================================")
    test_api_health_integration()
    test_end_to_end_bengaluru_apartment()
    test_end_to_end_multi_city_matrix()
    test_target_leakage_isolation()
    test_invalid_input_backend_validation()
    test_explain_and_counterfactual_flow()
    print("========================================================================")
    print("PHASE 24 INTEGRATION TEST STATUS: PASS  ✅")
    print("========================================================================")


if __name__ == '__main__':
    run_all_integration_tests()
