export interface HealthResponse {
  [key: string]: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

export interface SendTokenRequest {
  token: string;
}

export interface SendTokenResponse {
  status: string;
  message: string;
  token: string;
  notification_id?: string | null;
}

export interface RegisterUserRequest {
  email: string;
  username: string;
  password: string;
  date_of_birth?: string | null;
  device_token?: string | null;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  is_active?: boolean;
}

export interface RegisterUserResponse {
  status: string;
  message: string;
  user: UserResponse;
}

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  status: string;
  message: string;
  email: string;
}

export interface GetUserByEmailResponse {
  status: string;
  message: string;
  user: UserResponse;
}

export interface AutocompleteSuggestion {
  place_id: string;
  main_text: string;
  secondary_text?: string | null;
  description: string;
}

export interface AutocompleteResponse {
  status: string;
  message: string;
  suggestions: AutocompleteSuggestion[];
}

export interface NearestStationRequest {
  place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface NearestStationResponse {
  status: string;
  message: string;
  nearest_station: string;
  station_line?: string | null;
  distance_km: number;
  user_location: UserLocation;
}

export interface BaseResponse {
  status: string;
  message: string;
}

export interface RouteScheduleRequest {
  email: string;
  departing_location: string;
  destination_location: string;
  day_of_week: string;
  time: string;
  departing_station: string;
  destination_station: string;
  route_desc: string;
}

export interface EditRouteRequest extends RouteScheduleRequest {
  route_id: string;
}

export interface DeleteRouteRequest {
  email: string;
  route_id: string;
}

export interface AddScheduleRequest {
  user_id: string;
  route_id: string;
  day_of_week: string;
  time_from: string;
  time_to: string;
}

export interface RouteIdResponse extends BaseResponse {
  route_id: string;
}

export interface ScheduleIdResponse extends BaseResponse {
  schedule_id: string;
}

export interface RouteRecord {
  [key: string]: unknown;
}

export interface RoutesListResponse extends BaseResponse {
  routes: RouteRecord[];
}

export interface SpecificRouteResponse extends BaseResponse {
  route: RouteRecord;
}

export interface NextUpcomingRouteResponse extends BaseResponse {
  route: RouteRecord;
}

export interface SendReportRequest {
  line: string;
  station: string;
  incident_type: string;
  description: string;
}

export interface ReportIdResponse extends BaseResponse {
  report_id: string;
}

export interface ReportRecord {
  [key: string]: unknown;
}

export interface TopReportsResponse extends BaseResponse {
  reports: ReportRecord[];
}

export type IncidentSource = 'reddit' | 'twitter' | 'user_report';
export type IncidentType =
  | 'delay'
  | 'breakdown'
  | 'overcrowding'
  | 'signal_fault'
  | 'maintenance'
  | 'other'
  | 'none';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface IncidentDetails {
  line?: string | null;
  station?: string | null;
  incident_type?: IncidentType;
  severity?: IncidentSeverity;
  description?: string | null;
  estimated_duration_minutes?: number | null;
  confidence_score?: number;
}

export interface IncidentExtractionRequest {
  text: string;
  source?: IncidentSource;
}

export interface IncidentExtractionResponse {
  is_incident: boolean;
  incident?: IncidentDetails | null;
  raw_explanation?: string | null;
}

export interface BatchIncidentExtractionRequest {
  texts: IncidentExtractionRequest[];
}

export interface BatchIncidentExtractionResponse {
  results: IncidentExtractionResponse[];
  processed_count: number;
  failed_count: number;
}
