import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, messaging
from dotenv import load_dotenv

# Load environment variables from .env file (for local dev)
# Render will override these with environment variables set in dashboard
load_dotenv()

# Initialize Firebase app only once
if not firebase_admin._apps:
    try:
        # Try to load credentials from JSON string (Render environment variable)
        firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
        
        if firebase_creds_json:
            # Production: Parse JSON string from environment variable
            cred_dict = json.loads(firebase_creds_json)
            cred = credentials.Certificate(cred_dict)
            print("Firebase Admin Initialized (from JSON env var)")
        else:
            # Local development: Use file path
            cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebaseServiceAccountKey.json")
            cred = credentials.Certificate(cred_path)
            print("Firebase Admin Initialized (from file)")
        
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Failed to initialize Firebase: {e}")
        raise

# Export clients for other modules to use
db = firestore.client()
# Usage: from config.firebase import db, messaging
