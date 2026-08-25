import type { PaginatedResponse, TechnologyCard } from '@devsure/contracts';
import { getApiBaseUrl } from '@/lib/config';

const PAGE_LIMIT = 50;

export async function getAllTechnologies(): Promise<TechnologyCard[]> {
  const technologiesById = new Map<string, TechnologyCard>();
  let page = 1;
  let totalPages = 1;

  do {
    const response = await fetch(
      `${getApiBaseUrl()}/technologies?page=${page}&limit=${PAGE_LIMIT}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      throw new Error(`Technologies request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as PaginatedResponse<TechnologyCard>;
    assertTechnologiesPage(payload);

    for (const technology of payload.items) {
      if (!technologiesById.has(technology.id)) {
        technologiesById.set(technology.id, technology);
      }
    }

    totalPages = payload.meta.totalPages;
    page += 1;
  } while (page <= totalPages);

  return [...technologiesById.values()];
}

function assertTechnologiesPage(
  value: PaginatedResponse<TechnologyCard>,
): asserts value is PaginatedResponse<TechnologyCard> {
  if (
    !value ||
    !Array.isArray(value.items) ||
    !value.meta ||
    !Number.isInteger(value.meta.totalPages) ||
    value.meta.totalPages < 0
  ) {
    throw new Error('Technologies API returned an invalid response');
  }
}
