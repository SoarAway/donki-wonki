from uuid import uuid4

from api.schemas.user import RegisterUserRequest, UserResponse

_registered_users_by_email: dict[str, UserResponse] = {}

# will need to further link with firestore to save to db
# returns 200 on success // returns 409 conflict if same email is registered again
def register_user(user_in: RegisterUserRequest) -> UserResponse:
    existing_user = _registered_users_by_email.get(user_in.email)
    if existing_user:
        raise ValueError("User with this email already exists")

    created_user = UserResponse(
        id=str(uuid4()),
        email=user_in.email,
        username=user_in.username,
    )
    _registered_users_by_email[user_in.email] = created_user
    return created_user
