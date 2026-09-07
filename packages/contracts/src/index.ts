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

export type AdminRole = 'ADMIN';

export interface AdminIdentity {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  mustChangePassword: boolean;
}

export interface AuthResponse {
  user: AdminIdentity;
  csrfToken: string;
}

/** Locales supported by the platform; an owner activates a subset via `activeLocales`. */
export const SUPPORTED_LOCALES = [
  'en',
  'es',
  'pt',
  'fr',
  'de',
  'it',
  'nl',
  'ja',
  'zh',
  'ko',
  'ru',
  'ar',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Editorial field stored as JSON in the database, one value per locale. */
export type TranslatableString = Partial<Record<string, string>>;

/**
 * Resolves an editorial value for a locale: current locale, then "en", then
 * the first non-empty value. Mirrors the fallback rule content editors rely on.
 */
export function translateValue(
  value: TranslatableString | string | null | undefined,
  locale: string,
): string | null {
  if (value == null || typeof value === 'string') return value ?? null;
  const direct = value[locale];
  if (direct?.trim()) return direct;
  const english = value.en;
  if (english?.trim()) return english;
  const fallback = Object.values(value).find((entry) => entry?.trim());
  return fallback ?? null;
}

export interface Profile {
  id: string;
  username: string;
  email: string;
  name: string;
  fullName?: string;
  headline: TranslatableString;
  bio: TranslatableString;
  avatar?: string;
  resume: TranslatableString;
  activeLocales: string[];
  defaultLocale: string;
}

export interface UpdateProfileInput {
  email?: string;
  name?: string;
  fullName?: string;
  headline?: TranslatableString;
  bio?: TranslatableString;
  avatar?: string;
  resume?: TranslatableString;
  activeLocales?: string[];
  defaultLocale?: string;
}

export interface TechnologyInput {
  name: string;
  slug: string;
  category: string;
  summary?: string;
  iconKey: string;
  featured: boolean;
  sortOrder: number;
  publicationStatus: TechnologyPublicationStatus;
}

export type TechnologyPublicationStatus = 'draft' | 'published';

export interface AdminTechnology extends TechnologyCard {
  publicationStatus: TechnologyPublicationStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
