import { getApiBaseUrl } from '@/lib/config';
import type {
  AdminTechnology,
  AdminTechnologyPage,
  AuthSession,
  Experience,
  ExperienceInput,
  ExperiencePage,
  Profile,
  Project,
  ProjectInput,
  ProjectPage,
  Study,
  StudyInput,
  StudyPage,
  ServiceContent,
  ServiceInput,
  ServicePage,
  Strength,
  StrengthInput,
  StrengthPage,
  WorkStyleItem,
  WorkStyleItemInput,
  WorkStyleItemPage,
  Faq,
  FaqInput,
  FaqPage,
  TechnologyInput,
  Translations,
  UpdateProfileInput,
  UpdateTranslationsInput,
  UploadFolder,
  UploadResult,
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

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
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

export function uploadFile(file: File, folder: UploadFolder): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  return request<UploadResult>('/admin/uploads', {
    method: 'POST',
    body: formData,
  });
}

export function listExperiences(page = 1, limit = 50): Promise<ExperiencePage> {
  return request<ExperiencePage>(`/admin/experiences?page=${page}&limit=${limit}`);
}

export function getExperience(id: string): Promise<Experience> {
  return request<Experience>(`/admin/experiences/${encodeURIComponent(id)}`);
}

export function createExperience(input: ExperienceInput): Promise<Experience> {
  return request<Experience>('/admin/experiences', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateExperience(id: string, input: Partial<ExperienceInput>): Promise<Experience> {
  return request<Experience>(`/admin/experiences/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteExperience(id: string): Promise<void> {
  return request<void>(`/admin/experiences/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function listProjects(page = 1, limit = 50): Promise<ProjectPage> {
  return request<ProjectPage>(`/admin/projects?page=${page}&limit=${limit}`);
}

export function getProject(id: string): Promise<Project> {
  return request<Project>(`/admin/projects/${encodeURIComponent(id)}`);
}

export function createProject(input: ProjectInput): Promise<Project> {
  return request<Project>('/admin/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateProject(id: string, input: Partial<ProjectInput>): Promise<Project> {
  return request<Project>(`/admin/projects/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteProject(id: string): Promise<void> {
  return request<void>(`/admin/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function listStudies(page = 1, limit = 50): Promise<StudyPage> {
  return request<StudyPage>(`/admin/studies?page=${page}&limit=${limit}`);
}

export function getStudy(id: string): Promise<Study> {
  return request<Study>(`/admin/studies/${encodeURIComponent(id)}`);
}

export function createStudy(input: StudyInput): Promise<Study> {
  return request<Study>('/admin/studies', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateStudy(id: string, input: Partial<StudyInput>): Promise<Study> {
  return request<Study>(`/admin/studies/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteStudy(id: string): Promise<void> {
  return request<void>(`/admin/studies/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function listServices(page = 1, limit = 50): Promise<ServicePage> {
  return request<ServicePage>(`/admin/services?page=${page}&limit=${limit}`);
}

export function getService(id: string): Promise<ServiceContent> {
  return request<ServiceContent>(`/admin/services/${encodeURIComponent(id)}`);
}

export function createService(input: ServiceInput): Promise<ServiceContent> {
  return request<ServiceContent>('/admin/services', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateService(id: string, input: Partial<ServiceInput>): Promise<ServiceContent> {
  return request<ServiceContent>(`/admin/services/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteService(id: string): Promise<void> {
  return request<void>(`/admin/services/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function listStrengths(page = 1, limit = 50): Promise<StrengthPage> {
  return request<StrengthPage>(`/admin/strengths?page=${page}&limit=${limit}`);
}

export function getStrength(id: string): Promise<Strength> {
  return request<Strength>(`/admin/strengths/${encodeURIComponent(id)}`);
}

export function createStrength(input: StrengthInput): Promise<Strength> {
  return request<Strength>('/admin/strengths', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateStrength(id: string, input: Partial<StrengthInput>): Promise<Strength> {
  return request<Strength>(`/admin/strengths/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteStrength(id: string): Promise<void> {
  return request<void>(`/admin/strengths/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function listWorkStyleItems(page = 1, limit = 50): Promise<WorkStyleItemPage> {
  return request<WorkStyleItemPage>(`/admin/work-style-items?page=${page}&limit=${limit}`);
}

export function getWorkStyleItem(id: string): Promise<WorkStyleItem> {
  return request<WorkStyleItem>(`/admin/work-style-items/${encodeURIComponent(id)}`);
}

export function createWorkStyleItem(input: WorkStyleItemInput): Promise<WorkStyleItem> {
  return request<WorkStyleItem>('/admin/work-style-items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateWorkStyleItem(id: string, input: Partial<WorkStyleItemInput>): Promise<WorkStyleItem> {
  return request<WorkStyleItem>(`/admin/work-style-items/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteWorkStyleItem(id: string): Promise<void> {
  return request<void>(`/admin/work-style-items/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function listFaqs(page = 1, limit = 50): Promise<FaqPage> {
  return request<FaqPage>(`/admin/faqs?page=${page}&limit=${limit}`);
}

export function getFaq(id: string): Promise<Faq> {
  return request<Faq>(`/admin/faqs/${encodeURIComponent(id)}`);
}

export function createFaq(input: FaqInput): Promise<Faq> {
  return request<Faq>('/admin/faqs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateFaq(id: string, input: Partial<FaqInput>): Promise<Faq> {
  return request<Faq>(`/admin/faqs/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteFaq(id: string): Promise<void> {
  return request<void>(`/admin/faqs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
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
