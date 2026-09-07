import type { AdminTechnology, Experience, PaginatedResponse, Project, Service, Strength, Study } from '@devsure/contracts';

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
  Service as ServiceContent,
  ServiceInput,
  Strength,
  StrengthInput,
} from '@devsure/contracts';

export { SUPPORTED_LOCALES } from '@devsure/contracts';

export type AdminTechnologyPage = PaginatedResponse<AdminTechnology>;
export type ExperiencePage = PaginatedResponse<Experience>;
export type ProjectPage = PaginatedResponse<Project>;
export type StudyPage = PaginatedResponse<Study>;
export type ServicePage = PaginatedResponse<Service>;
export type StrengthPage = PaginatedResponse<Strength>;
