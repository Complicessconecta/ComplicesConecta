import requests

BASE_URL = "http://localhost:8080"
TIMEOUT = 30
HEADERS = {
    "Accept": "text/html"
}

def test_verify_auth_ui_rendering():
    url = f"{BASE_URL}/auth"
    try:
        response = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        response.raise_for_status()
        # Basic validations
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        content_type = response.headers.get("Content-Type", "")
        assert "text/html" in content_type, f"Expected Content-Type to include 'text/html' but got '{content_type}'"
        content = response.text.lower()

        # Check for login, registration, and MFA indicators in HTML content to verify UI rendering
        assert ("login" in content or "sign in" in content), "Login element not found in auth UI"
        assert ("register" in content or "sign up" in content), "Registration element not found in auth UI"
        # MFA optional, so check if presence or at least hint/reference is included
        assert ("mfa" in content or "multi-factor" in content or "two-factor" in content or "verification" in content), \
            "MFA support indicators not found in auth UI"

        # Check for basic responsiveness meta tag (viewport)
        assert "<meta name=\"viewport\"" in response.text, "Responsive viewport meta tag missing in auth UI"

        # Check presence of elements that may indicate error feedback UI
        assert ("error" in content or "invalid" in content or "required" in content), \
            "Clear error feedback elements not found in auth UI"

    except requests.RequestException as e:
        assert False, f"Request to /auth failed: {e}"

test_verify_auth_ui_rendering()