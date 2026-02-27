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
from firebase_admin import firestore

def send_report(line, station, incident_type, description):
    initialize_firebase()
    db = get_firestore_client()
    
    if db is None:
        print("Error: Could not obtain Firestore client.")
        return None
    
    record = {
        "line": line,
        "station": station,
        "incident_type": incident_type,
        "description": description,
        "created_at": datetime.datetime.now(datetime.timezone.utc),
    }
    
    collection_ref = db.collection("reports")
    doc_id = str(uuid.uuid4())
    collection_ref.document(doc_id).set(record)
    print(f"Report '{description}' sent successfully with ID: {doc_id}")
    return doc_id

def get_top3_report():
    initialize_firebase()
    db = get_firestore_client()
    
    if db is None:
        print("Error: Could not obtain Firestore client.")
        return None
    
    collection_ref = db.collection("reports")
    query = collection_ref.order_by("created_at", direction=firestore.Query.DESCENDING).limit(3)
    results = query.stream()
    
    top_reports = []
    for doc in results:
        top_reports.append(doc.to_dict())
    
    return top_reports