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

import re

def get_line_prefix(line_name: str) -> str:
    """
    Interprets line name using regex and returns the prefix (e.g., 'KJ').
    """
    patterns = {
        r"(?i)kelana\s*jaya": "KJ",
        r"(?i)mrt\s*kajang": "KG",
        r"(?i)mrt\s*putrajaya": "PY",
        r"(?i)ampang": "AG",
        r"(?i)sri\s*petaling": "SP",
        r"(?i)monorail": "MR",
    }
    for pattern, prefix in patterns.items():
        if re.search(pattern, line_name):
            return prefix
    return None

def lookup_station_id(prefix: str, station_name: str) -> str:
    """
    Looks up station ID in the 'metro' collection based on prefix and name (direct match).
    """
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return None

    metro_ref = db.collection("metro")
    
    # We stream because Firestore doesn't support case-insensitive contains queries
    query = metro_ref.stream()
    
    for doc in query:
        # Check if ID prefix matches
        if prefix and not doc.id.startswith(prefix):
            continue
            
        data = doc.to_dict()
        record_name = data.get("station_name", "")
        
        # Direct comparison (case-insensitive for convenience)
        if station_name.lower() == str(record_name).lower():
            return doc.id
            
    return None

def add_route(user_id: str, departing_location: str, destination_location: str, station_ids: List[str]) -> str:
    """
    Adds a route subcollection to a user document.
    """
    initialize_firebase()
    db = get_firestore_client()
    
    if db is None:
        print("Error: Could not obtain Firestore client.")
        return None

    route_id = str(uuid.uuid4())
    route_ref = db.collection("users").document(user_id).collection("routes").document(route_id)
    
    route_data = {
        "departingLocation": departing_location,
        "destinationLocation": destination_location,
        "stationIds": station_ids,
        "createdAt": datetime.datetime.now(datetime.timezone.utc),
        "updatedAt": datetime.datetime.now(datetime.timezone.utc),
    }
    
    route_ref.set(route_data)
    print(f"Route added for user {user_id} with ID: {route_id}")
    return route_id

def add_schedule(user_id: str, route_id: str, day_of_week: str, time_from: str, time_to: str) -> str:
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

def get_user_id_by_email(email: str) -> str:
    """
    Looks up a user document by email and returns the document ID.
    """
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return None

    users_ref = db.collection("users")
    query = users_ref.where("email", "==", email.lower()).limit(1)
    results = query.stream()

    for doc in results:
        return doc.id
    return None

if __name__ == "__main__":
    print("--- Route & Schedule Registration ---")
    email = input("Enter user email: ")
    user_id = get_user_id_by_email(email)

    if not user_id:
        print(f"Error: No user found with email '{email}'.")
    else:
        print(f"User found with ID: {user_id}")
        
        # Line & Prefix Logic
        line_name = input("Enter line name (e.g., Kelana Jaya): ")
        prefix = get_line_prefix(line_name)
        
        if not prefix:
            print(f"Error: Could not interpret line name '{line_name}'.")
        else:
            print(f"Interpreted line prefix: {prefix}")
            
            # Route Input
            print("\n--- Route Details ---")
            dep_loc = input("Enter departing location: ")
            dest_loc = input("Enter destination location: ")
            
            station_input = input("Enter station names (comma separated, e.g., KL Sentral, Masjid Jamek): ")
            input_stations = [s.strip() for s in station_input.split(",") if s.strip()]
            
            # Lookup station IDs
            station_ids = []
            for s_name in input_stations:
                s_id = lookup_station_id(prefix, s_name)
                if s_id:
                    print(f"Found ID for '{s_name}': {s_id}")
                    station_ids.append(s_id)
                else:
                    print(f"Warning: Could not find station ID for '{s_name}' with prefix '{prefix}'. Skipping.")

            if not station_ids:
                print("Error: No valid station IDs found. Aborting.")
            else:
                # Schedule Input
                print("\n--- Schedule Details ---")
                day = input("Enter day of week (e.g., Monday): ")
                time_from = input("Enter time from (e.g., 08:00): ")
                time_to = input("Enter time to (e.g., 09:30): ")
                
                # Registering
                print("\nRegistering route and schedule...")
                route_id = add_route(user_id, dep_loc, dest_loc, station_ids)
                if route_id:
                    schedule_id = add_schedule(user_id, route_id, day, time_from, time_to)
                    print("\nRegistration complete!")
                    
                    # Fetch and display
                    print("\nCurrent Routes for User:")
                    routes = get_user_routes_with_schedules(user_id)
                    import json
                    print(json.dumps(routes, indent=2, default=str))
