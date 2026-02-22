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
    email = _normalize_email(str(user_in.email))

    if check_email_exists(email):
        raise ValueError("User with this email already exists")

    now = datetime.datetime.now(datetime.timezone.utc)
    record = {
        "user_name": user_in.username,
        "password_enc": hash_password(user_in.password),
        "email": email,
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
