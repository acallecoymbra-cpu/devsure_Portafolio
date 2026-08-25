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

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface TechnologyCard {
  id: string;
  name: string;
  slug: string;
  category: string;
  summary?: string;
  iconKey: string;
  featured: boolean;
  sortOrder: number;
}
