import datetime
from typing import List, Dict, Any
import os
import sys
import uuid

# Get the absolute path to the 'server' directory
# __file__ is .../server/jobs/simple_etl.py
# parent is .../server/jobs
# grandparent is .../server
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.append(project_root)

from core.firebase import initialize_firebase, get_firestore_client

def run_etl():
    """
    Simple ETL process:
    1. Extract: Hardcoded sample data.
    2. Transform: Normalize names, emails, and roles; add timestamp.
    3. Load: Save to 'users_etl' collection in Firestore.
    4. Verify: Read back written data.
    """
    print("--- Starting Simple ETL ---")
    
    # Initialize Firebase
    initialize_firebase()
    db = get_firestore_client()
    
    if db is None:
        print("Error: Could not obtain Firestore client.")
        return

    # 1. Extract
    # shall replace with input from frontend later
    user_name = input("Enter your username: ")
    user_password = input("Enter your password: ")
    user_email = input("Enter your email: ")
    dob = input("Enter your date of birth (YYYY-MM-DD): ")

    # Parse DOB into a datetime object
    try:
        dob_dt = datetime.datetime.strptime(dob, "%Y-%m-%d").replace(tzinfo=datetime.timezone.utc)
    except ValueError:
        print("Invalid date format. Using current time as fallback.")
        dob_dt = datetime.datetime.now(datetime.timezone.utc)

    # 2. Transform
    # Create the record from inputs
    record = {
        "user_name": user_name,
        "password_enc": user_password,
        "email": user_email,
        "date_of_birth": dob_dt,
        "created_at": datetime.datetime.now(datetime.timezone.utc),
        "last_modified": datetime.datetime.now(datetime.timezone.utc),
    }

    # 3. Load
    print(f"Loading user '{user_name}' into Firestore (collection: 'users')...")
    collection_ref = db.collection("users")
    
    # Use UUID for document ID
    doc_id = str(uuid.uuid4())
    collection_ref.document(doc_id).set(record)

    # 4. Verify (Read Back)
    print("\nVerifying data from Firestore:")
    docs = collection_ref.stream()
    for doc in docs:
        data = doc.to_dict()
        print(f"  [ID: {doc.id}] => Name: {data.get('user_name')}, Email: {data.get('email')}, DOB: {data.get('date_of_birth')}")
    
    print("--- ETL Process Finished ---")

if __name__ == "__main__":
    run_etl()