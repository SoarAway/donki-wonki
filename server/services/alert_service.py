from firebase_admin import messaging

def send_alert_to_device(token: str, title: str, body: str, data: dict = None):
    """
    Sends a notification to a single specific device.
    Useful for: "Your route has an issue", "Direct Message".
    """
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
        print(f"Successfully sent message to device: {response}")
        return response
    except Exception as e:
        print(f"Error sending message to device: {e}")
        return None
