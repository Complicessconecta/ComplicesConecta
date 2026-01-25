import requests

BASE_URL = "http://localhost:8080"
CHAT_ENDPOINT = "/chat"
TIMEOUT = 30

def test_verify_chat_ui_rendering():
    # Test access without authentication/session - accept restricted or 200 OK status
    try:
        response = requests.get(f"{BASE_URL}{CHAT_ENDPOINT}", timeout=TIMEOUT)
        assert response.status_code in {200, 401, 403, 302}, f"Expected access restriction or 200 status but got {response.status_code}"
        if response.status_code == 200:
            content = response.text.lower()
            # Check for likely chat UI placeholder or limited guest view indication
            assert "chat" in content or "real-time" in content or "messaging" in content, \
                "Chat UI content does not appear correct on unauthenticated access."
    except requests.RequestException as e:
        assert False, f"Request failed unexpectedly: {e}"

    # Now test access with a valid session if API supports demo mode or authentication
    session = requests.Session()
    try:
        demo_resp = session.get(f"{BASE_URL}/demo", timeout=TIMEOUT)
        assert demo_resp.status_code == 200, f"Demo mode UI should render with 200, got {demo_resp.status_code}"

        # Access /chat with session after demo mode visit (assuming session cookie established)
        chat_resp = session.get(f"{BASE_URL}{CHAT_ENDPOINT}", timeout=TIMEOUT)
        assert chat_resp.status_code == 200, f"Expected 200 OK for authenticated chat UI, got {chat_resp.status_code}"
        content = chat_resp.text.lower()
        assert "chat" in content or "real-time" in content or "messaging" in content, \
            "Chat UI content does not appear correct."

    except requests.RequestException as e:
        assert False, f"Request with authentication/session failed unexpectedly: {e}"
    finally:
        session.close()

test_verify_chat_ui_rendering()
