import { getStorageUrl } from '@/lib/config';

/**
 * Same leading-slash check as `/cultura/page.tsx`'s `cultureStories` mapping
 * (Slice 14): a seeded placeholder photo is a literal `/public` path (e.g.
 * `/photos/professional-office.webp`), directly servable as-is, while a real
 * `FileUploadField` upload has no leading slash (e.g.
 * `culture/team/<uuid>.webp`) and must be resolved through the API's
 * storage server via `getStorageUrl`.
 */
export function getTeamImageUrl(path: string): string {
  return path.startsWith('/') ? path : getStorageUrl(path);
}
