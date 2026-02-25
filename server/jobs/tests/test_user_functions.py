import os
import sys

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from users import register_user, get_user, check_email_exists

def test_user_management():
    print("--- User Management System Verification ---")
    test_email = "test_user_refactorv2@example.com"
    test_username = "RefactorTestv2"
    test_password = "password123"
    test_dob = "2000-01-01"
    test_device_token = "test-token-12345"

    # 1. Check if user exists
    print(f"\nChecking if user {test_email} exists...")
    exists = check_email_exists(test_email)
    print(f"Exists: {exists}")

    # 2. Register user if not exists
    if not exists:
        print(f"Registering user {test_username}...")
        doc_id = register_user(test_username, test_password, test_email, test_dob, test_device_token)
        if doc_id:
            print(f"Registration successful. ID: {doc_id}")
        else:
            print("Registration failed.")
            return
    else:
        print("Test user already exists. Proceeding to lookup.")

    # 3. Lookup user
    print(f"\nLooking up user by email: {test_email}...")
    user_data = get_user(test_email)
    if user_data:
        print(f"User retrieved: {user_data.get('user_name')}")
    else:
        print("User retrieval failed.")

    print("\n--- Verification Complete ---")

if __name__ == "__main__":
    test_user_management()
