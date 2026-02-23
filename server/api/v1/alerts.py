from fastapi import APIRouter, HTTPException

from api.schemas.base import ERROR_RESPONSES
from api.schemas.user import SendTokenRequest, SendTokenResponse
from services import alert_service
from services.alert_service import send_alert_to_device

router = APIRouter()

# endpoint = api/v1/alerts/


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
