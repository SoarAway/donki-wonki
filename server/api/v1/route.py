import datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field

from api.schemas.base import BaseResponse, ERROR_RESPONSES
from services.route_service import (
    add_schedule,
    create_route,
    delete_route,
    edit_route,
    get_all_routes_by_email,
    get_next_upcoming_route,
    get_specific_route,
    get_user_routes_with_schedules,
)

router = APIRouter()


class RouteScheduleRequest(BaseModel):
    email: EmailStr
    departing_location: str
    destination_location: str
    day_of_week: str
    time: datetime.time
    departing_station: str
    destination_station: str
    route_desc: str


class EditRouteRequest(BaseModel):
    email: EmailStr
    route_id: str
    departing_location: str
    destination_location: str
    day_of_week: str
    time: datetime.time
    departing_station: str
    destination_station: str
    route_desc: str


class DeleteRouteRequest(BaseModel):
    email: EmailStr
    route_id: str


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
    routes: list["RouteListItem"]


class RouteListItem(BaseModel):
    id: str
    departingLocation: str
    destinationLocation: str
    departingStation: str
    destinationStation: str
    description: str
    createdAt: datetime.datetime | None = None
    updatedAt: datetime.datetime | None = None
    dayOfWeek: list[str] = Field(default_factory=list)
    timeFrom: str | None = None
    timeTo: str | None = None


class NextUpcomingRouteResponse(BaseResponse):
    route: "NextUpcomingRouteItem"


class SpecificRouteResponse(BaseResponse):
    route: RouteListItem


class NextUpcomingRouteItem(BaseModel):
    routeId: str
    scheduleId: str
    departingLocation: str
    destinationLocation: str
    departingStation: str
    destinationStation: str
    description: str
    dayOfWeek: str
    timeFrom: str
    timeTo: str
    createdAt: datetime.datetime | None = None
    updatedAt: datetime.datetime | None = None


@router.post(
    "/create",
    response_model=RouteIdResponse,
    responses=ERROR_RESPONSES,
)
def create_route_endpoint(payload: RouteScheduleRequest) -> RouteIdResponse:
    route_id = create_route(
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
        raise HTTPException(status_code=404, detail="User not found or route could not be created")

    return RouteIdResponse(
        status="success",
        message="Route created successfully",
        route_id=route_id,
    )


@router.put(
    "/edit",
    response_model=RouteIdResponse,
    responses=ERROR_RESPONSES,
)
def edit_route_endpoint(payload: EditRouteRequest) -> RouteIdResponse:
    route_id = edit_route(
        email=str(payload.email),
        route_id=payload.route_id,
        departing_location=payload.departing_location,
        destination_location=payload.destination_location,
        day_of_week=payload.day_of_week,
        time=payload.time,
        departing_station=payload.departing_station,
        destination_station=payload.destination_station,
        route_desc=payload.route_desc,
    )
    if route_id is None:
        raise HTTPException(status_code=404, detail="User or route not found")

    return RouteIdResponse(
        status="success",
        message="Route updated successfully",
        route_id=route_id,
    )


@router.delete(
    "/delete",
    response_model=BaseResponse,
    responses=ERROR_RESPONSES,
)
def delete_route_endpoint(payload: DeleteRouteRequest) -> BaseResponse:
    deleted = delete_route(email=str(payload.email), route_id=payload.route_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User or route not found")

    return BaseResponse(
        status="success",
        message="Route deleted successfully",
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
        routes=[RouteListItem(**route) for route in routes],
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
        routes=[RouteListItem(**route) for route in routes],
    )


@router.get(
    "/next-upcoming",
    response_model=NextUpcomingRouteResponse,
    responses=ERROR_RESPONSES,
)
def get_next_upcoming_route_endpoint(
    email: str = Query(..., description="User email address"),
    timestamp: float | None = Query(None, description="Unix timestamp in seconds (optional)"),
) -> NextUpcomingRouteResponse:
    effective_timestamp = (
        timestamp
        if timestamp is not None
        else datetime.datetime.now(datetime.timezone.utc).timestamp()
    )
    route = get_next_upcoming_route(email=email, timestamp=effective_timestamp)
    if route is None:
        raise HTTPException(status_code=404, detail="No upcoming route found")

    return NextUpcomingRouteResponse(
        status="success",
        message="Upcoming route fetched successfully",
        route=NextUpcomingRouteItem(**route),
    )


@router.get(
    "/specific",
    response_model=SpecificRouteResponse,
    responses=ERROR_RESPONSES,
)
def get_specific_route_endpoint(
    email: str = Query(..., description="User email address"),
    route_id: str = Query(..., description="Route id"),
) -> SpecificRouteResponse:
    route = get_specific_route(email=email, route_id=route_id)
    if route is None:
        raise HTTPException(status_code=404, detail="Route not found")

    return SpecificRouteResponse(
        status="success",
        message="Route fetched successfully",
        route=RouteListItem(**route),
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
