import requests

BASE_URL = "http://localhost:8080"
TIMEOUT = 30
HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "User-Agent": "Mozilla/5.0 (compatible; TestClient/1.0)"
}

def test_verify_landing_page_ui_rendering():
    try:
        response = requests.get(f"{BASE_URL}/", headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        content_type = response.headers.get("Content-Type", "")
        assert "html" in content_type.lower(), f"Expected 'html' in Content-Type, got {content_type}"
    except requests.RequestException as e:
        assert False, f"HTTP request to landing page failed: {str(e)}"

test_verify_landing_page_ui_rendering()