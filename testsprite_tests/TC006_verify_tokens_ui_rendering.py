import requests

BASE_URL = "http://localhost:8080"
TIMEOUT = 30

def test_verify_tokens_ui_rendering():
    url = f"{BASE_URL}/tokens"
    headers = {
        "Accept": "application/json",
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to /tokens failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    # Try to parse JSON response if any
    try:
        data = response.json()
    except ValueError:
        data = None

    # Since UI rendering is usually HTML or JSON with UI data,
    # check content-type header and minimal content checks.

    content_type = response.headers.get("Content-Type", "")
    assert "text/html" in content_type or "application/json" in content_type, \
        f"Unexpected Content-Type: {content_type}"

    # If JSON data was returned, verify presence of CMPX and GTK balances keys or fields
    if isinstance(data, dict):
        # Check for keys typically representing CMPX and GTK balances in the token dashboard
        # This is a best effort since schema is not defined exactly for response content
        has_cmpx = any(key.lower().find("cmpx") != -1 for key in data.keys())
        has_gtk = any(key.lower().find("gtk") != -1 for key in data.keys())
        assert has_cmpx or has_gtk, "Response JSON does not contain CMPX or GTK balance info keys"
    else:
        # If HTML, verify content includes expected keywords indicating balances display or navigation
        text = response.text.lower()
        assert "cmpx" in text, "Response HTML does not mention CMPX token"
        assert "gtk" in text, "Response HTML does not mention GTK token"
        assert "dashboard" in text or "tokens" in text, "Response HTML does not mention dashboard or tokens navigation"

test_verify_tokens_ui_rendering()