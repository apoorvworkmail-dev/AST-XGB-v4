"""
API Unit & Integration Tests for FastAPI Backend.
"""

import sys, os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["system"] == "AST-XGB Property Valuation Engine"

def test_predict_endpoint():
    payload = {
        "builtup_area_sqft": 1450.0,
        "bhk": 2,
        "bathrooms": 2,
        "property_type": "Apartment",
        "project_age": 5,
        "floor_no": 12,
        "city": "Bengaluru",
        "locality": "Whitefield"
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_price_inr" in data
    assert "conformal_lower_90_inr" in data
    assert "conformal_upper_90_inr" in data
    assert "active_market_regime" in data
    assert data["predicted_price_inr"] > 0

def test_explain_endpoint():
    payload = {
        "builtup_area_sqft": 1450.0,
        "bhk": 2,
        "bathrooms": 2,
        "property_type": "Apartment",
        "city": "Bengaluru"
    }
    response = client.post("/api/v1/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "top_positive_drivers" in data
    assert "top_negative_drivers" in data

def test_counterfactual_endpoint():
    payload = {
        "builtup_area_sqft": 1450.0,
        "bhk": 2,
        "bathrooms": 2,
        "property_type": "Apartment",
        "city": "Bengaluru"
    }
    response = client.post("/api/v1/counterfactual", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "baseline_prediction_inr" in data
    assert len(data["scenarios"]) >= 3

def test_market_state_endpoint():
    response = client.get("/api/v1/market-state")
    assert response.status_code == 200
    data = response.json()
    assert "active_regime" in data
    assert "growth_3m_pct" in data

