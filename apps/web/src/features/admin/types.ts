import type { AdminTechnology, PaginatedResponse } from '@devsure/contracts';

export type {
  AdminIdentity as AdminUser,
  AuthResponse as AuthSession,
  AdminTechnology,
  TechnologyInput,
  TechnologyPublicationStatus as PublicationStatus,
  PaginationMeta,
} from '@devsure/contracts';

export type AdminTechnologyPage = PaginatedResponse<AdminTechnology>;
