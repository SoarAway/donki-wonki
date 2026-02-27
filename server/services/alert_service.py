import logging
import datetime
from typing import Any
from uuid import uuid4

from firebase_admin import messaging
from core.firebase import get_firestore_client, initialize_firebase
from services.route_service import get_user_routes_with_schedules

logger = logging.getLogger("services.alerts")


def _build_fcm_message(
    token: str,
    title: str,
    body: str,
    data: dict[str, str] | None = None,
) -> messaging.Message:
    return messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        android=messaging.AndroidConfig(
            priority="high",
            notification=messaging.AndroidNotification(
                channel_id="default",
                sound="default",
                priority="max",
            ),
        ),
        data=data or {},
        token=token,
    )


def send_alert_to_device(
    token: str,
    title: str,
    body: str,
    data: dict[str, str] | None = None,
) -> str | None:
    try:
        message = _build_fcm_message(token=token, title=title, body=body, data=data)
        response = messaging.send(message)
        logger.info("Successfully sent message to device: %s", response)
        return response
    except Exception as exc:
        logger.exception("Error sending message to device: %s", exc)
        return None

        
def predict_incident(text: str, source: str) -> dict[str, Any]:
    keywords = ["delay", "fault", "stuck", "breakdown", "disruption"]
    is_incident = any(keyword in text.lower() for keyword in keywords)

    return {
        "is_incident": is_incident,
        "confidence": 0.95 if is_incident else 0.1,
        "details": {"source": source, "analysis": "Keyword match"},
    }


def _to_total_minutes(time_str: str) -> int:
    try:
        hour, minute = map(int, time_str.split(":"))
        return hour * 60 + minute
    except (ValueError, AttributeError):
        return 0


def _is_station_in_route(
    departing_station: str,
    destination_station: str,
    target_station: str,
) -> bool:
    try:
        dep_num = int(str(departing_station)[2:])
        dest_num = int(str(destination_station)[2:])
        target_num = int(str(target_station)[2:])
        return min(dep_num, dest_num) <= target_num <= max(dep_num, dest_num)
    except (ValueError, TypeError, IndexError):
        return False


def _is_time_affected(schedule: dict[str, Any], current_time: str, current_day: str) -> bool:
    if schedule.get("dayOfWeek") != current_day:
        return False
    time_from = schedule.get("timeFrom")
    time_to = schedule.get("timeTo")
    if not time_from or not time_to:
        return False
    current_minutes = _to_total_minutes(current_time)
    from_minutes = _to_total_minutes(str(time_from))
    to_minutes = _to_total_minutes(str(time_to))
    return from_minutes <= current_minutes <= to_minutes


def notify_affected_users(
    affected_stations: list[str],
    line: str,
    incident_type: str,
    description: str,
    predicted_time: str = "TBD",
) -> str | None:
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return None

    user_involved_map: dict[str, list[str]] = {}
    notified_count = 0

    now = datetime.datetime.now(datetime.timezone.utc)
    current_day = now.strftime("%A")
    current_time = now.strftime("%H:%M")

    for user_doc in db.collection("users").stream():
        user_data = user_doc.to_dict()
        device_token = user_data.get("device_token")
        if not isinstance(device_token, str) or not device_token:
            continue

        routes = get_user_routes_with_schedules(user_doc.id)
        notified_this_user = False

        for route in routes:
            dep_station = str(route.get("departingStation", ""))
            dest_station = str(route.get("destinationStation", ""))
            matched_stations = [
                station
                for station in affected_stations
                if _is_station_in_route(dep_station, dest_station, station)
            ]
            if not matched_stations:
                continue

            for schedule in route.get("schedules", []):
                if not _is_time_affected(schedule, current_time, current_day):
                    continue

                existing = user_involved_map.setdefault(device_token, [])
                for station in matched_stations:
                    if station not in existing:
                        existing.append(station)

                if not notified_this_user:
                    title = f"Alert: {incident_type} on {line}"
                    affected_str = ", ".join(matched_stations)
                    body = (
                        f"Incident reported at {affected_str}: {description}. "
                        "This may affect your route."
                    )
                    send_alert_to_device(token=device_token, title=title, body=body)
                    notified_count += 1
                    notified_this_user = True
                break

    alert_id = str(uuid4())
    user_involved = [
        {"device_token": token, "stations": stations}
        for token, stations in user_involved_map.items()
    ]
    db.collection("alerts").document(alert_id).set(
        {
            "alert_id": alert_id,
            "time_from": datetime.datetime.now(datetime.timezone.utc),
            "predicted_time": predicted_time,
            "user_involved": user_involved,
            "incident_details": {
                "affected_stations": affected_stations,
                "line": line,
                "type": incident_type,
                "description": description,
            },
            "notified_count": notified_count,
            "created_at": datetime.datetime.now(datetime.timezone.utc),
            "updated_at": datetime.datetime.now(datetime.timezone.utc),
        }
    )
    return alert_id


def trigger_alert(alert_id: str, title: str, body: str) -> dict[str, Any] | None:
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return None

    alert_ref = db.collection("alerts").document(alert_id)
    alert_doc = alert_ref.get()
    if not alert_doc.exists:
        return None

    data = alert_doc.to_dict() or {}
    user_involved = data.get("user_involved", [])
    if isinstance(user_involved, list):
        for item in user_involved:
            if not isinstance(item, dict):
                continue
            device_token = item.get("device_token")
            if isinstance(device_token, str) and device_token:
                send_alert_to_device(token=device_token, title=title, body=body)
    return data


def predict_end_time(alert_id: str, new_pred_end_time: str) -> dict[str, Any] | None:
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return None

    alert_ref = db.collection("alerts").document(alert_id)
    if not alert_ref.get().exists:
        return None

    alert_ref.update(
        {
            "predicted_time": new_pred_end_time,
            "updated_at": datetime.datetime.now(datetime.timezone.utc),
        }
    )
    return alert_ref.get().to_dict()


def get_related_alerts(device_token: str) -> list[dict[str, Any]]:
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return []

    alerts: list[dict[str, Any]] = []
    for doc in db.collection("alerts").stream():
        data = doc.to_dict()
        user_involved = data.get("user_involved", [])
        if not isinstance(user_involved, list):
            continue
        has_token = any(
            isinstance(item, dict) and item.get("device_token") == device_token
            for item in user_involved
        )
        if has_token:
            data["id"] = doc.id
            alerts.append(data)
    return alerts


def get_alert(device_token: str) -> list[dict[str, Any]]:
    """Alias for fetching alerts related to a device token."""
    return get_related_alerts(device_token=device_token)


def end_alert(alert_id: str) -> dict[str, Any] | None:
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return None

    alert_ref = db.collection("alerts").document(alert_id)
    alert_doc = alert_ref.get()
    if not alert_doc.exists:
        return None

    payload = alert_doc.to_dict()
    alert_ref.delete()
    return payload


def predict_end_time_and_trigger(
    alert_id: str,
    new_pred_end_time: str,
    title: str,
    body: str,
) -> dict[str, Any] | None:
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return None

    original_ref = db.collection("alerts").document(alert_id)
    original_doc = original_ref.get()
    if not original_doc.exists:
        return None

    original_data = original_doc.to_dict() or {}
    user_involved = original_data.get("user_involved", [])

    notified_count = 0
    if isinstance(user_involved, list):
        for item in user_involved:
            if not isinstance(item, dict):
                continue
            device_token = item.get("device_token")
            if not isinstance(device_token, str) or not device_token:
                continue
            response = send_alert_to_device(
                token=device_token,
                title=title,
                body=body,
            )
            if response is not None:
                notified_count += 1

    new_alert_id = str(uuid4())
    now = datetime.datetime.now(datetime.timezone.utc)
    new_alert_data = {
        "alert_id": new_alert_id,
        "source_alert_id": alert_id,
        "time_from": now,
        "predicted_time": new_pred_end_time,
        "user_involved": user_involved,
        "incident_details": original_data.get("incident_details", {}),
        "notified_count": notified_count,
        "created_at": now,
        "updated_at": now,
    }
    db.collection("alerts").document(new_alert_id).set(new_alert_data)
    return new_alert_data
