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

export interface Translations {
  heroTag?: string;
  heroTitle: TranslatableString;
  heroCopy: TranslatableString;
  heroNote: TranslatableString;
  aboutHeading: TranslatableString;
  aboutBody: TranslatableString;
  strengthsHeading: TranslatableString;
  strengthsIntro: TranslatableString;
  experienceHeading: TranslatableString;
  experienceIntro: TranslatableString;
  educationHeading: TranslatableString;
  portfolioHeading: TranslatableString;
  portfolioIntro: TranslatableString;
  skillsHeading: TranslatableString;
  skillsIntro: TranslatableString;
  workstyleHeading: TranslatableString;
  workstyleIntro: TranslatableString;
  testimonialsHeading: TranslatableString;
  faqHeading: TranslatableString;
  blogHeading: TranslatableString;
  contactHeading: TranslatableString;
  contactIntro: TranslatableString;
}

export type UpdateTranslationsInput = Partial<Translations>;

/**
 * Storage folders from spec §8, one per uploadable field. Kept as a
 * type-only union (no runtime array) so the API — which is CommonJS and
 * cannot `require()` a value export from this ESM-only package (see the
 * `SUPPORTED_LOCALES` note above) — never needs to import it as a value.
 */
export type UploadFolder =
  | 'avatars'
  | 'resumes'
  | 'experiences-logos'
  | 'projects-covers'
  | 'projects-gallery'
  | 'studies-logos'
  | 'testimonials'
  | 'posts-covers'
  | 'network-icons';

export interface UploadResult {
  path: string;
  url: string;
}

/** One role held at a company; `experiences.levels[]` in spec §5.3. */
export interface ExperienceLevel {
  role: string;
  startDate?: string;
  endDate?: string | null;
  inProgress?: boolean;
  description?: TranslatableString;
  highlights?: TranslatableString[];
}

export interface Experience {
  id: string;
  company: string;
  slug: string;
  logo?: string;
  summary: TranslatableString;
  techStack: string[];
  levels: ExperienceLevel[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExperienceInput {
  company: string;
  slug?: string;
  logo?: string;
  summary?: TranslatableString;
  techStack?: string[];
  levels: ExperienceLevel[];
  sortOrder?: number;
}

/** One app/platform within a multi-app project; `projects.apps[]` in spec §5.4. */
export interface ProjectApp {
  name: string;
  platform?: string;
  description?: TranslatableString;
  techStack?: string[];
  links?: Record<string, string>;
}

export interface Project {
  id: string;
  experienceId?: string;
  title: TranslatableString;
  slug: string;
  excerpt: TranslatableString;
  description: TranslatableString;
  coverImage?: string;
  gallery: string[];
  techStack: string[];
  apps: ProjectApp[];
  url?: string;
  repoUrl?: string;
  featured: boolean;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  experienceId?: string | null;
  title: TranslatableString;
  slug?: string;
  excerpt?: TranslatableString;
  description?: TranslatableString;
  coverImage?: string;
  gallery?: string[];
  techStack?: string[];
  apps?: ProjectApp[];
  url?: string;
  repoUrl?: string;
  featured?: boolean;
  sortOrder?: number;
  publishedAt?: string | null;
}

export interface Study {
  id: string;
  institution: string;
  title: TranslatableString;
  field?: string;
  description: TranslatableString;
  startDate?: string;
  endDate?: string | null;
  inProgress: boolean;
  logo?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudyInput {
  institution: string;
  title: TranslatableString;
  field?: string;
  description?: TranslatableString;
  startDate?: string;
  endDate?: string | null;
  inProgress?: boolean;
  logo?: string;
  sortOrder?: number;
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
