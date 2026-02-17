from typing import Any

from fastapi import APIRouter, HTTPException

from api.schemas.error import ErrorResponse
from api.schemas.user import SendTokenRequest, SendTokenResponse, UserResponse
from services.alert_service import send_token_received_notification

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    "422": {"model": ErrorResponse, "description": "Validation error"},
    "500": {"model": ErrorResponse, "description": "Internal server error"},
}

# endpoint = api/v1/users/

@router.post(
    "/sendToken",
    response_model=SendTokenResponse,
    responses=ERROR_RESPONSES,
)
def send_token(send_token: SendTokenRequest) -> SendTokenResponse:
    notification_id = send_token_received_notification(send_token.token)
    if not notification_id:
        raise HTTPException(status_code=500, detail="Failed to send test notification")

    return SendTokenResponse(
        status="success",
        message="Token received and notification sent",
        token=send_token.token,
        notification_id=notification_id,
    )



@router.get("/me", response_model=UserResponse, responses=ERROR_RESPONSES)
def read_user_me() -> UserResponse:
    return UserResponse(
        id="1",
        email="test@example.com",
        username="commuter1",
        is_active=True,
    )
