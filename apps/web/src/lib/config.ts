const DEFAULT_API_BASE_URL = 'http://localhost:3001/api/v1';

export function getApiBaseUrl(): string {
  return (
    process.env.API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    DEFAULT_API_BASE_URL
  );
}

/** Resolves an uploaded file's stored `path` (e.g. `projects/covers/x.webp`) to a full URL, served from the API's `/storage` static route (not under the versioned `/api/v1` prefix). */
export function getStorageUrl(path: string): string {
  const origin = getApiBaseUrl().replace(/\/api\/v\d+\/?$/, '');
  return `${origin}/storage/${path}`;
}
