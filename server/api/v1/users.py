from typing import Any

from fastapi import APIRouter, HTTPException

from api.schemas.error import ErrorResponse
from api.schemas.user import (
    RegisterUserRequest,
    RegisterUserResponse,
    SendTokenRequest,
    SendTokenResponse,
)
from services.alert_service import send_token_received_notification_with_debug
from services.user_service import register_user

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    "409": {"model": ErrorResponse, "description": "Conflict"},
    "422": {"model": ErrorResponse, "description": "Validation error"},
    "500": {"model": ErrorResponse, "description": "Internal server error"},
}

# endpoint = api/v1/users/

@router.post("/send-token",
    response_model=SendTokenResponse,
    responses=ERROR_RESPONSES,
)
def send_token(send_token: SendTokenRequest) -> SendTokenResponse:
    notification_id, error_detail = send_token_received_notification_with_debug(send_token.token)

    if not notification_id:
        detail = "Failed to send test notification"
        if error_detail:
            detail = f"{detail}: {error_detail}"
        raise HTTPException(status_code=500, detail=detail)

    return SendTokenResponse(
        status="success",
        message="Token received and notification sent",
        token=send_token.token,
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
