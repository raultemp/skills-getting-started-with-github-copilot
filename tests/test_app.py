import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

# Reset activities before each test to ensure isolation
@pytest.fixture(autouse=True)
def reset_activities():
    # Store original activities
    original_activities = activities.copy()
    yield
    # Reset to original after test
    activities.clear()
    activities.update(original_activities)

client = TestClient(app)

def test_root_redirect():
    """Test that root endpoint redirects to static index"""
    response = client.get("/")
    assert response.status_code == 200  # RedirectResponse is handled by TestClient
    assert "text/html" in response.headers.get("content-type", "")

def test_get_activities():
    """Test getting all activities"""
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Basketball" in data
    assert "Tennis Club" in data
    # Check structure of one activity
    basketball = data["Basketball"]
    assert "description" in basketball
    assert "schedule" in basketball
    assert "max_participants" in basketball
    assert "participants" in basketball
    assert isinstance(basketball["participants"], list)

def test_signup_success():
    """Test successful signup for an activity"""
    # Use an activity with space in name to test URL encoding
    response = client.post(
        "/activities/Tennis Club/signup",
        data={"email": "test@mergington.edu"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "test@mergington.edu" in data["message"]
    assert "Tennis Club" in data["message"]
    
    # Check that participant was added
    get_response = client.get("/activities")
    activities_data = get_response.json()
    assert "test@mergington.edu" in activities_data["Tennis Club"]["participants"]

def test_signup_activity_not_found():
    """Test signup for non-existent activity"""
    response = client.post(
        "/activities/NonExistent/signup",
        data={"email": "test@mergington.edu"}
    )
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "Activity not found" in data["detail"]

def test_signup_already_registered():
    """Test signup when student is already registered"""
    # First signup
    client.post(
        "/activities/Basketball/signup",
        data={"email": "newstudent@mergington.edu"}
    )
    
    # Try to signup again
    response = client.post(
        "/activities/Basketball/signup",
        data={"email": "newstudent@mergington.edu"}
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "already signed up" in data["detail"]

def test_unregister_success():
    """Test successful unregister from an activity"""
    # First add a participant
    client.post(
        "/activities/Basketball/signup",
        data={"email": "removeme@mergington.edu"}
    )
    
    # Now unregister
    response = client.post(
        "/activities/Basketball/unregister",
        data={"email": "removeme@mergington.edu"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "removeme@mergington.edu" in data["message"]
    
    # Check that participant was removed
    get_response = client.get("/activities")
    activities_data = get_response.json()
    assert "removeme@mergington.edu" not in activities_data["Basketball"]["participants"]

def test_unregister_activity_not_found():
    """Test unregister from non-existent activity"""
    response = client.post(
        "/activities/NonExistent/unregister",
        data={"email": "test@mergington.edu"}
    )
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "Activity not found" in data["detail"]

def test_unregister_not_registered():
    """Test unregister when student is not registered"""
    response = client.post(
        "/activities/Basketball/unregister",
        data={"email": "notregistered@mergington.edu"}
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "not registered" in data["detail"]