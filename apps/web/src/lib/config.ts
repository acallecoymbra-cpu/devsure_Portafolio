const DEFAULT_API_BASE_URL = 'http://localhost:3001/api/v1';

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
}
