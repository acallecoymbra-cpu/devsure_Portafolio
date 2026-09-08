import type {
  AdminTechnology,
  Experience,
  Faq,
  PaginatedResponse,
  Project,
  Service,
  Strength,
  Study,
  Testimonial,
  WorkStyleItem,
} from '@devsure/contracts';

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
  WorkStyleItem,
  WorkStyleItemInput,
  Faq,
  FaqInput,
  Testimonial,
  TestimonialInput,
  TestimonialSource,
} from '@devsure/contracts';

export { TESTIMONIAL_SOURCES } from '@devsure/contracts';

export { SUPPORTED_LOCALES } from '@devsure/contracts';

export type AdminTechnologyPage = PaginatedResponse<AdminTechnology>;
export type ExperiencePage = PaginatedResponse<Experience>;
export type ProjectPage = PaginatedResponse<Project>;
export type StudyPage = PaginatedResponse<Study>;
export type ServicePage = PaginatedResponse<Service>;
export type StrengthPage = PaginatedResponse<Strength>;
export type WorkStyleItemPage = PaginatedResponse<WorkStyleItem>;
export type FaqPage = PaginatedResponse<Faq>;
export type TestimonialPage = PaginatedResponse<Testimonial>;
