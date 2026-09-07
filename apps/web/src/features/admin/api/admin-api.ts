import { getApiBaseUrl } from '@/lib/config';
import type {
  AdminTechnology,
  AdminTechnologyPage,
  AuthSession,
  Profile,
  TechnologyInput,
  Translations,
  UpdateProfileInput,
  UpdateTranslationsInput,
} from '../types';

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

interface ErrorPayload {
  code?: string;
  message?: string | string[];
}

let csrfToken: string | undefined;

function rememberSession(session: AuthSession): AuthSession {
  csrfToken = session.csrfToken;
  return session;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    const message = Array.isArray(payload.message)
      ? payload.message.join(' ')
      : payload.message || friendlyStatusMessage(response.status);
    throw new AdminApiError(response.status, payload.code ?? 'REQUEST_FAILED', message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function readErrorPayload(response: Response): Promise<ErrorPayload> {
  try {
    return (await response.json()) as ErrorPayload;
  } catch {
    return {};
  }
}

function friendlyStatusMessage(status: number): string {
  if (status === 401) return 'Tu sesión venció. Vuelve a iniciar sesión.';
  if (status === 403) return 'No tienes permisos para realizar esta acción.';
  if (status === 409) return 'Ya existe una tecnología con esos datos.';
  return 'No pudimos completar la solicitud. Inténtalo nuevamente.';
}

export function login(username: string, password: string): Promise<AuthSession> {
  return request<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }).then(rememberSession);
}

export function getSession(): Promise<AuthSession> {
  return request<AuthSession>('/auth/me').then(rememberSession);
}

export async function logout(): Promise<void> {
  await request<void>('/auth/logout', { method: 'POST' });
  csrfToken = undefined;
}

export function changePassword(currentPassword: string, newPassword: string): Promise<AuthSession> {
  return request<AuthSession>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  }).then(rememberSession);
}

export function getProfile(): Promise<Profile> {
  return request<Profile>('/admin/profile');
}

export function updateProfile(input: Partial<UpdateProfileInput>): Promise<Profile> {
  return request<Profile>('/admin/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function getTranslations(): Promise<Translations> {
  return request<Translations>('/admin/translations');
}

export function updateTranslations(input: Partial<UpdateTranslationsInput>): Promise<Translations> {
  return request<Translations>('/admin/translations', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listTechnologies(page = 1, limit = 50): Promise<AdminTechnologyPage> {
  return request<AdminTechnologyPage>(`/admin/technologies?page=${page}&limit=${limit}`);
}

export function getTechnology(id: string): Promise<AdminTechnology> {
  return request<AdminTechnology>(`/admin/technologies/${encodeURIComponent(id)}`);
}

export function createTechnology(input: TechnologyInput): Promise<AdminTechnology> {
  return request<AdminTechnology>('/admin/technologies', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTechnology(
  id: string,
  input: Partial<TechnologyInput>,
): Promise<AdminTechnology> {
  return request<AdminTechnology>(`/admin/technologies/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteTechnology(id: string): Promise<void> {
  return request<void>(`/admin/technologies/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
