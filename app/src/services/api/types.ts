// Defines shared types for API responses (aligned with backend OpenAPI spec)

export interface HealthResponse {
  [key: string]: string;
}

// /api/v1/users/sendToken types
export interface SendTokenRequest {
  token: string;
}

export interface SendTokenResponse {
  status: string;
  message: string;
  token: string;
  notification_id: string | null;
}

export interface RegisterUserRequest {
  email: string;
  username: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
}

export interface RegisterUserResponse {
  status: string;
  message: string;
  user: UserResponse;
}

// Error response
export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
}
