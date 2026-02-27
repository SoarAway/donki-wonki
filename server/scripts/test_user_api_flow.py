import argparse
import sys
import time

import requests


def _assert_status(name: str, response: requests.Response, expected: int) -> None:
    if response.status_code != expected:
        raise AssertionError(
            f"{name} expected HTTP {expected}, got {response.status_code}. Body: {response.text}"
        )
    print(f"[PASS] {name}: HTTP {response.status_code}")


def run(base_url: str, email_prefix: str) -> None:
    base_url = base_url.rstrip("/")
    email = f"{email_prefix}_{int(time.time())}@example.com"
    password = "ReusableTest123!"

    print(f"Base URL: {base_url}")
    print(f"Test Email: {email}")

    health = requests.get(f"{base_url}/health", timeout=20)
    _assert_status("health", health, 200)

    register_payload = {
        "email": email,
        "username": "reusable_user_test",
        "password": password,
    }
    register = requests.post(
        f"{base_url}/api/v1/users/register",
        json=register_payload,
        timeout=20,
    )
    _assert_status("register", register, 200)

    by_email = requests.get(
        f"{base_url}/api/v1/users/by-email",
        params={"email": email},
        timeout=20,
    )
    _assert_status("by-email", by_email, 200)

    login_ok = requests.post(
        f"{base_url}/api/v1/users/login",
        json={"email": email, "password": password},
        timeout=20,
    )
    _assert_status("login-correct-password", login_ok, 200)

    login_bad = requests.post(
        f"{base_url}/api/v1/users/login",
        json={"email": email, "password": "wrong-password"},
        timeout=20,
    )
    _assert_status("login-wrong-password", login_bad, 401)

    duplicate_register = requests.post(
        f"{base_url}/api/v1/users/register",
        json=register_payload,
        timeout=20,
    )
    _assert_status("duplicate-register", duplicate_register, 409)

    print("[PASS] User API flow test completed.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Reusable end-to-end user API flow test.")
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
        help="Backend server base URL.",
    )
    parser.add_argument(
        "--email-prefix",
        default="codex_reusable_test",
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
