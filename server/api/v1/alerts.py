from fastapi import APIRouter, HTTPException

from api.schemas.alert import AlertRequest, AlertResponse, PredictRequest, PredictResponse
from services import alert_service

router = APIRouter()


@router.post("/send", response_model=AlertResponse)
def send_alert(alert_in: AlertRequest) -> AlertResponse:
    response = alert_service.send_alert_to_device(
        token=alert_in.token,
        title=alert_in.title,
        body=alert_in.body,
        data=alert_in.data,
    )

    if not response:
        raise HTTPException(status_code=500, detail="Failed to send alert via FCM")

    return AlertResponse(
        status="success",
        message="Alert sent successfully",
        fcm_response={"message_id": response},
    )


@router.post("/predict", response_model=PredictResponse)
def predict_incident(payload: PredictRequest) -> PredictResponse:
    result = alert_service.predict_incident(payload.social_text, payload.source)
    return PredictResponse(**result)
