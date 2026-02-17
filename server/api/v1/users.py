from typing import Any

from fastapi import APIRouter, HTTPException

from api.schemas.error import ErrorResponse
from api.schemas.user import SendTokenRequest, SendTokenResponse, UserResponse
from services.alert_service import send_token_received_notification_with_debug

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    "422": {"model": ErrorResponse, "description": "Validation error"},
    "500": {"model": ErrorResponse, "description": "Internal server error"},
}

# endpoint = api/v1/users/

@router.post("/sendToken",
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
