from pydantic import BaseModel, EmailStr

from api.schemas.base import BaseResponse


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    username: str
    is_active: bool = True


class SendTokenRequest(BaseModel):
    token: str

class SendTokenResponse(BaseResponse):
    token: str
    notification_id: str | None = None


class RegisterUserRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    date_of_birth: str | None = None
    device_token: int | None = None


class RegisterUserResponse(BaseResponse):
    user: UserResponse


class GetUserByEmailResponse(BaseResponse):
    user: UserResponse


class LoginUserRequest(BaseModel):
    email: EmailStr
    password: str


class LoginUserResponse(BaseResponse):
    email: str
