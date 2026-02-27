import os
import sys
import datetime

# Add the server root to sys.path
server_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

from jobs.alert import (
    notify_affected_users, 
    predict_end_time, 
    end_alert, 
    get_related_alerts
)
from jobs.users import register_user, check_email_exists, get_user
from jobs.route import save_or_update_route

# Configuration
TEST_EMAIL = "alert_tester_management@example.com"
DEVICE_TOKEN = "management-token-456"

def setup_test_environment():
    print("--- 1. Setting up Test Environment ---")
    
    # 1. Register User
    if not check_email_exists(TEST_EMAIL):
        print(f"Registering test user: {TEST_EMAIL}")
        register_user("Management Tester", "pass123", TEST_EMAIL, "1990-01-01", DEVICE_TOKEN)
    
    # 2. Register Route (active for 'now')
    now = datetime.datetime.now()
    current_day = now.strftime("%A")
    current_time_minus_10 = (now - datetime.timedelta(minutes=10)).strftime("%H:%M")

    print(f"Setting up route for {current_day} at {current_time_minus_10}: KJ18 to KJ22")
    save_or_update_route(
        email=TEST_EMAIL,
        departing_location="Initial Station",
        destination_location="Final Station",
        day_of_week=current_day,
        time=current_time_minus_10,
        departing_station="KJ18",
        destination_station="KJ22",
        route_desc="Management Test Route"
    )

def test_alert_lifecycle():
    print("\n--- 2. Testing Alert Notification ---")
    alert_id = notify_affected_users(
        affected_stations=["KJ20", "KJ21"],
        line="Kelana Jaya Line",
        incident_type="Maintenance",
        description="Testing management lifecycle.",
        predicted_time="22:00"
    )
    
    if not alert_id:
        print("FAIL: notify_affected_users did not return an alert_id")
        return
    print(f"SUCCESS: Alert created with ID: {alert_id}")

    print("\n--- 3. Testing Get Related Alerts ---")
    related = get_related_alerts(DEVICE_TOKEN)
    found = False
    for a in related:
        if a.get("alert_id") == alert_id:
            found = True
            print(f"SUCCESS: Found alert {alert_id} for token {DEVICE_TOKEN}")
            break
    if not found:
        print(f"FAIL: Could not find alert {alert_id} for token {DEVICE_TOKEN}")

    print("\n--- 4. Testing Predict End Time ---")
    updated = predict_end_time(alert_id, "23:30")
    if updated and updated.get("predicted_time") == "23:30":
        print(f"SUCCESS: Predicted end time updated to {updated.get('predicted_time')}")
    else:
        print(f"FAIL: Predicted end time not updated correctly")

    print("\n--- 5. Testing End Alert (Deletion) ---")
    deleted_data = end_alert(alert_id)
    if deleted_data:
        print(f"SUCCESS: Alert {alert_id} deleted.")
        # Verify it's gone
        after_deleted = get_related_alerts(DEVICE_TOKEN)
        is_still_there = any(a.get("alert_id") == alert_id for a in after_deleted)
        if not is_still_there:
            print("VERIFIED: Alert no longer exists in database.")
        else:
            print("FAIL: Alert still exists in database after deletion.")
    else:
        print(f"FAIL: end_alert returned None for {alert_id}")

if __name__ == "__main__":
    setup_test_environment()
    test_alert_lifecycle()
    print("\n--- Test Suite Complete ---")
