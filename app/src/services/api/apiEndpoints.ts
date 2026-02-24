import {get, post} from './apiClient';
import type {
  AutocompleteResponse,
  BatchIncidentExtractionRequest,
  BatchIncidentExtractionResponse,
  GetUserByEmailResponse,
  HealthResponse,
  IncidentExtractionRequest,
  IncidentExtractionResponse,
  LoginUserRequest,
  LoginUserResponse,
  NearestStationRequest,
  NearestStationResponse,
  RegisterUserRequest,
  RegisterUserResponse,
  SendTokenResponse,
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

/**
 * Extracts one incident from a single text input.
 * @param request Incident extraction payload.
 * @returns Incident classification and extracted details.
 * Request: `IncidentExtractionRequest`.
 * Response: `IncidentExtractionResponse`.
 */
export const extractIncident = (request: IncidentExtractionRequest) =>
  post<IncidentExtractionResponse>(`${BASE_API_ENDPOINT}/incidents/extract`, request);

/**
 * Extracts incidents from a batch of text inputs.
 * @param request Batch extraction payload.
 * @returns Batch extraction results with processed/failed counts.
 * Request: `BatchIncidentExtractionRequest`.
 * Response: `BatchIncidentExtractionResponse`.
 */
export const extractIncidentsBatch = (request: BatchIncidentExtractionRequest) =>
  post<BatchIncidentExtractionResponse>(`${BASE_API_ENDPOINT}/incidents/extract/batch`, request);

interface ProcessIncidentParams {
  text: string;
  source?: string;
  save?: boolean;
}

/**
 * Runs extraction, validation, and optional persistence for one social post.
 * @param params Query payload with text, source, and save flag.
 * @returns Incident extraction pipeline result.
 * Request: query params `{ text, source, save }`.
 * Response: `IncidentExtractionResponse`.
 */
export const processIncident = ({text, source = 'reddit', save = true}: ProcessIncidentParams) =>
  post<IncidentExtractionResponse>(
    `${BASE_API_ENDPOINT}/incidents/process?text=${encodeURIComponent(text)}&source=${encodeURIComponent(
      source,
    )}&save=${save}`,
    {},
  );
