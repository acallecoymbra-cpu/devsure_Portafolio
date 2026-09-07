import type { AdminTechnology, Experience, PaginatedResponse } from '@devsure/contracts';

export type {
  AdminIdentity as AdminUser,
  AuthResponse as AuthSession,
  AdminTechnology,
  TechnologyInput,
  TechnologyPublicationStatus as PublicationStatus,
  PaginationMeta,
  Profile,
  UpdateProfileInput,
  Translations,
  UpdateTranslationsInput,
  TranslatableString,
  SupportedLocale,
  UploadFolder,
  UploadResult,
  Experience,
  ExperienceInput,
  ExperienceLevel,
} from '@devsure/contracts';

export { SUPPORTED_LOCALES } from '@devsure/contracts';

export type AdminTechnologyPage = PaginatedResponse<AdminTechnology>;
export type ExperiencePage = PaginatedResponse<Experience>;
