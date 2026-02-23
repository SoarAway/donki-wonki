import datetime
import time as time_module
from route import save_or_update_route, get_all_routes_by_email, get_next_upcoming_route
from users import register_user, check_email_exists

def test_route_functions():
    test_email = "test_user_route@example.com"
    test_route_id = "test-route-123"
    
    print(f"--- Verification for {test_email} ---")
    
    # 1. Ensure user exists
    if not check_email_exists(test_email):
        print("Registering test user...")
        register_user("Test User Route", "password123", test_email, "1990s-01-01")
    
    # 2. Test save_or_update_route (Creation)
    print("\nTesting save_or_update_route (Create)...")
    save_or_update_route(
        email=test_email,
        route_id=test_route_id,
        departing_location="Home",
        destination_location="Office",
        day_of_week="Monday",
        time="08:30",
        departing_station="KJ1",
        destination_station="KJ14"
    )
    
    # 3. Test get_all_routes_by_email
    print("\nTesting get_all_routes_by_email...")
    routes = get_all_routes_by_email(test_email)
    print(f"Total routes found: {len(routes)}")
    for r in routes:
        if r['id'] == test_route_id:
            print(f"Found created route: {r}")

    # 4. Test save_or_update_route (Update)
    print("\nTesting save_or_update_route (Update)...")
    save_or_update_route(
        email=test_email,
        route_id=test_route_id,
        departing_location="Home",
        destination_location="Gym",
        day_of_week="Monday",
        time="18:00",
        departing_station="KJ1",
        destination_station="KJ10"
    )
    
    # Verify update
    routes = get_all_routes_by_email(test_email)
    for r in routes:
        if r['id'] == test_route_id:
            print(f"Updated route: {r}")

    # 5. Test get_next_upcoming_route
    print("\nTesting get_next_upcoming_route...")
    # Simulate a Monday at 08:00 UTC
    # Since we set the route to Monday 18:00, it should find it.
    # Note: timestamp conversion needs to match the day of week.
    # 2026-02-23 is a Monday.
    monday_8am = datetime.datetime(2026, 2, 23, 8, 0, tzinfo=datetime.timezone.utc).timestamp()
    next_route = get_next_upcoming_route(test_email, monday_8am)
    print(f"Next route for Monday 08:00: {next_route}")
    
    monday_7pm = datetime.datetime(2026, 2, 23, 19, 0, tzinfo=datetime.timezone.utc).timestamp()
    next_route_late = get_next_upcoming_route(test_email, monday_7pm)
    print(f"Next route for Monday 19:00: {next_route_late} (Should be None if only current day checked)")

if __name__ == "__main__":
    test_route_functions()
