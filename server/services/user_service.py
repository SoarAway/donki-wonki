import datetime
from typing import Any
from uuid import uuid4

from api.schemas.user import RegisterUserRequest, UserResponse
from core.firebase import get_firestore_client, initialize_firebase
from utils.hashing_utils import hash_password, verify_password

DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
MINUTES_IN_DAY = 1440
MINUTES_IN_WEEK = 7 * MINUTES_IN_DAY


def _get_users_collection() -> Any:
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        raise RuntimeError("Could not obtain Firestore client")
    return db.collection("users")


def _normalize_email(email: str) -> str:
    return email.lower().strip()


def _parse_date_of_birth(date_of_birth: str | None) -> datetime.datetime:
    tz_utc8 = datetime.timezone(datetime.timedelta(hours=8))
    if date_of_birth:
        try:
            return datetime.datetime.strptime(date_of_birth, "%Y-%m-%d").replace(tzinfo=tz_utc8)
        except ValueError:
            pass
    return datetime.datetime.now(datetime.timezone.utc)


def check_email_exists(email: str) -> bool:
    collection_ref = _get_users_collection()
    query = collection_ref.where("email", "==", _normalize_email(email)).limit(1)
    return any(True for _ in query.stream())


def get_user_by_email(email: str) -> dict[str, Any] | None:
    collection_ref = _get_users_collection()
    query = collection_ref.where("email", "==", _normalize_email(email)).limit(1)

    for doc in query.stream():
        data = doc.to_dict()
        data["id"] = doc.id
        return data
    return None


def map_user_record_to_response(user_data: dict[str, Any]) -> UserResponse:
    email = user_data.get("email")
    if not isinstance(email, str) or not email:
        raise ValueError("User record is missing a valid email")

    return UserResponse(
        id=str(user_data.get("id", "")),
        email=email,
        username=user_data.get("user_name") or user_data.get("username", ""),
    )


def validate_login(email: str, password: str) -> bool:
    user = get_user_by_email(email)
    if user is None:
        return False
    stored_password = user.get("password_enc", "")
    try:
        return verify_password(password, stored_password)
    except ValueError:
        # Backward compatibility for legacy plaintext records.
        return stored_password == password


def register_user(user_in: RegisterUserRequest) -> UserResponse:
    """
    Registers a new user into Firestore after normalization.
    """

    email = _normalize_email(str(user_in.email))

    if check_email_exists(email):
        raise ValueError("User with this email already exists")

    now = datetime.datetime.now(datetime.timezone.utc)
    dob = _parse_date_of_birth(user_in.date_of_birth)
    record = {
        "user_name": user_in.username,
        "password_enc": hash_password(user_in.password),
        "email": email,
        "date_of_birth": dob,
        "created_at": now,
        "last_modified": now,
        "device_token": user_in.device_token,
    }

    doc_id = str(uuid4())
    collection_ref = _get_users_collection()
    collection_ref.document(doc_id).set(record)

    return UserResponse(
        id=doc_id,
        email=email,
        username=user_in.username,
    )


def get_user_routes_with_schedules(user_id: str) -> list[dict[str, Any]]:
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return []

    routes_ref = db.collection("users").document(user_id).collection("routes")
    routes = routes_ref.stream()

    full_routes: list[dict[str, Any]] = []
    for route_doc in routes:
        route_data = route_doc.to_dict()
        route_data["id"] = route_doc.id

        schedules_ref = route_doc.reference.collection("schedules")
        schedules = schedules_ref.stream()

        route_data["schedules"] = []
        for schedule_doc in schedules:
            schedule_data = schedule_doc.to_dict()
            schedule_data["id"] = schedule_doc.id
            route_data["schedules"].append(schedule_data)

        full_routes.append(route_data)

    return full_routes


def calcTimeTo(time_from: str, departing_station: str, destination_station: str) -> str:
    buffer_time = 10
    departing_station_num = int(departing_station[2:])
    destination_station_num = int(destination_station[2:])
    duration = abs(destination_station_num - departing_station_num) * 2 + buffer_time
    time_from_dt = datetime.datetime.strptime(time_from, "%H:%M")
    time_to_dt = time_from_dt + datetime.timedelta(minutes=duration)
    return time_to_dt.strftime("%H:%M")


def add_schedule(user_id: str, route_id: str, day_of_week: str, time_from: str, time_to: str) -> str | None:
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return None

    route_ref = db.collection("users").document(user_id).collection("routes").document(route_id)
    if not route_ref.get().exists:
        return None

    schedule_id = str(uuid4())
    schedule_ref = (
        route_ref
        .collection("schedules")
        .document(schedule_id)
    )

    schedule_data = {
        "dayOfWeek": day_of_week,
        "timeFrom": time_from,
        "timeTo": time_to,
        "createdAt": datetime.datetime.now(datetime.timezone.utc),
        "updatedAt": datetime.datetime.now(datetime.timezone.utc),
    }

    schedule_ref.set(schedule_data)
    return schedule_id


def save_or_update_route(
    email: str,
    departing_location: str,
    destination_location: str,
    day_of_week: str,
    time: str,
    departing_station: str,
    destination_station: str,
    route_desc: str,
) -> str | None:
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return None

    user = get_user_by_email(email)
    user_id = user.get("id") if user else None
    if not isinstance(user_id, str) or not user_id:
        return None

    routes_ref = db.collection("users").document(user_id).collection("routes")
    existing_route_query = (
        routes_ref.where("departingStation", "==", departing_station)
        .where("destinationStation", "==", destination_station)
        .where("departingLocation", "==", departing_location)
        .where("destinationLocation", "==", destination_location)
        .limit(1)
        .stream()
    )
    existing_route_doc = next(existing_route_query, None)
    if existing_route_doc is None:
        route_id = str(uuid4())
        route_ref = routes_ref.document(route_id)
        route_exists = False
    else:
        route_id = existing_route_doc.id
        route_ref = existing_route_doc.reference
        route_exists = True

    time_to = calcTimeTo(time, departing_station, destination_station)

    route_data = {
        "departingLocation": departing_location,
        "destinationLocation": destination_location,
        "departingStation": departing_station,
        "destinationStation": destination_station,
        "description": route_desc,
        "updatedAt": datetime.datetime.now(datetime.timezone.utc),
    }

    if route_exists:
        route_ref.update(route_data)
    else:
        route_data["createdAt"] = datetime.datetime.now(datetime.timezone.utc)
        route_ref.set(route_data)

    schedules_ref = route_ref.collection("schedules")
    existing_schedules = (
        schedules_ref.where("dayOfWeek", "==", day_of_week).where("timeFrom", "==", time).limit(1).stream()
    )

    if not any(existing_schedules):
        add_schedule(user_id, route_id, day_of_week, time, time_to)

    return route_id


def get_all_routes_by_email(email: str) -> list[dict[str, Any]]:
    user = get_user_by_email(email)
    user_id = user.get("id") if user else None
    if not isinstance(user_id, str) or not user_id:
        return []
    return get_user_routes_with_schedules(user_id)


def get_next_upcoming_route(email: str, timestamp: float) -> dict[str, Any] | None:
    dt = datetime.datetime.fromtimestamp(timestamp, tz=datetime.timezone.utc)
    current_day = dt.strftime("%A")
    current_time_str = dt.strftime("%H:%M")

    routes = get_all_routes_by_email(email)
    if not routes:
        return None

    try:
        current_day_idx = DAYS_ORDER.index(current_day)
    except ValueError:
        return None

    current_hour, current_min = map(int, current_time_str.split(":"))
    current_total_min = (current_day_idx * MINUTES_IN_DAY) + (current_hour * 60) + current_min

    best_candidate = None
    min_wait = float("inf")

    for route in routes:
        schedules = route.get("schedules", [])
        for schedule in schedules:
            day = schedule.get("dayOfWeek")
            time_str = schedule.get("timeFrom")
            if not day or not time_str:
                continue

            try:
                day_idx = DAYS_ORDER.index(str(day))
                hour, minute = map(int, str(time_str).split(":"))
            except (ValueError, AttributeError):
                continue

            schedule_total_min = (day_idx * MINUTES_IN_DAY) + (hour * 60) + minute
            wait = (schedule_total_min - current_total_min) % MINUTES_IN_WEEK

            if float(wait) < min_wait:
                min_wait = float(wait)
                candidate = route.copy()
                candidate.pop("schedules", None)
                candidate["routeId"] = str(route.get("id", ""))
                candidate.update(schedule)
                candidate["scheduleId"] = str(schedule.get("id", ""))
                if "id" in candidate:
                    del candidate["id"]
                best_candidate = candidate

    return best_candidate
