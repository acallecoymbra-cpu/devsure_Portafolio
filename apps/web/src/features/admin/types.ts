import type { AdminTechnology, Experience, PaginatedResponse, Project, Study } from '@devsure/contracts';

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
  Project,
  ProjectApp,
  ProjectInput,
  Study,
  StudyInput,
} from '@devsure/contracts';

export { SUPPORTED_LOCALES } from '@devsure/contracts';

export type AdminTechnologyPage = PaginatedResponse<AdminTechnology>;
export type ExperiencePage = PaginatedResponse<Experience>;
export type ProjectPage = PaginatedResponse<Project>;
export type StudyPage = PaginatedResponse<Study>;
