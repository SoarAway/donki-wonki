from __future__ import annotations

import argparse
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

SERVER_ROOT = Path(__file__).resolve().parents[1]
if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))

from main import app


@dataclass
class TestResult:
    name: str
    passed: bool
    detail: str


class SkipCase(Exception):
    pass


def parse_json(response) -> dict[str, Any]:
    try:
        data = response.json()
    except ValueError as exc:
        raise AssertionError(f"response is not valid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise AssertionError(f"response JSON must be an object, got {type(data).__name__}")
    return data


def assert_status(name: str, response, expected: set[int]) -> None:
    if response.status_code not in expected:
        expected_str = ", ".join(str(code) for code in sorted(expected))
        raise AssertionError(
            f"{name} expected one of [{expected_str}], got {response.status_code}. body={response.text}"
        )


def assert_keys(name: str, payload: dict[str, Any], required_keys: set[str]) -> None:
    missing = required_keys - payload.keys()
    if missing:
        raise AssertionError(f"{name} missing keys: {sorted(missing)}")


def run_case(results: list[TestResult], name: str, fn) -> None:
    try:
        fn()
        results.append(TestResult(name=name, passed=True, detail="ok"))
        print(f"[PASS] {name}")
    except SkipCase as exc:
        results.append(TestResult(name=name, passed=True, detail=f"skipped: {exc}"))
        print(f"[SKIP] {name} -> {exc}")
    except Exception as exc:
        results.append(TestResult(name=name, passed=False, detail=str(exc)))
        print(f"[FAIL] {name} -> {exc}")


def run(timeout_seconds: float, skip_write_endpoints: bool) -> int:
    client = TestClient(app, raise_server_exceptions=False)
    unique_suffix = int(time.time())
    test_email = f"functional_{unique_suffix}@example.com"
    test_password = "FunctionalPass123!"

    results: list[TestResult] = []

    def register_case() -> None:
        if skip_write_endpoints:
            raise SkipCase("skip-write-endpoints enabled")
        response = client.post(
            "/api/v1/users/register",
            json={
                "email": test_email,
                "username": "functional_user",
                "password": test_password,
            },
            timeout=timeout_seconds,
        )
        assert_status("users-register", response, {200})
        payload = parse_json(response)
        assert_keys("users-register", payload, {"status", "message", "user"})

    def login_success_case() -> None:
        if skip_write_endpoints:
            raise SkipCase("skip-write-endpoints enabled")
        response = client.post(
            "/api/v1/users/login",
            json={"email": test_email, "password": test_password},
            timeout=timeout_seconds,
        )
        assert_status("users-login-success", response, {200})
        payload = parse_json(response)
        assert_keys("users-login-success", payload, {"status", "message", "email"})

    def login_failure_case() -> None:
        if skip_write_endpoints:
            raise SkipCase("skip-write-endpoints enabled")
        response = client.post(
            "/api/v1/users/login",
            json={"email": test_email, "password": "wrong-password"},
            timeout=timeout_seconds,
        )
        assert_status("users-login-fail", response, {401})

    def users_by_email_existing_case() -> None:
        if skip_write_endpoints:
            raise SkipCase("skip-write-endpoints enabled")
        response = client.get(
            "/api/v1/users/by-email",
            params={"email": test_email},
            timeout=timeout_seconds,
        )
        assert_status("users-by-email-existing", response, {200})
        payload = parse_json(response)
        assert_keys("users-by-email-existing", payload, {"status", "message", "user"})

    def users_by_email_missing_case() -> None:
        response = client.get(
            "/api/v1/users/by-email",
            params={"email": f"missing_{unique_suffix}@example.com"},
            timeout=timeout_seconds,
        )
        assert_status("users-by-email-missing", response, {404})

    def users_register_duplicate_case() -> None:
        if skip_write_endpoints:
            raise SkipCase("skip-write-endpoints enabled")
        duplicate_email = f"functional_dup_{unique_suffix}@example.com"
        payload = {
            "email": duplicate_email,
            "username": "functional_user",
            "password": test_password,
        }
        first = client.post("/api/v1/users/register", json=payload, timeout=timeout_seconds)
        if first.status_code != 200:
            raise AssertionError(
                f"precondition register failed before duplicate test: {first.status_code} {first.text}"
            )
        second = client.post("/api/v1/users/register", json=payload, timeout=timeout_seconds)
        assert_status("users-register-duplicate", second, {409})

    cases = [
        ("users-register", register_case),
        ("users-login-success", login_success_case),
        ("users-login-fail", login_failure_case),
        ("users-by-email-existing", users_by_email_existing_case),
        ("users-by-email-missing", users_by_email_missing_case),
        ("users-register-duplicate", users_register_duplicate_case),
    ]

    print("Running standalone users endpoint functional tests...")
    print(f"skip_write_endpoints={skip_write_endpoints}")

    for case_name, case_fn in cases:
        run_case(results, case_name, case_fn)

    failed = [result for result in results if not result.passed]
    passed = len(results) - len(failed)

    print("\n=== Users Functional Test Summary ===")
    print(f"Passed: {passed}")
    print(f"Failed: {len(failed)}")

    if failed:
        print("\nFailed cases:")
        for result in failed:
            print(f"- {result.name}: {result.detail}")
        return 1

    print("All users endpoint functional test cases passed.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Standalone users endpoint functional tests.")
    parser.add_argument(
        "--timeout-seconds",
        type=float,
        default=30.0,
        help="Timeout for each API request in seconds.",
    )
    parser.add_argument(
        "--skip-write-endpoints",
        action="store_true",
        help="Skip register/login/write-oriented cases that create test data.",
    )
    args = parser.parse_args()
    return run(
        timeout_seconds=args.timeout_seconds,
        skip_write_endpoints=args.skip_write_endpoints,
    )


if __name__ == "__main__":
    sys.exit(main())
