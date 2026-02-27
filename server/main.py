from contextlib import asynccontextmanager
import logging
import time

from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from starlette.exceptions import HTTPException as StarletteHTTPException

from api.schemas.base import ErrorResponse
from api.v1.api import api_router
from core.config import get_settings
from core.firebase import get_firestore_client, initialize_firebase

settings = get_settings()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api.interceptor")
logger.setLevel(logging.INFO)


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
    version="0.1.3",
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

# Logging interceptor to show all request and response content
@app.middleware("http")
async def log_requests_and_responses(request: Request, call_next) -> Response:
    request_body = await request.body()
    request_body_text = request_body.decode("utf-8", errors="replace")

    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000

    response_body_bytes = b""
    async for chunk in response.body_iterator:
        response_body_bytes += chunk

    response_body_text = response_body_bytes.decode("utf-8", errors="replace")

    logger.info(
        "REQUEST method=%s path=%s query=%s body=%s",
        request.method,
        request.url.path,
        request.url.query,
        request_body_text,
    )
    logger.info(
        "RESPONSE method=%s path=%s status=%s duration_ms=%.2f body=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        response_body_text,
    )

    return Response(
        content=response_body_bytes,
        status_code=response.status_code,
        headers=dict(response.headers),
        media_type=response.media_type,
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
    sanitized_errors = []
    for error in exc.errors():
        sanitized_error = dict(error)
        context = sanitized_error.get("ctx")
        if isinstance(context, dict) and "error" in context:
            context = dict(context)
            context["error"] = str(context["error"])
            sanitized_error["ctx"] = context
        sanitized_errors.append(sanitized_error)

    error_payload = ErrorResponse(
        error="VALIDATION_ERROR",
        message="Request validation failed",
        details={
            "path": str(request.url.path),
            "errors": jsonable_encoder(sanitized_errors),
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
