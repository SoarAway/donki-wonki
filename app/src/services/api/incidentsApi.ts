import { get, post } from './apiClient';
import { HealthResponse, Incident } from './types';

export const checkHealth = () => get<HealthResponse>('/health');

// List all related api endpoints here
export const checkApiHealth = () => get<HealthResponse>('/test');

export const fetchIncidents = () => get<Incident[]>('/test');

export const sendToken = (token: string) =>
  post<{message?: string}>('/api/v1/users/sendToken', {token});
