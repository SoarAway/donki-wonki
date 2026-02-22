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

// /api/v1/incidents types
export interface IncidentDetails {
  line: string | null;
  station: string | null;
  incident_type: 'delay' | 'breakdown' | 'overcrowding' | 'signal_fault' | 'maintenance' | 'other' | 'none';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string | null;
  estimated_duration_minutes: number | null;
  confidence_score: number;
}

export interface IncidentExtractionRequest {
  text: string;
  source?: 'reddit' | 'twitter' | 'user_report';
}

export interface IncidentExtractionResponse {
  is_incident: boolean;
  incident: IncidentDetails | null;
  raw_explanation: string | null;
}

export interface BatchIncidentExtractionRequest {
  texts: IncidentExtractionRequest[];
}

export interface BatchIncidentExtractionResponse {
  results: IncidentExtractionResponse[];
  processed_count: number;
  failed_count: number;
}

// /api/v1/alerts types
export interface AlertRequest {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface AlertResponse {
  status: string;
  message: string;
  fcm_response: Record<string, any> | null;
}

export interface PredictRequest {
  social_text: string;
  source?: string;
}

export interface PredictResponse {
  is_incident: boolean;
  confidence: number;
  details: Record<string, any> | null;
}

// Error response
export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
}
