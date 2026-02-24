import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from utils.hashing_utils import hash_password, verify_password


def run() -> None:
    print("=== hashing_utils functional test ===")

    password = "12345678"
    wrong_password = "87654321"

    hashed = hash_password(password)
    print(f"original password: {password}, hashed password: {hashed}")

    hashed2 = hash_password(password)
    print(f"checking salt behaviour -- hashed1: {hashed}, hashed2 {hashed2}")
    print(f"checking salt behaviour -- {hashed == hashed2}")

    print(f"verfying hash -- {verify_password(password, hashed)}")
    print(f"verfying wrong password -- {verify_password(wrong_password, hashed)}")

    print(f"checking hash prefix -- {hashed.startswith('$2')}")
    print(f"checking hash is not empty -- {len(hashed) > 0}")

    empty_password = ""
    empty_password_hashed = hash_password(empty_password)
    print(f"verifying empty password hash -- {verify_password(empty_password, empty_password_hashed)}")

    try:
        invalid_hash_check = verify_password(password, "invalid-hash")
        print(f"verifying invalid hash format -- {invalid_hash_check}")
    except Exception as exc:
        print(f"verifying invalid hash format raised error -- {exc}")


if __name__ == "__main__":
    run()
