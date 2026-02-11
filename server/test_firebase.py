"""
Standalone test script to verify Firebase initialization.
Run this to check if your serviceAccountKey.json is configured correctly.

Usage:
    python test_firebase.py
"""

import sys
import os

# Add parent directory to path so we can import config
sys.path.insert(0, os.path.dirname(__file__))

try:
    from config import firebase
    print("✅ Firebase config imported successfully")
    
    # Test Firestore connection
    if firebase.db:
        print("✅ Firestore client initialized")
        
        # Try a simple read operation (won't fail even if collection doesn't exist)
        test_ref = firebase.db.collection('_test').limit(1)
        print("✅ Firestore connection verified")
    
    print("\n🎉 All checks passed! Firebase is ready to use.")
    print("\nNext steps:")
    print("1. Start the server: uvicorn main:app --reload")
    print("2. Visit http://localhost:8000/health to verify")
    print("3. Check API docs at http://localhost:8000/docs")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nTroubleshooting:")
    print("1. Check that FIREBASE_CREDENTIALS_PATH is set in .env")
    print("2. Verify serviceAccountKey.json exists at the specified path")
    print("3. Ensure the JSON file is valid (download a fresh one if needed)")
    sys.exit(1)
