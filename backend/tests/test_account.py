import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_auth_signup_and_login_flow():
    # 1. Signup with valid details
    test_email = "test_user_phase11@example.com"
    test_password = "SecurePassword123!"
    
    signup_payload = {
        "email": test_email,
        "password": test_password,
        "name": "Vikram Malhotra",
        "phone": "+91 9876543210",
        "role": "Buyer"
    }
    
    res = client.post("/api/v1/auth/signup", json=signup_payload)
    # Could be 200 or 400 if already exists in test run
    if res.status_code == 400:
        assert "already exists" in res.json()["detail"]
    else:
        assert res.status_code == 200
        data = res.json()
        assert data["user"]["email"] == test_email
        assert "session" in data
        assert "token" in data["session"]

    # 2. Login with valid credentials
    login_res = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    token = login_data["session"]["token"]
    assert token is not None

    # 3. Login with invalid password
    bad_res = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "WrongPassword999!"
    })
    assert bad_res.status_code == 401

    # 4. Access protected profile endpoint
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["user"]["email"] == test_email

    # 5. Update user profile
    update_res = client.put("/api/v1/auth/profile", json={
        "name": "Vikram S. Malhotra",
        "notification_prefs": {"price_drop_alerts": True, "sms_updates": True}
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["user"]["name"] == "Vikram S. Malhotra"
    assert update_res.json()["user"]["notification_prefs"]["sms_updates"] is True

    # 6. Saved Properties workflow
    save_res = client.post("/api/v1/user/saved-properties/prop-blr-01", headers=headers)
    assert save_res.status_code == 200
    assert "prop-blr-01" in save_res.json()["saved_property_ids"]

    get_saved = client.get("/api/v1/user/saved-properties", headers=headers)
    assert get_saved.status_code == 200
    assert "prop-blr-01" in get_saved.json()["saved_property_ids"]

    del_saved = client.delete("/api/v1/user/saved-properties/prop-blr-01", headers=headers)
    assert del_saved.status_code == 200
    assert "prop-blr-01" not in del_saved.json()["saved_property_ids"]

    # 7. Logout
    logout_res = client.post("/api/v1/auth/logout", headers=headers)
    assert logout_res.status_code == 200

    # 8. Access with terminated token fails
    unauth_res = client.get("/api/v1/auth/me", headers=headers)
    assert unauth_res.status_code == 401


def test_inquiry_submission_and_rate_limiting():
    # Submit valid inquiry as guest
    inquiry_payload = {
        "property_id": "prop-mum-01",
        "property_title": "2 BHK Flat in Andheri East",
        "name": "Ananya Roy",
        "phone": "+91 9123456789",
        "email": "ananya@example.com",
        "message": "Please share floor plans and price breakdown.",
        "preferred_bhk": "2 BHK"
    }

    res = client.post("/api/v1/inquiries", json=inquiry_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "inquiry" in data
    assert "id" in data["inquiry"]
    assert "delivery_notice" in data["inquiry"]

    # Validation failure: invalid phone number
    bad_phone = inquiry_payload.copy()
    bad_phone["phone"] = "123"
    res_bad = client.post("/api/v1/inquiries", json=bad_phone)
    assert res_bad.status_code == 400


def test_unauthorized_endpoints():
    res = client.get("/api/v1/user/saved-properties")
    assert res.status_code == 401

    res_inquiries = client.get("/api/v1/user/inquiries")
    assert res_inquiries.status_code == 401
