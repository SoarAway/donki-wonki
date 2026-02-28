import datetime
from typing import Any
from uuid import uuid4

from core.firebase import get_firestore_client, initialize_firebase
from services.user_service import get_user_by_email

DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
MINUTES_IN_DAY = 1440
MINUTES_IN_WEEK = 7 * MINUTES_IN_DAY


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
    schedule_ref = route_ref.collection("schedules").document(schedule_id)

    schedule_data = {
        "dayOfWeek": day_of_week,
        "timeFrom": time_from,
        "timeTo": time_to,
        "createdAt": datetime.datetime.now(datetime.timezone.utc),
        "updatedAt": datetime.datetime.now(datetime.timezone.utc),
    }

    schedule_ref.set(schedule_data)
    return schedule_id


def create_route(
    email: str,
    departing_location: str,
    destination_location: str,
    day_of_week: str,
    time: datetime.time,
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
    route_id = str(uuid4())
    route_ref = routes_ref.document(route_id)

    time_from = time.strftime("%H:%M")
    time_to = calcTimeTo(time_from, departing_station, destination_station)
    days = [day.strip() for day in day_of_week.split(",") if day.strip()]
    if not days:
        return None

    route_data = {
        "departingLocation": departing_location,
        "destinationLocation": destination_location,
        "departingStation": departing_station,
        "destinationStation": destination_station,
        "description": route_desc,
        "updatedAt": datetime.datetime.now(datetime.timezone.utc),
    }

    route_data["createdAt"] = datetime.datetime.now(datetime.timezone.utc)
    route_ref.set(route_data)

    schedules_ref = route_ref.collection("schedules")
    for day in days:
        existing_schedules = (
            schedules_ref.where("dayOfWeek", "==", day).where("timeFrom", "==", time_from).limit(1).stream()
        )
        if not any(existing_schedules):
            add_schedule(user_id, route_id, day, time_from, time_to)

    return route_id


def edit_route(
    email: str,
    route_id: str,
    departing_location: str,
    destination_location: str,
    day_of_week: str,
    time: datetime.time,
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

    route_ref = db.collection("users").document(user_id).collection("routes").document(route_id)
    if not route_ref.get().exists:
        return None

    time_from = time.strftime("%H:%M")
    time_to = calcTimeTo(time_from, departing_station, destination_station)
    days = [day.strip() for day in day_of_week.split(",") if day.strip()]
    if not days:
        return None

    route_data = {
        "departingLocation": departing_location,
        "destinationLocation": destination_location,
        "departingStation": departing_station,
        "destinationStation": destination_station,
        "description": route_desc,
        "updatedAt": datetime.datetime.now(datetime.timezone.utc),
    }
    route_ref.update(route_data)

    schedules_ref = route_ref.collection("schedules")
    primary_day = days[0]

    existing_primary = next(
        schedules_ref.where("dayOfWeek", "==", primary_day).where("timeFrom", "==", time_from).limit(1).stream(),
        None,
    )
    if existing_primary is not None:
        existing_primary.reference.update(
            {
                "dayOfWeek": primary_day,
                "timeFrom": time_from,
                "timeTo": time_to,
                "updatedAt": datetime.datetime.now(datetime.timezone.utc),
            }
        )
    else:
        fallback_schedule_doc = next(schedules_ref.stream(), None)
        if fallback_schedule_doc is not None:
            fallback_schedule_doc.reference.update(
                {
                    "dayOfWeek": primary_day,
                    "timeFrom": time_from,
                    "timeTo": time_to,
                    "updatedAt": datetime.datetime.now(datetime.timezone.utc),
                }
            )
        else:
            add_schedule(user_id, route_id, primary_day, time_from, time_to)

    for extra_day in days[1:]:
        existing_extra = next(
            schedules_ref.where("dayOfWeek", "==", extra_day).where("timeFrom", "==", time_from).limit(1).stream(),
            None,
        )
        if existing_extra is None:
            add_schedule(user_id, route_id, extra_day, time_from, time_to)

    return route_id


def delete_route(email: str, route_id: str) -> bool:
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return False

    user = get_user_by_email(email)
    user_id = user.get("id") if user else None
    if not isinstance(user_id, str) or not user_id:
        return False

    route_ref = db.collection("users").document(user_id).collection("routes").document(route_id)
    route_snapshot = route_ref.get()
    if not route_snapshot.exists:
        return False

    for schedule_doc in route_ref.collection("schedules").stream():
        schedule_doc.reference.delete()

    route_ref.delete()
    return True


def get_specific_route(email: str, route_id: str) -> dict[str, Any] | None:
    initialize_firebase()
    db = get_firestore_client()
    if db is None:
        return None

    user = get_user_by_email(email)
    user_id = user.get("id") if user else None
    if not isinstance(user_id, str) or not user_id:
        return None

    route_ref = db.collection("users").document(user_id).collection("routes").document(route_id)
    route_snapshot = route_ref.get()
    if not route_snapshot.exists:
        return None

    route_data = route_snapshot.to_dict() or {}
    route_data["id"] = route_snapshot.id

    schedules: list[dict[str, Any]] = []
    for schedule_doc in route_ref.collection("schedules").stream():
        schedule_data = schedule_doc.to_dict()
        schedules.append(schedule_data)

    return _flatten_route_schedule_fields(route_data, schedules)


def get_all_routes_by_email(email: str) -> list[dict[str, Any]]:
    user = get_user_by_email(email)
    user_id = user.get("id") if user else None
    if not isinstance(user_id, str) or not user_id:
        return []
    raw_routes = get_user_routes_with_schedules(user_id)
    flattened_routes: list[dict[str, Any]] = []

    for route in raw_routes:
        route_copy = route.copy()
        schedules = route_copy.pop("schedules", [])
        if not isinstance(schedules, list):
            schedules = []
        flattened_routes.append(_flatten_route_schedule_fields(route_copy, schedules))

    return flattened_routes


def _flatten_route_schedule_fields(route_data: dict[str, Any], schedules: list[dict[str, Any]]) -> dict[str, Any]:
    if not schedules:
        route_data["dayOfWeek"] = []
        route_data["timeFrom"] = None
        route_data["timeTo"] = None
        return route_data

    unique_days = {str(item.get("dayOfWeek", "")).strip() for item in schedules if item.get("dayOfWeek")}
    ordered_days = [day for day in DAYS_ORDER if day in unique_days]

    first_schedule = schedules[0]
    route_data["dayOfWeek"] = ordered_days
    route_data["timeFrom"] = first_schedule.get("timeFrom")
    route_data["timeTo"] = first_schedule.get("timeTo")
    return route_data


def get_next_upcoming_route(email: str, timestamp: float) -> dict[str, Any] | None:
    dt = datetime.datetime.fromtimestamp(timestamp, tz=datetime.timezone.utc)
    current_day = dt.strftime("%A")
    current_time_str = dt.strftime("%H:%M")

    user = get_user_by_email(email)
    user_id = user.get("id") if user else None
    if not isinstance(user_id, str) or not user_id:
        return None

    routes = get_user_routes_with_schedules(user_id)
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
