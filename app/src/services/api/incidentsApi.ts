import { get } from './apiClient';
import { HealthResponse, Incident } from './types';

export const checkHealth = () => get<HealthResponse>('/health');

// List all related api endpoints here
export const checkApiHealth = () => get<HealthResponse>('/api/test');

export const fetchIncidents = () => get<Incident[]>('/api/test');
