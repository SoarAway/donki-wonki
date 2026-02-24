from fastapi import APIRouter, HTTPException, Query

from api.schemas.base import ERROR_RESPONSES
from api.schemas.user import (
    GetUserByEmailResponse,
    LoginUserRequest,
    LoginUserResponse,
    RegisterUserRequest,
    RegisterUserResponse,
)
from services.user_service import (
    get_user_by_email,
    map_user_record_to_response,
    register_user,
    validate_login,
)
from services.alert_service import send_alert_to_device

router = APIRouter()

# endpoint = api/v1/users/

@router.post("/login",
    response_model=LoginUserResponse,
    responses=ERROR_RESPONSES,
)
def login_user_endpoint(payload: LoginUserRequest) -> LoginUserResponse:
    if not validate_login(str(payload.email), payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return LoginUserResponse(
        status="success",
        message="Login success",
        email= payload.email
    )


@router.post("/register",
    response_model=RegisterUserResponse,
    responses=ERROR_RESPONSES,
)
def register_user_endpoint(new_user: RegisterUserRequest) -> RegisterUserResponse:
    try:
        created_user = register_user(new_user)
        send_alert_to_device(
            token=new_user.device_token,
            title="Welcome to On The Way",
            body=f"User {new_user.username} is registered.",
        )

    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    return RegisterUserResponse(
        status="success",
        message="User registered successfully",
        user=created_user,
    )


@router.get("/by-email",
    response_model=GetUserByEmailResponse,
    responses=ERROR_RESPONSES,
)
def get_user_by_email_endpoint(
    email: str = Query(..., description="User email address")
    ) -> GetUserByEmailResponse:

    user_data = get_user_by_email(email)
    if user_data is None:
        raise HTTPException(status_code=404, detail="No user found with this email")

    try:
        user = map_user_record_to_response(user_data)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return GetUserByEmailResponse(
        status="success",
        message="User fetched successfully",
        user=user,
    )