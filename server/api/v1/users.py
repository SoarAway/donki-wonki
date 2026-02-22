from typing import Any

from fastapi import APIRouter, HTTPException

from api.schemas.error import ErrorResponse
from api.schemas.user import (
    GetUserByEmailResponse,
    LoginUserRequest,
    LoginUserResponse,
    RegisterUserRequest,
    RegisterUserResponse,
    SendTokenRequest,
    SendTokenResponse,
    UserResponse,
)
from services.alert_service import send_alert_to_device
from services.user_service import check_email_exists, get_user_by_email, register_user, validate_login

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    "401": {"model": ErrorResponse, "description": "Unauthorized"},
    "404": {"model": ErrorResponse, "description": "Not found"},
    "409": {"model": ErrorResponse, "description": "Conflict"},
    "422": {"model": ErrorResponse, "description": "Validation error"},
    "500": {"model": ErrorResponse, "description": "Internal server error"},
}

# endpoint = api/v1/users/

@router.post("/send-token",
    response_model=SendTokenResponse,
    responses=ERROR_RESPONSES,
)
def send_token(payload: SendTokenRequest) -> SendTokenResponse:
    notification_id = send_alert_to_device(
        token=payload.token,
        title="Donki-Wonki Campaign",
        body="New disruption alert campaign is active.",
        data={"type": "campaign", "source": "send-token"},
    )

    if not notification_id:
        raise HTTPException(status_code=500, detail="Failed to send campaign notification")

    return SendTokenResponse(
        status="success",
        message="Campaign notification sent to token",
        token=payload.token,
        notification_id=notification_id,
    )

# this mean that the api endpoint will be api/v1/user/register
# then the other two is the response model, is like the schema for the endpoint when it returning data back to app side
@router.post("/register",
    # this response model is calling from api/schemas/user.py
    response_model=RegisterUserResponse,

    # this one is the error response, just incase got any error occured (can just copy paste this)
    responses=ERROR_RESPONSES,
)
# then here is the request model routed to the response
def register_user_endpoint(user_in: RegisterUserRequest) -> RegisterUserResponse:
    try:
        created_user = register_user(user_in)

    # checking if got error then return error resopnse
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    # else will return the actual response back to app side
    return RegisterUserResponse(
        status="success",
        message="User registered successfully",
        user=created_user,
    )


def _map_user_record_to_response(user_data: dict[str, Any]) -> UserResponse:
    return UserResponse(
        id=str(user_data.get("id", "")),
        email=user_data.get("email", ""),
        username=user_data.get("user_name") or user_data.get("username", ""),
    )


@router.get(
    "/by-email",
    response_model=GetUserByEmailResponse,
    responses=ERROR_RESPONSES,
)
def get_user_by_email_endpoint(email: str) -> GetUserByEmailResponse:
    user_data = get_user_by_email(email)
    if user_data is None:
        raise HTTPException(status_code=404, detail="No user found with this email")

    return GetUserByEmailResponse(
        status="success",
        message="User fetched successfully",
        user=_map_user_record_to_response(user_data),
    )


@router.post(
    "/login",
    response_model=LoginUserResponse,
    responses=ERROR_RESPONSES,
)
def login_user_endpoint(payload: LoginUserRequest) -> LoginUserResponse:
    if not check_email_exists(str(payload.email)):
        raise HTTPException(status_code=404, detail="Account does not exist")

    if not validate_login(str(payload.email), payload.password):
        raise HTTPException(status_code=401, detail="Password incorrect")

    return LoginUserResponse(
        status="success",
        message="Login success",
    )
