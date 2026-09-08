import type {
  AdminTechnology,
  ClientLogo,
  Experience,
  Faq,
  PaginatedResponse,
  Post,
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
  ProfileStat,
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
  Post,
  PostInput,
  PostCategory,
  ClientLogo,
  ClientLogoInput,
} from '@devsure/contracts';

export { TESTIMONIAL_SOURCES } from '@devsure/contracts';

export { POST_CATEGORIES } from '@devsure/contracts';

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
export type PostPage = PaginatedResponse<Post>;
export type ClientLogoPage = PaginatedResponse<ClientLogo>;
