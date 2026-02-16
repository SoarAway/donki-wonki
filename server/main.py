from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from api.schemas.error import ErrorResponse
from api.v1.api import api_router
from core.config import get_settings
from core.firebase import get_firestore_client, initialize_firebase

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    initialize_firebase()
    yield
    # Shutdown (if needed in future)


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    docs_url="/docs",
    lifespan=lifespan,
)

# CORS origins based on environment
allowed_origins = ["*"] if settings.ENVIRONMENT == "development" else [settings.FRONTEND_URL]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.exception_handler(HTTPException)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    error_payload = ErrorResponse(
        error="HTTP_ERROR",
        message=str(exc.detail),
        details={"path": str(request.url.path)},
    )
    return JSONResponse(status_code=exc.status_code, content=error_payload.model_dump())


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    error_payload = ErrorResponse(
        error="VALIDATION_ERROR",
        message="Request validation failed",
        details={
            "path": str(request.url.path),
            "errors": exc.errors(),
        },
    )
    return JSONResponse(status_code=422, content=error_payload.model_dump())


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    error_payload = ErrorResponse(
        error="INTERNAL_SERVER_ERROR",
        message="Unexpected server error",
        details={"path": str(request.url.path)},
    )
    return JSONResponse(status_code=500, content=error_payload.model_dump())

# Root endpoint (will show when app starts)
@app.get("/")
def root():
    return {
        "message": "Welcome to Donki-Wonki API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health_check() -> dict[str, str]:
    db = get_firestore_client()
    firebase_status = "connected" if db else "not initialized"
    return {
        "status": "healthy",
        "service": "Donki-Wonki API",
        "firebase": firebase_status,
    }
