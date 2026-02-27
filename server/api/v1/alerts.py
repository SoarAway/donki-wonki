from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from api.schemas.base import BaseResponse, ERROR_RESPONSES
from api.schemas.user import SendTokenRequest, SendTokenResponse
from services.alert_service import (
    end_alert,
    get_alert,
    notify_affected_users,
    predict_end_time_and_trigger,
    send_alert_to_device,
    trigger_alert,
)

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


class NotifyAffectedUsersRequest(BaseModel):
    affected_stations: list[str]
    line: str
    incident_type: str
    description: str
    predicted_time: str = "TBD"


class AlertIdResponse(BaseResponse):
    alert_id: str


class TriggerAlertRequest(BaseModel):
    alert_id: str
    title: str
    body: str


class PredictEndTimeAndTriggerRequest(BaseModel):
    alert_id: str
    new_pred_end_time: str
    title: str
    body: str


class AlertDataResponse(BaseResponse):
    alert: dict[str, Any]


class AlertsListResponse(BaseResponse):
    alerts: list[dict[str, Any]]


class EndAlertRequest(BaseModel):
    alert_id: str
    device_token: str


class EndAlertAndRefreshResponse(BaseResponse):
    ended_alert: dict[str, Any]
    alerts: list[dict[str, Any]]


@router.post(
    "/notify-affected-user",
    response_model=AlertIdResponse,
    responses=ERROR_RESPONSES,
)
def notify_affected_users_endpoint(payload: NotifyAffectedUsersRequest) -> AlertIdResponse:
    alert_id = notify_affected_users(
        affected_stations=payload.affected_stations,
        line=payload.line,
        incident_type=payload.incident_type,
        description=payload.description,
        predicted_time=payload.predicted_time,
    )
    if alert_id is None:
        raise HTTPException(status_code=500, detail="Failed to create alert")
    return AlertIdResponse(status="success", message="Alert created", alert_id=alert_id)


@router.post(
    "/predict-end-time-trigger",
    response_model=AlertDataResponse,
    responses=ERROR_RESPONSES,
)
def predict_end_time_and_trigger_endpoint(payload: PredictEndTimeAndTriggerRequest) -> AlertDataResponse:
    alert = predict_end_time_and_trigger(
        alert_id=payload.alert_id,
        new_pred_end_time=payload.new_pred_end_time,
        title=payload.title,
        body=payload.body,
    )
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return AlertDataResponse(
        status="success",
        message="New alert created and notifications triggered",
        alert=alert,
    )


@router.delete(
    "/end-alert",
    response_model=EndAlertAndRefreshResponse,
    responses=ERROR_RESPONSES,
)
def end_alert_endpoint(payload: EndAlertRequest) -> EndAlertAndRefreshResponse:
    # Notify affected users that this alert has ended before removing it.
    trigger_alert(
        alert_id=payload.alert_id,
        title="Alert Ended",
        body="The previously reported disruption has been marked as resolved.",
    )

    alert = end_alert(alert_id=payload.alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    alerts = get_alert(device_token=payload.device_token)
    return EndAlertAndRefreshResponse(
        status="success",
        message="Alert ended and alert list refreshed",
        ended_alert=alert,
        alerts=alerts,
    )


@router.get(
    "/get-alert",
    response_model=AlertsListResponse,
    responses=ERROR_RESPONSES,
)
def get_alert_endpoint(
    device_token: str = Query(..., description="Device token"),
) -> AlertsListResponse:
    alerts = get_alert(device_token=device_token)
    return AlertsListResponse(status="success", message="Alerts fetched", alerts=alerts)
