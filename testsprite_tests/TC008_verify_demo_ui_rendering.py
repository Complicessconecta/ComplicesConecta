import requests

BASE_URL = "http://localhost:8080"
TIMEOUT = 30
HEADERS = {
    "Accept": "application/json"
}

def test_verify_demo_ui_rendering():
    url = f"{BASE_URL}/demo"
    try:
        response = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        assert False, f"Request to /demo endpoint failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    assert response.text, "Response body is empty, expected demo UI content"

    # Optional: Check for indicative keywords in response content related to demo mode UI
    demo_keywords = ["demo", "tour", "quick product tours", "demo mode"]
    content_lower = response.text.lower()
    assert any(keyword in content_lower for keyword in demo_keywords), "Demo UI content not found in response"

test_verify_demo_ui_rendering()
