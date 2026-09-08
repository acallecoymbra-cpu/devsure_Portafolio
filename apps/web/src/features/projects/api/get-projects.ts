import type { PaginatedResponse, Project } from '@devsure/contracts';
import { getApiBaseUrl } from '@/lib/config';

const PAGE_LIMIT = 50;

export async function getAllPublishedProjects(): Promise<Project[]> {
  const projectsById = new Map<string, Project>();
  let page = 1;
  let totalPages = 1;

  do {
    const response = await fetch(`${getApiBaseUrl()}/projects?page=${page}&limit=${PAGE_LIMIT}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Projects request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as PaginatedResponse<Project>;
    for (const project of payload.items) {
      if (!projectsById.has(project.id)) projectsById.set(project.id, project);
    }

    totalPages = payload.meta.totalPages;
    page += 1;
  } while (page <= totalPages);

  return [...projectsById.values()];
}

/** Returns `null` for a draft or unknown slug (public endpoint 404s in both cases, never leaking which). */
export async function getPublishedProjectBySlug(slug: string): Promise<Project | null> {
  const response = await fetch(`${getApiBaseUrl()}/projects/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Project request failed with status ${response.status}`);
  }

  return (await response.json()) as Project;
}
