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
from utils.hashing_utils import hash_password, verify_password

def register_user(user_name, user_password, user_email, dob, device_token):
    """
    Registers a new user into Firestore after normalization.
    """
    initialize_firebase()
    db = get_firestore_client()
    
    if db is None:
        print("Error: Could not obtain Firestore client.")
        return None

    # Parse DOB into a datetime object (UTC+8)
    tz_utc8 = datetime.timezone(datetime.timedelta(hours=8))
    try:
        dob_dt = datetime.datetime.strptime(dob, "%Y-%m-%d").replace(tzinfo=tz_utc8)
    except ValueError:
        print("Invalid date format. Using current time as fallback.")
        dob_dt = datetime.datetime.now(datetime.timezone.utc)

    # Transform/Normalize
    record = {
        "user_name": user_name,
        "password_enc": hash_password(user_password),
        "email": user_email.lower(),
        "date_of_birth": dob_dt,
        "created_at": datetime.datetime.now(datetime.timezone.utc),
        "last_modified": datetime.datetime.now(datetime.timezone.utc),
        "device_token": device_token,
    }

    # Load
    collection_ref = db.collection("users")
    doc_id = str(uuid.uuid4())
    collection_ref.document(doc_id).set(record)
    print(f"User '{user_name}' registered successfully with ID: {doc_id}")
    return doc_id

def check_email_exists(email):
    """
    Checks if a user with the given email exists in Firestore.
    """
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return False

    collection_ref = db.collection("users")
    query = collection_ref.where("email", "==", email.lower()).limit(1)
    results = query.stream()
    
    # Check if results stream has at least one document
    for _ in results:
        return True
    return False

def get_user(email):
    """
    Retrieves user info from Firestore by email.
    """
    if not check_email_exists(email):
        print(f"No user found with email: {email}")
        return None

    db = get_firestore_client()
    collection_ref = db.collection("users")
    query = collection_ref.where("email", "==", email.lower()).limit(1)
    results = query.stream()

    user_data = None
    for doc in results:
        user_data = doc.to_dict()
        dob = user_data.get('date_of_birth')
        if isinstance(dob, datetime.datetime):
            dob_str = dob.strftime("%Y-%m-%d")
        else:
            dob_str = str(dob)
            
        print(f"\nUser Found [ID: {doc.id}]:")
        print(f"  Name: {user_data.get('user_name')}")
        print(f"  Email: {user_data.get('email')}")
        print(f"  DOB: {dob_str}")
        break
    
    return user_data

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

def login_user():
    """
    Prompts for email and password, then validates credentials.
    """
    email = input("Enter email: ")
    password = input("Enter password: ")

    if not check_email_exists(email):
        print("Account does not exist.")
        return False

    db = get_firestore_client()
    collection_ref = db.collection("users")
    query = collection_ref.where("email", "==", email.lower()).limit(1)
    results = query.stream()

    for doc in results:
        data = doc.to_dict()
        stored_password = data.get("password_enc", "")
        try:
            is_valid_password = verify_password(password, stored_password)
        except ValueError:
            # Backward compatibility for older plaintext passwords.
            is_valid_password = stored_password == password

        if is_valid_password:
            print("Login success!")
            return True
        else:
            print("Password incorrect.")
            return False
    
    return False
