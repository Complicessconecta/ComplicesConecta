import requests

BASE_URL = "http://localhost:8080"
TIMEOUT = 30

def test_verify_profile_detail_ui_rendering():
    headers = {
        "Accept": "application/json",
    }
    # First get a profile ID by fetching profiles list
    try:
        response_profiles = requests.get(f"{BASE_URL}/profiles", headers=headers, timeout=TIMEOUT)
        response_profiles.raise_for_status()
        profiles = response_profiles.json()
        assert isinstance(profiles, list) and len(profiles) > 0, "Profiles list should be a non-empty list"
        profile_id = None
        # Try to find an ID in profiles list
        for p in profiles:
            if isinstance(p, dict) and "id" in p:
                profile_id = p["id"]
                break
        # If no id found in list, fallback to first index 0 element if string id type
        if not profile_id:
            first = profiles[0]
            if isinstance(first, dict) and "id" in first:
                profile_id = first["id"]
            elif isinstance(first, str):
                profile_id = first
        assert profile_id, "No profile ID found from profiles list"
    except Exception as e:
        raise AssertionError(f"Failed to obtain a valid profile ID for testing: {e}")

    try:
        response = requests.get(f"{BASE_URL}/profile/{profile_id}", headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
        content_type = response.headers.get("Content-Type", "")
        # Profile detail should respond with JSON or HTML UI content-type
        assert "json" in content_type or "html" in content_type.lower(), f"Unexpected content type: {content_type}"
        # Basic check for content presence
        assert response.text.strip(), "Response body is empty"
        # Optionally parse JSON if possible
        try:
            data = response.json()
            assert isinstance(data, dict), "Expected JSON object for profile detail"
            # Validate some expected fields if any (id must match)
            assert "id" in data and data["id"] == profile_id, "Profile detail ID mismatch"
        except Exception:
            # Not JSON, assume HTML UI rendering is returned; check title tag or key strings
            assert "<html" in response.text.lower(), "Response does not appear to contain HTML content"
    except requests.HTTPError as he:
        raise AssertionError(f"HTTP error when fetching profile detail: {he}")
    except requests.RequestException as re:
        raise AssertionError(f"Request exception when fetching profile detail: {re}")

test_verify_profile_detail_ui_rendering()