"""
API Unit & Integration Tests for FastAPI Backend.
"""

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["system"] == "AST-XGB Valuation Engine"

def test_predict_endpoint():
    payload = {
        "area": 1450.0,
        "bedrooms": 2,
        "bathrooms": 2,
        "property_type": "Apartment",
        "age": 5,
        "floor": 12,
        "parking": 1,
        "condition": "Good",
        "latitude": 25.1972,
        "longitude": 55.2744,
        "location_id": 0
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "property_valuation" in data
    assert "conformal_pi_lower_90" in data
    assert "conformal_pi_upper_90" in data
    assert "active_market_regime" in data
    assert data["property_valuation"] > 0

def test_explain_endpoint():
    payload = {
        "area": 1450.0,
        "bedrooms": 2,
        "bathrooms": 2,
        "property_type": "Apartment",
        "age": 5,
        "floor": 12,
        "parking": 1,
        "condition": "Good",
        "latitude": 25.1972,
        "longitude": 55.2744,
        "location_id": 0
    }
    response = client.post("/api/v1/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "top_positive_drivers" in data
    assert "top_negative_drivers" in data

def test_counterfactual_endpoint():
    payload = {
        "area": 1450.0,
        "bedrooms": 2,
        "bathrooms": 2,
        "property_type": "Apartment",
        "age": 5,
        "floor": 12,
        "parking": 1,
        "condition": "Good",
        "latitude": 25.1972,
        "longitude": 55.2744,
        "location_id": 0
    }
    response = client.post("/api/v1/counterfactual", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "base_valuation" in data
    assert len(data["scenarios"]) >= 4

def test_market_state_endpoint():
    response = client.get("/api/v1/market-state")
    assert response.status_code == 200
    data = response.json()
    assert "active_regime" in data
    assert "growth_3m_pct" in data
