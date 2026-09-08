import type { Profile } from './entities/profile.entity';

/** Shared by ProfileService and TranslationsService: both get-or-create the same row. */
export function profileDefaults(ownerId: string, username: string): Partial<Profile> {
  return {
    ownerId,
    name: username,
    headline: null,
    bio: null,
    resume: null,
    stats: null,
    activeLocales: ['en'],
    defaultLocale: 'en',
  };
}
