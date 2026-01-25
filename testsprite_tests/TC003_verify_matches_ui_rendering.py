import requests

BASE_URL = "http://localhost:8080"
TIMEOUT = 30

def test_verify_matches_ui_rendering():
    url = f"{BASE_URL}/matches"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        assert False, f"HTTP request to /matches failed: {str(e)}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    
    # Content validation: The response should represent the matches UI correctly.
    # Since we lack detailed response schema, we at least check that response contains expected keys
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    
    # Validate that data is a dict or list (depending on matches UI response)
    assert isinstance(data, (dict, list)), "Expected response JSON to be dict or list"

    # For UI rendering validation, check presence of common keys or values typical for matches screen
    # (Such as a list of matches with user info, partial example)
    # We'll check that if it's dict, it has 'matches' key or if it's list each item has 'id' or 'user'
    if isinstance(data, dict):
        assert "matches" in data or "results" in data or len(data) > 0, "Response JSON lacks matches data"
        # If matches key is present and is list, check it's not empty (matches screen should show matches)
        matches_key = "matches" if "matches" in data else "results" if "results" in data else None
        if matches_key:
            matches_list = data[matches_key]
            assert isinstance(matches_list, list), f"Expected '{matches_key}' to be a list"
            # Could be empty if no matches, so no strict length check here
    elif isinstance(data, list):
        # If list, each item should have at least 'id' or 'user' keys for a match
        for item in data:
            assert isinstance(item, dict), "Each match item should be a dict"
            assert "id" in item or "user" in item, "Match item missing expected keys"

test_verify_matches_ui_rendering()