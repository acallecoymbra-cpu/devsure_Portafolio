export interface HealthResponse {
  status: 'ok';
  service: 'devsure-api';
  timestamp: string;
}

export interface PublicErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  requestId?: string;
}
