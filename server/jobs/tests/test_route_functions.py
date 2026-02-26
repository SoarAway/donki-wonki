import datetime
import time as time_module
import os
import sys

# Add the parent directory ('jobs') to sys.path so we can import route and users
jobs_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if jobs_dir not in sys.path:
    sys.path.insert(0, jobs_dir)

from route import save_or_update_route, get_all_routes_by_email, get_next_upcoming_route
from users import register_user, check_email_exists

def test_route_functions():
    test_email = "test_user_route@example.com"
    test_route_id = "test-route-123-v3"
    
    print(f"--- Verification for {test_email} ---")
    
    # 1. Ensure user exists
    if not check_email_exists(test_email):
        print("Registering test user...")
        register_user("Test User Route", "password123", test_email, "1990-01-01", "test-token-route")
    
    # 2. Test save_or_update_route (Creation)
    print("\nTesting save_or_update_route (Create)...")
    save_or_update_route(
        email=test_email,
        departing_location="Home",
        destination_location="Office",
        day_of_week="Wednesday",
        time="10:00",
        departing_station="KJ18",
        destination_station="KJ30",
        route_desc="Test Route"
    )
    
    # 3. Test get_all_routes_by_email
    print("\nTesting get_all_routes_by_email...")
    routes = get_all_routes_by_email(test_email)
    print(f"Total routes found: {len(routes)}")
    for r in routes:
        if r['id'] == test_route_id:
            print(f"Found created route: {r.get('departingLocation')} to {r.get('destinationLocation')}")
            print(f"Schedules: {len(r.get('schedules', []))}")

    # 4. Test save_or_update_route (Adding another schedule to same route)
    print("\nTesting save_or_update_route (Add Another Schedule)...")
    save_or_update_route(
        email=test_email,
        departing_location="Home",
        destination_location="Office", # Keep locations same for same route_id
        day_of_week="Monday",
        time="22:00",
        departing_station="KJ18",
        destination_station="KJ30",
        route_desc="Test Route"
    )

    # 5. Test get_next_upcoming_route (Week wrap-around)
    print("\nTesting get_next_upcoming_route...")
    # Simulate Monday at 08:00
    monday_8am = datetime.datetime(2026, 2, 23, 8, 0, tzinfo=datetime.timezone.utc).timestamp()
    next_route = get_next_upcoming_route(test_email, monday_8am)
    print(f"Next route for Monday 08:00: {next_route.get('dayOfWeek')} at {next_route.get('timeFrom') if next_route else 'None'}")
    
    # Simulate Tuesday at 12:00 (should find the 22:00 one)
    tuesday_12pm = datetime.datetime(2026, 2, 24, 12, 0, tzinfo=datetime.timezone.utc).timestamp()
    next_route_mid = get_next_upcoming_route(test_email, tuesday_12pm)
    print(f"Next route for Tuesday 12:00: {next_route_mid.get('dayOfWeek')} at {next_route_mid.get('timeFrom') if next_route_mid else 'None'}")

    # Simulate Thursday at 23:00 (should wrap around to next Monday 10:00 if no other days)
    thurs_11pm = datetime.datetime(2026, 2, 26, 23, 0, tzinfo=datetime.timezone.utc).timestamp()
    next_route_late = get_next_upcoming_route(test_email, thurs_11pm)
    if next_route_late:
        print(f"Next route for Thursday 23:00 (Wrap Around): {next_route_late.get('dayOfWeek')} at {next_route_late.get('timeFrom')}")
    else:
        print(f"Next route for Thursday 23:00 (Wrap Around): None found")

if __name__ == "__main__":
    test_route_functions()
