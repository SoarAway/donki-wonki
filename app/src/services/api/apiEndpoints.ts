import {del, get, post, put} from './apiClient';
import type {
  AddScheduleRequest,
  AutocompleteResponse,
  BaseResponse,
  DeleteRouteRequest,
  EditRouteRequest,
  GetUserByEmailResponse,
  HealthResponse,
  LoginUserRequest,
  LoginUserResponse,
  NextUpcomingRouteResponse,
  NearestStationRequest,
  NearestStationResponse,
  ReportIdResponse,
  RegisterUserRequest,
  RegisterUserResponse,
  RouteIdResponse,
  RouteScheduleRequest,
  RoutesListResponse,
  ScheduleIdResponse,
  SendTokenResponse,
  SendReportRequest,
  SpecificRouteResponse,
  TopReportsResponse,
} from './types';

const BASE_API_ENDPOINT = '/api/v1';


/**
 * Checks backend health and wake state.
 * @returns Response object map from `/health`.
 * Response: `HealthResponse`.
 */
export const checkHealth = () => get<HealthResponse>('/health');

/**
 * Registers a device token for push notifications.
 * @param token FCM device token string.
 * @returns Alert token registration result.
 * Request: `{ token: string }`.
 * Response: `SendTokenResponse`.
 */
export const sendToken = (token: string) =>
  post<SendTokenResponse>(`${BASE_API_ENDPOINT}/alerts/send-token`, {token});

/**
 * Creates a new user account.
 * @param request Registration payload.
 * @returns Newly created user and status message.
 * Request: `RegisterUserRequest`.
 * Response: `RegisterUserResponse`.
 */
export const registerUser = (request: RegisterUserRequest) =>
  post<RegisterUserResponse>(`${BASE_API_ENDPOINT}/users/register`, request);

/**
 * Logs in an existing user.
 * @param request Login credentials.
 * @returns Login acknowledgement payload.
 * Request: `LoginUserRequest`.
 * Response: `LoginUserResponse`.
 */
export const loginUser = (request: LoginUserRequest) =>
  post<LoginUserResponse>(`${BASE_API_ENDPOINT}/users/login`, request);

/**
 * Fetches a user by email address.
 * @param email User email query.
 * @returns User profile wrapper for matching email.
 * Request: query string `email`.
 * Response: `GetUserByEmailResponse`.
 */
export const getUserByEmail = (email: string) =>
  get<GetUserByEmailResponse>(
    `${BASE_API_ENDPOINT}/users/by-email?email=${encodeURIComponent(email)}`,
  );

/**
 * Returns location autocomplete suggestions.
 * @param query Partial location text, minimum 2 characters.
 * @returns Suggestion list with place ids and display text.
 * Request: query string `query`.
 * Response: `AutocompleteResponse`.
 */
export const autocompleteLocation = (query: string) =>
  get<AutocompleteResponse>(
    `${BASE_API_ENDPOINT}/locations/autocomplete?query=${encodeURIComponent(query)}`,
  );

/**
 * Resolves the nearest station from place id or coordinates.
 * @param request Place id or latitude/longitude payload.
 * @returns Nearest station details and distance.
 * Request: `NearestStationRequest`.
 * Response: `NearestStationResponse`.
 */
export const nearestStation = (request: NearestStationRequest) =>
  post<NearestStationResponse>(`${BASE_API_ENDPOINT}/locations/nearest-station`, request);

export const createRoute = (request: RouteScheduleRequest) =>
  post<RouteIdResponse>(`${BASE_API_ENDPOINT}/route/create`, request);

export const editRoute = (request: EditRouteRequest) =>
  put<RouteIdResponse>(`${BASE_API_ENDPOINT}/route/edit`, request);

export const deleteRoute = (request: DeleteRouteRequest) =>
  del<BaseResponse>(`${BASE_API_ENDPOINT}/route/delete`, request);

export const getRoutesByEmail = (email: string) =>
  get<RoutesListResponse>(
    `${BASE_API_ENDPOINT}/route/all-by-email?email=${encodeURIComponent(email)}`,
  );

export const getRoutesByUserId = (userId: string) =>
  get<RoutesListResponse>(
    `${BASE_API_ENDPOINT}/route/by-user-id?user_id=${encodeURIComponent(userId)}`,
  );

export const getNextUpcomingRoute = (userEmail: string) =>
  get<NextUpcomingRouteResponse>(
    `${BASE_API_ENDPOINT}/route/next-upcoming?email=${encodeURIComponent(userEmail)}`,
  );

export const getSpecificRoute = (email: string, routeId: string) =>
  get<SpecificRouteResponse>(
    `${BASE_API_ENDPOINT}/route/specific?email=${encodeURIComponent(email)}&route_id=${encodeURIComponent(routeId)}`,
  );

export const addSchedule = (request: AddScheduleRequest) =>
  post<ScheduleIdResponse>(`${BASE_API_ENDPOINT}/route/add-schedule`, request);

export const sendReport = (request: SendReportRequest) =>
  post<ReportIdResponse>(`${BASE_API_ENDPOINT}/report/send`, request);

export const getTopReports = () => get<TopReportsResponse>(`${BASE_API_ENDPOINT}/report/top3`);
