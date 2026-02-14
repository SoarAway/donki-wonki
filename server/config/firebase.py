import os
import firebase_admin
from firebase_admin import credentials, firestore, messaging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Path to service account key
cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

if not cred_path:
    raise ValueError("FIREBASE_CREDENTIALS_PATH not found in .env file")

# Initialize Firebase app only once
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin Initialized")
    except Exception as e:
        print(f"Failed to initialize Firebase: {e}")

# Export clients for other modules to use
db = firestore.client()
# Usage: from config.firebase import db, messaging
