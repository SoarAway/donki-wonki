// Defines shared types for API responses

export interface Incident {
  id: string;
  line: string;
  station: string;
  description: string;
  status: 'active' | 'resolved';
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  service: string;
}
