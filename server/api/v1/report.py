from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.schemas.base import BaseResponse, ERROR_RESPONSES
from services.report_service import get_top3_report, send_report

router = APIRouter()


class SendReportRequest(BaseModel):
    line: str
    station: str
    incident_type: str
    description: str


class ReportIdResponse(BaseResponse):
    report_id: str


class TopReportsResponse(BaseResponse):
    reports: list[dict[str, Any]]


@router.post(
    "/send",
    response_model=ReportIdResponse,
    responses=ERROR_RESPONSES,
)
def send_report_endpoint(payload: SendReportRequest) -> ReportIdResponse:
    report_id = send_report(
        line=payload.line,
        station=payload.station,
        incident_type=payload.incident_type,
        description=payload.description,
    )
    if report_id is None:
        raise HTTPException(status_code=500, detail="Report could not be created")

    return ReportIdResponse(
        status="success",
        message="Report sent successfully",
        report_id=report_id,
    )


@router.get(
    "/top3",
    response_model=TopReportsResponse,
    responses=ERROR_RESPONSES,
)
def get_top3_report_endpoint() -> TopReportsResponse:
    reports = get_top3_report()
    return TopReportsResponse(
        status="success",
        message="Top reports fetched successfully",
        reports=reports,
    )
