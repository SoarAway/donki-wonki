import logging
from typing import Any

from firebase_admin import messaging

logger = logging.getLogger("services.alerts")


def _format_fcm_exception(exc: Exception) -> str:
    error_code = getattr(exc, "code", None)
    if error_code:
        return f"{error_code}: {exc}"
    return str(exc)


def _build_fcm_message(
    token: str,
    title: str,
    body: str,
    data: dict[str, str] | None = None,
) -> messaging.Message:
    return messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        android=messaging.AndroidConfig(
            priority="high",
            notification=messaging.AndroidNotification(
                channel_id="default",
                sound="default",
                priority="max",
            ),
        ),
        data=data or {},
        token=token,
    )


def send_alert_to_device(
    token: str,
    title: str,
    body: str,
    data: dict[str, str] | None = None,
) -> str | None:
    try:
        message = _build_fcm_message(token=token, title=title, body=body, data=data)
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


def send_token_received_notification_with_debug(token: str) -> tuple[str | None, str | None]:
    try:
        message = _build_fcm_message(
            token=token,
            title="Donki-Wonki",
            body="Notification setup successful.",
            data={"type": "token_registered"},
        )
        response = messaging.send(message)
        logger.info("Successfully sent message to device: %s", response)
        return response, None
    except Exception as exc:
        error_detail = _format_fcm_exception(exc)
        logger.exception("Error sending message to device: %s", error_detail)
        return None, error_detail


def predict_incident(text: str, source: str) -> dict[str, Any]:
    keywords = ["delay", "fault", "stuck", "breakdown", "disruption"]
    is_incident = any(keyword in text.lower() for keyword in keywords)

    return {
        "is_incident": is_incident,
        "confidence": 0.95 if is_incident else 0.1,
        "details": {"source": source, "analysis": "Keyword match"},
    }
