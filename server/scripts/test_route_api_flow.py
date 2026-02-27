import argparse
import datetime
import sys
import time

import requests


def _assert_status(name: str, response: requests.Response, expected: int) -> None:
    if response.status_code != expected:
        raise AssertionError(
            f"{name} expected HTTP {expected}, got {response.status_code}. Body: {response.text}"
        )
    print(f"[PASS] {name}: HTTP {response.status_code}")


def _assert_true(name: str, condition: bool, detail: str) -> None:
    if not condition:
        raise AssertionError(f"{name} failed: {detail}")
    print(f"[PASS] {name}")


def _find_route_by_id(routes: list[dict], route_id: str) -> dict | None:
    for route in routes:
        if str(route.get("id", "")) == route_id:
            return route
    return None


def run(base_url: str, email_prefix: str) -> None:
    base_url = base_url.rstrip("/")
    email = f"{email_prefix}_{int(time.time())}@example.com"
    password = "ReusableRouteTest123!"

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    schedule_dt = now_utc + datetime.timedelta(minutes=5)
    day_of_week = schedule_dt.strftime("%A")
    time_from = schedule_dt.strftime("%H:%M")

    print(f"Base URL: {base_url}")
    print(f"Test Email: {email}")
    print(f"Primary Schedule: {day_of_week} {time_from}")

    health = requests.get(f"{base_url}/health", timeout=20)
    _assert_status("health", health, 200)

    register_payload = {
        "email": email,
        "username": "route_api_test_user",
        "password": password,
    }
    register = requests.post(
        f"{base_url}/api/v1/users/register",
        json=register_payload,
        timeout=20,
    )
    _assert_status("register", register, 200)

    user_lookup = requests.get(
        f"{base_url}/api/v1/users/by-email",
        params={"email": email},
        timeout=20,
    )
    _assert_status("by-email", user_lookup, 200)
    user_lookup_data = user_lookup.json()
    user_id = str(user_lookup_data.get("user", {}).get("id", ""))
    _assert_true("extract-user-id", bool(user_id), "missing user.id in /users/by-email response")

    save_payload = {
        "email": email,
        "departing_location": "Jurong East MRT",
        "destination_location": "City Hall MRT",
        "day_of_week": day_of_week,
        "time": time_from,
        "departing_station": "EW24",
        "destination_station": "EW13",
        "route_desc": "Route API verification flow",
    }
    save_route = requests.post(
        f"{base_url}/api/v1/route/create",
        json=save_payload,
        timeout=20,
    )
    _assert_status("route-create", save_route, 200)
    route_id = str(save_route.json().get("route_id", ""))
    _assert_true("extract-route-id", bool(route_id), "missing route_id in /route/create response")

    routes_by_email = requests.get(
        f"{base_url}/api/v1/route/all-by-email",
        params={"email": email},
        timeout=20,
    )
    _assert_status("route-all-by-email", routes_by_email, 200)
    routes_by_email_data = routes_by_email.json().get("routes", [])
    created_route = _find_route_by_id(routes_by_email_data, route_id)
    _assert_true(
        "route-present-in-all-by-email",
        created_route is not None,
        f"route_id {route_id} not found in /route/all-by-email",
    )
    schedules = created_route.get("schedules", []) if isinstance(created_route, dict) else []
    _assert_true("initial-schedule-created", len(schedules) >= 1, "expected at least one schedule after save-or-update")

    routes_by_user = requests.get(
        f"{base_url}/api/v1/route/by-user-id",
        params={"user_id": user_id},
        timeout=20,
    )
    _assert_status("route-by-user-id", routes_by_user, 200)
    routes_by_user_data = routes_by_user.json().get("routes", [])
    _assert_true(
        "route-present-in-by-user-id",
        _find_route_by_id(routes_by_user_data, route_id) is not None,
        f"route_id {route_id} not found in /route/by-user-id",
    )

    next_route = requests.get(
        f"{base_url}/api/v1/route/next-upcoming",
        params={"email": email, "timestamp": int(now_utc.timestamp())},
        timeout=20,
    )
    _assert_status("route-next-upcoming", next_route, 200)
    next_route_payload = next_route.json().get("route", {})
    next_route_id = str(next_route_payload.get("routeId", ""))
    _assert_true(
        "next-upcoming-has-route-id",
        bool(next_route_id),
        "missing route.routeId in /route/next-upcoming response",
    )

    second_from_dt = schedule_dt + datetime.timedelta(minutes=20)
    second_to_dt = second_from_dt + datetime.timedelta(minutes=40)
    second_time_from = second_from_dt.strftime("%H:%M")
    second_time_to = second_to_dt.strftime("%H:%M")
    add_schedule_payload = {
        "user_id": user_id,
        "route_id": route_id,
        "day_of_week": day_of_week,
        "time_from": second_time_from,
        "time_to": second_time_to,
    }
    add_schedule = requests.post(
        f"{base_url}/api/v1/route/add-schedule",
        json=add_schedule_payload,
        timeout=20,
    )
    _assert_status("route-add-schedule", add_schedule, 200)
    schedule_id = str(add_schedule.json().get("schedule_id", ""))
    _assert_true("extract-schedule-id", bool(schedule_id), "missing schedule_id in /route/add-schedule response")

    routes_after_add = requests.get(
        f"{base_url}/api/v1/route/all-by-email",
        params={"email": email},
        timeout=20,
    )
    _assert_status("route-all-by-email-after-add-schedule", routes_after_add, 200)
    final_routes = routes_after_add.json().get("routes", [])
    final_route = _find_route_by_id(final_routes, route_id)
    _assert_true(
        "route-present-after-add-schedule",
        final_route is not None,
        f"route_id {route_id} not found after /route/add-schedule",
    )
    final_schedules = final_route.get("schedules", []) if isinstance(final_route, dict) else []
    _assert_true(
        "schedule-count-increased",
        len(final_schedules) >= 2,
        "expected at least two schedules after explicit add-schedule",
    )

    print("[PASS] Route API flow test completed.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Reusable end-to-end route API flow test.")
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
        help="Backend server base URL.",
    )
    parser.add_argument(
        "--email-prefix",
        default="codex_route_test",
        help="Prefix used to generate a unique test email.",
    )
    args = parser.parse_args()

    try:
        run(base_url=args.base_url, email_prefix=args.email_prefix)
        return 0
    except Exception as exc:
        print(f"[FAIL] {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
