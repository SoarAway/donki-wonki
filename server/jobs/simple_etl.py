import datetime
from typing import List, Dict, Any
import os
import sys

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

    # 1. Extract - Sample input data
    raw_data = [
        {"id": "user1", "name": "john doe", "email": "JOHN@EXAMPLE.COM", "role": "ADMIN"},
        {"id": "user2", "name": "jane Smith", "email": "jane@example.com", "role": "user"},
        {"id": "user3", "name": "BOB BROWN", "email": "bob@domain.org", "role": "editor"},
    ]
    print(f"Extracted {len(raw_data)} records.")

    # 2. Transform
    transformed_data: List[Dict[str, Any]] = []
    for item in raw_data:
        record = item.copy()
        # Normalize fields
        record["name"] = record["name"].title()
        record["email"] = record["email"].lower()
        record["role"] = record["role"].upper()
        # Add metadata
        record["processed_at"] = datetime.datetime.now(datetime.timezone.utc)
        record["etl_version"] = "1.0"
        transformed_data.append(record)
    print("Transformation complete.")

    # 3. Load
    print("Loading data into Firestore (collection: 'users_etl')...")
    collection_ref = db.collection("users_etl")
    for record in transformed_data:
        doc_id = record.pop("id")
        collection_ref.document(doc_id).set(record)
        print(f"  - Saved user: {doc_id}")

    # 4. Verify (Read Back)
    print("\nVerifying data from Firestore:")
    docs = collection_ref.stream()
    count = 0
    for doc in docs:
        data = doc.to_dict()
        print(f"  [ID: {doc.id}] => Name: {data.get('name')}, Email: {data.get('email')}, Role: {data.get('role')}")
        count += 1
    
    print(f"\nVerification finished. Total records in collection: {count}")
    print("--- ETL Process Finished ---")

if __name__ == "__main__":
    run_etl()
