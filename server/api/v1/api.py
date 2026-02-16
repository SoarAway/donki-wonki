from fastapi import APIRouter

from api.v1 import alerts, users

api_router = APIRouter()
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
