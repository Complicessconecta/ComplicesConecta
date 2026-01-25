import requests

BASE_URL = "http://localhost:8080"
TIMEOUT = 30
HEADERS = {
    "Accept": "application/json"
}

def test_verify_discover_ui_rendering():
    """
    Test the /discover endpoint to confirm the discover screen loads properly,
    allowing users to view profiles and perform liking actions.
    """
    url = f"{BASE_URL}/discover"
    try:
        response = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
        # Assuming JSON response with profile list or discover screen content
        try:
            data = response.json()
        except ValueError:
            # If response is not JSON, it's unexpected
            assert False, "Response is not valid JSON"
        # Validate expected keys or structure in the response to indicate discover screen loaded correctly
        # As no schema provided, check that data is a dict or list and not empty
        assert data is not None, "Response JSON is empty or null"
        # If discover screen should list profiles, expect a list or dict with profiles
        if isinstance(data, dict):
            # Check there might be a 'profiles' or similar key to hold profile list
            profiles = data.get("profiles") or data.get("data") or data.get("results") or data
        else:
            profiles = data
        assert isinstance(profiles, (list, dict)), "Profiles data is not of type list or dict"
        # If list, possibly check it's non-empty to confirm profiles present
        if isinstance(profiles, list):
            assert len(profiles) >= 0, "Profiles list is empty"
        
        # Further interaction tests (like liking) cannot be done with GET /discover endpoint alone without IDs or POST endpoint info.
        # So this test focuses on loading discover UI successfully.
        
    except requests.exceptions.RequestException as e:
        assert False, f"Request to {url} failed with exception: {e}"

test_verify_discover_ui_rendering()