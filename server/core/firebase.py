import json
import os
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore

from core.config import get_settings


def initialize_firebase() -> None:
    """Initialize Firebase Admin SDK (called during app lifespan)."""
    if firebase_admin._apps:
        return  # Already initialized

    settings = get_settings()

    try:
        firebase_creds_json = settings.FIREBASE_CREDENTIALS_JSON
        cred = None

        if firebase_creds_json:
            try:
                cred_dict = json.loads(firebase_creds_json)
                cred = credentials.Certificate(cred_dict)
                print("Firebase Admin Initialized (from JSON env var)")
            except json.JSONDecodeError:
                print(
                    "Warning: FIREBASE_CREDENTIALS_JSON is not valid JSON. "
                    "Falling back to FIREBASE_CREDENTIALS_PATH."
                )

        if cred is None:
            cred_path = settings.FIREBASE_CREDENTIALS_PATH
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                print(f"Firebase Admin Initialized (from file: {cred_path})")
            else:
                print(f"Warning: Firebase credentials file not found at {cred_path}")
                return

        firebase_admin.initialize_app(cred)
    except Exception as exc:
        print(f"Failed to initialize Firebase: {exc}")
        raise


def get_firestore_client() -> Any:
    """Get Firestore client instance."""
    if firebase_admin._apps:
        return firestore.client()
    return None
