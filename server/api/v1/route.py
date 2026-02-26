from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr

from api.schemas.base import BaseResponse, ERROR_RESPONSES
from services.user_service import (
    add_schedule,
    get_all_routes_by_email,
    get_next_upcoming_route,
    get_user_routes_with_schedules,
    save_or_update_route,
)

router = APIRouter()


class RouteScheduleRequest(BaseModel):
    email: EmailStr
    departing_location: str
    destination_location: str
    day_of_week: str
    time: str
    departing_station: str
    destination_station: str
    route_desc: str


class AddScheduleRequest(BaseModel):
    user_id: str
    route_id: str
    day_of_week: str
    time_from: str
    time_to: str


class RouteIdResponse(BaseResponse):
    route_id: str


class ScheduleIdResponse(BaseResponse):
    schedule_id: str


class RoutesListResponse(BaseResponse):
    routes: list[dict[str, Any]]


class NextUpcomingRouteResponse(BaseResponse):
    route: dict[str, Any]


@router.post(
    "/save-or-update",
    response_model=RouteIdResponse,
    responses=ERROR_RESPONSES,
)
def save_or_update_route_endpoint(payload: RouteScheduleRequest) -> RouteIdResponse:
    route_id = save_or_update_route(
        email=str(payload.email),
        departing_location=payload.departing_location,
        destination_location=payload.destination_location,
        day_of_week=payload.day_of_week,
        time=payload.time,
        departing_station=payload.departing_station,
        destination_station=payload.destination_station,
        route_desc=payload.route_desc,
    )
    if route_id is None:
        raise HTTPException(status_code=404, detail="User not found or route could not be saved")

    return RouteIdResponse(
        status="success",
        message="Route saved successfully",
        route_id=route_id,
    )


@router.get(
    "/all-by-email",
    response_model=RoutesListResponse,
    responses=ERROR_RESPONSES,
)
def get_routes_by_email_endpoint(
    email: str = Query(..., description="User email address"),
) -> RoutesListResponse:
    routes = get_all_routes_by_email(email)
    return RoutesListResponse(
        status="success",
        message="Routes fetched successfully",
        routes=routes,
    )


@router.get(
    "/by-user-id",
    response_model=RoutesListResponse,
    responses=ERROR_RESPONSES,
)
def get_routes_by_user_id_endpoint(
    user_id: str = Query(..., description="Firestore user id"),
) -> RoutesListResponse:
    routes = get_user_routes_with_schedules(user_id)
    return RoutesListResponse(
        status="success",
        message="Routes fetched successfully",
        routes=routes,
    )


@router.get(
    "/next-upcoming",
    response_model=NextUpcomingRouteResponse,
    responses=ERROR_RESPONSES,
)
def get_next_upcoming_route_endpoint(
    email: str = Query(..., description="User email address"),
    timestamp: float = Query(..., description="Unix timestamp in seconds"),
) -> NextUpcomingRouteResponse:
    route = get_next_upcoming_route(email=email, timestamp=timestamp)
    if route is None:
        raise HTTPException(status_code=404, detail="No upcoming route found")

    return NextUpcomingRouteResponse(
        status="success",
        message="Upcoming route fetched successfully",
        route=route,
    )


@router.post(
    "/add-schedule",
    response_model=ScheduleIdResponse,
    responses=ERROR_RESPONSES,
)
def add_schedule_endpoint(payload: AddScheduleRequest) -> ScheduleIdResponse:
    schedule_id = add_schedule(
        user_id=payload.user_id,
        route_id=payload.route_id,
        day_of_week=payload.day_of_week,
        time_from=payload.time_from,
        time_to=payload.time_to,
    )
    if schedule_id is None:
        raise HTTPException(status_code=404, detail="Route not found or schedule could not be created")

    return ScheduleIdResponse(
        status="success",
        message="Schedule added successfully",
        schedule_id=schedule_id,
    )
