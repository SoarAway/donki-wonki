import logging
from typing import Any

from firebase_admin import messaging

logger = logging.getLogger("services.alerts")


def send_alert_to_device(
    token: str,
    title: str,
    body: str,
    data: dict[str, str] | None = None,
) -> str | None:
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )
        response = messaging.send(message)
        logger.info("Successfully sent message to device: %s", response)
        return response
    except Exception as exc:
        logger.exception("Error sending message to device: %s", exc)
        return None


def send_token_received_notification(token: str) -> str | None:
    return send_alert_to_device(
        token=token,
        title="Donki-Wonki",
        body="Notification setup successful.",
        data={"type": "token_registered"},
    )


def predict_incident(text: str, source: str) -> dict[str, Any]:
    keywords = ["delay", "fault", "stuck", "breakdown", "disruption"]
    is_incident = any(keyword in text.lower() for keyword in keywords)

    return {
        "is_incident": is_incident,
        "confidence": 0.95 if is_incident else 0.1,
        "details": {"source": source, "analysis": "Keyword match"},
    }
