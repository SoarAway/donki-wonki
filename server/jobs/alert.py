import datetime
import os
import sys
import uuid
from typing import List, Dict, Any

# Get the absolute path to the 'server' directory
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.append(project_root)

from core.firebase import initialize_firebase, get_firestore_client
from jobs.route import get_user_routes_with_schedules

# =============================================================================
# Helper Functions
# =============================================================================

def to_total_minutes(t_str: str) -> int:
    """Helper to convert HH:MM to total minutes since midnight."""
    try:
        h, m = map(int, t_str.split(":"))
        return h * 60 + m
    except (ValueError, AttributeError):
        return 0

def is_station_in_route(departing_station: str, destination_station: str, target_station: str) -> bool:
    """
    Checks if target_station is between departing_station and destination_station.
    Assumes station IDs like 'KJ18', 'KJ20' etc.
    """
    try:
        dep_num = int(str(departing_station)[2:])
        dest_num = int(str(destination_station)[2:])
        target_num = int(str(target_station)[2:])
        
        lower = min(dep_num, dest_num)
        upper = max(dep_num, dest_num)
        
        return lower <= target_num <= upper
    except (ValueError, TypeError, IndexError):
        return False

def is_time_affected(schedule: Dict[str, Any], current_time_str: str, current_day_str: str) -> bool:
    """
    Checks if an incident at current_time_str on current_day_str affects the given schedule.
    Logic: dayOfWeek matches AND timeFrom <= current_time <= timeTo.
    """
    if schedule.get("dayOfWeek") != current_day_str:
        return False
    
    time_from = schedule.get("timeFrom")
    time_to = schedule.get("timeTo")
    
    if not time_from or not time_to:
        return False
        
    t_from = to_total_minutes(str(time_from))
    t_to = to_total_minutes(str(time_to))
    t_curr = to_total_minutes(current_time_str)
    
    return t_from <= t_curr <= t_to

def send_push_notification(device_token: str, title: str, body: str):
    """Mock implementation of sending a push notification."""
    print(f"\n>>> [MOCK NOTIFICATION] SENT TO TOKEN: {device_token}")
    print(f">>> TITLE: {title}")
    print(f">>> BODY: {body}\n")

# =============================================================================
# Core Logic
# =============================================================================

def notify_affected_users(affected_stations: List[str], line: str, incident_type: str, description: str, predicted_time: str = "TBD") -> str | None:
    """
    Identifies all users affected by disruptions, notifies them, and stores the alert.
    Returns the created alert_id.
    """
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return None

    print(f"Scanning for users affected by '{incident_type}' at stations {affected_stations}...")
    
    users_ref = db.collection("users")
    users = users_ref.stream()
    
    user_involved = {}
    notified_count = 0
    now = datetime.datetime.now()
    current_day = now.strftime("%A")
    current_time = now.strftime("%H:%M")
    
    for user_doc in users:
        user_data = user_doc.to_dict()
        device_token = user_data.get("device_token")
        if not device_token:
            continue
            
        routes = get_user_routes_with_schedules(user_doc.id)
        is_user_notified = False
        
        for route in routes:
            dep_st = route.get("departingStation")
            dest_st = route.get("destinationStation")
            
            stations_found = [s for s in affected_stations if is_station_in_route(dep_st, dest_st, s)]
            
            if stations_found:
                schedules = route.get("schedules", [])
                for schedule in schedules:
                    if is_time_affected(schedule, current_time, current_day):
                        if device_token not in user_involved:
                            user_involved[device_token] = []
                        
                        for s in stations_found:
                            if s not in user_involved[device_token]:
                                user_involved[device_token].append(s)
                        
                        if not is_user_notified:
                            affected_str = ", ".join(stations_found)
                            title = f"Alert: {incident_type} on {line}"
                            body = f"Incident reported at {affected_str}: {description}. This may affect your route."
                            send_push_notification(device_token, title, body)
                            notified_count += 1
                            is_user_notified = True
                        break
        
    alert_id = str(uuid.uuid4())
    alert_record = {
        "alert_id": alert_id,
        "time_from": datetime.datetime.now(datetime.timezone.utc),
        "predicted_time": predicted_time,
        "user_involved": user_involved,
        "incident_details": {
            "affected_stations": affected_stations,
            "line": line,
            "type": incident_type,
            "description": description
        },
        "created_at": datetime.datetime.now(datetime.timezone.utc),
        "updated_at": datetime.datetime.now(datetime.timezone.utc)
    }
    
    db.collection("alerts").document(alert_id).set(alert_record)
    print(f"Alert stored with ID: {alert_id}. Users notified: {notified_count}")
    return alert_id

# =============================================================================
# Alert Management Functions
# =============================================================================

def trigger_alert(alert_id: str, title: str, body: str) -> Dict[str, Any] | None:
    """Manual trigger to re-send notifications for an existing alert."""
    db = get_firestore_client()
    if not db: return None

    alert_ref = db.collection("alerts").document(alert_id)
    alert_doc = alert_ref.get()
    
    if alert_doc.exists:
        data = alert_doc.to_dict()
        involved = data.get("user_involved", {})
        for device_token in involved.keys():
            send_push_notification(device_token, title, body)
        return data
    return None

def predict_end_time(alert_id: str, new_pred_end_time: str) -> Dict[str, Any] | None:
    """Updates the predicted end time of an alert."""
    db = get_firestore_client()
    if not db: return None

    alert_ref = db.collection("alerts").document(alert_id)
    if alert_ref.get().exists:
        update_data = {
            "predicted_time": new_pred_end_time,
            "updated_at": datetime.datetime.now(datetime.timezone.utc)
        }
        alert_ref.update(update_data)
        return alert_ref.get().to_dict()
    return None

def get_related_alerts(device_token: str) -> List[Dict[str, Any]]:
    """Retrieves all active alerts that involve the given device token."""
    db = get_firestore_client()
    if not db: return []

    # Query for alerts where the device_token exists as a key in user_involved map
    # Note: Firestore 'where' on map keys is done via dot notation.
    query = db.collection("alerts").where(f"user_involved.{device_token}", "!=", None)
    results = query.stream()
    
    return [doc.to_dict() for doc in results]

def end_alert(alert_id: str) -> Dict[str, Any] | None:
    """Deletes an alert from the system once resolved."""
    db = get_firestore_client()
    if not db: return None

    alert_ref = db.collection("alerts").document(alert_id)
    alert_snap = alert_ref.get()
    
    if alert_snap.exists:
        data = alert_snap.to_dict()
        alert_ref.delete()
        print(f"Alert {alert_id} removed from database.")
        return data
    return None

if __name__ == "__main__":
    # Internal test run
    res = notify_affected_users(["KJ20", "KJ21"], "Kelana Jaya Line", "Delay", "Track maintenance.")
    print(f"Final Result: {res}")