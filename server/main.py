from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Import Firebase config to initialize on startup
from config import firebase
from services import alert_service

app = FastAPI(title="Donki-Wonki FastAPI Backend", version="0.1.0")

# Request model for testing alerts
class AlertRequest(BaseModel):
    token: str
    title: str
    body: str
    data: dict = {}

@app.get("/")
def root():
    return {
        "message": "Donki-Wonki Backend API",
        "version": "0.1.0",
        "status": "running"
    }

@app.get("/health")
def health_check():
    """Check if Firebase is initialized"""
    try:
        # If firebase.db exists, Firebase is initialized
        if firebase.db:
            return {
                "status": "healthy",
                "firebase": "connected"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Firebase not initialized: {str(e)}")

@app.post("/test-alert")
def test_alert(alert: AlertRequest):
    """
    Test endpoint to send an alert to a device.
    Requires a valid FCM token from a real device.
    """
    try:
        response = alert_service.send_alert_to_device(
            token=alert.token,
            title=alert.title,
            body=alert.body,
            data=alert.data
        )
        
        if response:
            return {
                "status": "success",
                "message": "Alert sent successfully",
                "fcm_response": response
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send alert")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
