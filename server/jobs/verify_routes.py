import os
import sys

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.append(project_root)

from jobs.users import register_user
from jobs.route import add_route, add_schedule, get_user_routes_with_schedules

def test_flow():
    print("--- Starting Verification Flow ---")
    
    # 1. Register a test user
    user_name = "Test User"
    user_pass = "password123"
    user_email = "test@example.com"
    dob = "1990-01-01"
    
    print(f"Registering user: {user_email}")
    user_id = register_user(user_name, user_pass, user_email, dob)
    
    if not user_id:
        print("Failed to register user.")
        return

    # 2. Add a route
    print(f"Adding route for user: {user_id}")
    route_id = add_route(
        user_id, 
        "Kuala Lumpur", 
        "Penang", 
        ["LRT Kelana Jaya"], 
        ["KL Sentral", "Masjid Jamek"]
    )

    # 3. Add a schedule to that route
    print(f"Adding schedule for route: {route_id}")
    schedule_id = add_schedule(
        user_id, 
        route_id, 
        "Monday", 
        "08:00", 
        "09:30"
    )

    # 4. Fetch and verify
    print("Fetching routes and schedules...")
    data = get_user_routes_with_schedules(user_id)
    
    print("\nVerification Results:")
    import json
    # Use default=str for datetime objects
    print(json.dumps(data, indent=2, default=str))

    if len(data) > 0 and data[0]['id'] == route_id:
        if len(data[0]['schedules']) > 0 and data[0]['schedules'][0]['id'] == schedule_id:
            print("\nSUCCESS: Subcollection and Sub-subcollection implemented correctly!")
        else:
            print("\nFAILURE: Schedule subcollection missing or incorrect.")
    else:
        print("\nFAILURE: Route subcollection missing or incorrect.")

if __name__ == "__main__":
    test_flow()
