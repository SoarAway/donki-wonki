import datetime
from typing import Any
from uuid import uuid4

from firebase_admin import firestore

from core.firebase import get_firestore_client, initialize_firebase


def send_report(
    line: str,
    station: str,
    incident_type: str,
    description: str,
) -> str | None:
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return None

    record = {
        "line": line,
        "station": station,
        "incident_type": incident_type,
        "description": description,
        "created_at": datetime.datetime.now(datetime.timezone.utc),
    }

    doc_id = str(uuid4())
    db.collection("reports").document(doc_id).set(record)
    return doc_id


def get_top3_report() -> list[dict[str, Any]]:
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return []

    query = db.collection("reports").order_by(
        "created_at",
        direction=firestore.Query.DESCENDING,
    ).limit(3)

    top_reports: list[dict[str, Any]] = []
    for doc in query.stream():
        report = doc.to_dict()
        report["id"] = doc.id
        top_reports.append(report)

    return top_reports
