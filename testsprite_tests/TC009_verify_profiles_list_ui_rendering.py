import requests

BASE_URL = "http://localhost:8080"
TIMEOUT = 30

def test_verify_profiles_list_ui_rendering():
    url = f"{BASE_URL}/profiles"
    headers = {
        "Accept": "application/json",
    }

    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to /profiles endpoint failed: {e}"

    # Assert HTTP 200 OK
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    # Assert that response is JSON and parse it
    try:
        data = response.json()
    except ValueError as e:
        assert False, f"Response is not valid JSON: {e}"

    # Validate that data represents profiles list — could be a list or dict with profiles key
    assert isinstance(data, (list, dict)), f"Expected response to be list or dict, got {type(data)}"

    # If data is a dict, check if 'profiles' key exists
    profiles_list = []
    if isinstance(data, dict):
        if "profiles" in data:
            profiles_list = data["profiles"]
        else:
            # If no key 'profiles' assume dict itself is profiles list object
            profiles_list = data
    else:
        profiles_list = data

    # Assert profiles_list is iterable
    assert hasattr(profiles_list, "__iter__"), "Profiles data is not iterable"

    # Check that there is at least one profile (single or couple)
    assert len(profiles_list) > 0, "Profiles list is empty"

    # Check structure of each profile supports single or couple profile types
    for profile in profiles_list:
        assert isinstance(profile, dict), f"Profile item is not a dict: {profile}"
        assert "type" in profile, "Profile missing 'type' field"
        assert profile["type"] in ("single", "couple"), f"Profile 'type' not 'single' or 'couple': {profile['type']}"
        # Optionally check required fields for single or couple
        if profile["type"] == "single":
            # Example required fields for single profile
            for field in ["id", "name", "age"]:
                assert field in profile, f"Single profile missing field '{field}'"
        elif profile["type"] == "couple":
            # Example required fields for couple profile
            for field in ["id", "partner_names", "age_range"]:
                assert field in profile, f"Couple profile missing field '{field}'"

test_verify_profiles_list_ui_rendering()