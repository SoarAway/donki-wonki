import {get, post} from './apiClient';
import type {
  HealthResponse,
  RegisterUserRequest,
  RegisterUserResponse,
  SendTokenResponse,
} from './types';

const BASE_API_ENDPOINT = '/api/v1';

export const checkHealth = () => get<HealthResponse>('/health');

export const sendToken = (token: string) => post<SendTokenResponse>(`${BASE_API_ENDPOINT}/users/send-token`, {token});

export const registerUser = (request: RegisterUserRequest) => post<RegisterUserResponse>(`${BASE_API_ENDPOINT}/users/register`, request);
