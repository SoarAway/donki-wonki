import {get, post} from './apiClient';
import type {
  HealthResponse,
  RegisterUserRequest,
  RegisterUserResponse,
  SendTokenResponse,
  IncidentExtractionRequest,
  IncidentExtractionResponse,
  BatchIncidentExtractionRequest,
  BatchIncidentExtractionResponse,
  AlertRequest,
  AlertResponse,
  PredictRequest,
  PredictResponse,
} from './types';

export const checkHealth = () => get<HealthResponse>('/health');

export const sendToken = (token: string) =>
  post<SendTokenResponse>('/api/v1/users/send-token', {token});

export const registerUser = (request: RegisterUserRequest) =>
  post<RegisterUserResponse>('/api/v1/users/register', request);

export const extractIncident = (request: IncidentExtractionRequest) =>
  post<IncidentExtractionResponse>('/api/v1/incidents/extract', request);

export const extractIncidentsBatch = (request: BatchIncidentExtractionRequest) =>
  post<BatchIncidentExtractionResponse>('/api/v1/incidents/extract/batch', request);

export const processIncident = (text: string, source = 'reddit', save = true) =>
  get<IncidentExtractionResponse>(
    `/api/v1/incidents/process?text=${encodeURIComponent(text)}&source=${source}&save=${save}`,
  );

export const sendAlert = (request: AlertRequest) =>
  post<AlertResponse>('/api/v1/alerts/send', request);

export const predictIncident = (request: PredictRequest) =>
  post<PredictResponse>('/api/v1/alerts/predict', request);
