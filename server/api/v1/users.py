from fastapi import APIRouter

from api.schemas.user import UserResponse

router = APIRouter()

# all of these are test code
@router.get("/", response_model=list[UserResponse])
def read_users() -> list[UserResponse]:
    return [
        UserResponse(
            id="1",
            email="test@example.com",
            username="commuter1",
            is_active=True,
        )
    ]


@router.get("/me", response_model=UserResponse)
def read_user_me() -> UserResponse:
    return UserResponse(
        id="1",
        email="test@example.com",
        username="commuter1",
        is_active=True,
    )
