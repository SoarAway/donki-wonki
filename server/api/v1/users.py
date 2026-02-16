from fastapi import APIRouter

from api.schemas.user import SendTokenRequest, SendTokenResponse, UserResponse

router = APIRouter()

# endpoint = api/v1/users/

@router.post("/sendToken", response_model=SendTokenResponse)
def send_token(send_token: SendTokenRequest) -> SendTokenResponse:
    print("Token received", send_token.token)
    return SendTokenResponse(
        status="success",
        message="Token received",
        token=send_token.token,
    )



@router.get("/me", response_model=UserResponse)
def read_user_me() -> UserResponse:
    return UserResponse(
        id="1",
        email="test@example.com",
        username="commuter1",
        is_active=True,
    )
