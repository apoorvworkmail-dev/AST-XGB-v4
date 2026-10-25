import urllib.request
import json
import sys

def test_endpoints():
    print("Testing Backend...")
    # 1. Healthz
    with urllib.request.urlopen("http://127.0.0.1:8000/healthz") as resp:
        print("  /healthz status:", resp.status)
        assert resp.status == 200
        headers = dict(resp.headers)
        assert headers.get("x-content-type-options") == "nosniff"
        print("  Security headers verified: x-content-type-options=nosniff")

    # 2. Predict
    payload = json.dumps({
        "builtup_area_sqft": 1450.0,
        "bhk": 3,
        "bathrooms": 2,
        "property_type": "Apartment",
        "city": "Bengaluru",
        "locality": "Whitefield"
    }).encode("utf-8")
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/predict", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print("  /api/v1/predict status:", resp.status)
        print("  Predicted price INR:", data.get("predicted_price_inr"))
        assert data.get("predicted_price_inr") > 0

    print("Testing Frontend...")
    fe_req = urllib.request.Request("http://localhost:3000/", headers={"Accept": "text/html", "User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(fe_req) as resp:
        print("  Frontend http://localhost:3000/ status:", resp.status)
        html = resp.read().decode("utf-8")
        assert "GharDhundo" in html
        assert 'id="root"' in html
        print("  HTML title & root div verified successfully!")

    print("\nALL HTTP SERVICES LIVE AND VERIFIED!")

if __name__ == "__main__":
    test_endpoints()
