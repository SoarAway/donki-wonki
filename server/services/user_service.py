import datetime
from typing import Any
from uuid import uuid4

from api.schemas.user import RegisterUserRequest, UserResponse
from core.firebase import get_firestore_client, initialize_firebase
from utils.hashing_utils import hash_password, verify_password


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
    }

    doc_id = str(uuid4())
    collection_ref = _get_users_collection()
    collection_ref.document(doc_id).set(record)

    return UserResponse(
        id=doc_id,
        email=email,
        username=user_in.username,
    )
