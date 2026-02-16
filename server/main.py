from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
