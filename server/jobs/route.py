import datetime
from typing import List, Dict, Any
import os
import sys
import uuid

# Get the absolute path to the 'server' directory
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.append(project_root)

from core.firebase import initialize_firebase, get_firestore_client
from jobs.users import get_user_id_by_email

DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
MINUTES_IN_DAY = 1440
MINUTES_IN_WEEK = 7 * MINUTES_IN_DAY


def get_user_routes_with_schedules(user_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves all routes and their schedules for a user.
    """
    initialize_firebase()
    db = get_firestore_client()
    
    if db is None:
        print("Error: Could not obtain Firestore client.")
        return []

    routes_ref = db.collection("users").document(user_id).collection("routes")
    routes = routes_ref.stream()
    
    full_routes = []
    for route_doc in routes:
        route_data = route_doc.to_dict()
        route_data['id'] = route_doc.id
        
        # Fetch schedules for this route
        schedules_ref = route_doc.reference.collection("schedules")
        schedules = schedules_ref.stream()
        
        route_data['schedules'] = []
        for schedule_doc in schedules:
            schedule_data = schedule_doc.to_dict()
            schedule_data['id'] = schedule_doc.id
            route_data['schedules'].append(schedule_data)
            
        full_routes.append(route_data)
        
    return full_routes

def calcTimeTo(time_from, departing_station, destination_station):
    BUFFER_TIME = 10
    departing_station_num = int(departing_station[2:])
    destination_station_num = int(destination_station[2:])
    duration = abs(destination_station_num - departing_station_num) * 2 + BUFFER_TIME
    time_from_dt = datetime.datetime.strptime(time_from, "%H:%M")
    time_to_dt = time_from_dt + datetime.timedelta(minutes=duration)
    return time_to_dt.strftime("%H:%M")

def add_schedule(user_id: str, route_id: str, day_of_week: str, time_from: str, time_to: str) -> str | None:
    """
    Adds a schedule sub-subcollection to a route document.
    """
    initialize_firebase()
    db = get_firestore_client()
    
    if db is None:
        print("Error: Could not obtain Firestore client.")
        return None

    schedule_id = str(uuid.uuid4())
    schedule_ref = db.collection("users").document(user_id).collection("routes").document(route_id).collection("schedules").document(schedule_id)
    
    schedule_data = {
        "dayOfWeek": day_of_week,
        "timeFrom": time_from,
        "timeTo": time_to,
        "createdAt": datetime.datetime.now(datetime.timezone.utc),
        "updatedAt": datetime.datetime.now(datetime.timezone.utc),
    }
    
    schedule_ref.set(schedule_data)
    print(f"Schedule added for user {user_id}, route {route_id} with ID: {schedule_id}")
    return schedule_id

def save_or_update_route(
    email: str,
    departing_location: str,
    destination_location: str,
    day_of_week: str,
    time: str,
    departing_station: str,
    destination_station: str,
    route_desc: str,
) -> str | None:
    """
    Identifies user by email, checks if route exists, and either updates or creates it.
    """
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return None

    user_id = get_user_id_by_email(email)
    if not user_id:
        print(f"Error: No user found with email {email}")
        return None

    route_id = str(uuid.uuid4())
    route_ref = db.collection("users").document(user_id).collection("routes").document(route_id)
    route_doc = route_ref.get()

    # Calculate timeTo for the schedule subcollection
    time_to = calcTimeTo(time, departing_station, destination_station)

    route_data = {
        "departingLocation": departing_location,
        "destinationLocation": destination_location,
        "departingStation": departing_station,
        "destinationStation": destination_station,
        "description": route_desc,
        "updatedAt": datetime.datetime.now(datetime.timezone.utc),
    }

    if route_doc.exists:
        print(f"Route {route_id} exists. Updating...")
        route_ref.update(route_data)
    else:
        print(f"Route {route_id} does not exist. Creating new route...")
        route_data["createdAt"] = datetime.datetime.now(datetime.timezone.utc)
        route_ref.set(route_data)

    # Check if a schedule already exists for this route with the same day and time
    schedules_ref = route_ref.collection("schedules")
    existing_schedules = schedules_ref.where("dayOfWeek", "==", day_of_week).where("timeFrom", "==", time).limit(1).stream()
    
    if not any(existing_schedules):
        print(f"Adding schedule for route {route_id}...")
        add_schedule(user_id, route_id, day_of_week, time, time_to)
    else:
        print(f"Schedule for {day_of_week} at {time} already exists for route {route_id}.")

    return route_id

def get_all_routes_by_email(email: str) -> List[Dict[str, Any]]:
    """
    Retrieves all routes for a user identified by email.
    """
    user_id = get_user_id_by_email(email)
    if not user_id:
        return []
    
    return get_user_routes_with_schedules(user_id)

def get_next_upcoming_route(email: str, timestamp: float) -> Dict[str, Any] | None:
    """
    Finds the next upcoming route for a user, searching throughout the entire week.
    Returns the route info flattened with only the relevant upcoming schedule.
    """
    dt = datetime.datetime.fromtimestamp(timestamp, tz=datetime.timezone.utc)
    current_day = dt.strftime("%A")
    current_time_str = dt.strftime("%H:%M")

    routes = get_all_routes_by_email(email)
    if not routes:
        return None

    try:
        current_day_idx = DAYS_ORDER.index(current_day)
    except ValueError:
        return None

    current_hour, current_min = map(int, current_time_str.split(":"))
    current_total_min: int = (current_day_idx * MINUTES_IN_DAY) + (current_hour * 60) + current_min
    
    # Use global constant for week minutes
    
    best_candidate = None
    min_wait: float = float('inf')

    for route in routes:
        schedules = route.get("schedules", [])
        for schedule in schedules:
            day = schedule.get("dayOfWeek")
            time_str = schedule.get("timeFrom")
            if not day or not time_str:
                continue
                
            try:
                # Explicitly cast to string for the static analysis tool
                day_str: str = str(day)
                day_idx: int = DAYS_ORDER.index(day_str)
                hour, minute = map(int, time_str.split(":"))
            except (ValueError, AttributeError):
                continue
                
            schedule_total_min: int = (day_idx * MINUTES_IN_DAY) + (hour * 60) + minute
            
            # Calculate wait time in minutes (cyclic)
            wait: int = (schedule_total_min - current_total_min) % MINUTES_IN_WEEK
            
            # If wait is 0, it means the schedule is exactly now. 
            # We usually want the "next" occurrence unless it's strictly >= now.
            # For this logic, wait=0 means it's due now.
            if float(wait) < min_wait:
                min_wait = wait
                candidate = route.copy()
                candidate.pop("schedules", None)
                candidate.update(schedule)
                best_candidate = candidate

    return best_candidate
