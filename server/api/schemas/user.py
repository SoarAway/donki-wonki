from pydantic import BaseModel, EmailStr

# all of these are test only, can change
class UserResponse(BaseModel):
    id: str
    email: EmailStr
    username: str
    is_active: bool = True

class SendTokenRequest(BaseModel):
    token: str


class SendTokenResponse(BaseModel):
    status: str
    message: str
    token: str
    notification_id: str | None = None
