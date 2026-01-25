import requests

BASE_URL = "http://localhost:8080"
TIMEOUT = 30

def test_verify_chat_ui_rendering_with_id():
    # For this test we need a valid chat id to test /chat/{id}
    # Strategy: get available chat IDs from matches or discover endpoints
    # Since no explicit creation endpoint or ID is provided, we'll try to get a valid chat id from /matches or /discover.
    # If none found, skip test with appropriate assertion.

    headers = {
        "Accept": "application/json"
    }

    try:
        # Try to get matches to find a chat id - assuming /matches returns matched profiles with chat id
        matches_resp = requests.get(f"{BASE_URL}/matches", headers=headers, timeout=TIMEOUT)
        assert matches_resp.status_code == 200, f"Failed to get matches: {matches_resp.status_code}"
        matches_data = matches_resp.json() if 'application/json' in matches_resp.headers.get('Content-Type', '') else None

        chat_id = None
        # Attempt to locate a chat id from matches response (assuming matches_data is a list/dict containing id)
        if matches_data:
            if isinstance(matches_data, dict):
                # Try find id in keys or nested lists - heuristic
                if "matches" in matches_data and isinstance(matches_data["matches"], list) and matches_data["matches"]:
                    first_match = matches_data["matches"][0]
                    if isinstance(first_match, dict) and "chatId" in first_match:
                        chat_id = first_match["chatId"]
                    elif isinstance(first_match, dict) and "id" in first_match:
                        chat_id = first_match["id"]
            elif isinstance(matches_data, list) and len(matches_data) > 0:
                first_match = matches_data[0]
                if isinstance(first_match, dict):
                    chat_id = first_match.get("chatId") or first_match.get("id")

        # If no chat id from matches, fallback to discover endpoint - look for profiles which might give an id
        if not chat_id:
            discover_resp = requests.get(f"{BASE_URL}/discover", headers=headers, timeout=TIMEOUT)
            assert discover_resp.status_code == 200, f"Failed to get discover profiles: {discover_resp.status_code}"
            discover_data = discover_resp.json() if 'application/json' in discover_resp.headers.get('Content-Type', '') else None
            if discover_data:
                if isinstance(discover_data, dict):
                    if "profiles" in discover_data and isinstance(discover_data["profiles"], list) and discover_data["profiles"]:
                        first_profile = discover_data["profiles"][0]
                        if isinstance(first_profile, dict) and "id" in first_profile:
                            chat_id = first_profile["id"]
                elif isinstance(discover_data, list) and len(discover_data) > 0:
                    first_profile = discover_data[0]
                    if isinstance(first_profile, dict):
                        chat_id = first_profile.get("id")

        assert chat_id, "No chat or profile id found to test /chat/{id} endpoint."

        # Call /chat/{id} endpoint
        chat_resp = requests.get(f"{BASE_URL}/chat/{chat_id}", headers=headers, timeout=TIMEOUT)
        assert chat_resp.status_code == 200, f"/chat/{chat_id} endpoint did not return 200 OK"
        # Quick check for content-type to be html or json or text
        content_type = chat_resp.headers.get("Content-Type", "")
        assert "text/html" in content_type or "application/json" in content_type or "text/plain" in content_type, \
            f"Unexpected Content-Type: {content_type}"

        # Basic sanity check on returned content length
        assert len(chat_resp.content) > 0, "/chat/{id} response is empty"

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_verify_chat_ui_rendering_with_id()