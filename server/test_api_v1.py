import sys
import os
import uuid
from fastapi.testclient import TestClient

# Ensure the current directory is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app

client = TestClient(app)

def test_register_user():
    print("\n--- Testing Registration Endpoint ---")
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": unique_email,
        "username": "TestUser",
        "password": "securepassword123",
        "date_of_birth": "1995-10-10",
        "device_token": "test-device-token-abc-123"
    }
    
    print(f"Sending registration request for: {unique_email}")
    response = client.post("/api/v1/users/register", json=payload)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")
    
    if response.status_code == 200:
        print("Registration test PASSED")
    else:
        print("Registration test FAILED")

if __name__ == "__main__":
    test_register_user()
